const Select = ({
  label,
  name,
  value = '',
  onChange,
  errors = {},
  required = false,
  options = [],
  placeholder = 'Select an option',
  className = '',
  multiple = false,
  ...props
}) => {
  const error = typeof errors[name] === 'string' ? errors[name] : errors[name]?.message || ''

  const handleChange = (e) => {
    if (multiple) {
      const selectedOptions = Array.from(e.target.selectedOptions, option => option.value)
      onChange({
        target: {
          name: name,
          value: selectedOptions,
        }
      })
    } else {
      onChange(e)
    }
  }

  return (
    <div className="flex flex-col gap-2">
      {label && (
        <label htmlFor={name} className="text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <select
        id={name}
        name={name}
        multiple={multiple}
        value={value}
        onChange={handleChange}
        className={`
          px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500
          ${error ? 'border-red-500' : 'border-gray-300'}
          ${multiple ? 'h-32' : ''}
          ${className}
        `}
        {...props}
      >
        {!multiple && <option value="">{placeholder}</option>}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && (
        <span className="text-sm text-red-500">{error}</span>
      )}
    </div>
  )
}

export default Select

