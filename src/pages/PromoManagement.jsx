import { useCallback, useEffect, useMemo, useState } from 'react'
import {
    Gift,
    Loader2,
    RefreshCw,
    Clipboard,
    CheckCircle2,
    AlertCircle,
    Filter,
    Eye,
    Download,
    Ban,
    X,
} from 'lucide-react'
import Input from '../components/Form/Input'
import Select from '../components/Form/Select'
import Textarea from '../components/Form/Textarea'
import { useFormState } from '../utils/useFormState'
import {
    createPromoBatchAPI,
    getAllProductsAPI,
    getPromoBatchesAPI,
    getPromoBatchByIdAPI,
    deactivatePromoBatchAPI,
} from '../utils/api'
import * as XLSX from 'xlsx'

const INITIAL_FORM_STATE = {
    title: '',
    baseInput: '',
    count: '',
    discountType: 'FLAT',
    discountValue: '',
    startDate: '',
    endDate: '',
    products: [],
    usageScope: 'GLOBAL',
    notes: '',
}

const DEFAULT_FILTERS = {
    search: '',
    status: '',
    scope: '',
}

const formatDateTimeLocal = (isoString) => {
    if (!isoString) return ''
    try {
        const date = new Date(isoString)
        if (Number.isNaN(date.getTime())) return ''
        const tzOffset = date.getTimezoneOffset() * 60000
        const localISOTime = new Date(date.getTime() - tzOffset).toISOString().slice(0, 16)
        return localISOTime
    } catch (error) {
        return ''
    }
}

const formatDateTime = (isoString) => {
    if (!isoString) return '—'
    const date = new Date(isoString)
    if (Number.isNaN(date.getTime())) return '—'
    return date.toLocaleString()
}

