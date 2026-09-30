/**
 * Input component — form input with label, error state, and various types.
 * Password type automatically gets a show/hide toggle eye button.
 */

import { useState } from 'react'

// ── Eye icons ──────────────────────────────────────────────────────────────────
function EyeOpen() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none"
      viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round"
        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round"
        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7
           -1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  )
}

function EyeOff() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none"
      viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round"
        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7
           a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243
           M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29
           m7.532 7.532l3.29 3.29M3 3l3.59 3.59
           m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7
           a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
    </svg>
  )
}

export default function Input({
  label,
  name,
  type = 'text',
  placeholder = '',
  value,
  onChange,
  error,
  required = false,
  disabled = false,
  className = '',
  autoComplete,
  ...props
}) {
  const [showPassword, setShowPassword] = useState(false)
  const isPassword = type === 'password'
  const inputId    = name || `input-${Math.random().toString(36).substr(2, 9)}`
  const inputType  = isPassword ? (showPassword ? 'text' : 'password') : type

  const baseStyles     = 'w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-colors'
  const normalStyles   = 'border-gray-300 focus:border-accent focus:ring-accent'
  const errorStyles    = 'border-red-500 focus:border-red-500 focus:ring-red-500'
  const disabledStyles = 'bg-gray-100 cursor-not-allowed'

  const getInputStyles = () => {
    let styles = baseStyles
    if (isPassword) styles += ' pr-11'  // extra right padding for eye button
    if (error)    styles += ` ${errorStyles}`
    else          styles += ` ${normalStyles}`
    if (disabled) styles += ` ${disabledStyles}`
    return styles
  }

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      <div className="relative">
        <input
          id={inputId}
          name={name}
          type={inputType}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          disabled={disabled}
          required={required}
          autoComplete={autoComplete}
          className={getInputStyles()}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={error ? `${inputId}-error` : undefined}
          {...props}
        />

        {/* Show/hide toggle — only for password fields */}
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(v => !v)}
            className="absolute inset-y-0 right-3 flex items-center text-gray-400
                       hover:text-gray-600 transition-colors focus:outline-none
                       focus:text-accent"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            tabIndex={-1}
          >
            {showPassword ? <EyeOff /> : <EyeOpen />}
          </button>
        )}
      </div>

      {error && (
        <p id={`${inputId}-error`} className="text-sm text-red-500" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
