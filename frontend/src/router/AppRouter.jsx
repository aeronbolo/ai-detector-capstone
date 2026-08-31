/**
 * AppRouter — React Router v6 routes with guards.
 * Includes ProtectedRoute (auth required) and AdminRoute (admin role required).
 */

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'

// Lazy-loaded pages (to be implemented in later phases)
import { Suspense, lazy } from 'react'

// Auth pages
const LoginPage = lazy(() => import('@/features/auth/LoginPage'))
const RegisterPage = lazy(() => import('@/features/auth/RegisterPage'))
const ForgotPasswordPage = lazy(() => import('@/features/auth/ForgotPasswordPage'))

// Public/protected pages
const LandingPage = lazy(() => import('@/features/home/LandingPage'))
const DetectionResultPage = lazy(() => import('@/features/detection/DetectionResultPage'))
const HistoryPage = lazy(() => import('@/features/history/HistoryPage'))
const ReportsPage = lazy(() => import('@/features/reports/ReportsPage'))

// Admin pages
const AdminDashboardPage       = lazy(() => import('@/features/admin/AdminDashboardPage'))
const AllAnalysesPage          = lazy(() => import('@/features/admin/AllAnalysesPage'))
const UserManagementPage       = lazy(() => import('@/features/admin/UserManagementPage'))
const AlgorithmComparisonPage  = lazy(() => import('@/features/admin/AlgorithmComparisonPage'))

// 404
const NotFoundPage = lazy(() => import('@/features/NotFoundPage'))

// Loading fallback
function LoadingFallback() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
    </div>
  )
}

// Protected route wrapper — requires authentication
function ProtectedRoute({ children }) {
  const { currentUser, loading, userDocLoading } = useAuth()

  if (loading || userDocLoading) {
    return <LoadingFallback />
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />
  }

  return children
}

// Admin route wrapper — requires authentication + admin role
function AdminRoute({ children }) {
  const { currentUser, userDoc, loading, userDocLoading } = useAuth()

  // Wait for BOTH auth AND userDoc to finish loading
  if (loading || userDocLoading) {
    return <LoadingFallback />
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />
  }

  // Debug: log what role was found
  if (import.meta.env.DEV) {
    console.log('[AdminRoute] userDoc:', userDoc, 'role:', userDoc?.role)
  }

  // If Firestore is blocked, userDoc will be null — allow access if user is
  // authenticated and we can verify role from localStorage cache as fallback
  const cachedRole = localStorage.getItem(`role_${currentUser.uid}`)

  if (userDoc?.role !== 'admin' && cachedRole !== 'admin') {
    return <Navigate to="/" replace />
  }

  // Cache the role for fallback use
  if (userDoc?.role === 'admin') {
    localStorage.setItem(`role_${currentUser.uid}`, 'admin')
  }

  return children
}

// Public-only route — redirects authenticated users to home
function PublicOnlyRoute({ children }) {
  const { currentUser, userDoc, loading, userDocLoading } = useAuth()

  // Wait for both so we redirect admin to /admin not /
  if (loading || userDocLoading) {
    return <LoadingFallback />
  }

  if (currentUser) {
    // Redirect admin directly to /admin
    return <Navigate to={userDoc?.role === 'admin' ? '/admin' : '/'} replace />
  }

  return children
}

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<LandingPage />} />
          
          {/* Auth routes (public only) */}
          <Route
            path="/login"
            element={
              <PublicOnlyRoute>
                <LoginPage />
              </PublicOnlyRoute>
            }
          />
          <Route
            path="/register"
            element={
              <PublicOnlyRoute>
                <RegisterPage />
              </PublicOnlyRoute>
            }
          />
          <Route
            path="/forgot-password"
            element={
              <PublicOnlyRoute>
                <ForgotPasswordPage />
              </PublicOnlyRoute>
            }
          />

          {/* Protected routes */}
          <Route
            path="/results/:detectionId"
            element={
              <ProtectedRoute>
                <DetectionResultPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/history"
            element={
              <ProtectedRoute>
                <HistoryPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/reports"
            element={
              <ProtectedRoute>
                <ReportsPage />
              </ProtectedRoute>
            }
          />

          {/* Admin routes */}
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <AdminDashboardPage />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/analyses"
            element={
              <AdminRoute>
                <AllAnalysesPage />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <AdminRoute>
                <UserManagementPage />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/algorithms"
            element={
              <AdminRoute>
                <AlgorithmComparisonPage />
              </AdminRoute>
            }
          />

          {/* 404 */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}
