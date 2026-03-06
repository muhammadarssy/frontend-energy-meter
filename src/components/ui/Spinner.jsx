import React from 'react'
import { Loader2 } from 'lucide-react'

const Spinner = ({ size = 'md', className = '' }) => {
  const sizeClass = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  }[size] || 'w-6 h-6'

  return (
    <Loader2 className={`animate-spin text-blue-600 ${sizeClass} ${className}`} />
  )
}

export default Spinner
