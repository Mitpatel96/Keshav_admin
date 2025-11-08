const Textarea = ({
  label,
  name,
  value = '',
  onChange,
  errors = {},
  required = false,
  placeholder,
  rows = 4,
  className = '',
  ...props
}) => {
  const error = typeof errors[name] === 'string' ? errors[name] : errors[name]?.message || ''

  return (
    <div className="flex flex-col gap-2">
      {label && (
        <label htmlFor={name} className="text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <textarea
        id={name}
        name={name}
        rows={rows}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`
          px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500
          ${error ? 'border-red-500' : 'border-gray-300'}
          resize-y
          ${className}
        `}
        {...props}
      />
      {error && (
        <span className="text-sm text-red-500">{error}</span>
      )}
    </div>
  )
}

export default Textarea

