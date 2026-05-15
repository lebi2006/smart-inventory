import { useState, useEffect } from 'react';
import { getDashboard, getTopProducts, getMovementTrend, getLowStockProducts, getForecast } from '../services/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const StatCard = ({ title, value, subtitle, color, icon }) => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
    <div className="flex items-center justify-between mb-4">
      <div className={`w-12 h-12 ${color} rounded-xl flex items-center justify-center text-white text-xl`}>
        {icon}
      </div>
    </div>
    <p className="text-2xl font-bold text-gray-900">{value}</p>
    <p className="text-sm font-medium text-gray-600 mt-1">{title}</p>
    {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
  </div>
);

export default function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [topProducts, setTopProducts] = useState([]);
  const [trend, setTrend] = useState([]);
  const [lowStock, setLowStock] = useState([]);
  const [forecasts, setForecasts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [summaryRes, topRes, trendRes, lowStockRes, forecastRes] = await Promise.all([
          getDashboard(),
          getTopProducts(),
          getMovementTrend(7),
          getLowStockProducts(),
          getForecast(),
        ]);
        setSummary(summaryRes.data);
        setTopProducts(topRes.data);
        setTrend(trendRes.data);
        setLowStock(lowStockRes.data);
        setForecasts(forecastRes.data);
      } catch (err) {
        console.error('Dashboard fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-8 gap-4">
        <StatCard title="Total Products" value={summary?.total_products ?? 0} color="bg-indigo-600" icon="📦" />
        <StatCard title="Stock Value" value={`₹${summary?.total_stock_value?.toLocaleString() ?? 0}`} color="bg-emerald-500" icon="💰" />
        <StatCard title="Low Stock" value={summary?.low_stock_count ?? 0} subtitle="Below reorder level" color="bg-amber-500" icon="⚠️" />
        <StatCard title="Out of Stock" value={summary?.out_of_stock_count ?? 0} subtitle="Needs immediate action" color="bg-red-500" icon="🚨" />
        <StatCard
  title="Expiring Soon"
  value={summary?.expiring_soon_count ?? 0}
  subtitle="Within 30 days"
  color="bg-orange-500"
  icon="📅"
/>
<StatCard
  title="Expired"
  value={summary?.expired_count ?? 0}
  subtitle="Remove immediately"
  color="bg-rose-600"
  icon="🗑️"
/>
        <StatCard title="Categories" value={summary?.total_categories ?? 0} color="bg-purple-500" icon="🏷️" />
        <StatCard title="Suppliers" value={summary?.total_suppliers ?? 0} color="bg-blue-500" icon="🚚" />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Movement Trend Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-base font-semibold text-gray-800 mb-4">Stock Movement — Last 7 Days</h2>
          {trend.length === 0 ? (
            <div className="flex items-center justify-center h-48 text-gray-400 text-sm">
              No movement data yet
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={trend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="stock_in" name="Stock In" fill="#6366f1" radius={[4, 4, 0, 0]} />
                <Bar dataKey="stock_out" name="Stock Out" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Top Products Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-base font-semibold text-gray-800 mb-4">Top Selling Products</h2>
          {topProducts.length === 0 ? (
            <div className="flex items-center justify-center h-48 text-gray-400 text-sm">
              No sales data yet
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={topProducts} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis dataKey="product_name" type="category" tick={{ fontSize: 11 }} width={100} />
                <Tooltip />
                <Bar dataKey="total_sold" name="Units Sold" fill="#10b981" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Low Stock Alert Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-gray-800">Low Stock Alerts</h2>
          <span className="bg-amber-100 text-amber-700 text-xs font-medium px-2.5 py-1 rounded-full">
            {lowStock.length} items need attention
          </span>
        </div>
        {lowStock.length === 0 ? (
          <div className="text-center py-8 text-gray-400 text-sm">
            All products are well stocked
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-3 px-2 text-gray-500 font-medium">Product</th>
                  <th className="text-left py-3 px-2 text-gray-500 font-medium">SKU</th>
                  <th className="text-left py-3 px-2 text-gray-500 font-medium">Current Stock</th>
                  <th className="text-left py-3 px-2 text-gray-500 font-medium">Reorder Level</th>
                  <th className="text-left py-3 px-2 text-gray-500 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {lowStock.map((product) => (
                  <tr key={product.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-3 px-2 font-medium text-gray-900">{product.name}</td>
                    <td className="py-3 px-2 text-gray-500">{product.sku}</td>
                    <td className="py-3 px-2">
                      <span className={`font-semibold ${product.current_stock === 0 ? 'text-red-600' : 'text-amber-600'}`}>
                        {product.current_stock}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-gray-500">{product.reorder_level}</td>
                    <td className="py-3 px-2">
                      {product.current_stock === 0 ? (
                        <span className="bg-red-100 text-red-700 text-xs font-medium px-2 py-1 rounded-full">Out of Stock</span>
                      ) : (
                        <span className="bg-amber-100 text-amber-700 text-xs font-medium px-2 py-1 rounded-full">Low Stock</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Demand Forecast Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-gray-800">AI Demand Forecast</h2>
          <span className="bg-indigo-100 text-indigo-700 text-xs font-medium px-2.5 py-1 rounded-full">
            Next 7 Days
          </span>
        </div>
        {forecasts.length === 0 ? (
          <div className="text-center py-8 text-gray-400 text-sm">
            No forecast data available yet
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-3 px-2 text-gray-500 font-medium">Product</th>
                  <th className="text-left py-3 px-2 text-gray-500 font-medium">Current Stock</th>
                  <th className="text-left py-3 px-2 text-gray-500 font-medium">Avg Daily Usage</th>
                  <th className="text-left py-3 px-2 text-gray-500 font-medium">7-Day Forecast</th>
                  <th className="text-left py-3 px-2 text-gray-500 font-medium">Order Qty</th>
                  <th className="text-left py-3 px-2 text-gray-500 font-medium">Days Left</th>
                  <th className="text-left py-3 px-2 text-gray-500 font-medium">Trend</th>
                  <th className="text-left py-3 px-2 text-gray-500 font-medium">Confidence</th>
                </tr>
              </thead>
              <tbody>
                {forecasts.map((f) => (
                  <tr key={f.product_id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-3 px-2 font-medium text-gray-900">
                      {f.product_name}
                      <p className="text-xs text-gray-400 font-mono">{f.sku}</p>
                    </td>
                    <td className="py-3 px-2 text-gray-700">{f.current_stock}</td>
                    <td className="py-3 px-2 text-gray-700">{f.avg_daily_usage}</td>
                    <td className="py-3 px-2 text-gray-700">{f.forecasted_demand_7_days} units</td>
                    <td className="py-3 px-2">
                      <span className={`font-semibold ${f.recommended_order_quantity > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                        {f.recommended_order_quantity > 0 ? `Order ${f.recommended_order_quantity}` : 'Sufficient'}
                      </span>
                    </td>
                    <td className="py-3 px-2">
                      <span className={`font-semibold ${
                        f.days_until_stockout <= 3 ? 'text-red-600' :
                        f.days_until_stockout <= 7 ? 'text-amber-600' :
                        'text-emerald-600'
                      }`}>
                        {f.days_until_stockout >= 999 ? 'N/A' : `${f.days_until_stockout}d`}
                      </span>
                    </td>
                    <td className="py-3 px-2">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                        f.trend === 'INCREASING' ? 'bg-red-100 text-red-700' :
                        f.trend === 'DECREASING' ? 'bg-blue-100 text-blue-700' :
                        f.trend === 'STABLE' ? 'bg-emerald-100 text-emerald-700' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {f.trend.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-2">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                        f.forecast_confidence === 'HIGH' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {f.forecast_confidence}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}