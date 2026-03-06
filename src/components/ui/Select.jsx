import React from 'react'

const Select = React.forwardRef(({
  label,
  error,
  options = [],
  placeholder = 'Pilih...',
  className = '',
  required = false,
  ...props
}, ref) => {
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label className="text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <select
        ref={ref}
        className={`
          w-full px-3 py-2 text-sm border rounded-lg
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
          transition-colors bg-white
          ${error ? 'border-red-400 bg-red-50' : 'border-gray-300'}
          ${className}
        `}
        {...props}
      >
        <option value="">{placeholder}</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && (
        <p className="text-xs text-red-500">{error}</p>
      )}
    </div>
  )
})

Select.displayName = 'Select'

export default Select
