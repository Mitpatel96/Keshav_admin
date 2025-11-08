const Checkbox = ({
  label,
  name,
  checked = false,
  onChange,
  errors = {},
  required = false,
  className = '',
  ...props
}) => {
  const error = typeof errors[name] === 'string' ? errors[name] : errors[name]?.message || ''

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2">
        <input
          id={name}
          name={name}
          type="checkbox"
          checked={checked}
          onChange={onChange}
          className={`
            w-4 h-4 text-primary-600 border-gray-300 rounded
            focus:ring-primary-500
            ${error ? 'border-red-500' : ''}
            ${className}
          `}
          {...props}
        />
        {label && (
          <label htmlFor={name} className="text-sm font-medium text-gray-700">
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
      </div>
      {error && (
        <span className="text-sm text-red-500">{error}</span>
      )}
    </div>
  )
}

export default Checkbox

