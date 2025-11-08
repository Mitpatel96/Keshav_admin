import { Package, TrendingUp, ShoppingBag, AlertTriangle, DollarSign } from 'lucide-react'
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

const VendorDashboard = () => {
  // Mock vendor data
  const vendorMetrics = {
    totalSKUs: 45,
    totalStock: 1240,
    lowStockItems: 8,
    totalOrders: 156,
    totalRevenue: 245000,
    pendingOrders: 12,
  }

  const salesData = [
    { month: 'Jan', sales: 40000, orders: 24 },
    { month: 'Feb', sales: 30000, orders: 18 },
    { month: 'Mar', sales: 50000, orders: 32 },
    { month: 'Apr', sales: 45000, orders: 28 },
    { month: 'May', sales: 60000, orders: 38 },
    { month: 'Jun', sales: 55000, orders: 35 },
  ]

  const topProducts = [
    { name: 'iPhone 15 Pro', units: 45, revenue: 67500 },
    { name: 'Samsung Galaxy S24', units: 38, revenue: 57000 },
    { name: 'MacBook Air M2', units: 22, revenue: 26400 },
  ]

  const lowStockItems = [
    { sku: 'SKU-SM-S24U-256-BLK', name: 'Samsung Galaxy S24 Ultra', stock: 3, threshold: 10 },
    { sku: 'SKU-IPH-15PM-256', name: 'iPhone 15 Pro Max', stock: 5, threshold: 10 },
    { sku: 'SKU-MBA-M2', name: 'MacBook Air M2', stock: 8, threshold: 10 },
  ]

  const recentOrders = [
    { id: 'ORD001', customer: 'John Doe', amount: 94999, status: 'Pending', date: '2025-11-03' },
    { id: 'ORD002', customer: 'Jane Smith', amount: 129900, status: 'Completed', date: '2025-11-02' },
    { id: 'ORD003', customer: 'Bob Johnson', amount: 89999, status: 'Processing', date: '2025-11-01' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-800">Vendor Dashboard</h1>
        <p className="text-sm text-gray-600">Welcome back, Tech Solutions Pvt Ltd</p>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total SKUs"
          value={vendorMetrics.totalSKUs}
          subtitle="active products"
          icon={Package}
          color="blue"
        />
        <MetricCard
          title="Total Stock"
          value={vendorMetrics.totalStock.toLocaleString()}
          subtitle="units available"
          icon={Package}
          color="green"
        />
        <MetricCard
          title="Total Orders"
          value={vendorMetrics.totalOrders}
          subtitle={`${vendorMetrics.pendingOrders} pending`}
          icon={ShoppingBag}
          color="purple"
        />
        <MetricCard
          title="Total Revenue"
          value={formatCurrency(vendorMetrics.totalRevenue)}
          subtitle="this month"
          icon={DollarSign}
          color="green"
        />
      </div>

      {/* Sales Chart */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Sales Overview</h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={salesData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="sales" stroke="#10b981" name="Sales (₹)" />
            <Line type="monotone" dataKey="orders" stroke="#0ea5e9" name="Orders" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Top Products & Low Stock */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Products */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Top Selling Products</h2>
          <div className="space-y-4">
            {topProducts.map((product, idx) => (
              <div key={idx} className="p-4 border rounded-lg">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-medium">{product.name}</h3>
                    <p className="text-sm text-gray-600 mt-1">{product.units} units sold</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-green-600">{formatCurrency(product.revenue)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <AlertTriangle className="text-red-500" size={20} />
            Low Stock Alerts
          </h2>
          <div className="space-y-3">
            {lowStockItems.map((item, idx) => (
              <div
                key={idx}
                className="p-4 border rounded-lg bg-red-50 border-red-200"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-medium text-sm">{item.name}</h3>
                    <p className="text-xs text-gray-600 mt-1 font-mono">{item.sku}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-red-600 font-semibold">
                      {item.stock} / {item.threshold}
                    </p>
                    <button className="mt-2 text-xs text-primary-600 hover:underline">
                      Request Restock
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Recent Orders</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2">Order ID</th>
                <th className="text-left py-2">Customer</th>
                <th className="text-right py-2">Amount</th>
                <th className="text-left py-2">Status</th>
                <th className="text-left py-2">Date</th>
                <th className="text-center py-2">Action</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.map((order) => (
                <tr key={order.id} className="border-b">
                  <td className="py-2 font-mono">{order.id}</td>
                  <td className="py-2">{order.customer}</td>
                  <td className="py-2 text-right">{formatCurrency(order.amount)}</td>
                  <td className="py-2">
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
                        order.status === 'Completed'
                          ? 'bg-green-100 text-green-800'
                          : order.status === 'Processing'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {order.status}
                    </span>
                  </td>
                  <td className="py-2 text-gray-600">{order.date}</td>
                  <td className="py-2 text-center">
                    <button className="text-primary-600 hover:underline text-xs">
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
      <div className="flex items-center justify-between">
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

export default VendorDashboard

