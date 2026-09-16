import { useState, useEffect } from 'react';
import { getPublicProducts, placePublicOrder } from '../services/api';

const UPI_ID = "yourname@upi";

export default function CustomerMenu() {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState({});
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState('menu');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [tableNumber, setTableNumber] = useState('');
  const [order, setOrder] = useState(null);
  const [placing, setPlacing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setTableNumber(params.get('table') || '');
    fetchProducts();
  }, []);

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

  const categories = ['All', ...new Set(products.map(p => p.category || 'Other'))];

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || (p.category || 'Other') === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const addToCart = (product) => {
    setCart(prev => ({
      ...prev,
      [product.id]: {
        ...product,
        quantity: (prev[product.id]?.quantity || 0) + 1
      }
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

  const cartItems = Object.values(cart);
  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const cartTotal = cartItems.reduce((sum, item) => sum + item.selling_price * item.quantity, 0);

  const handlePlaceOrder = async () => {
    if (!paymentMethod) return;
    setPlacing(true);
    try {
      const res = await placePublicOrder({
        customer_name: customerName || 'Guest',
        table_number: tableNumber,
        payment_method: paymentMethod,
        is_self_service: "true",
        items: cartItems.map(item => ({
          product_id: item.id,
          quantity: item.quantity
        }))
      });
      setOrder(res.data);
      setStep('confirmation');
      setCart({});
    } catch (err) {
      alert(err.response?.data?.detail || 'Order failed. Please try again.');
    } finally {
      setPlacing(false);
    }
  };

  const upiLink = `upi://pay?pa=${UPI_ID}&pn=SmartInventory&am=${cartTotal.toFixed(2)}&cu=INR`;

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
    </div>
  );

  // CONFIRMATION SCREEN
  if (step === 'confirmation' && order) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8 text-center">
        <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-4xl">✅</span>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Order Placed!</h2>
        <p className="text-gray-500 mb-6">Your order has been received.</p>

        <div className="bg-gray-50 rounded-xl p-4 mb-6 text-left">
          <p className="text-sm font-semibold text-gray-700 mb-3">Order Summary</p>
          <p className="text-xs text-gray-500 mb-2">
            Order: <span className="font-mono font-bold text-gray-800">{order.order_number}</span>
          </p>
          {order.table_number && (
            <p className="text-xs text-gray-500 mb-2">Table: {order.table_number}</p>
          )}
          <p className="text-xs text-gray-500 mb-3">Payment: {order.payment_method}</p>
          <div className="border-t pt-3 space-y-1">
            {order.items.map(item => (
              <div key={item.id} className="flex justify-between text-xs text-gray-700">
                <span>{item.product_name} x {item.quantity}</span>
                <span>Rs.{item.total_price.toFixed(2)}</span>
              </div>
            ))}
          </div>
          <div className="border-t mt-3 pt-3 flex justify-between font-bold text-gray-900">
            <span>Total Paid</span>
            <span>Rs.{order.total_amount.toFixed(2)}</span>
          </div>
        </div>

        {order.payment_method === 'CASH' && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
            <p className="text-amber-800 text-sm font-medium">
              Please pay Rs.{order.total_amount.toFixed(2)} cash to the staff.
            </p>
          </div>
        )}

        <button
          onClick={() => { setStep('menu'); setOrder(null); }}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-semibold transition"
        >
          Place New Order
        </button>
      </div>
    </div>
  );

  // PAYMENT SCREEN
  if (step === 'payment') return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-md mx-auto">
        <button
          onClick={() => setStep('cart')}
          className="flex items-center gap-2 text-indigo-600 mb-4 text-sm font-medium"
        >
          Back to Cart
        </button>

        <div className="bg-white rounded-2xl shadow-sm p-6 mb-4">
          <h2 className="text-xl font-bold text-gray-900 mb-1">Checkout</h2>
          <p className="text-2xl font-bold text-indigo-600 mb-6">
            Total: Rs.{cartTotal.toFixed(2)}
          </p>

          <div className="space-y-3 mb-6">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Your Name (optional)
              </label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Enter your name"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            {tableNumber && (
              <div className="bg-indigo-50 rounded-lg px-3 py-2 text-sm text-indigo-700 font-medium">
                Table: {tableNumber}
              </div>
            )}
          </div>

          <p className="text-sm font-semibold text-gray-700 mb-3">Choose Payment Method</p>
          <div className="grid grid-cols-2 gap-3 mb-6">
            <button
              onClick={() => setPaymentMethod('UPI')}
              className={`p-4 rounded-xl border-2 text-center transition ${
                paymentMethod === 'UPI'
                  ? 'border-indigo-600 bg-indigo-50'
                  : 'border-gray-200 hover:border-indigo-300'
              }`}
            >
              <p className="text-2xl mb-1">📱</p>
              <p className="text-sm font-semibold text-gray-800">UPI</p>
              <p className="text-xs text-gray-500">GPay / PhonePe</p>
            </button>
            <button
              onClick={() => setPaymentMethod('CASH')}
              className={`p-4 rounded-xl border-2 text-center transition ${
                paymentMethod === 'CASH'
                  ? 'border-indigo-600 bg-indigo-50'
                  : 'border-gray-200 hover:border-indigo-300'
              }`}
            >
              <p className="text-2xl mb-1">💵</p>
              <p className="text-sm font-semibold text-gray-800">Cash</p>
              <p className="text-xs text-gray-500">Pay at counter</p>
            </button>
          </div>

          {paymentMethod === 'UPI' && (
            <div className="bg-gray-50 rounded-xl p-4 mb-6 text-center">
              <p className="text-sm text-gray-600 mb-3">
                Scan QR to pay Rs.{cartTotal.toFixed(2)}
              </p>
              <div className="bg-white border border-gray-200 rounded-xl p-4 inline-block mb-3">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(upiLink)}`}
                  alt="UPI QR Code"
                  className="w-44 h-44"
                />
              </div>
              <p className="text-xs text-gray-500 mb-3">UPI ID: {UPI_ID}</p>
              <button
                onClick={() => { window.location.href = upiLink; }}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded-lg text-sm font-medium transition"
              >
                Open UPI App
              </button>
            </div>
          )}

          <button
            onClick={handlePlaceOrder}
            disabled={!paymentMethod || placing}
            className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white py-3 rounded-xl font-semibold transition"
          >
            {placing
              ? 'Placing Order...'
              : paymentMethod === 'UPI'
              ? 'I have paid — Confirm Order'
              : 'Place Order — Pay at Counter'}
          </button>
        </div>
      </div>
    </div>
  );

  // CART SCREEN
  if (step === 'cart') return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-md mx-auto">
        <button
          onClick={() => setStep('menu')}
          className="flex items-center gap-2 text-indigo-600 mb-4 text-sm font-medium"
        >
          Continue Shopping
        </button>
        <h2 className="text-xl font-bold text-gray-900 mb-4">Your Cart</h2>

        {cartItems.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <p className="text-4xl mb-3">🛒</p>
            <p>Your cart is empty</p>
            <button
              onClick={() => setStep('menu')}
              className="mt-4 text-indigo-600 font-medium text-sm"
            >
              Browse Products
            </button>
          </div>
        ) : (
          <div>
            <div className="space-y-3 mb-6">
              {cartItems.map(item => (
                <div
                  key={item.id}
                  className="bg-white rounded-xl shadow-sm p-4 flex items-center justify-between"
                >
                  <div>
                    <p className="font-semibold text-gray-900">{item.name}</p>
                    <p className="text-sm text-indigo-600 font-bold">
                      Rs.{item.selling_price} each
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center font-bold text-gray-700"
                    >
                      -
                    </button>
                    <span className="font-bold text-gray-900 w-6 text-center">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => addToCart(item)}
                      disabled={item.quantity >= item.current_stock}
                      className="w-8 h-8 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 rounded-full flex items-center justify-center font-bold text-white"
                    >
                      +
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
              <div className="flex justify-between text-gray-600 text-sm mb-2">
                <span>Items ({cartCount})</span>
                <span>Rs.{cartTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold text-gray-900 text-lg border-t pt-2">
                <span>Total</span>
                <span>Rs.{cartTotal.toFixed(2)}</span>
              </div>
            </div>

            <button
              onClick={() => setStep('payment')}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-4 rounded-xl font-bold text-lg transition"
            >
              Proceed to Payment
            </button>
          </div>
        )}
      </div>
    </div>
  );

  // MAIN MENU SCREEN
  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-indigo-900 text-white px-4 py-5">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-2xl font-bold">Smart Store</h1>
          {tableNumber && (
            <p className="text-indigo-300 text-sm mt-0.5">Table {tableNumber}</p>
          )}
          <div className="mt-3">
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl text-gray-900 text-sm focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Category Filter */}
      <div className="bg-white border-b border-gray-100 px-4 py-3 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto flex gap-2 overflow-x-auto pb-1">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition ${
                selectedCategory === cat
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Products Grid */}
      <div className="max-w-2xl mx-auto px-4 py-4">
        {filteredProducts.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <p className="text-4xl mb-3">📦</p>
            <p>No products found</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {filteredProducts.map(product => {
              const inCart = cart[product.id]?.quantity || 0;
              return (
                <div key={product.id} className="bg-white rounded-xl shadow-sm overflow-hidden">
                  <div className="bg-gradient-to-br from-indigo-50 to-purple-50 h-24 flex items-center justify-center">
                    <span className="text-4xl">📦</span>
                  </div>
                  <div className="p-3">
                    <p className="font-semibold text-gray-900 text-sm leading-tight mb-1">
                      {product.name}
                    </p>
                    {product.category && (
                      <p className="text-xs text-gray-400 mb-2">{product.category}</p>
                    )}
                    <p className="text-indigo-600 font-bold mb-3">Rs.{product.selling_price}</p>
                    {inCart > 0 ? (
                      <div className="flex items-center justify-between">
                        <button
                          onClick={() => removeFromCart(product.id)}
                          className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center font-bold text-gray-700 text-lg"
                        >
                          -
                        </button>
                        <span className="font-bold text-gray-900">{inCart}</span>
                        <button
                          onClick={() => addToCart(product)}
                          disabled={inCart >= product.current_stock}
                          className="w-8 h-8 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 rounded-full flex items-center justify-center font-bold text-white text-lg"
                        >
                          +
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => addToCart(product)}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-lg text-sm font-semibold transition"
                      >
                        Add
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Floating Cart Button */}
      {cartCount > 0 && (
        <div className="fixed bottom-4 left-0 right-0 px-4 z-20">
          <div className="max-w-2xl mx-auto">
            <button
              onClick={() => setStep('cart')}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-4 rounded-2xl shadow-xl flex items-center justify-between px-6 transition"
            >
              <span className="bg-white text-indigo-600 rounded-full w-7 h-7 flex items-center justify-center font-bold text-sm">
                {cartCount}
              </span>
              <span className="font-bold text-lg">View Cart</span>
              <span className="font-bold text-lg">Rs.{cartTotal.toFixed(2)}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}