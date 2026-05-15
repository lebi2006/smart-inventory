import { useState, useEffect } from 'react';
import { getPublicProducts, placeStaffOrder } from '../services/api';

export default function POS() {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState({});
  const [loading, setLoading] = useState(true);
  const [customerName, setCustomerName] = useState('');
  const [tableNumber, setTableNumber] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [placing, setPlacing] = useState(false);
  const [lastOrder, setLastOrder] = useState(null);
  const [search, setSearch] = useState('');

  useEffect(() => { fetchProducts(); }, []);

  const fetchProducts = async () => {
    try {
      const res = await getPublicProducts();
      setProducts(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = (product) => {
    setCart(prev => ({
      ...prev,
      [product.id]: { ...product, quantity: (prev[product.id]?.quantity || 0) + 1 }
    }));
  };

  const removeFromCart = (productId) => {
    setCart(prev => {
      const updated = { ...prev };
      if (updated[productId]?.quantity > 1) {
        updated[productId] = { ...updated[productId], quantity: updated[productId].quantity - 1 };
      } else {
        delete updated[productId];
      }
      return updated;
    });
  };

  const clearCart = () => {
    setCart({});
    setCustomerName('');
    setTableNumber('');
    setPaymentMethod('CASH');
  };

  const cartItems = Object.values(cart);
  const cartTotal = cartItems.reduce((sum, item) => sum + item.selling_price * item.quantity, 0);
  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  const handlePlaceOrder = async () => {
    if (cartItems.length === 0) return;
    setPlacing(true);
    try {
      const res = await placeStaffOrder({
        customer_name: customerName || 'Walk-in',
        table_number: tableNumber,
        payment_method: paymentMethod,
        is_self_service: "false",
        items: cartItems.map(item => ({
          product_id: item.id,
          quantity: item.quantity
        }))
      });
      setLastOrder(res.data);
      clearCart();
      fetchProducts();
    } catch (err) {
      alert(err.response?.data?.detail || 'Order failed');
    } finally {
      setPlacing(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
    </div>
  );

  return (
    <div className="flex h-full gap-5">

      {/* Left — Product Grid */}
      <div className="flex-1 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">POS — Billing</h2>
          <input
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-64"
          />
        </div>

        {lastOrder && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center justify-between">
            <div>
              <p className="text-emerald-800 font-semibold text-sm">Order placed: {lastOrder.order_number}</p>
              <p className="text-emerald-600 text-xs">Total: ₹{lastOrder.total_amount} — {lastOrder.payment_method}</p>
            </div>
            <button onClick={() => setLastOrder(null)} className="text-emerald-400 hover:text-emerald-600 text-xs">Dismiss</button>
          </div>
        )}

        <div className="grid grid-cols-2 xl:grid-cols-3 gap-3">
          {filteredProducts.map(product => {
            const inCart = cart[product.id]?.quantity || 0;
            return (
              <div
                key={product.id}
                onClick={() => addToCart(product)}
                className={`bg-white rounded-xl border-2 p-4 cursor-pointer transition ${
                  inCart > 0 ? 'border-indigo-500 bg-indigo-50' : 'border-gray-100 hover:border-indigo-300'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <p className="font-semibold text-gray-900 text-sm leading-tight">{product.name}</p>
                  {inCart > 0 && (
                    <span className="bg-indigo-600 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-bold flex-shrink-0">
                      {inCart}
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-400 mb-2">Stock: {product.current_stock}</p>
                <p className="text-indigo-600 font-bold">₹{product.selling_price}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Right — Bill Panel */}
      <div className="w-80 flex-shrink-0">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 sticky top-0">
          <h3 className="font-bold text-gray-900 mb-4">Current Bill</h3>

          <div className="space-y-2 mb-4">
            <input
              type="text"
              placeholder="Customer name"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <input
              type="text"
              placeholder="Table / Token number"
              value={tableNumber}
              onChange={(e) => setTableNumber(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Cart Items */}
          <div className="min-h-32 max-h-64 overflow-y-auto space-y-2 mb-4">
            {cartItems.length === 0 ? (
              <p className="text-center text-gray-400 text-sm py-8">Click products to add</p>
            ) : (
              cartItems.map(item => (
                <div key={item.id} className="flex items-center justify-between text-sm">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 text-xs">{item.name}</p>
                    <p className="text-gray-400 text-xs">₹{item.selling_price} × {item.quantity}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-900 text-xs">
                      ₹{(item.selling_price * item.quantity).toFixed(2)}
                    </span>
                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="text-red-400 hover:text-red-600 text-xs"
                    >✕</button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Total */}
          <div className="border-t pt-3 mb-4">
            <div className="flex justify-between font-bold text-gray-900">
              <span>Total</span>
              <span>₹{cartTotal.toFixed(2)}</span>
            </div>
          </div>

          {/* Payment Method */}
          <div className="grid grid-cols-2 gap-2 mb-4">
            <button
              onClick={() => setPaymentMethod('CASH')}
              className={`py-2 rounded-lg text-sm font-medium border-2 transition ${
                paymentMethod === 'CASH' ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-gray-200 text-gray-600'
              }`}
            >
              💵 Cash
            </button>
            <button
              onClick={() => setPaymentMethod('UPI')}
              className={`py-2 rounded-lg text-sm font-medium border-2 transition ${
                paymentMethod === 'UPI' ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-gray-200 text-gray-600'
              }`}
            >
              📱 UPI
            </button>
          </div>

          <button
            onClick={handlePlaceOrder}
            disabled={cartItems.length === 0 || placing}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white py-3 rounded-xl font-bold transition mb-2"
          >
            {placing ? 'Processing...' : `Charge ₹${cartTotal.toFixed(2)}`}
          </button>
          <button
            onClick={clearCart}
            className="w-full border border-gray-300 text-gray-600 py-2 rounded-xl text-sm font-medium hover:bg-gray-50 transition"
          >
            Clear Bill
          </button>
        </div>
      </div>
    </div>
  );
}