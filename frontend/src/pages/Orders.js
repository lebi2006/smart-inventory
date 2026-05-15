import { useState, useEffect } from 'react';
import { getOrders, getOrdersSummary, updateOrderStatus } from '../services/api';

const STATUS_COLORS = {
  PENDING: 'bg-amber-100 text-amber-700',
  PAID: 'bg-blue-100 text-blue-700',
  COMPLETED: 'bg-emerald-100 text-emerald-700',
  CANCELLED: 'bg-red-100 text-red-700',
};

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');
  const [expandedOrder, setExpandedOrder] = useState(null);

  const fetchData = async () => {
    try {
      const params = {};
      if (filterStatus) params.status = filterStatus;
      const [ordersRes, summaryRes] = await Promise.all([
        getOrders(params),
        getOrdersSummary()
      ]);
      setOrders(ordersRes.data);
      setSummary(summaryRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchData(); }, [filterStatus]);

  // Auto-refresh every 15 seconds for live orders
  useEffect(() => {
    const interval = setInterval(fetchData, 15000);
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterStatus]);

  const handleStatusUpdate = async (orderId, status, paymentMethod = null) => {
    try {
      await updateOrderStatus(orderId, status, paymentMethod);
      fetchData();
    } catch (err) {
      alert('Failed to update order');
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
    </div>
  );

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Orders</h2>
          <p className="text-sm text-gray-500">Live order tracking — refreshes every 15s</p>
        </div>
        <button onClick={fetchData} className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-4 py-2 rounded-lg text-sm font-medium transition">
          Refresh Now
        </button>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {[
            { label: "Today's Orders", value: summary.today_orders, color: 'text-indigo-600' },
            { label: 'Pending', value: summary.pending_orders, color: 'text-amber-600' },
            { label: 'Completed', value: summary.completed_orders, color: 'text-emerald-600' },
            { label: "Today's Revenue", value: `₹${summary.today_revenue}`, color: 'text-blue-600' },
            { label: 'Total Orders', value: summary.total_orders, color: 'text-purple-600' },
            { label: 'Total Revenue', value: `₹${summary.total_revenue}`, color: 'text-teal-600' },
          ].map((card, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
              <p className={`text-xl font-bold ${card.color}`}>{card.value}</p>
              <p className="text-xs text-gray-500 mt-1">{card.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Filter */}
      <div className="flex gap-3">
        {['', 'PENDING', 'PAID', 'COMPLETED', 'CANCELLED'].map(status => (
          <button
            key={status}
            onClick={() => setFilterStatus(status)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              filterStatus === status
                ? 'bg-indigo-600 text-white'
                : 'bg-white border border-gray-200 text-gray-600 hover:border-indigo-300'
            }`}
          >
            {status || 'All'}
          </button>
        ))}
      </div>

      {/* Orders List */}
      <div className="space-y-3">
        {orders.length === 0 ? (
          <div className="text-center py-16 text-gray-400 bg-white rounded-xl border border-gray-100">
            No orders found
          </div>
        ) : (
          orders.map(order => (
            <div key={order.id} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              <div
                className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50"
                onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
              >
                <div className="flex items-center gap-4">
                  <div>
                    <p className="font-bold text-gray-900 font-mono">{order.order_number}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(order.created_at).toLocaleString()} —
                      {order.is_self_service === 'true' ? ' Self-service' : ' Staff billed'}
                    </p>
                  </div>
                  {order.table_number && (
                    <span className="bg-indigo-100 text-indigo-700 text-xs px-2 py-1 rounded-full font-medium">
                      Table {order.table_number}
                    </span>
                  )}
                  {order.customer_name && (
                    <span className="text-sm text-gray-600">{order.customer_name}</span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-bold text-gray-900">₹{order.total_amount}</span>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_COLORS[order.status]}`}>
                    {order.status}
                  </span>
                  <span className="text-gray-400 text-xs">{expandedOrder === order.id ? '▲' : '▼'}</span>
                </div>
              </div>

              {expandedOrder === order.id && (
                <div className="border-t border-gray-100 p-4">
                  <div className="mb-4">
                    <p className="text-xs font-semibold text-gray-500 mb-2">ORDER ITEMS</p>
                    <div className="space-y-1">
                      {order.items.map(item => (
                        <div key={item.id} className="flex justify-between text-sm">
                          <span className="text-gray-700">{item.product_name} × {item.quantity}</span>
                          <span className="font-medium text-gray-900">₹{item.total_price.toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                    <div className="border-t mt-2 pt-2 flex justify-between font-bold text-gray-900">
                      <span>Total</span>
                      <span>₹{order.total_amount}</span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2 flex-wrap">
                    {order.status === 'PENDING' && (
                      <>
                        <button
                          onClick={() => handleStatusUpdate(order.id, 'PAID', order.payment_method || 'CASH')}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition"
                        >
                          Mark as Paid
                        </button>
                        <button
                          onClick={() => handleStatusUpdate(order.id, 'COMPLETED')}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition"
                        >
                          Mark as Completed
                        </button>
                        <button
                          onClick={() => handleStatusUpdate(order.id, 'CANCELLED')}
                          className="bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition"
                        >
                          Cancel Order
                        </button>
                      </>
                    )}
                    {order.status === 'PAID' && (
                      <button
                        onClick={() => handleStatusUpdate(order.id, 'COMPLETED')}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition"
                      >
                        Mark as Completed
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}