/**
 * AuthContext — global authentication state provider.
 * Wraps the entire app and exposes currentUser, loading, and auth methods.
 */

import { createContext, useContext, useEffect, useState } from 'react'
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail,
  updateProfile,
} from 'firebase/auth'
import { doc, setDoc, getDoc } from 'firebase/firestore'
import { auth, db } from '@/lib/firebase'

const AuthContext = createContext({})

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null)
  const [userDoc, setUserDoc]         = useState(null)
  const [loading, setLoading]         = useState(true)
  const [userDocLoading, setUserDocLoading] = useState(true)

  // Register a new user and create Firestore user document
  async function register(email, password, displayName) {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password)
    const user = userCredential.user

    // Update profile with display name
    await updateProfile(user, { displayName })

    // Create user document in Firestore — retry up to 3 times
    const userData = {
      uid:            user.uid,
      email:          user.email,
      displayName:    displayName || '',
      photoURL:       user.photoURL || null,
      role:           'user',
      createdAt:      new Date(),
      disabled:       false,
      detectionCount: 0,
    }

    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        await setDoc(doc(db, 'users', user.uid), userData)
        break
      } catch (err) {
        console.warn(`Firestore write attempt ${attempt} failed:`, err.message)
        if (attempt === 3) {
          // Non-fatal — user is authenticated, Firestore write failed
          // Will be created on next login via loginWithGoogle path
          console.error('Could not create user document after 3 attempts.')
        } else {
          await new Promise(r => setTimeout(r, 1000 * attempt))
        }
      }
    }

    return userCredential
  }

  // Login with email/password
  async function login(email, password) {
    return signInWithEmailAndPassword(auth, email, password)
  }

  // Login with Google OAuth
  async function loginWithGoogle() {
    const provider = new GoogleAuthProvider()
    const userCredential = await signInWithPopup(auth, provider)
    const user = userCredential.user

    // Check if user document exists; if not, create it
    const userDocRef = doc(db, 'users', user.uid)
    const userSnapshot = await getDoc(userDocRef)
    if (!userSnapshot.exists()) {
      await setDoc(userDocRef, {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || '',
        photoURL: user.photoURL || null,
        role: 'user',
        createdAt: new Date(),
        disabled: false,
        detectionCount: 0,
      })
    }

    return userCredential
  }

  // Logout
  async function logout() {
    // Clear cached user doc on logout
    const uid = auth.currentUser?.uid
    if (uid) {
      localStorage.removeItem(`userDoc_${uid}`)
      localStorage.removeItem(`role_${uid}`)
    }
    return signOut(auth)
  }

  // Send password reset email
  async function resetPassword(email) {
    return sendPasswordResetEmail(auth, email)
  }

  // Load user document from Firestore whenever auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user)
      setUserDocLoading(true)

      if (user) {
        // Check localStorage cache first (works even when Firestore is blocked)
        const cachedData = localStorage.getItem(`userDoc_${user.uid}`)
        if (cachedData) {
          try {
            const parsed = JSON.parse(cachedData)
            setUserDoc(parsed)
            setLoading(false)
            setUserDocLoading(false)
          } catch { /* ignore parse error */ }
        }

        try {
          const userDocRef   = doc(db, 'users', user.uid)
          const userSnapshot = await getDoc(userDocRef)

          if (userSnapshot.exists() && Object.keys(userSnapshot.data()).length > 0) {
            const data = userSnapshot.data()
            setUserDoc(data)
            // Cache in localStorage so it works when Firestore is blocked
            localStorage.setItem(`userDoc_${user.uid}`, JSON.stringify({
              uid:            data.uid,
              email:          data.email,
              displayName:    data.displayName,
              role:           data.role,
              detectionCount: data.detectionCount || 0,
              disabled:       data.disabled || false,
            }))
          } else {
            // Document missing or empty — create/repair it now
            const userData = {
              uid:            user.uid,
              email:          user.email || '',
              displayName:    user.displayName || '',
              photoURL:       user.photoURL || null,
              role:           'user',
              createdAt:      new Date(),
              disabled:       false,
              detectionCount: 0,
            }
            try {
              await setDoc(userDocRef, userData, { merge: true })
              setUserDoc(userData)
              localStorage.setItem(`userDoc_${user.uid}`, JSON.stringify(userData))
            } catch (writeErr) {
              console.warn('Could not repair user document:', writeErr.message)
              // Keep whatever was loaded from cache
              if (!cachedData) setUserDoc(null)
            }
          }
        } catch (error) {
          console.warn('Failed to load user document (using cache if available):', error.message)
          // If Firestore fails but we have a cache, keep using it
          if (!cachedData) setUserDoc(null)
        }
      } else {
        setUserDoc(null)
        // Clear cache on logout
        if (user === null) {
          Object.keys(localStorage)
            .filter(k => k.startsWith('userDoc_'))
            .forEach(k => localStorage.removeItem(k))
        }
      }

      setLoading(false)
      setUserDocLoading(false)
    })

    return unsubscribe
  }, [])

  const value = {
    currentUser,
    userDoc,
    loading,
    userDocLoading,
    register,
    login,
    loginWithGoogle,
    logout,
    resetPassword,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
