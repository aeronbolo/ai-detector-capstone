/**
 * authService — Firebase error code → human-readable message mapping.
 */

export function getAuthErrorMessage(code) {
  const messages = {
    'auth/email-already-in-use': 'An account with this email already exists.',
    'auth/invalid-email': 'Please enter a valid email address.',
    'auth/user-not-found': 'No account found with this email.',
    'auth/wrong-password': 'Incorrect password. Please try again.',
    'auth/weak-password': 'Password must be at least 6 characters.',
    'auth/too-many-requests': 'Too many failed attempts. Please try again later.',
    'auth/user-disabled': 'This account has been disabled. Contact support.',
    'auth/popup-closed-by-user': 'Google sign-in was cancelled.',
    'auth/network-request-failed': 'Network error. Check your connection.',
  }
  return messages[code] || 'Something went wrong. Please try again.'
}
