import { useState, useEffect, useMemo, useCallback } from 'react'
import { Plus, RefreshCw, Loader2, Edit, Trash2 } from 'lucide-react'
import Input from '../components/Form/Input'
import Select from '../components/Form/Select'
import Textarea from '../components/Form/Textarea'
import Checkbox from '../components/Form/Checkbox'
import FileUpload from '../components/Form/FileUpload'
import {
    getTradersAPI,
    getAllProductsAPI,
    getAllCategoriesAPI,
    getWebsiteSectionsAPI,
    createWebsiteSectionAPI,
    updateWebsiteSectionAPI,
    deleteWebsiteSectionAPI,
} from '../utils/api'

const SECTION_OPTIONS = [
    { value: 'HERO_PRODUCT', label: 'Hero Product' },
    { value: 'SELECT_CATEGORY', label: 'Select Category' },
    { value: 'HERO_IMAGE', label: 'Hero Image' },
    { value: 'SHOP_BY_CATEGORY', label: 'Shop By Category' },
    { value: 'BUSINESS_GALLERY', label: 'Business Gallery' },
    { value: 'HASHTAG_SECTION', label: 'Hashtag Section' },
    { value: 'PRODUCT_DETAIL', label: 'Product Detail' },
]

const SECTION_CONFIG = {
    HERO_PRODUCT: {
        requiresProduct: true,
        requiresTitle: false,
        hasImages: true,
        requiresImages: false,
        requiresCategory: false,
        allowsTags: false,
        allowsCategory: false,
        allowsNeedTree: true,
    },
    SELECT_CATEGORY: {
        requiresProduct: false,
        requiresTitle: true,
        hasImages: true,
        requiresImages: true,
        requiresCategory: false,
        allowsTags: false,
        allowsCategory: true,
        allowsNeedTree: false,
    },
    HERO_IMAGE: {
        requiresProduct: false,
        requiresTitle: false,
        hasImages: true,
        requiresImages: true,
        requiresCategory: false,
        allowsTags: false,
        allowsCategory: false,
        allowsNeedTree: true,
    },
    SHOP_BY_CATEGORY: {
        requiresProduct: true,
        requiresTitle: false,
        hasImages: true,
        requiresImages: false,
        requiresCategory: true,
        allowsTags: true,
        allowsCategory: true,
        allowsNeedTree: false,
    },
    BUSINESS_GALLERY: {
        requiresProduct: false,
        requiresTitle: false,
        hasImages: true,
        requiresImages: true,
        requiresCategory: false,
        allowsTags: false,
        allowsCategory: false,
        allowsNeedTree: false,
    },
    HASHTAG_SECTION: {
        requiresProduct: false,
        requiresTitle: false,
        hasImages: true,
        requiresImages: true,
        requiresCategory: false,
        allowsTags: true,
        allowsCategory: false,
        allowsNeedTree: false,
    },
    PRODUCT_DETAIL: {
        requiresProduct: true,
        requiresTitle: false,
        hasImages: false,
        requiresImages: false,
        requiresCategory: true,
        allowsTags: true,
        allowsCategory: true,
        allowsNeedTree: true,
    },
}

const DEFAULT_FORM_STATE = {
    sectionType: '',
    trader: '',
    title: '',
    product: '',
    categoryId: '',
    images: [],
    imagesText: '',
    tagsText: '',
    order: '',
    active: true,
    isNeedToShowTree: false,
}

const parseListInput = (value) => {
    if (!value) return []
    return value
        .split(/[\n,]/)
        .map((item) => item.trim())
        .filter(Boolean)
}

