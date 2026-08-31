/**
 * Card component — container with shadow and rounded corners.
 */

export default function Card({ children, className = '', hover = false, ...props }) {
  const baseStyles = 'bg-white rounded-lg p-6'
  const shadowClass = hover ? 'card-shadow' : 'shadow-card'

  return (
    <div className={`${baseStyles} ${shadowClass} ${className}`} {...props}>
      {children}
    </div>
  )
}
