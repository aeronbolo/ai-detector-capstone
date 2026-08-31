/**
 * Input component — form input with label, error state, and various types.
 */

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
  ...props
}) {
  const inputId = name || `input-${Math.random().toString(36).substr(2, 9)}`

  const baseStyles = 'w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-colors'
  const normalStyles = 'border-gray-300 focus:border-accent focus:ring-accent'
  const errorStyles = 'border-red-500 focus:border-red-500 focus:ring-red-500'
  const disabledStyles = 'bg-gray-100 cursor-not-allowed'

  const getInputStyles = () => {
    let styles = baseStyles
    if (error) styles += ` ${errorStyles}`
    else styles += ` ${normalStyles}`
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
      <input
        id={inputId}
        name={name}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        disabled={disabled}
        required={required}
        className={getInputStyles()}
        aria-invalid={error ? 'true' : 'false'}
        aria-describedby={error ? `${inputId}-error` : undefined}
        {...props}
      />
      {error && (
        <p id={`${inputId}-error`} className="text-sm text-red-500" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
