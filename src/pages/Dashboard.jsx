import { useState } from 'react'
import {
  Package,
  TrendingUp,
  ShoppingBag,
  MapPin,
  AlertTriangle,
  Award,
  Filter
} from 'lucide-react'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { formatCurrency } from '../utils/helpers'
import Select from '../components/Form/Select'

const Dashboard = () => {
  const [salesFilter, setSalesFilter] = useState('last7days')
  const [dateRange, setDateRange] = useState({ start: '', end: '' })

  // Mock data - in real app, fetch from API
  const dashboardData = {
    totalInventory: 15240,
    totalSales: 245000,
    totalOrders: 245,
    averageOrderValue: 1000,
    totalPickupLocations: 12,
    lowInventoryCount: 8,
  }

  const salesData = [
    { date: 'Mon', sales: 4000, orders: 24 },
    { date: 'Tue', sales: 3000, orders: 13 },
    { date: 'Wed', sales: 5000, orders: 28 },
    { date: 'Thu', sales: 4500, orders: 25 },
    { date: 'Fri', sales: 6000, orders: 35 },
    { date: 'Sat', sales: 7000, orders: 42 },
    { date: 'Sun', sales: 5500, orders: 33 },
  ]

  const productSalesData = [
    { name: 'iPhone 15 Pro', sku: 'SKU123', units: 45, revenue: 67500, percentage: 27.5 },
    { name: 'Samsung Galaxy S24', sku: 'SKU124', units: 38, revenue: 57000, percentage: 23.3 },
    { name: 'MacBook Air M2', sku: 'SKU125', units: 22, revenue: 26400, percentage: 10.8 },
    { name: 'AirPods Pro', sku: 'SKU126', units: 65, revenue: 14950, percentage: 6.1 },
  ]

  const bestPickupLocations = [
    { name: 'Satellite Road', city: 'Ahmedabad', orders: 450, revenue: 345000, rating: 95 },
    { name: 'Vastrapur Point', city: 'Ahmedabad', orders: 380, revenue: 298000, rating: 92 },
    { name: 'Maninagar', city: 'Ahmedabad', orders: 320, revenue: 245000, rating: 88 },
  ]

  const bestProducts = [
    { name: 'Samsung Galaxy S24', image: '', units: 120, revenue: 420000 },
    { name: 'iPhone 15 Pro Max', image: '', units: 95, revenue: 665000 },
    { name: 'MacBook Pro M3', image: '', units: 45, revenue: 675000 },
  ]

  const lowInventoryPickup = [
    { sku: 'MacBook Air M2', location: 'Vastrapur Point', stock: 3, threshold: 10, vendor: 'Tech Solutions' },
    { sku: 'AirPods Pro Gen 3', location: 'Satellite Road', stock: 5, threshold: 10, vendor: 'Audio Store' },
    { sku: 'iPhone 15 Case', location: 'Maninagar', stock: 8, threshold: 10, vendor: 'Accessories Plus' },
  ]

  const lowInventoryWarehouse = [
    { sku: 'AirPods Pro Gen 3', category: 'Electronics', stock: 8, threshold: 20, location: 'Main Warehouse', lastRestocked: '2025-10-28' },
    { sku: 'Samsung Charger', category: 'Accessories', stock: 12, threshold: 20, location: 'Main Warehouse', lastRestocked: '2025-10-25' },
  ]

  return (
    <div className="space-y-6">
      <div className="page-header">
        <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Inventory"
          value={dashboardData.totalInventory.toLocaleString()}
          subtitle="units"
          icon={Package}
          color="blue"
        />
        <MetricCard
          title="Total Sales"
          value={formatCurrency(dashboardData.totalSales)}
          subtitle={`${dashboardData.totalOrders} orders`}
          icon={TrendingUp}
          color="green"
        />
        <MetricCard
          title="Pickup Locations"
          value={dashboardData.totalPickupLocations}
          subtitle="active locations"
          icon={MapPin}
          color="purple"
        />
        <MetricCard
          title="Low Inventory Alerts"
          value={dashboardData.lowInventoryCount}
          subtitle="items need restocking"
          icon={AlertTriangle}
          color="red"
        />
      </div>

      {/* Sales Chart */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="page-header mb-4">
          <h2 className="text-xl font-semibold">Total Sales</h2>
          <div className="action-stack gap-3 sm:gap-4">
            <Select
              name="salesFilter"
              value={salesFilter}
              onChange={(e) => setSalesFilter(e.target.value)}
              options={[
                { value: 'today', label: 'Today' },
                { value: 'yesterday', label: 'Yesterday' },
                { value: 'last7days', label: 'Last 7 Days' },
                { value: 'last30days', label: 'Last 30 Days' },
                { value: 'custom', label: 'Custom Range' },
              ]}
              className="w-40"
            />
            {salesFilter === 'custom' && (
              <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
                <input
                  type="date"
                  className="px-3 py-1 border rounded"
                  value={dateRange.start}
                  onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                />
                <input
                  type="date"
                  className="px-3 py-1 border rounded"
                  value={dateRange.end}
                  onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                />
              </div>
            )}
          </div>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={salesData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="sales" stroke="#0ea5e9" name="Sales (₹)" />
            <Line type="monotone" dataKey="orders" stroke="#10b981" name="Orders" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Product Sales & Best Products */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Total Product Sales */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Total Product Sales</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Product</th>
                  <th className="text-left py-2">SKU</th>
                  <th className="text-right py-2">Units</th>
                  <th className="text-right py-2">Revenue</th>
                  <th className="text-right py-2">%</th>
                </tr>
              </thead>
              <tbody>
                {productSalesData.map((item, idx) => (
                  <tr key={idx} className="border-b">
                    <td className="py-2">{item.name}</td>
                    <td className="py-2 text-gray-600">{item.sku}</td>
                    <td className="py-2 text-right">{item.units}</td>
                    <td className="py-2 text-right">{formatCurrency(item.revenue)}</td>
                    <td className="py-2 text-right">{item.percentage}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Best Products */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Best Products Sold</h2>
          <div className="space-y-4">
            {bestProducts.map((product, idx) => (
              <div
                key={idx}
                className={`p-4 border rounded-lg ${idx === 0 ? 'bg-yellow-50 border-yellow-200' : ''}`}
              >
                {idx === 0 && (
                  <span className="text-xs font-semibold text-yellow-600 bg-yellow-200 px-2 py-1 rounded">
                    🔥 Bestseller
                  </span>
                )}
                <div className="mt-2">
                  <h3 className="font-medium">{product.name}</h3>
                  <div className="flex justify-between mt-1 text-sm text-gray-600">
                    <span>{product.units} units sold</span>
                    <span className="font-semibold">{formatCurrency(product.revenue)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Best Pickup Location */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Best Pickup Locations</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2">Location</th>
                <th className="text-left py-2">City</th>
                <th className="text-right py-2">Total Orders</th>
                <th className="text-right py-2">Revenue</th>
                <th className="text-right py-2">Rating</th>
              </tr>
            </thead>
            <tbody>
              {bestPickupLocations.map((location, idx) => (
                <tr key={idx} className="border-b">
                  <td className="py-2">
                    <div className="flex items-center gap-2">
                      {idx === 0 && <span className="text-yellow-500">🥇</span>}
                      {idx === 1 && <span className="text-gray-400">🥈</span>}
                      {idx === 2 && <span className="text-orange-600">🥉</span>}
                      {location.name}
                    </div>
                  </td>
                  <td className="py-2 text-gray-600">{location.city}</td>
                  <td className="py-2 text-right">{location.orders}</td>
                  <td className="py-2 text-right">{formatCurrency(location.revenue)}</td>
                  <td className="py-2 text-right">
                    <span className="text-yellow-500">⭐ {location.rating}%</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Low Inventory Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Low Inventory in Pickup Location */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <AlertTriangle className="text-red-500" size={20} />
            Low Inventory in Pickup Location
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">SKU</th>
                  <th className="text-left py-2">Location</th>
                  <th className="text-right py-2">Stock</th>
                  <th className="text-left py-2">Vendor</th>
                  <th className="text-center py-2">Action</th>
                </tr>
              </thead>
              <tbody>
                {lowInventoryPickup.map((item, idx) => (
                  <tr key={idx} className={`border-b ${item.stock < item.threshold ? 'bg-red-50' : ''}`}>
                    <td className="py-2">{item.sku}</td>
                    <td className="py-2">{item.location}</td>
                    <td className="py-2 text-right">
                      <span className={item.stock < item.threshold ? 'text-red-600 font-semibold' : ''}>
                        {item.stock} / {item.threshold}
                      </span>
                    </td>
                    <td className="py-2">{item.vendor}</td>
                    <td className="py-2 text-center">
                      <button className="text-primary-600 hover:underline text-xs">
                        Restock Now
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Low Inventory in Main Warehouse */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <AlertTriangle className="text-red-500" size={20} />
            Low Inventory in Main Warehouse
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">SKU</th>
                  <th className="text-left py-2">Category</th>
                  <th className="text-right py-2">Stock</th>
                  <th className="text-left py-2">Last Restocked</th>
                  <th className="text-center py-2">Action</th>
                </tr>
              </thead>
              <tbody>
                {lowInventoryWarehouse.map((item, idx) => (
                  <tr key={idx} className={`border-b ${item.stock < item.threshold ? 'bg-red-50' : ''}`}>
                    <td className="py-2">{item.sku}</td>
                    <td className="py-2">{item.category}</td>
                    <td className="py-2 text-right">
                      <span className={item.stock < item.threshold ? 'text-red-600 font-semibold' : ''}>
                        {item.stock} / {item.threshold}
                      </span>
                    </td>
                    <td className="py-2">{item.lastRestocked}</td>
                    <td className="py-2 text-center">
                      <div className="flex gap-2 justify-center">
                        <button className="text-primary-600 hover:underline text-xs">
                          Order More
                        </button>
                        <button className="text-green-600 hover:underline text-xs">
                          Redistribute
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

const MetricCard = ({ title, value, subtitle, icon: Icon, color }) => {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    purple: 'bg-purple-50 text-purple-600',
    red: 'bg-red-50 text-red-600',
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="page-header">
        <div>
          <p className="text-sm text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-800 mt-1">{value}</p>
          <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
        </div>
        <div className={`p-3 rounded-full ${colorClasses[color]}`}>
          <Icon size={24} />
        </div>
      </div>
    </div>
  )
}

export default Dashboard

