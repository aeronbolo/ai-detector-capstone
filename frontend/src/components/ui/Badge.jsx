/**
 * Badge component — pill-shaped labels for detection results.
 * Colors match mockup: red for AI-Generated, green for Real.
 */

export default function Badge({ label, type = 'default', className = '' }) {
  const baseStyles = 'inline-flex items-center px-3 py-1 rounded-full text-sm font-medium'
  
  const types = {
    default: 'bg-gray-100 text-gray-800',
    success: 'bg-green-100 text-green-800',
    danger: 'bg-red-100 text-red-800',
    warning: 'bg-yellow-100 text-yellow-800',
    info: 'bg-blue-100 text-blue-800',
  }

  // Map detection labels to badge types
  const getLabelType = () => {
    if (label === 'AI-Generated') return 'danger'
    if (label === 'Real' || label === 'Authentic') return 'success'
    return type
  }

  return (
    <span className={`${baseStyles} ${types[getLabelType()]} ${className}`}>
      {label}
    </span>
  )
}