const buildPayload = (formData, config) => {
    const payload = {
        sectionType: formData.sectionType,
        trader: formData.trader,
        order: formData.order ? Number(formData.order) : undefined,
        active: formData.active,
    }

    if (config.allowsNeedTree || config.requiresProduct) {
        payload.isNeedToShowTree = formData.isNeedToShowTree
    }

    if (formData.title) {
        payload.title = formData.title
    }

    if (formData.product) {
        payload.product = formData.product
    }

    if (formData.categoryId) {
        payload.categoryId = formData.categoryId
    }

    if (config.hasImages && config.requiresImages) {sideb
        const uploadedImages = Array.isArray(formData.images) ? formData.images.filter(Boolean) : []
        const manualImages = parseListInput(formData.imagesText)
        const images = Array.from(new Set([...uploadedImages, ...manualImages]))
        if (images.length > 0) {
            payload.images = images
        }
    }

    const tags = parseListInput(formData.tagsText)
    if (tags.length > 0) {
        payload.tags = tags
    }

    // Remove undefined keys
    Object.keys(payload).forEach((key) => {
        if (payload[key] === undefined) {
            delete payload[key]
        }
    })

    return payload
}

const WebsiteSections = () => {
    const [formData, setFormData] = useState(DEFAULT_FORM_STATE)
    const [formErrors, setFormErrors] = useState({})
    const [filters, setFilters] = useState({ sectionType: '', trader: '' })
    const [traders, setTraders] = useState([])
    const [products, setProducts] = useState([])
    const [categories, setCategories] = useState([])
    const [sections, setSections] = useState([])
    const [listLoading, setListLoading] = useState(false)
    const [loadingInitialData, setLoadingInitialData] = useState(true)
    const [saving, setSaving] = useState(false)
    const [editingSectionId, setEditingSectionId] = useState(null)

    const currentConfig = useMemo(() => {
        return SECTION_CONFIG[formData.sectionType] || {}
    }, [formData.sectionType])

    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                const [tradersResponse, productsResponse, categoriesResponse] = await Promise.all([
                    getTradersAPI(1, 100),
                    getAllProductsAPI(1, 100),
                    getAllCategoriesAPI(1, 100),
                ])

                setTraders(tradersResponse?.data || [])
                setProducts(productsResponse?.data || [])
                setCategories(categoriesResponse?.data || [])
            } catch (error) {
                console.error('Error loading initial data:', error)
                alert(error.message || 'Failed to load initial data')
            } finally {
                setLoadingInitialData(false)
            }
        }

        fetchInitialData()
    }, [])

    const fetchSections = useCallback(
        async (sectionTypeParam, traderParam) => {
            const sectionType = sectionTypeParam ?? filters.sectionType
            const traderId = traderParam ?? filters.trader

            if (!sectionType || !traderId) {
                setSections([])
                return
            }

            try {
                setListLoading(true)
                const response = await getWebsiteSectionsAPI(sectionType, traderId, 1, 100)
                setSections(response?.data || [])
            } catch (error) {
                console.error('Error fetching website sections:', error)
                alert(error.message || 'Failed to fetch website sections')
            } finally {
                setListLoading(false)
            }
        },
        [filters.sectionType, filters.trader]
    )

    useEffect(() => {
        if (filters.sectionType && filters.trader) {
            fetchSections(filters.sectionType, filters.trader)
        }
    }, [filters.sectionType, filters.trader, fetchSections])

    useEffect(() => {
        if (!editingSectionId) {
            setFormData((prev) => ({
                ...prev,
                sectionType: filters.sectionType || prev.sectionType,
                trader: filters.trader || prev.trader,
            }))
        }
    }, [filters.sectionType, filters.trader, editingSectionId])

    const handleFilterChange = (e) => {
        const { name, value } = e.target
        setFilters((prev) => ({
            ...prev,
            [name]: value,
        }))
    }

    const handleFormChange = (e) => {
        if (!e || !e.target) return

        const { name, value, type, checked, error, allPaths } = e.target

        if (error) {
            setFormErrors((prev) => ({
                ...prev,
                [name]: error,
            }))
            return
        }

        const derivedValue = type === 'checkbox' ? checked : value

        setFormData((prev) => {
            const next = { ...prev }

            if (name === 'images') {
                const imageList = Array.isArray(allPaths)
                    ? allPaths
                    : Array.isArray(derivedValue)
                        ? derivedValue
                        : derivedValue
                            ? [derivedValue]
                            : []
                next.images = imageList
                next.imagesText = imageList.join('\n')
            } else if (name === 'imagesText') {
                const imageList = parseListInput(derivedValue)
                next.imagesText = derivedValue
                next.images = imageList
            } else {
                next[name] = derivedValue
            }

            return next
        })

        if (formErrors[name]) {
            setFormErrors((prev) => ({
                ...prev,
                [name]: '',
            }))
        }
    }

    const resetForm = () => {
        setFormData((prev) => ({
            ...DEFAULT_FORM_STATE,
            sectionType: filters.sectionType,
            trader: filters.trader,
        }))
        setFormErrors({})
        setEditingSectionId(null)
    }

    const validateForm = () => {
        const errors = {}

        if (!formData.sectionType) {
            errors.sectionType = 'Section type is required'
        }

        if (!formData.trader) {
            errors.trader = 'Trader is required'
        }

        if (!formData.order) {
            errors.order = 'Order is required'
        }

        const config = SECTION_CONFIG[formData.sectionType]
        if (config) {
            if (config.requiresTitle && !formData.title) {
                errors.title = 'Title is required'
            }

            if (config.requiresProduct && !formData.product) {
                errors.product = 'Product is required'
            }

            if (config.requiresCategory && !formData.categoryId) {
                errors.categoryId = 'Category is required'
            }

            if (config.requiresImages) {
                const images = (Array.isArray(formData.images) ? formData.images : []).filter(Boolean)
                if (images.length === 0) {
                    errors.images = 'At least one image is required'
                }
            }
        }

        setFormErrors(errors)
        return Object.keys(errors).length === 0
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!validateForm()) {
            return
        }

        const config = SECTION_CONFIG[formData.sectionType] || {}
        const payload = buildPayload(formData, config)

        try {
            setSaving(true)
            if (editingSectionId) {
                await updateWebsiteSectionAPI(editingSectionId, payload)
                alert('Website section updated successfully!')
            } else {
                await createWebsiteSectionAPI(payload)
                alert('Website section created successfully!')
            }

            await fetchSections(payload.sectionType, payload.trader)
            resetForm()
        } catch (error) {
            console.error('Error saving website section:', error)
            alert(error.message || 'Failed to save website section')
        } finally {
            setSaving(false)
        }
    }

    const handleEdit = (section) => {
        setEditingSectionId(section._id)
        setFormData({
            sectionType: section.sectionType || '',
            trader: section.trader?._id || section.trader || '',
            title: section.title || '',
            product: section.product?._id || section.product || '',
            categoryId: section.categoryId?._id || section.categoryId || '',
            images: section.images || [],
            imagesText: (section.images || []).join('\n'),
            tagsText: (section.tags || []).join('\n'),
            order: section.order ? String(section.order) : '',
            active: section.active !== undefined ? section.active : true,
            isNeedToShowTree: section.isNeedToShowTree || false,
        })
        setFormErrors({})
    }

    const handleDelete = async (sectionId) => {
        if (!window.confirm('Are you sure you want to delete this section?')) {
            return
        }

        try {
            await deleteWebsiteSectionAPI(sectionId)
            alert('Website section deleted successfully!')
            await fetchSections()
        } catch (error) {
            console.error('Error deleting website section:', error)
            alert(error.message || 'Failed to delete website section')
        }
    }

    const traderOptions = useMemo(
        () =>
            traders.map((trader) => ({
                value: trader._id,
                label: trader.name,
            })),
        [traders]
    )

    const productOptions = useMemo(
        () =>
            products.map((product) => ({
                value: product._id,
                label: product.title,
            })),
        [products]
    )

    const categoryOptions = useMemo(
        () =>
            categories.map((category) => ({
                value: category._id,
                label: category.name,
            })),
        [categories]
    )

    return (
        <div className="space-y-6">
            <div className="page-header flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">Website Sections</h1>
                    <p className="text-gray-500 text-sm">Manage trader specific website sections and landing page content.</p>
                </div>
                <button
                    type="button"
                    onClick={() => fetchSections()}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg shadow hover:bg-primary-700 transition"
                >
                    <RefreshCw size={18} className={listLoading ? 'animate-spin' : ''} />
                    Refresh List
                </button>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white rounded-lg shadow p-5">
                        <h2 className="text-lg font-semibold text-gray-800 mb-4">Filters</h2>
                        <div className="space-y-4">
                            <Select
                                label="Section Type"
                                name="sectionType"
                                value={filters.sectionType}
                                onChange={handleFilterChange}
                                options={SECTION_OPTIONS}
                                required
                            />
                            <Select
                                label="Trader"
                                name="trader"
                                value={filters.trader}
                                onChange={handleFilterChange}
                                options={traderOptions}
                                required
                            />
                            <button
                                type="button"
                                onClick={() => fetchSections()}
                                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 border border-primary-600 text-primary-600 rounded-lg hover:bg-primary-50 transition"
                            >
                                {listLoading ? <Loader2 size={18} className="animate-spin" /> : <RefreshCw size={18} />}
                                Load Sections
                            </button>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow p-5">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-semibold text-gray-800">{editingSectionId ? 'Edit Section' : 'Create Section'}</h2>
                            {editingSectionId && (
                                <button
                                    type="button"
                                    onClick={resetForm}
                                    className="text-sm text-primary-600 hover:text-primary-700"
                                >
                                    Clear
                                </button>
                            )}
                        </div>

                        <form className="space-y-4" onSubmit={handleSubmit}>
                            <Select
                                label="Section Type"
                                name="sectionType"
                                value={formData.sectionType}
                                onChange={handleFormChange}
                                options={SECTION_OPTIONS}
                                errors={formErrors}
                                required
                            />

                            <Select
                                label="Trader"
                                name="trader"
                                value={formData.trader}
                                onChange={handleFormChange}
                                options={traderOptions}
                                errors={formErrors}
                                required
                            />

                            <Input
                                label="Display Order"
                                name="order"
                                type="number"
                                min="1"
                                value={formData.order}
                                onChange={handleFormChange}
                                errors={formErrors}
                                required
                            />

                            {(currentConfig.requiresTitle || editingSectionId || formData.title) && (
                                <Input
                                    label="Title"
                                    name="title"
                                    value={formData.title}
                                    onChange={handleFormChange}
                                    errors={formErrors}
                                    required={currentConfig.requiresTitle}
                                    placeholder="Section title"
                                />
                            )}

                            {(currentConfig.requiresProduct || currentConfig === SECTION_CONFIG.PRODUCT_DETAIL || editingSectionId || formData.product) && (
                                <Select
                                    label="Product"
                                    name="product"
                                    value={formData.product}
                                    onChange={handleFormChange}
                                    options={productOptions}
                                    errors={formErrors}
                                    required={currentConfig.requiresProduct}
                                    placeholder="Select product"
                                />
                            )}

                            {currentConfig.hasImages && (
                                <FileUpload
                                    label="Images"
                                    name="images"
                                    onChange={handleFormChange}
                                    errors={formErrors}
                                    required={currentConfig.requiresImages}
                                    multiple
                                    accept="image/*"
                                    uploadUrl="/upload/image/avatar"
                                    fieldName="image"
                                    mapResponseToValue={(response) => response?.data?.image}
                                    uploadedFiles={formData.images}
                                    maxSizeMB={10}
                                />
                            )}

                            {(currentConfig.allowsTags || editingSectionId || formData.tagsText) && (
                                <Textarea
                                    label="Tags"
                                    name="tagsText"
                                    value={formData.tagsText}
                                    onChange={handleFormChange}
                                    errors={formErrors}
                                    placeholder="Enter one tag per line"
                                    rows={3}
                                />
                            )}

                            {(currentConfig.allowsCategory || editingSectionId || formData.categoryId) && (
                                <Select
                                    label="Category"
                                    name="categoryId"
                                    value={formData.categoryId}
                                    onChange={handleFormChange}
                                    options={categoryOptions}
                                    placeholder="Select category"
                                    errors={formErrors}
                                    required={currentConfig.requiresCategory}
                                />
                            )}

                            {(currentConfig.allowsNeedTree || currentConfig.requiresProduct) && (
                                <Checkbox
                                    label="Display category tree"
                                    name="isNeedToShowTree"
                                    checked={formData.isNeedToShowTree}
                                    onChange={handleFormChange}
                                />
                            )}

                            <Checkbox
                                label="Active"
                                name="active"
                                checked={formData.active}
                                onChange={handleFormChange}
                            />

                            <button
                                type="submit"
                                disabled={saving}
                                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition disabled:opacity-60"
                            >
                                {saving ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
                                {editingSectionId ? 'Update Section' : 'Create Section'}
                            </button>
                        </form>
                    </div>
                </div>

                <div className="lg:col-span-2">
                    <div className="bg-white rounded-lg shadow overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100">
                            <h2 className="text-lg font-semibold text-gray-800">Sections List</h2>
                            <p className="text-sm text-gray-500">
                                {filters.sectionType && filters.trader
                                    ? `Showing sections for ${filters.sectionType.replace(/_/g, ' ')}`
                                    : 'Select a section type and trader to view sections.'}
                            </p>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Section Type</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trader</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title / Product</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tags</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Images</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Active</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Updated At</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {listLoading ? (
                                        <tr>
                                            <td colSpan="10" className="px-6 py-12 text-center">
                                                <div className="flex items-center justify-center gap-2 text-gray-500">
                                                    <Loader2 size={20} className="animate-spin" />
                                                    Loading sections...
                                                </div>
                                            </td>
                                        </tr>
                                    ) : sections.length === 0 ? (
                                        <tr>
                                            <td colSpan="10" className="px-6 py-12 text-center text-gray-500">
                                                {filters.sectionType && filters.trader
                                                    ? 'No sections found. Create a new section to get started.'
                                                    : 'Select filters to load website sections.'}
                                            </td>
                                        </tr>
                                    ) : (
                                        sections.map((section) => (
                                            <tr key={section._id} className={editingSectionId === section._id ? 'bg-primary-50' : ''}>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{section.order ?? '-'}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                    {section.sectionType?.replace(/_/g, ' ')}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                                    {section.trader?.name || traders.find((t) => t._id === section.trader)?.name || 'N/A'}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-700">
                                                    {section.title ||
                                                        section.product?.title ||
                                                        products.find((p) => p._id === section.product)?.title ||
                                                        '—'}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                                    {section.categoryId?.name ||
                                                        categories.find((c) => c._id === (section.categoryId?._id || section.categoryId))?.name ||
                                                        '—'}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-700">
                                                    {section.tags?.length ? section.tags.join(', ') : '—'}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                                    {section.images?.length ? `${section.images.length} image${section.images.length > 1 ? 's' : ''}` : '—'}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span
                                                        className={`px-2 py-1 text-xs font-semibold rounded-full ${section.active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                                            }`}
                                                    >
                                                        {section.active ? 'Active' : 'Inactive'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {section.updatedAt ? new Date(section.updatedAt).toLocaleString() : '—'}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                    <div className="inline-flex items-center gap-2">
                                                        <button
                                                            type="button"
                                                            onClick={() => handleEdit(section)}
                                                            className="text-primary-600 hover:text-primary-700"
                                                        >
                                                            <Edit size={18} />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleDelete(section._id)}
                                                            className="text-red-600 hover:text-red-700"
                                                        >
                                                            <Trash2 size={18} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            {loadingInitialData && (
                <div className="fixed inset-0 bg-black bg-opacity-25 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-lg px-6 py-4 flex items-center gap-3">
                        <Loader2 className="animate-spin text-primary-600" size={22} />
                        <span className="text-gray-700 text-sm font-medium">Loading data, please wait...</span>
                    </div>
                </div>
            )}
        </div>
    )
}

export default WebsiteSections


