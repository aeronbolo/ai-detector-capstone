/**
 * Button component with variants matching mockup design system.
 */

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  className = '',
  ...props
}) {
  const baseStyles = 'font-medium rounded transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2'
  
  const variants = {
    primary: 'bg-primary text-white hover:bg-primary-dark focus:ring-primary disabled:bg-gray-300',
    secondary: 'bg-white text-primary border-2 border-primary hover:bg-primary hover:text-white focus:ring-primary disabled:border-gray-300 disabled:text-gray-300',
    accent: 'bg-accent text-white hover:bg-accent-dark focus:ring-accent disabled:bg-gray-300',
    danger: 'bg-danger text-white hover:bg-red-600 focus:ring-danger disabled:bg-gray-300',
    ghost: 'bg-transparent text-primary hover:bg-gray-100 focus:ring-gray-300',
  }

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  }

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${disabled || loading ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <span className="flex items-center gap-2">
          <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Loading...
        </span>
      ) : children}
    </button>
  )
}
