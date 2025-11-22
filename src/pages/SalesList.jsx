import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight, AlertTriangle, Loader2 } from 'lucide-react'
import { getProductSalesListAPI } from '../utils/api'

const SalesList = () => {
    const [productSalesData, setProductSalesData] = useState([])
    const [productSalesSummary, setProductSalesSummary] = useState(null)
    const [productSalesLoading, setProductSalesLoading] = useState(true)
    const [productSalesError, setProductSalesError] = useState(null)
    const [currentPage, setCurrentPage] = useState(1)
    const itemsPerPage = 15

    // Fetch product sales data
    useEffect(() => {
        const fetchProductSales = async () => {
            try {
                setProductSalesLoading(true)
                setProductSalesError(null)
                console.log('🔄 Fetching product sales data...')
                const response = await getProductSalesListAPI()
                console.log('📦 Product sales API response:', response)
                console.log('📦 Response type:', typeof response)
                console.log('📦 Response keys:', response ? Object.keys(response) : 'null/undefined')

                // Handle response - check if it's the data object directly or wrapped
                let data = response

                // If response is the data object directly (with success, data, summary)
                if (response && typeof response === 'object') {
                    if (response.success !== undefined && response.data !== undefined) {
                        // This is the expected format
                        data = response
                    } else if (Array.isArray(response)) {
                        // If response is directly an array, wrap it
                        data = {
                            success: true,
                            data: response,
                            summary: null
                        }
                    }
                }

                if (data && data.success && data.data && Array.isArray(data.data)) {
                    // Format data without percentage and skuId
                    const formattedData = data.data.map((item) => {
                        const { skuId, ...rest } = item
                        return rest
                    })

                    console.log('✅ Formatted product sales data:', formattedData)
                    console.log('📊 Summary:', data.summary)

                    setProductSalesData(formattedData)
                    setProductSalesSummary(data.summary)
                } else {
                    console.warn('⚠️ Invalid response structure:', data)
                    console.warn('⚠️ Response structure check:', {
                        hasResponse: !!data,
                        hasSuccess: data?.success,
                        hasData: !!data?.data,
                        isArray: Array.isArray(data?.data),
                        dataType: typeof data,
                        dataValue: data
                    })
                    setProductSalesError('Invalid response format from API')
                    setProductSalesData([])
                }
            } catch (error) {
                console.error('❌ Error fetching product sales:', error)
                console.error('Error details:', {
                    message: error.message,
                    response: error.response?.data,
                    status: error.response?.status,
                    statusText: error.response?.statusText,
                    fullError: error
                })
                setProductSalesError(
                    error.response?.data?.message ||
                    error.message ||
                    'Failed to fetch product sales data'
                )
                setProductSalesData([])
            } finally {
                setProductSalesLoading(false)
            }
        }

        fetchProductSales()
    }, [])

    // Calculate pagination
    const totalPages = Math.ceil(productSalesData.length / itemsPerPage)
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    const currentData = productSalesData.slice(startIndex, endIndex)

    const handlePageChange = (page) => {
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page)
            // Scroll to top of table
            window.scrollTo({ top: 0, behavior: 'smooth' })
        }
    }

    return (
        <div className="space-y-6">
            <div className="page-header">
                <h1 className="text-3xl font-bold text-gray-800">Product Sales List</h1>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold">Total Product Sales</h2>
                    {productSalesSummary && (
                        <div className="text-xs text-gray-500">
                            Total Sold: <span className="font-semibold text-gray-700">{productSalesSummary.totalStockSell}</span>
                        </div>
                    )}
                </div>

                {productSalesLoading ? (
                    <div className="flex items-center justify-center py-8">
                        <Loader2 className="animate-spin text-primary-600" size={24} />
                        <span className="ml-2 text-gray-600">Loading product sales...</span>
                    </div>
                ) : productSalesError ? (
                    <div className="text-center py-8 text-red-600">
                        <AlertTriangle className="mx-auto mb-2" size={24} />
                        <p>{productSalesError}</p>
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b">
                                        <th className="text-center py-2 px-2 whitespace-nowrap">Product</th>
                                        <th className="text-center py-2 px-2 whitespace-nowrap">SKU</th>
                                        <th className="text-center py-2 px-2 whitespace-nowrap">Units</th>
                                        <th className="text-center py-2 px-2 whitespace-nowrap">In Stock</th>
                                        <th className="text-center py-2 px-2 whitespace-nowrap">Stock Out</th>
                                        <th className="text-center py-2 px-2 whitespace-nowrap">Live Stock</th>
                                        <th className="text-center py-2 px-2 whitespace-nowrap">Sold</th>
                                        <th className="text-center py-2 px-2 whitespace-nowrap">Damage</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {currentData.length === 0 ? (
                                        <tr>
                                            <td colSpan="8" className="text-center py-8 text-gray-500">
                                                No product sales data available
                                            </td>
                                        </tr>
                                    ) : (
                                        currentData.map((item, idx) => (
                                            <tr key={startIndex + idx} className="border-b hover:bg-gray-50">
                                                <td className="py-2 px-2 text-center">{item.productName}</td>
                                                <td className="py-2 px-2 text-center text-gray-600">{item.skuName}</td>
                                                <td className="py-2 px-2 text-center">{item.totalInStock.toLocaleString()}</td>
                                                <td className="py-2 px-2 text-center">{item.inHouseStock.toLocaleString()}</td>
                                                <td className="py-2 px-2 text-center">{item.totalStockOut.toLocaleString()}</td>
                                                <td className="py-2 px-2 text-center">{item.liveStock.toLocaleString()}</td>
                                                <td className="py-2 px-2 text-center font-semibold">{item.stockSell}</td>
                                                <td className="py-2 px-2 text-center">{item.damage}</td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                                {productSalesSummary && productSalesData.length > 0 && (
                                    <tfoot>
                                        <tr className="border-t-2 border-gray-300 bg-gray-50 font-semibold">
                                            <td className="py-2 px-2 text-center" colSpan="2">Total</td>
                                            <td className="py-2 px-2 text-center">{productSalesSummary.totalInStock.toLocaleString()}</td>
                                            <td className="py-2 px-2 text-center">{productSalesSummary.totalInHouseStock.toLocaleString()}</td>
                                            <td className="py-2 px-2 text-center">{productSalesSummary.totalStockOut.toLocaleString()}</td>
                                            <td className="py-2 px-2 text-center">{productSalesSummary.totalLiveStock.toLocaleString()}</td>
                                            <td className="py-2 px-2 text-center">{productSalesSummary.totalStockSell.toLocaleString()}</td>
                                            <td className="py-2 px-2 text-center">{productSalesSummary.totalDamage.toLocaleString()}</td>
                                        </tr>
                                    </tfoot>
                                )}
                            </table>
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="mt-6 bg-white rounded-lg shadow p-4">
                                <div className="page-header">
                                    <div className="text-sm text-gray-600">
                                        Showing {startIndex + 1} to {Math.min(endIndex, productSalesData.length)} of {productSalesData.length} items
                                        {totalPages > 1 && ` (Page ${currentPage} of ${totalPages})`}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => handlePageChange(currentPage - 1)}
                                            disabled={currentPage === 1}
                                            className={`px-4 py-2 rounded-lg border ${currentPage === 1
                                                    ? 'border-gray-200 text-gray-400 cursor-not-allowed'
                                                    : 'border-gray-300 hover:bg-gray-50'
                                                }`}
                                        >
                                            <ChevronLeft size={20} />
                                        </button>
                                        <div className="flex items-center gap-1">
                                            {Array.from({ length: totalPages }, (_, i) => i + 1)
                                                .filter(
                                                    (p) =>
                                                        p === 1 ||
                                                        p === totalPages ||
                                                        (p >= currentPage - 1 && p <= currentPage + 1)
                                                )
                                                .map((p, idx, arr) => {
                                                    if (idx > 0 && arr[idx - 1] !== p - 1) {
                                                        return (
                                                            <span key={`ellipsis-${p}`} className="px-2 text-gray-400">
                                                                ...
                                                            </span>
                                                        )
                                                    }
                                                    return (
                                                        <button
                                                            key={p}
                                                            onClick={() => handlePageChange(p)}
                                                            className={`px-4 py-2 rounded-lg border ${p === currentPage
                                                                    ? 'bg-primary-600 text-white border-primary-600'
                                                                    : 'border-gray-300 hover:bg-gray-50'
                                                                }`}
                                                        >
                                                            {p}
                                                        </button>
                                                    )
                                                })}
                                        </div>
                                        <button
                                            onClick={() => handlePageChange(currentPage + 1)}
                                            disabled={currentPage === totalPages}
                                            className={`px-4 py-2 rounded-lg border ${currentPage === totalPages
                                                    ? 'border-gray-200 text-gray-400 cursor-not-allowed'
                                                    : 'border-gray-300 hover:bg-gray-50'
                                                }`}
                                        >
                                            <ChevronRight size={20} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    )
}

export default SalesList

