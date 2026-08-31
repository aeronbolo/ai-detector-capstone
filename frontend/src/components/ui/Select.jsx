/**
 * Select component — dropdown select with label, error state.
 */

export default function Select({
  label,
  name,
  options = [],
  value,
  onChange,
  error,
  required = false,
  disabled = false,
  placeholder = 'Select an option',
  className = '',
  ...props
}) {
  const selectId = name || `select-${Math.random().toString(36).substr(2, 9)}`

  const baseStyles = 'w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-colors bg-white'
  const normalStyles = 'border-gray-300 focus:border-accent focus:ring-accent'
  const errorStyles = 'border-red-500 focus:border-red-500 focus:ring-red-500'
  const disabledStyles = 'bg-gray-100 cursor-not-allowed'

  const getSelectStyles = () => {
    let styles = baseStyles
    if (error) styles += ` ${errorStyles}`
    else styles += ` ${normalStyles}`
    if (disabled) styles += ` ${disabledStyles}`
    return styles
  }

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && (
        <label htmlFor={selectId} className="text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <select
        id={selectId}
        name={name}
        value={value}
        onChange={onChange}
        disabled={disabled}
        required={required}
        className={getSelectStyles()}
        aria-invalid={error ? 'true' : 'false'}
        aria-describedby={error ? `${selectId}-error` : undefined}
        {...props}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((option) => {
          // Support both string arrays and object arrays
          if (typeof option === 'string') {
            return (
              <option key={option} value={option}>
                {option}
              </option>
            )
          }
          return (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          )
        })}
      </select>
      {error && (
        <p id={`${selectId}-error`} className="text-sm text-red-500" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