const PromoManagement = () => {
    const {
        formData,
        errors,
        handleChange,
        setValue,
        setErrors,
        reset,
    } = useFormState(INITIAL_FORM_STATE)

    const [products, setProducts] = useState([])
    const [loadingProducts, setLoadingProducts] = useState(false)
    const [productError, setProductError] = useState('')
    const [submitting, setSubmitting] = useState(false)
    const [submitError, setSubmitError] = useState('')
    const [result, setResult] = useState(null)
    const [copyFeedback, setCopyFeedback] = useState('')
    const [detailCopyFeedback, setDetailCopyFeedback] = useState('')
    const [showCreateForm, setShowCreateForm] = useState(false)
    const [selectedBatchSummary, setSelectedBatchSummary] = useState(null)

    const [batches, setBatches] = useState([])
    const [listLoading, setListLoading] = useState(false)
    const [listError, setListError] = useState('')
    const [filters, setFilters] = useState({ ...DEFAULT_FILTERS })
    const [pagination, setPagination] = useState({
        currentPage: 1,
        totalPages: 1,
        totalCount: 0,
        hasNextPage: false,
        hasPrevPage: false,
    })

    const [selectedBatchId, setSelectedBatchId] = useState(null)
    const [selectedBatch, setSelectedBatch] = useState(null)
    const [selectedBatchLoading, setSelectedBatchLoading] = useState(false)
    const [selectedBatchError, setSelectedBatchError] = useState('')

    const [exportingBatchId, setExportingBatchId] = useState(null)
    const [deactivatingBatchId, setDeactivatingBatchId] = useState(null)

    const productOptions = useMemo(() => {
        return (products || []).map((product) => ({
            value: product._id,
            label: product.title || product.name || product.slug || product.sku?.title || product._id,
        }))
    }, [products])

    useEffect(() => {
        fetchProducts()
    }, [])

    const fetchBatches = useCallback(
        async (page = 1) => {
            try {
                setListLoading(true)
                setListError('')
                const params = {
                    page,
                    search: filters.search?.trim() || undefined,
                    status: filters.status || undefined,
                    scope: filters.scope || undefined,
                }
                const response = await getPromoBatchesAPI(params)
                setBatches(response?.data || [])
                const paginationData = response?.pagination || {}
                setPagination({
                    currentPage: paginationData.currentPage || page,
                    totalPages: paginationData.totalPages || 1,
                    totalCount: paginationData.totalCount ?? response?.data?.length ?? 0,
                    hasNextPage: Boolean(paginationData.hasNextPage),
                    hasPrevPage: Boolean(paginationData.hasPrevPage),
                })
            } catch (error) {
                setListError(error.message || 'Failed to load promo batches')
            } finally {
                setListLoading(false)
            }
        },
        [filters]
    )

    useEffect(() => {
        fetchBatches(pagination.currentPage)
    }, [fetchBatches, pagination.currentPage])

    const fetchProducts = async () => {
        try {
            setLoadingProducts(true)
            setProductError('')
            const response = await getAllProductsAPI(1, 500)
            setProducts(response?.data || [])
        } catch (error) {
            setProductError(error.message || 'Failed to load products')
        } finally {
            setLoadingProducts(false)
        }
    }

    const handleRefreshBatches = () => {
        fetchBatches(pagination.currentPage)
    }

    const handleToggleCreateForm = () => {
        setShowCreateForm((prev) => {
            if (prev) {
                reset({ ...INITIAL_FORM_STATE })
                setSubmitError('')
                setCopyFeedback('')
                setResult(null)
            }
            return !prev
        })
    }

    const formatScope = (value) => {
        if (value === 'GLOBAL') return 'Global'
        if (value === 'PER_USER') return 'Per User'
        return value || '-'
    }

    const formatDiscount = (batch) => {
        if (!batch) return '-'
        if (batch.discountType === 'PERCENTAGE') {
            return `${batch.discountValue}%`
        }
        return `₹${batch.discountValue}`
    }

    const formatDateRange = (start, end) => {
        if (!start || !end) return '—'
        const startDate = new Date(start)
        const endDate = new Date(end)
        if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
            return '—'
        }
        return `${startDate.toLocaleDateString()} → ${endDate.toLocaleDateString()}`
    }

    const displayStat = (value) => (value === null || value === undefined ? '—' : value)

    const updateFilters = (name, value) => {
        setFilters((prev) => {
            if (prev[name] === value) return prev
            return { ...prev, [name]: value }
        })
        setPagination((prev) => {
            if (prev.currentPage === 1) return prev
            return { ...prev, currentPage: 1 }
        })
    }

    const handleFilterChange = (event) => {
        const { name, value } = event.target
        updateFilters(name, value)
    }

    const filtersAreDefault =
        filters.search === DEFAULT_FILTERS.search &&
        filters.status === DEFAULT_FILTERS.status &&
        filters.scope === DEFAULT_FILTERS.scope

    const handleClearFilters = () => {
        if (filtersAreDefault) return
        setFilters({ ...DEFAULT_FILTERS })
        setPagination((prev) => ({ ...prev, currentPage: 1 }))
    }

    const handlePageChange = (direction) => {
        setPagination((prev) => {
            const nextPage = direction === 'next' ? prev.currentPage + 1 : prev.currentPage - 1
            if (nextPage < 1 || nextPage > prev.totalPages) {
                return prev
            }
            return { ...prev, currentPage: nextPage }
        })
    }

    const handleBaseInputChange = (value) => {
        const safeValue = (value || '').toUpperCase().replace(/[^A-Z0-9]/g, '')
        setValue('baseInput', safeValue)
        if (errors.baseInput) {
            setErrors((prev) => ({ ...prev, baseInput: '' }))
        }
    }

    const validateForm = () => {
        const validationErrors = {}

        if (!formData.title.trim()) {
            validationErrors.title = 'Title is required'
        }

        const baseInput = formData.baseInput.trim()
        if (!baseInput) {
            validationErrors.baseInput = 'Base input is required'
        } else if (baseInput.length < 3) {
            validationErrors.baseInput = 'Base must be at least 3 characters'
        }

        const countValue = Number(formData.count)
        if (!Number.isFinite(countValue) || countValue <= 0) {
            validationErrors.count = 'Count must be greater than 0'
        } else if (!Number.isInteger(countValue)) {
            validationErrors.count = 'Count must be a whole number'
        } else if (countValue > 500) {
            validationErrors.count = 'Maximum 500 codes per batch'
        }

        const discountValue = Number(formData.discountValue)
        if (!Number.isFinite(discountValue) || discountValue <= 0) {
            validationErrors.discountValue = 'Discount value must be greater than 0'
        } else if (formData.discountType === 'PERCENTAGE' && discountValue > 100) {
            validationErrors.discountValue = 'Percentage cannot exceed 100'
        }

        if (!formData.startDate) {
            validationErrors.startDate = 'Start date is required'
        }

        if (!formData.endDate) {
            validationErrors.endDate = 'End date is required'
        }

        if (formData.startDate && formData.endDate) {
            const start = new Date(formData.startDate)
            const end = new Date(formData.endDate)
            if (start > end) {
                validationErrors.endDate = 'End date must be after start date'
            }
        }

        if (!formData.discountType) {
            validationErrors.discountType = 'Select a discount type'
        }

        if (!formData.usageScope) {
            validationErrors.usageScope = 'Select a usage scope'
        }

        setErrors(validationErrors)
        return Object.keys(validationErrors).length === 0
    }

    const buildPayload = () => {
        const payload = {
            title: formData.title.trim(),
            baseInput: formData.baseInput.trim().toUpperCase(),
            count: Number(formData.count),
            discountType: formData.discountType,
            discountValue: Number(formData.discountValue),
            startDate: new Date(formData.startDate).toISOString(),
            endDate: new Date(formData.endDate).toISOString(),
            usageScope: formData.usageScope,
        }

        if (Array.isArray(formData.products) && formData.products.length > 0) {
            payload.products = formData.products
        }

        if (formData.notes?.trim()) {
            payload.notes = formData.notes.trim()
        }

        return payload
    }

    const handleSubmit = async (event) => {
        event.preventDefault()
        setSubmitError('')
        setCopyFeedback('')

        if (!validateForm()) {
            return
        }

        try {
            setSubmitting(true)
            const payload = buildPayload()
            const response = await createPromoBatchAPI(payload)
            setResult(response)
            reset({ ...INITIAL_FORM_STATE })
            setPagination((prev) => ({ ...prev, currentPage: 1 }))
            fetchBatches(1)
        } catch (error) {
            setSubmitError(error.message || 'Failed to create promo batch')
        } finally {
            setSubmitting(false)
        }
    }

    const handleCopyCodes = async () => {
        if (!result?.codes || result.codes.length === 0) {
            return
        }

        const text = result.codes.join('\n')
        try {
            if (navigator?.clipboard?.writeText) {
                await navigator.clipboard.writeText(text)
                setCopyFeedback('Codes copied to clipboard')
                setTimeout(() => setCopyFeedback(''), 2500)
            } else {
                throw new Error('Clipboard API not supported')
            }
        } catch (error) {
            setCopyFeedback('Unable to copy automatically. Please copy manually.')
            setTimeout(() => setCopyFeedback(''), 3000)
        }
    }

    const handleCopySelectedCodes = async (codes) => {
        if (!codes?.length) return
        const text = codes.map((item) => (typeof item === 'string' ? item : item.code)).join('\n')
        try {
            if (navigator?.clipboard?.writeText) {
                await navigator.clipboard.writeText(text)
                setDetailCopyFeedback('Codes copied to clipboard')
                setTimeout(() => setDetailCopyFeedback(''), 2500)
            } else {
                throw new Error('Clipboard API not supported')
            }
        } catch (error) {
            setDetailCopyFeedback('Unable to copy automatically. Please copy manually.')
            setTimeout(() => setDetailCopyFeedback(''), 3000)
        }
    }

    const slugify = (value) =>
        (value || '')
            .toString()
            .trim()
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '') || 'promo-export'

    const handleExportBatch = async (batch, detailResponse = null) => {
        if (!batch?._id) return
        try {
            setExportingBatchId(batch._id)

            let detailData = detailResponse
            if (!detailData) {
                const response = await getPromoBatchByIdAPI(batch._id)
                detailData = {
                    ...response,
                    stats: response.stats ?? batch.stats ?? selectedBatchSummary?.stats,
                }
            }

            const summary = {
                ...batch,
                ...(detailData.batch || {}),
            }
            const stats =
                detailData.stats || detailData.batch?.stats || batch.stats || selectedBatchSummary?.stats || null
            const codes = detailData.codes || []
            const workbook = XLSX.utils.book_new()

            const summaryRows = [
                ['Title', summary.title || ''],
                ['Prefix', summary.baseInput || ''],
                ['Usage Scope', summary.usageScope || ''],
                ['Discount Type', summary.discountType || ''],
                ['Discount Value', summary.discountValue ?? ''],
                ['Total Codes', stats?.totalCodes ?? summary.count ?? codes.length],
                ['Start Date', formatDateTime(summary.startDate)],
                ['End Date', formatDateTime(summary.endDate)],
            ]

            if (Array.isArray(summary.products) && summary.products.length > 0) {
                const productLabels = summary.products.map((product) => {
                    if (typeof product === 'string') return product
                    if (!product || typeof product !== 'object') return ''
                    return product.title || product.name || product.slug || product._id || ''
                })
                summaryRows.push(['Products', productLabels.filter(Boolean).join(', ')])
            }

            const formatText = detailData.format || summary.format
            if (formatText) {
                summaryRows.push(['Format', formatText])
            }

            if (stats) {
                summaryRows.push(['Total Usage Limit', stats.totalUsageLimit ?? ''])
                summaryRows.push(['Total Usage Count', stats.totalUsageCount ?? ''])
                summaryRows.push(['Fully Used Codes', stats.fullyUsedCodes ?? ''])
                summaryRows.push(['Active Codes', stats.activeCodes ?? ''])
                summaryRows.push(['Remaining Usage', stats.remainingUsage ?? ''])
            }

            const summarySheet = XLSX.utils.aoa_to_sheet(summaryRows)
            XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary')

            const codesSheetData = [
                ['Code', 'Status', 'Usage Limit', 'Usage Count', 'Remaining Usage', 'Used By'],
            ]

            codes.forEach((code) => {
                const usageLimit = code.usageLimit ?? ''
                const usageCount = code.usageCount ?? ''
                let remaining = code.remainingUsage
                if (remaining === undefined && typeof usageLimit === 'number' && typeof usageCount === 'number') {
                    remaining = usageLimit - usageCount
                }
                codesSheetData.push([
                    code.code || '',
                    code.status || '',
                    usageLimit,
                    usageCount,
                    remaining ?? '',
                    Array.isArray(code.usedBy) ? code.usedBy.join(', ') : '',
                ])
            })

            if (codesSheetData.length === 1) {
                codesSheetData.push(['', '', '', '', '', ''])
            }

            const codesSheet = XLSX.utils.aoa_to_sheet(codesSheetData)
            XLSX.utils.book_append_sheet(workbook, codesSheet, 'Codes')

            const filename = `${slugify(summary.title || summary.baseInput)}-codes.xlsx`
            XLSX.writeFile(workbook, filename)
        } catch (error) {
            console.error(error)
            alert(error.message || 'Failed to export promo batch')
        } finally {
            setExportingBatchId(null)
        }
    }

    const handleDeactivateBatch = async (batch) => {
        if (!batch?._id || !batch.isActive) return
        const confirmed = window.confirm(
            `Are you sure you want to deactivate the promo batch "${batch.title}"?`
        )
        if (!confirmed) return

        try {
            setDeactivatingBatchId(batch._id)
            await deactivatePromoBatchAPI(batch._id)
            await fetchBatches(pagination.currentPage)
            setSelectedBatch((prev) => {
                if (!prev || prev.batch?._id !== batch._id) return prev
                return {
                    ...prev,
                    batch: {
                        ...prev.batch,
                        isActive: false,
                    },
                }
            })
            setSelectedBatchSummary((prev) => {
                if (!prev || prev._id !== batch._id) return prev
                return { ...prev, isActive: false }
            })
        } catch (error) {
            alert(error.message || 'Failed to deactivate promo batch')
        } finally {
            setDeactivatingBatchId(null)
        }
    }

    const handleViewBatch = (batchId) => {
        if (!batchId) return
        const summary = batches.find((item) => item._id === batchId)
        setSelectedBatchSummary(summary || null)
        setSelectedBatchId(batchId)
    }

    useEffect(() => {
        if (!selectedBatchId) return

        const fetchBatchDetail = async () => {
            try {
                setSelectedBatchLoading(true)
                setSelectedBatchError('')
                setSelectedBatch(null)
                setDetailCopyFeedback('')
                const response = await getPromoBatchByIdAPI(selectedBatchId)
                setSelectedBatch({
                    ...response,
                    stats: response.stats ?? selectedBatchSummary?.stats,
                })
            } catch (error) {
                setSelectedBatchError(error.message || 'Failed to load promo batch details')
            } finally {
                setSelectedBatchLoading(false)
            }
        }

        fetchBatchDetail()
    }, [selectedBatchId, selectedBatchSummary])

    const handleCloseDetail = () => {
        setSelectedBatchId(null)
        setSelectedBatch(null)
        setSelectedBatchError('')
        setDetailCopyFeedback('')
        setSelectedBatchSummary(null)
    }

    const selectedCodes = useMemo(
        () => selectedBatch?.codes?.map((item) => item.code || item) || [],
        [selectedBatch]
    )

    const selectedStats = useMemo(() => {
        if (selectedBatch?.stats) return selectedBatch.stats
        if (selectedBatchSummary?.stats) return selectedBatchSummary.stats
        return null
    }, [selectedBatch, selectedBatchSummary])

    return (
        <div className="max-w-5xl mx-auto space-y-8">
            <div className="bg-white shadow-sm border border-gray-200 rounded-2xl p-6 sm:p-8">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="p-3 rounded-xl bg-primary-50 text-primary-600">
                            <Gift size={28} />
                        </div>
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Promo Batches</h1>
                            <p className="text-gray-600">
                                Generate stackable or flat promo codes for campaigns and product pushes.
                            </p>
                        </div>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3">
                        <button
                            type="button"
                            onClick={handleToggleCreateForm}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700 transition"
                        >
                            <Gift size={18} />
                            {showCreateForm ? 'Hide Promo Form' : 'Create Promo Batch'}
                        </button>
                        <button
                            type="button"
                            onClick={fetchProducts}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition disabled:opacity-60"
                            disabled={loadingProducts}
                        >
                            {loadingProducts ? <Loader2 className="animate-spin" size={18} /> : <RefreshCw size={18} />}
                            Refresh Products
                        </button>
                        <button
                            type="button"
                            onClick={handleRefreshBatches}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition disabled:opacity-60"
                            disabled={listLoading}
                        >
                            {listLoading ? <Loader2 className="animate-spin" size={18} /> : <RefreshCw size={18} />}
                            Refresh Promo List
                        </button>
                    </div>
                </div>
                {productError && (
                    <div className="mt-4 flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-amber-700">
                        <AlertCircle size={18} />
                        <span>{productError}</span>
                    </div>
                )}
            </div>

            {showCreateForm && (
                <form
                    onSubmit={handleSubmit}
                    className="bg-white shadow-sm border border-gray-200 rounded-2xl p-6 sm:p-8 space-y-6"
                >
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <Input
                            label="Batch Title"
                            name="title"
                            placeholder="New Year Blast"
                            value={formData.title}
                            onChange={handleChange}
                            errors={errors}
                            required
                        />

                        <Input
                            label="Base Prefix"
                            name="baseInput"
                            placeholder="VIKAS"
                            value={formData.baseInput}
                            onChange={(event) => handleBaseInputChange(event.target.value)}
                            errors={errors}
                            required
                            maxLength={10}
                        />

                        <Input
                            label="Number of Codes"
                            name="count"
                            type="number"
                            min={1}
                            max={500}
                            step={1}
                            placeholder="10"
                            value={formData.count}
                            onChange={handleChange}
                            errors={errors}
                            required
                        />

                        <Select
                            label="Discount Type"
                            name="discountType"
                            value={formData.discountType}
                            onChange={handleChange}
                            errors={errors}
                            required
                            options={[
                                { value: 'FLAT', label: 'Flat Discount (₹)' },
                                { value: 'PERCENTAGE', label: 'Percentage (%)' },
                            ]}
                        />

                        <Input
                            label={formData.discountType === 'PERCENTAGE' ? 'Discount Value (%)' : 'Discount Value (₹)'}
                            name="discountValue"
                            type="number"
                            min={formData.discountType === 'PERCENTAGE' ? 1 : 10}
                            max={formData.discountType === 'PERCENTAGE' ? 100 : undefined}
                            step={formData.discountType === 'PERCENTAGE' ? 1 : 5}
                            placeholder={formData.discountType === 'PERCENTAGE' ? '15' : '250'}
                            value={formData.discountValue}
                            onChange={handleChange}
                            errors={errors}
                            required
                        />

                        <Select
                            label="Usage Scope"
                            name="usageScope"
                            value={formData.usageScope}
                            onChange={handleChange}
                            errors={errors}
                            required
                            options={[
                                { value: 'GLOBAL', label: 'Global (any user)' },
                                { value: 'PER_USER', label: 'Per user (one use per user)' },
                            ]}
                        />

                        <Input
                            label="Start Date"
                            name="startDate"
                            type="datetime-local"
                            value={formatDateTimeLocal(formData.startDate) || formData.startDate}
                            onChange={handleChange}
                            errors={errors}
                            required
                        />

                        <Input
                            label="End Date"
                            name="endDate"
                            type="datetime-local"
                            value={formatDateTimeLocal(formData.endDate) || formData.endDate}
                            onChange={handleChange}
                            errors={errors}
                            required
                        />
                    </div>

                    <div className="grid grid-cols-1 gap-6">
                        <Select
                            label="Applicable Products"
                            name="products"
                            multiple
                            value={formData.products}
                            onChange={handleChange}
                            errors={errors}
                            options={productOptions}
                            placeholder={loadingProducts ? 'Loading products…' : 'Select one or more products'}
                            disabled={loadingProducts}
                        />
                        <p className="text-sm text-gray-500">
                            Leave empty for site-wide promos. Hold Ctrl (Windows) or ⌘ (macOS) to select multiple products.
                        </p>
                    </div>

                    <Textarea
                        label="Internal Notes (optional)"
                        name="notes"
                        placeholder="Add launch targets, restrictions or any internal notes for this batch."
                        value={formData.notes}
                        onChange={handleChange}
                        errors={errors}
                        rows={4}
                    />

                    {submitError && (
                        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-600">
                            <AlertCircle size={18} />
                            <span>{submitError}</span>
                        </div>
                    )}

                    <div className="flex flex-col sm:flex-row sm:items-center justify-end gap-3">
                        <button
                            type="button"
                            onClick={() => {
                                reset({ ...INITIAL_FORM_STATE })
                                setSubmitError('')
                                setCopyFeedback('')
                            }}
                            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition"
                            disabled={submitting}
                        >
                            Clear Form
                        </button>
                        <button
                            type="button"
                            onClick={handleToggleCreateForm}
                            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition"
                            disabled={submitting}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-primary-600 text-white hover:bg-primary-700 transition disabled:opacity-70"
                            disabled={submitting}
                        >
                            {submitting ? <Loader2 className="animate-spin" size={18} /> : <Gift size={18} />}
                            {submitting ? 'Creating Batch…' : 'Create Promo Batch'}
                        </button>
                    </div>
                </form>
            )}

            {showCreateForm && result && (
                <div className="bg-white shadow-sm border border-gray-200 rounded-2xl p-6 sm:p-8 space-y-6">
                    <div className="flex items-center gap-3 text-green-600">
                        <CheckCircle2 size={26} />
                        <div>
                            <h2 className="text-xl font-semibold text-gray-900">Promo Batch Created</h2>
                            <p className="text-gray-600">Keep these codes handy or export them to your campaign sheet.</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 space-y-2">
                            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Batch Summary</h3>
                            <p className="text-lg font-semibold text-gray-900">{result?.batch?.title}</p>
                            <dl className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                                <div>
                                    <dt className="font-medium text-gray-500">Prefix</dt>
                                    <dd>{result?.batch?.baseInput}</dd>
                                </div>
                                <div>
                                    <dt className="font-medium text-gray-500">Scope</dt>
                                    <dd>{result?.batch?.usageScope}</dd>
                                </div>
                                <div>
                                    <dt className="font-medium text-gray-500">Discount</dt>
                                    <dd>
                                        {result?.batch?.discountType === 'PERCENTAGE'
                                            ? `${result?.batch?.discountValue}%`
                                            : `₹${result?.batch?.discountValue}`}
                                    </dd>
                                </div>
                                <div>
                                    <dt className="font-medium text-gray-500">Codes</dt>
                                    <dd>{result?.batch?.count}</dd>
                                </div>
                                <div>
                                    <dt className="font-medium text-gray-500">Validity</dt>
                                    <dd>
                                        {new Date(result?.batch?.startDate).toLocaleString()} →{' '}
                                        {new Date(result?.batch?.endDate).toLocaleString()}
                                    </dd>
                                </div>
                                {result?.usageLimitPerCode && (
                                    <div>
                                        <dt className="font-medium text-gray-500">Usage / Code</dt>
                                        <dd>{result?.usageLimitPerCode}</dd>
                                    </div>
                                )}
                            </dl>
                        </div>

                        <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 space-y-2">
                            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Format</h3>
                            <p className="text-gray-700">{result?.format}</p>
                            {result?.batch?.products?.length > 0 && (
                                <div className="pt-2">
                                    <div className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Product IDs</div>
                                    <p className="text-sm text-gray-700 break-all">
                                        {result.batch.products.join(', ')}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                            <h3 className="text-lg font-semibold text-gray-900">Generated Codes</h3>
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={handleCopyCodes}
                                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition"
                                >
                                    <Clipboard size={18} />
                                    Copy Codes
                                </button>
                                {copyFeedback && (
                                    <span className="text-sm text-gray-500">{copyFeedback}</span>
                                )}
                            </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                            {result.codes?.map((code) => (
                                <div
                                    key={code}
                                    className="rounded-lg border border-primary-100 bg-primary-50 px-4 py-3 font-semibold text-primary-700 text-center tracking-wide"
                                >
                                    {code}
                                </div>
                            ))}
                        </div>

                        <Textarea
                            label="Raw Codes"
                            name="generatedCodes"
                            value={(result.codes || []).join('\n')}
                            readOnly
                            rows={Math.max(6, Math.ceil((result.codes || []).length / 3))}
                        />
                    </div>
                </div>
            )}

            <div className="bg-white shadow-sm border border-gray-200 rounded-2xl p-6 sm:p-8 space-y-6">
                <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-primary-50 text-primary-600">
                        <Filter size={20} />
                    </div>
                    <div className="flex-1">
                        <h2 className="text-xl font-semibold text-gray-900">Promo Batches</h2>
                        <p className="text-gray-600">
                            Filter, review and manage existing promo code batches.
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Input
                        label="Search"
                        name="search"
                        placeholder="Search by title or prefix"
                        value={filters.search}
                        onChange={handleFilterChange}
                        errors={{}}
                    />
                    <Select
                        label="Status"
                        name="status"
                        value={filters.status}
                        onChange={handleFilterChange}
                        errors={{}}
                        options={[
                            { value: 'active', label: 'Active' },
                            { value: 'inactive', label: 'Inactive' },
                        ]}
                        placeholder="Any status"
                    />
                    <Select
                        label="Usage Scope"
                        name="scope"
                        value={filters.scope}
                        onChange={handleFilterChange}
                        errors={{}}
                        options={[
                            { value: 'GLOBAL', label: 'Global' },
                            { value: 'PER_USER', label: 'Per User' },
                        ]}
                        placeholder="Any scope"
                    />
                </div>

                <div className="flex flex-col sm:flex-row sm:justify-end gap-3">
                    <button
                        type="button"
                        onClick={handleClearFilters}
                        className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition"
                        disabled={filtersAreDefault}
                    >
                        Clear Filters
                    </button>
                    <button
                        type="button"
                        onClick={handleRefreshBatches}
                        className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition disabled:opacity-60"
                        disabled={listLoading}
                    >
                        {listLoading ? <Loader2 className="animate-spin" size={18} /> : <RefreshCw size={18} />}
                        Refresh
                    </button>
                </div>

                {listError && (
                    <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-600">
                        <AlertCircle size={18} />
                        <span>{listError}</span>
                    </div>
                )}

                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                    Title
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                    Prefix
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                    Discount
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                    Scope
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                    Validity
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                    Codes
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                    Status
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {listLoading && batches.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="px-4 py-6 text-center text-gray-500">
                                        <div className="inline-flex items-center gap-2">
                                            <Loader2 className="animate-spin" size={18} />
                                            Loading promo batches…
                                        </div>
                                    </td>
                                </tr>
                            ) : batches.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="px-4 py-6 text-center text-gray-500">
                                        No promo batches found. Adjust filters or create a new batch.
                                    </td>
                                </tr>
                            ) : (
                                batches.map((batch) => (
                                    <tr key={batch._id} className="hover:bg-gray-50">
                                        <td className="px-4 py-3">
                                            <div className="font-semibold text-gray-900">{batch.title}</div>
                                            <div className="text-sm text-gray-500">
                                                Created {formatDateTime(batch.createdAt)}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-gray-700">{batch.baseInput}</td>
                                        <td className="px-4 py-3 text-gray-700">{formatDiscount(batch)}</td>
                                        <td className="px-4 py-3 text-gray-700">{formatScope(batch.usageScope)}</td>
                                        <td className="px-4 py-3 text-gray-700">
                                            {formatDateRange(batch.startDate, batch.endDate)}
                                        </td>
                                        <td className="px-4 py-3 text-gray-700">
                                            {batch.stats?.totalCodes ?? batch.count ?? '—'}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span
                                                className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${batch.isActive
                                                    ? 'bg-green-100 text-green-700'
                                                    : 'bg-gray-200 text-gray-600'
                                                    }`}
                                            >
                                                {batch.isActive ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex flex-wrap gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => handleViewBatch(batch._id)}
                                                    className="inline-flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 transition"
                                                >
                                                    <Eye size={16} />
                                                    View
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => handleExportBatch(batch)}
                                                    className="inline-flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 transition disabled:opacity-60"
                                                    disabled={exportingBatchId === batch._id}
                                                >
                                                    {exportingBatchId === batch._id ? (
                                                        <Loader2 className="animate-spin" size={16} />
                                                    ) : (
                                                        <Download size={16} />
                                                    )}
                                                    Export
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => handleDeactivateBatch(batch)}
                                                    className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 transition disabled:opacity-60"
                                                    disabled={!batch.isActive || deactivatingBatchId === batch._id}
                                                >
                                                    {deactivatingBatchId === batch._id ? (
                                                        <Loader2 className="animate-spin" size={16} />
                                                    ) : (
                                                        <Ban size={16} />
                                                    )}
                                                    Deactivate
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {batches.length > 0 && (
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div className="text-sm text-gray-600">
                            Showing page {pagination.currentPage} of {pagination.totalPages} •{' '}
                            {pagination.totalCount} total batches
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={() => handlePageChange('prev')}
                                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition disabled:opacity-60"
                                disabled={pagination.currentPage <= 1 || listLoading}
                            >
                                Prev
                            </button>
                            <button
                                type="button"
                                onClick={() => handlePageChange('next')}
                                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition disabled:opacity-60"
                                disabled={!pagination.hasNextPage || listLoading}
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {selectedBatchId && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 py-6">
                    <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-white rounded-2xl p-6 sm:p-8 space-y-6">
                        <button
                            type="button"
                            onClick={handleCloseDetail}
                            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition"
                        >
                            <X size={20} />
                        </button>

                        {selectedBatchLoading ? (
                            <div className="flex justify-center py-16 text-gray-500">
                                <div className="inline-flex items-center gap-2">
                                    <Loader2 className="animate-spin" size={20} />
                                    Loading batch details…
                                </div>
                            </div>
                        ) : selectedBatchError ? (
                            <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-600">
                                <AlertCircle size={18} />
                                <span>{selectedBatchError}</span>
                            </div>
                        ) : selectedBatch ? (
                            <>
                                <div className="space-y-2">
                                    <h3 className="text-2xl font-semibold text-gray-900">
                                        {selectedBatch.batch?.title}
                                    </h3>
                                    <div className="text-sm text-gray-500">
                                        Created {formatDateTime(selectedBatch.batch?.createdAt)}
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        <span className="rounded-full bg-primary-50 px-3 py-1 text-xs font-semibold text-primary-700">
                                            Prefix: {selectedBatch.batch?.baseInput}
                                        </span>
                                        <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700">
                                            Scope: {formatScope(selectedBatch.batch?.usageScope)}
                                        </span>
                                        <span
                                            className={`rounded-full px-3 py-1 text-xs font-semibold ${selectedBatch.batch?.isActive
                                                ? 'bg-green-100 text-green-700'
                                                : 'bg-gray-200 text-gray-600'
                                                }`}
                                        >
                                            {selectedBatch.batch?.isActive ? 'Active' : 'Inactive'}
                                        </span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 space-y-2">
                                        <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
                                            Batch Details
                                        </h4>
                                        <dl className="grid grid-cols-2 gap-2 text-sm text-gray-700">
                                            <div>
                                                <dt className="font-medium text-gray-500">Discount</dt>
                                                <dd>{formatDiscount(selectedBatch.batch)}</dd>
                                            </div>
                                            <div>
                                                <dt className="font-medium text-gray-500">Codes</dt>
                                                <dd>{selectedBatch.batch?.count}</dd>
                                            </div>
                                            <div>
                                                <dt className="font-medium text-gray-500">Start</dt>
                                                <dd>{formatDateTime(selectedBatch.batch?.startDate)}</dd>
                                            </div>
                                            <div>
                                                <dt className="font-medium text-gray-500">End</dt>
                                                <dd>{formatDateTime(selectedBatch.batch?.endDate)}</dd>
                                            </div>
                                            {selectedBatch.batch?.products?.length > 0 && (
                                                <div className="col-span-2">
                                                    <dt className="font-medium text-gray-500">Products</dt>
                                                    <dd className="text-sm text-gray-700 space-y-1">
                                                        {selectedBatch.batch.products.map((product) =>
                                                            typeof product === 'string' ? (
                                                                <div key={product}>{product}</div>
                                                            ) : (
                                                                <div key={product._id}>{product.title || product._id}</div>
                                                            )
                                                        )}
                                                    </dd>
                                                </div>
                                            )}
                                        </dl>
                                    </div>

                                    <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 space-y-2">
                                        <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
                                            Stats & Format
                                        </h4>
                                        <dl className="grid grid-cols-2 gap-2 text-sm text-gray-700">
                                            <div>
                                                <dt className="font-medium text-gray-500">Total Codes</dt>
                                                <dd>{displayStat(selectedStats?.totalCodes ?? selectedBatch.batch?.count)}</dd>
                                            </div>
                                            <div>
                                                <dt className="font-medium text-gray-500">Active Codes</dt>
                                                <dd>{displayStat(selectedStats?.activeCodes)}</dd>
                                            </div>
                                            <div>
                                                <dt className="font-medium text-gray-500">Total Usage Limit</dt>
                                                <dd>{displayStat(selectedStats?.totalUsageLimit)}</dd>
                                            </div>
                                            <div>
                                                <dt className="font-medium text-gray-500">Total Usage Count</dt>
                                                <dd>{displayStat(selectedStats?.totalUsageCount)}</dd>
                                            </div>
                                            <div>
                                                <dt className="font-medium text-gray-500">Fully Used Codes</dt>
                                                <dd>{displayStat(selectedStats?.fullyUsedCodes)}</dd>
                                            </div>
                                            <div>
                                                <dt className="font-medium text-gray-500">Remaining Usage</dt>
                                                <dd>{displayStat(selectedStats?.remainingUsage)}</dd>
                                            </div>
                                        </dl>
                                        {selectedBatch.format && (
                                            <p className="text-sm text-gray-600 pt-2">{selectedBatch.format}</p>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                        <h4 className="text-lg font-semibold text-gray-900">Codes</h4>
                                        <div className="flex flex-wrap items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={() => handleCopySelectedCodes(selectedBatch.codes)}
                                                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition"
                                            >
                                                <Clipboard size={16} />
                                                Copy
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleExportBatch(selectedBatch.batch, selectedBatch)}
                                                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition disabled:opacity-60"
                                                disabled={exportingBatchId === selectedBatch.batch?._id}
                                            >
                                                {exportingBatchId === selectedBatch.batch?._id ? (
                                                    <Loader2 className="animate-spin" size={16} />
                                                ) : (
                                                    <Download size={16} />
                                                )}
                                                Export
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleDeactivateBatch(selectedBatch.batch)}
                                                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition disabled:opacity-60"
                                                disabled={
                                                    !selectedBatch.batch?.isActive ||
                                                    deactivatingBatchId === selectedBatch.batch?._id
                                                }
                                            >
                                                {deactivatingBatchId === selectedBatch.batch?._id ? (
                                                    <Loader2 className="animate-spin" size={16} />
                                                ) : (
                                                    <Ban size={16} />
                                                )}
                                                Deactivate
                                            </button>
                                        </div>
                                    </div>
                                    {detailCopyFeedback && (
                                        <div className="text-sm text-gray-500">{detailCopyFeedback}</div>
                                    )}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                                        {(selectedBatch.codes || []).map((code) => (
                                            <div
                                                key={code._id || code.code || code}
                                                className="rounded-lg border border-primary-100 bg-primary-50 px-4 py-3 font-semibold text-primary-700 text-center tracking-wide"
                                            >
                                                {code.code || code}
                                            </div>
                                        ))}
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
                                            Raw Codes
                                        </label>
                                        <textarea
                                            readOnly
                                            className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
                                            rows={Math.max(6, Math.ceil(selectedCodes.length / 3))}
                                            value={selectedCodes.join('\n')}
                                        />
                                        {selectedBatch.pagination && (
                                            <div className="text-sm text-gray-500">
                                                Codes page {selectedBatch.pagination.currentPage} of{' '}
                                                {selectedBatch.pagination.totalPages} • {selectedBatch.pagination.totalCount} total codes
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </>
                        ) : null}
                    </div>
                </div>
            )}
        </div>
    )
}

export default PromoManagement

