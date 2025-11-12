import { Upload, X, Loader2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { uploadImageAPI, uploadFileAPI } from '../../utils/api'

const FileUpload = ({
  label,
  name,
  onChange,
  errors = {},
  required = false,
  accept = 'image/*',
  multiple = false,
  maxSizeMB = 5,
  className = '',
  uploadedFiles = [],
  uploadUrl = '',
  fieldName = 'image',
  mapResponseToValue,
  ...props
}) => {
  const [dragActive, setDragActive] = useState(false)
  const [files, setFiles] = useState([])
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState({})

  const isImage = accept.includes('image')

  useEffect(() => {
    if (!uploadedFiles || (Array.isArray(uploadedFiles) && uploadedFiles.length === 0)) {
      setFiles([])
      return
    }

    const normalized = (Array.isArray(uploadedFiles) ? uploadedFiles : [uploadedFiles])
      .filter(Boolean)
      .map((item) => {
        if (typeof item === 'string') {
          return {
            path: item,
            name: item.split('/').pop(),
          }
        }
        if (item?.path || item?.name || item?.file) {
          return item
        }
        return {
          path: item,
          name: typeof item === 'object' && item !== null ? item?.toString() : '',
        }
      })

    setFiles(normalized)
  }, [uploadedFiles])

  const handleDrag = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const validateFile = (file) => {
    // Check file size
    if (file.size > maxSizeMB * 1024 * 1024) {
      throw new Error(`File size exceeds ${maxSizeMB}MB limit`)
    }

    // Check file type
    if (accept !== '*/*' && accept !== '') {
      const acceptedTypes = accept.split(',').map(type => type.trim())
      const fileExtension = '.' + file.name.split('.').pop().toLowerCase()
      const fileType = file.type.toLowerCase()

      const isAccepted = acceptedTypes.some(type => {
        if (type.startsWith('.')) {
          return fileExtension === type.toLowerCase()
        }
        return fileType.match(type.replace('*', '.*'))
      })

      if (!isAccepted) {
        throw new Error(`File type not allowed. Accepted: ${accept}`)
      }
    }

    return true
  }

  const resolveUploadedPath = (response) => {
    if (typeof mapResponseToValue === 'function') {
      const mapped = mapResponseToValue(response)
      if (mapped) {
        return mapped
      }
    }

    return (
      response?.data?.image ||
      response?.data?.path ||
      response?.data?.filePath ||
      response?.data?.url ||
      response?.path ||
      response?.filePath ||
      response?.url ||
      ''
    )
  }

  const uploadFile = async (file, index) => {
    try {
      setUploadProgress((prev) => ({ ...prev, [index]: 'uploading' }))

      let response
      if (isImage) {
        response = await uploadImageAPI(file, { uploadUrl, fieldName })
      } else {
        response = await uploadFileAPI(file)
      }

      // Response should contain the file path
      const filePath = resolveUploadedPath(response)

      setUploadProgress((prev) => ({ ...prev, [index]: 'completed' }))
      return filePath
    } catch (error) {
      setUploadProgress((prev) => ({ ...prev, [index]: 'error' }))
      throw error
    }
  }

  const handleDrop = async (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await processFiles(Array.from(e.dataTransfer.files))
    }
  }

  const handleChange = async (e) => {
    if (e.target.files && e.target.files[0]) {
      await processFiles(Array.from(e.target.files))
    }
  }

  const processFiles = async (fileList) => {
    try {
      setUploading(true)

      // Validate all files first
      fileList.forEach((file) => {
        validateFile(file)
      })

      // Upload files
      const uploadPromises = fileList.map((file, index) => uploadFile(file, index))
      const uploadedPaths = await Promise.all(uploadPromises)

      // Update files state
      const appendedFiles = fileList.map((file, index) => ({
        file,
        path: uploadedPaths[index],
        name: file.name,
      }))

      setFiles((prevFiles) => {
        const nextFiles = [...prevFiles, ...appendedFiles]

        if (onChange) {
          const allPaths = nextFiles.map((f) => f?.path || f).filter(Boolean)
          const value = multiple ? allPaths : allPaths[allPaths.length - 1] || ''

          onChange({
            target: {
              name,
              value,
              files: fileList,
              uploadedPaths,
              allPaths,
            },
          })
        }

        return nextFiles
      })
    } catch (error) {
      if (onChange) {
        onChange({
          target: {
            name: name,
            error: error.message,
          },
        })
      }
    } finally {
      setUploading(false)
      setUploadProgress({})
    }
  }

  const removeFile = (index) => {
    const newFiles = files.filter((_, i) => i !== index)
    setFiles(newFiles)

    if (onChange) {
      const filePaths = newFiles.map((f) => f.path || f).filter(Boolean)
      onChange({
        target: {
          name: name,
          value: multiple ? filePaths : filePaths[0] || '',
          files: newFiles.map((f) => f.file).filter(Boolean),
          allPaths: filePaths,
        },
      })
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
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={`
          border-2 border-dashed rounded-lg p-6 text-center
          transition-colors
          ${dragActive ? 'border-primary-500 bg-primary-50' : 'border-gray-300'}
          ${errors[name] ? 'border-red-500' : ''}
          ${uploading ? 'opacity-50 cursor-wait' : 'cursor-pointer'}
          ${className}
        `}
      >
        <input
          id={name}
          name={name}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleChange}
          disabled={uploading}
          className="hidden"
          {...props}
        />
        <label htmlFor={name} className={`cursor-pointer ${uploading ? 'pointer-events-none' : ''}`}>
          {uploading ? (
            <Loader2 size={32} className="mx-auto text-primary-600 mb-2 animate-spin" />
          ) : (
            <Upload size={32} className="mx-auto text-gray-400 mb-2" />
          )}
          <p className="text-sm text-gray-600">
            {uploading
              ? 'Uploading...'
              : files.length > 0
                ? `${files.length} file(s) uploaded`
                : `Click to upload or drag and drop`}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Max {maxSizeMB}MB per file
          </p>
        </label>
      </div>

      {/* Display uploaded files */}
      {files.length > 0 && (
        <div className="space-y-2 mt-2">
          {files.map((fileObj, index) => {
            const file = fileObj.file || fileObj
            const path = fileObj.path || fileObj
            const fileName = fileObj.name || (typeof file === 'string' ? file : file?.name) || path?.split('/').pop()
            const isUploading = uploadProgress[index] === 'uploading'
            const hasError = uploadProgress[index] === 'error'

            return (
              <div
                key={index}
                className="page-header p-2 bg-gray-50 rounded-lg border"
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  {isUploading ? (
                    <Loader2 size={16} className="text-primary-600 animate-spin flex-shrink-0" />
                  ) : hasError ? (
                    <span className="text-red-500 flex-shrink-0">⚠️</span>
                  ) : (
                    <span className="text-green-500 flex-shrink-0">✓</span>
                  )}
                  <span className="text-sm text-gray-700 truncate" title={fileName}>
                    {fileName}
                  </span>
                  {path && !isUploading && (
                    <span className="text-xs text-gray-500 truncate hidden sm:inline" title={path}>
                      ({typeof path === 'string' ? path.split('/').pop() : 'Uploaded'})
                    </span>
                  )}
                </div>
                {!isUploading && (
                  <button
                    type="button"
                    onClick={() => removeFile(index)}
                    className="ml-2 text-red-500 hover:text-red-700 flex-shrink-0"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}

      {errors[name] && (
        <span className="text-sm text-red-500">
          {typeof errors[name] === 'string' ? errors[name] : errors[name]?.message || ''}
        </span>
      )}
    </div>
  )
}

export default FileUpload

