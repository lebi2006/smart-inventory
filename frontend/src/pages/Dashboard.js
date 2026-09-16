import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  getDashboard, getTopProducts, getMovementTrend, getLowStockProducts,
  getOrdersSummary, getOrders, getForecast,
} from '../services/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Wallet, TrendingUp, Boxes, AlertTriangle, ArrowUpRight, Plus, Download, ChevronRight } from 'lucide-react';

const currency = (n) => `₹${Number(n ?? 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

const StatCard = ({ title, value, subtitle, icon, tint }) => (
  <div className="bg-white dark:bg-[#171335] rounded-2xl border border-gray-100 dark:border-white/5 shadow-soft p-5">
    <div className="flex items-center justify-between mb-4">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${tint}`}>
        {icon}
      </div>
      <span className="text-[11px] font-medium text-gray-400 bg-gray-50 dark:bg-white/5 rounded-full px-2.5 py-1">Weekly</span>
    </div>
    <p className="text-2xl font-extrabold text-gray-900 dark:text-white">{value}</p>
    <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mt-1">{title}</p>
    {subtitle && <p className="text-xs text-gray-400 mt-2">{subtitle}</p>}
  </div>
);

const STATUS_STYLES = {
  PENDING: 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400',
  PAID: 'bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400',
  COMPLETED: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400',
  CANCELLED: 'bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400',
};

