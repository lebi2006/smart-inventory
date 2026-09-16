import { useState, useEffect } from 'react';
import { getProfitAnalysis, getProfitSummary } from '../services/api';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell
} from 'recharts';

export default function Analytics() {
  const [products, setProducts] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('margin_percent');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [productsRes, summaryRes] = await Promise.all([
          getProfitAnalysis(),
          getProfitSummary(),
        ]);
        setProducts(productsRes.data);
        setSummary(summaryRes.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const sorted = [...products].sort((a, b) => b[sortBy] - a[sortBy]);
  const chartData = sorted.slice(0, 8).map(p => ({
    name: p.product_name.length > 12 ? p.product_name.slice(0, 12) + '...' : p.product_name,
    margin: p.margin_percent,
    potential: p.total_profit_potential,
  }));

  const getMarginColor = (margin) => {
    if (margin >= 40) return '#10b981';
    if (margin >= 20) return '#f59e0b';
    return '#ef4444';
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
    </div>
  );

  return (
    <div className="space-y-6">

      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-gray-900">Profit Analytics</h2>
        <p className="text-sm text-gray-500">Margin analysis and revenue insights</p>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {[
            { label: 'Profit Potential', value: `₹${summary.total_profit_potential.toLocaleString()}`, color: 'bg-emerald-500' },
            { label: 'Revenue Realized', value: `₹${summary.total_revenue_realized.toLocaleString()}`, color: 'bg-blue-500' },
            { label: 'Profit Realized', value: `₹${summary.total_profit_realized.toLocaleString()}`, color: 'bg-indigo-600' },
            { label: 'Avg Margin', value: `${summary.avg_margin_percent}%`, color: 'bg-purple-500' },
            { label: 'Best Product', value: summary.most_profitable_product, color: 'bg-teal-500' },
            { label: 'Lowest Margin', value: summary.least_profitable_product, color: 'bg-rose-500' },
          ].map((card, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
              <div className={`w-8 h-8 ${card.color} rounded-lg mb-3`}></div>
              <p className="text-lg font-bold text-gray-900 truncate">{card.value}</p>
              <p className="text-xs text-gray-500 mt-1">{card.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h3 className="text-base font-semibold text-gray-800 mb-4">Margin % by Product</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 11 }} unit="%" />
              <Tooltip formatter={(value) => [`${value}%`, 'Margin']} />
              <Bar dataKey="margin" radius={[4, 4, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={index} fill={getMarginColor(entry.margin)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h3 className="text-base font-semibold text-gray-800 mb-4">Profit Potential by Product</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={chartData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} width={90} />
              <Tooltip formatter={(value) => [`₹${value}`, 'Profit Potential']} />
              <Bar dataKey="potential" fill="#6366f1" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Detailed Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-gray-800">Product Profit Breakdown</h3>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="margin_percent">Sort by Margin %</option>
            <option value="total_profit_potential">Sort by Profit Potential</option>
            <option value="total_profit_realized">Sort by Profit Realized</option>
            <option value="units_sold">Sort by Units Sold</option>
          </select>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left py-3 px-3 text-gray-500 font-medium">Product</th>
                <th className="text-left py-3 px-3 text-gray-500 font-medium">Cost</th>
                <th className="text-left py-3 px-3 text-gray-500 font-medium">Price</th>
                <th className="text-left py-3 px-3 text-gray-500 font-medium">Margin</th>
                <th className="text-left py-3 px-3 text-gray-500 font-medium">Stock</th>
                <th className="text-left py-3 px-3 text-gray-500 font-medium">Units Sold</th>
                <th className="text-left py-3 px-3 text-gray-500 font-medium">Revenue</th>
                <th className="text-left py-3 px-3 text-gray-500 font-medium">Profit Realized</th>
                <th className="text-left py-3 px-3 text-gray-500 font-medium">Potential</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((p) => (
                <tr key={p.product_id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="py-3 px-3">
                    <p className="font-medium text-gray-900">{p.product_name}</p>
                    <p className="text-xs text-gray-400 font-mono">{p.sku}</p>
                  </td>
                  <td className="py-3 px-3 text-gray-600">₹{p.unit_price}</td>
                  <td className="py-3 px-3 text-gray-600">₹{p.selling_price}</td>
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-2">
                      <span className={`font-bold ${
                        p.margin_percent >= 40 ? 'text-emerald-600' :
                        p.margin_percent >= 20 ? 'text-amber-600' :
                        'text-red-600'
                      }`}>
                        {p.margin_percent}%
                      </span>
                      <span className="text-xs text-gray-400">₹{p.margin_amount}</span>
                    </div>
                  </td>
                  <td className="py-3 px-3 text-gray-600">{p.current_stock}</td>
                  <td className="py-3 px-3 text-gray-600">{p.units_sold}</td>
                  <td className="py-3 px-3 text-gray-600">₹{p.total_revenue.toLocaleString()}</td>
                  <td className="py-3 px-3 font-semibold text-emerald-600">
                    ₹{p.total_profit_realized.toLocaleString()}
                  </td>
                  <td className="py-3 px-3 font-semibold text-indigo-600">
                    ₹{p.total_profit_potential.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}