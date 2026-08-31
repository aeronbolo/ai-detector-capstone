/**
 * Spinner component — loading indicator.
 */

export default function Spinner({ size = 'md', color = 'primary', className = '' }) {
  const sizes = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
    xl: 'h-16 w-16',
  }

  const colors = {
    primary: 'border-primary',
    accent: 'border-accent',
    white: 'border-white',
  }

  return (
    <div className={`animate-spin rounded-full border-b-2 ${sizes[size]} ${colors[color]} ${className}`} role="status">
      <span className="sr-only">Loading...</span>
    </div>
  )
}