export default function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [topProducts, setTopProducts] = useState([]);
  const [trend, setTrend] = useState([]);
  const [lowStock, setLowStock] = useState([]);
  const [ordersSummary, setOrdersSummary] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [forecasts, setForecasts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [summaryRes, topRes, trendRes, lowStockRes, ordersSummaryRes, ordersRes, forecastRes] = await Promise.all([
          getDashboard(),
          getTopProducts(),
          getMovementTrend(7),
          getLowStockProducts(),
          getOrdersSummary(),
          getOrders({ limit: 5 }),
          getForecast(),
        ]);
        setSummary(summaryRes.data);
        setTopProducts(topRes.data);
        setTrend(trendRes.data);
        setLowStock(lowStockRes.data);
        setOrdersSummary(ordersSummaryRes.data);
        setRecentOrders(ordersRes.data);
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
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-600"></div>
      </div>
    );
  }

  const healthyStock = Math.max(
    (summary?.total_products ?? 0) - (summary?.low_stock_count ?? 0) - (summary?.out_of_stock_count ?? 0),
    0
  );
  const totalForHealth = summary?.total_products || 1;
  const healthyPct = Math.round((healthyStock / totalForHealth) * 100);
  const atRiskPct = 100 - healthyPct;

  return (
    <div className="space-y-6">

      {/* Header actions */}
      <div className="flex items-center justify-end gap-2">
        <Link to="/products" className="flex items-center gap-1.5 bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition">
          <Plus className="w-4 h-4" /> Add New
        </Link>
        <Link to="/analytics" className="flex items-center gap-1.5 bg-white dark:bg-[#171335] border border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-300 text-sm font-semibold px-4 py-2.5 rounded-xl transition hover:bg-gray-50 dark:hover:bg-white/5">
          <Download className="w-4 h-4" /> Reports
        </Link>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          title="Total Revenue"
          value={currency(ordersSummary?.total_revenue)}
          subtitle="From completed & paid orders"
          tint="bg-brand-100 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300"
          icon={<Wallet className="w-5 h-5" />}
        />
        <StatCard
          title="Today's Revenue"
          value={currency(ordersSummary?.today_revenue)}
          subtitle={`${ordersSummary?.today_orders ?? 0} orders today`}
          tint="bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400"
          icon={<TrendingUp className="w-5 h-5" />}
        />
        <StatCard
          title="Stock Value"
          value={currency(summary?.total_stock_value)}
          subtitle={`${summary?.total_products ?? 0} active products`}
          tint="bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400"
          icon={<Boxes className="w-5 h-5" />}
        />
        <StatCard
          title="Low Stock Items"
          value={summary?.low_stock_count ?? 0}
          subtitle={`${summary?.out_of_stock_count ?? 0} out of stock`}
          tint="bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400"
          icon={<AlertTriangle className="w-5 h-5" />}
        />
      </div>

      {/* Chart + Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        <div className="lg:col-span-2 bg-white dark:bg-[#171335] rounded-2xl border border-gray-100 dark:border-white/5 shadow-soft p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-gray-800 dark:text-white">Stock Movement</h2>
            <span className="text-[11px] font-medium text-gray-400 bg-gray-50 dark:bg-white/5 rounded-full px-2.5 py-1">Last 7 Days</span>
          </div>
          {trend.length === 0 ? (
            <div className="flex items-center justify-center h-56 text-gray-400 text-sm">No movement data yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={trend} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <Tooltip cursor={{ fill: 'rgba(108,92,231,0.06)' }} />
                <Bar dataKey="stock_in" name="Stock In" fill="#6c5ce7" radius={[6, 6, 0, 0]} maxBarSize={18} />
                <Bar dataKey="stock_out" name="Stock Out" fill="#cfc7ff" radius={[6, 6, 0, 0]} maxBarSize={18} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="space-y-5">
          <div className="bg-white dark:bg-[#171335] rounded-2xl border border-gray-100 dark:border-white/5 shadow-soft p-5">
            <h2 className="text-base font-bold text-gray-800 dark:text-white mb-4">Overview</h2>
            <div className="space-y-1">
              {[
                { label: 'Suppliers', value: summary?.total_suppliers ?? 0, to: '/suppliers' },
                { label: 'Categories', value: summary?.total_categories ?? 0, to: '/categories' },
                { label: 'Total Orders', value: ordersSummary?.total_orders ?? 0, to: '/orders' },
              ].map((row) => (
                <Link key={row.label} to={row.to} className="flex items-center justify-between py-2.5 group">
                  <div>
                    <p className="text-lg font-bold text-gray-900 dark:text-white leading-tight">{row.value}</p>
                    <p className="text-xs text-gray-400">{row.label}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-brand-600 transition" />
                </Link>
              ))}
            </div>
          </div>

          <div className="bg-white dark:bg-[#171335] rounded-2xl border border-gray-100 dark:border-white/5 shadow-soft p-5">
            <h2 className="text-base font-bold text-gray-800 dark:text-white mb-4">Stock Health</h2>
            <div className="flex gap-2 mb-4">
              <div className="flex-[1_1_0] h-16 rounded-xl bg-emerald-500 flex flex-col items-center justify-center text-white" style={{ flexGrow: healthyPct || 1 }}>
                <span className="text-sm font-bold">{healthyPct}%</span>
              </div>
              <div className="flex-[1_1_0] h-16 rounded-xl bg-rose-400 flex flex-col items-center justify-center text-white" style={{ flexGrow: atRiskPct || 1 }}>
                <span className="text-sm font-bold">{atRiskPct}%</span>
              </div>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400"><span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>Healthy Stock</span>
              <span className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400"><span className="w-2 h-2 rounded-full bg-rose-400 inline-block"></span>Low / Out</span>
            </div>
          </div>
        </div>
      </div>

      {/* Top Selling + Recent Orders */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        <div className="bg-white dark:bg-[#171335] rounded-2xl border border-gray-100 dark:border-white/5 shadow-soft p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-gray-800 dark:text-white">Top Selling Products</h2>
            <span className="text-[11px] font-medium text-gray-400 bg-gray-50 dark:bg-white/5 rounded-full px-2.5 py-1">Weekly</span>
          </div>
          {topProducts.length === 0 ? (
            <div className="flex items-center justify-center h-40 text-gray-400 text-sm">No sales data yet</div>
          ) : (
            <div className="space-y-1">
              {topProducts.map((p, i) => (
                <div key={p.product_id} className="flex items-center gap-3 py-2.5 border-b border-gray-50 dark:border-white/5 last:border-0">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold ${
                    i === 0 ? 'bg-brand-100 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300' : 'bg-gray-100 text-gray-500 dark:bg-white/5 dark:text-gray-400'
                  }`}>
                    #{i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate">{p.product_name}</p>
                    <p className="text-xs text-gray-400 font-mono">{p.sku}</p>
                  </div>
                  <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 rounded-full px-2 py-1">
                    <ArrowUpRight className="w-3 h-3" /> {p.total_sold} sold
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-[#171335] rounded-2xl border border-gray-100 dark:border-white/5 shadow-soft p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-gray-800 dark:text-white">Recent Orders</h2>
            <Link to="/orders" className="text-xs font-semibold text-brand-600 hover:text-brand-700">View all</Link>
          </div>
          {recentOrders.length === 0 ? (
            <div className="flex items-center justify-center h-40 text-gray-400 text-sm">No orders yet</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-400 text-xs">
                    <th className="font-medium pb-2">Order</th>
                    <th className="font-medium pb-2">Status</th>
                    <th className="font-medium pb-2 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map((o) => (
                    <tr key={o.id} className="border-t border-gray-50 dark:border-white/5">
                      <td className="py-2.5">
                        <p className="font-semibold text-gray-800 dark:text-gray-100">{o.order_number}</p>
                        <p className="text-xs text-gray-400">{o.customer_name || (o.table_number ? `Table ${o.table_number}` : 'Walk-in')}</p>
                      </td>
                      <td className="py-2.5">
                        <span className={`text-xs font-medium px-2 py-1 rounded-full ${STATUS_STYLES[o.status] || 'bg-gray-100 text-gray-600'}`}>
                          {o.status}
                        </span>
                      </td>
                      <td className="py-2.5 text-right font-semibold text-gray-800 dark:text-gray-100">{currency(o.total_amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Low Stock Alerts */}
      <div className="bg-white dark:bg-[#171335] rounded-2xl border border-gray-100 dark:border-white/5 shadow-soft p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-gray-800 dark:text-white">Low Stock Alerts</h2>
          <span className="bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400 text-xs font-medium px-2.5 py-1 rounded-full">
            {lowStock.length} items need attention
          </span>
        </div>
        {lowStock.length === 0 ? (
          <div className="text-center py-8 text-gray-400 text-sm">All products are well stocked</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-white/5 text-left">
                  <th className="py-3 px-2 text-gray-400 font-medium">Product</th>
                  <th className="py-3 px-2 text-gray-400 font-medium">SKU</th>
                  <th className="py-3 px-2 text-gray-400 font-medium">Current Stock</th>
                  <th className="py-3 px-2 text-gray-400 font-medium">Reorder Level</th>
                  <th className="py-3 px-2 text-gray-400 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {lowStock.map((product) => (
                  <tr key={product.id} className="border-b border-gray-50 dark:border-white/5 hover:bg-gray-50 dark:hover:bg-white/5">
                    <td className="py-3 px-2 font-medium text-gray-900 dark:text-gray-100">{product.name}</td>
                    <td className="py-3 px-2 text-gray-500 dark:text-gray-400">{product.sku}</td>
                    <td className="py-3 px-2">
                      <span className={`font-semibold ${product.current_stock === 0 ? 'text-rose-600' : 'text-amber-600'}`}>
                        {product.current_stock}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-gray-500 dark:text-gray-400">{product.reorder_level}</td>
                    <td className="py-3 px-2">
                      {product.current_stock === 0 ? (
                        <span className="bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400 text-xs font-medium px-2 py-1 rounded-full">Out of Stock</span>
                      ) : (
                        <span className="bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400 text-xs font-medium px-2 py-1 rounded-full">Low Stock</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Demand Forecast */}
      <div className="bg-white dark:bg-[#171335] rounded-2xl border border-gray-100 dark:border-white/5 shadow-soft p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-gray-800 dark:text-white">Demand Forecast</h2>
          <span className="bg-brand-100 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300 text-xs font-medium px-2.5 py-1 rounded-full">
            Next 7 Days
          </span>
        </div>
        {forecasts.length === 0 ? (
          <div className="text-center py-8 text-gray-400 text-sm">No forecast data available yet</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-white/5 text-left">
                  <th className="py-3 px-2 text-gray-400 font-medium">Product</th>
                  <th className="py-3 px-2 text-gray-400 font-medium">Current Stock</th>
                  <th className="py-3 px-2 text-gray-400 font-medium">Avg Daily Usage</th>
                  <th className="py-3 px-2 text-gray-400 font-medium">7-Day Forecast</th>
                  <th className="py-3 px-2 text-gray-400 font-medium">Order Qty</th>
                  <th className="py-3 px-2 text-gray-400 font-medium">Days Left</th>
                  <th className="py-3 px-2 text-gray-400 font-medium">Trend</th>
                  <th className="py-3 px-2 text-gray-400 font-medium">Confidence</th>
                </tr>
              </thead>
              <tbody>
                {forecasts.map((f) => (
                  <tr key={f.product_id} className="border-b border-gray-50 dark:border-white/5 hover:bg-gray-50 dark:hover:bg-white/5">
                    <td className="py-3 px-2 font-medium text-gray-900 dark:text-gray-100">
                      {f.product_name}
                      <p className="text-xs text-gray-400 font-mono">{f.sku}</p>
                    </td>
                    <td className="py-3 px-2 text-gray-700 dark:text-gray-300">{f.current_stock}</td>
                    <td className="py-3 px-2 text-gray-700 dark:text-gray-300">{f.avg_daily_usage}</td>
                    <td className="py-3 px-2 text-gray-700 dark:text-gray-300">{f.forecasted_demand_7_days} units</td>
                    <td className="py-3 px-2">
                      <span className={`font-semibold ${f.recommended_order_quantity > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                        {f.recommended_order_quantity > 0 ? `Order ${f.recommended_order_quantity}` : 'Sufficient'}
                      </span>
                    </td>
                    <td className="py-3 px-2">
                      <span className={`font-semibold ${
                        f.days_until_stockout <= 3 ? 'text-rose-600' :
                        f.days_until_stockout <= 7 ? 'text-amber-600' :
                        'text-emerald-600'
                      }`}>
                        {f.days_until_stockout >= 999 ? 'N/A' : `${f.days_until_stockout}d`}
                      </span>
                    </td>
                    <td className="py-3 px-2">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                        f.trend === 'INCREASING' ? 'bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400' :
                        f.trend === 'DECREASING' ? 'bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400' :
                        f.trend === 'STABLE' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400' :
                        'bg-gray-100 text-gray-600 dark:bg-white/5 dark:text-gray-400'
                      }`}>
                        {f.trend.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-2">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                        f.forecast_confidence === 'HIGH' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400' : 'bg-gray-100 text-gray-600 dark:bg-white/5 dark:text-gray-400'
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
