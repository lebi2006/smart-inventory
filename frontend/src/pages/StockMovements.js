import { useState, useEffect } from 'react';
import { getStockMovements, stockIn, stockOut, adjustStock, getProducts, exportMovementsExcel, getProductByBarcode } from '../services/api';
import { downloadFile } from '../utils/downloadFile';
import BarcodeScanner from '../components/BarcodeScanner';

const MOVEMENT_COLORS = {
  STOCK_IN: 'bg-emerald-100 text-emerald-700',
  STOCK_OUT: 'bg-amber-100 text-amber-700',
  ADJUSTMENT: 'bg-blue-100 text-blue-700',
};

const EMPTY_FORM = { product_id: '', quantity: '', note: '' };

export default function StockMovements() {
  const [movements, setMovements] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [movementType, setMovementType] = useState('STOCK_IN');
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [filterType, setFilterType] = useState('');
  const [exporting, setExporting] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [scanError, setScanError] = useState('');

  const handleExportExcel = async () => {
    setExporting(true);
    try {
      const res = await exportMovementsExcel();
      downloadFile(res.data, `stock_movements_${new Date().toISOString().slice(0, 10)}.xlsx`);
    } catch (err) {
      alert('Export failed');
    } finally {
      setExporting(false);
    }
  };

  const fetchMovements = async () => {
    try {
      const params = {};
      if (filterType) params.movement_type = filterType;
      const res = await getStockMovements(params);
      setMovements(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    const init = async () => {
      try {
        const res = await getProducts({});
        setProducts(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchMovements(); }, [filterType]);

  const openModal = (type) => {
    setMovementType(type);
    setForm(EMPTY_FORM);
    setError('');
    setScanError('');
    setShowModal(true);
  };

  const handleBarcodeDetected = async (code) => {
    setShowScanner(false);
    setScanError('');
    try {
      const res = await getProductByBarcode(code);
      const product = res.data;
      setForm({ ...form, product_id: String(product.id) });
      alert(`Found: ${product.name} (Stock: ${product.current_stock})`);
    } catch (err) {
      setScanError(`No product found with barcode: ${code}`);
    }
  };

  const handleSubmit = async () => {
    if (!form.product_id || !form.quantity) {
      setError('Product and quantity are required');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const payload = {
        product_id: parseInt(form.product_id),
        movement_type: movementType,
        quantity: parseInt(form.quantity),
        note: form.note || null,
      };
      if (movementType === 'STOCK_IN') await stockIn(payload);
      else if (movementType === 'STOCK_OUT') await stockOut(payload);
      else await adjustStock(payload);
      setShowModal(false);
      fetchMovements();
    } catch (err) {
      setError(err.response?.data?.detail || 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
    </div>
  );

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Stock Movements</h2>
          <p className="text-sm text-gray-500">Full audit trail of all stock changes</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={handleExportExcel}
            disabled={exporting}
            className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
          >
            Export Excel
          </button>
          <button
            onClick={() => openModal('STOCK_IN')}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
          >
            + Stock In
          </button>
          <button
            onClick={() => openModal('STOCK_OUT')}
            className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
          >
            - Stock Out
          </button>
          <button
            onClick={() => openModal('ADJUSTMENT')}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
          >
            Adjust
          </button>
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-3">
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">All Movements</option>
          <option value="STOCK_IN">Stock In</option>
          <option value="STOCK_OUT">Stock Out</option>
          <option value="ADJUSTMENT">Adjustment</option>
        </select>
      </div>

      {/* Movements Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left py-3 px-4 text-gray-500 font-medium">Date & Time</th>
                <th className="text-left py-3 px-4 text-gray-500 font-medium">Product</th>
                <th className="text-left py-3 px-4 text-gray-500 font-medium">Type</th>
                <th className="text-left py-3 px-4 text-gray-500 font-medium">Quantity</th>
                <th className="text-left py-3 px-4 text-gray-500 font-medium">By</th>
                <th className="text-left py-3 px-4 text-gray-500 font-medium">Note</th>
              </tr>
            </thead>
            <tbody>
              {movements.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-12 text-gray-400">
                    No stock movements recorded yet
                  </td>
                </tr>
              ) : (
                movements.map((m) => (
                  <tr key={m.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-3 px-4 text-gray-500 text-xs">
                      {new Date(m.created_at).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 font-medium text-gray-900">
                      {m.product?.name || `Product #${m.product_id}`}
                      <p className="text-xs text-gray-400 font-mono">{m.product?.sku}</p>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${MOVEMENT_COLORS[m.movement_type]}`}>
                        {m.movement_type.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`font-bold ${
                        m.movement_type === 'STOCK_IN' ? 'text-emerald-600' :
                        m.movement_type === 'STOCK_OUT' ? 'text-amber-600' :
                        'text-blue-600'
                      }`}>
                        {m.movement_type === 'STOCK_IN' ? '+' :
                         m.movement_type === 'STOCK_OUT' ? '-' : '='}{m.quantity}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-500">
                      {m.user?.name || `User #${m.user_id}`}
                    </td>
                    <td className="py-3 px-4 text-gray-400 text-xs">
                      {m.note || '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-bold text-gray-900">
                  {movementType === 'STOCK_IN' ? 'Add Stock In' :
                   movementType === 'STOCK_OUT' ? 'Record Stock Out' : 'Adjust Stock'}
                </h3>
                <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
                  {error}
                </div>
              )}

              {/* Scan Barcode Button */}
              <div className="flex items-center gap-2 mb-4">
                <button
                  type="button"
                  onClick={() => setShowScanner(true)}
                  className="flex items-center gap-2 px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-sm font-medium transition"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.24M16.24 12l1.76-1.76M12 12l-1.76 1.76M12 12V8" />
                  </svg>
                  Scan Barcode
                </button>
                {scanError && <p className="text-xs text-red-500">{scanError}</p>}
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Product *</label>
                  <select
                    value={form.product_id}
                    onChange={(e) => setForm({ ...form, product_id: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">Select a product</option>
                    {products.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name} (Stock: {p.current_stock})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    {movementType === 'ADJUSTMENT' ? 'New Stock Level *' : 'Quantity *'}
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={form.quantity}
                    onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Note (optional)</label>
                  <input
                    type="text"
                    value={form.note}
                    onChange={(e) => setForm({ ...form, note: e.target.value })}
                    placeholder="e.g. Received from supplier"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className={`flex-1 px-4 py-2 text-white rounded-lg text-sm font-medium transition disabled:opacity-50 ${
                    movementType === 'STOCK_IN' ? 'bg-emerald-600 hover:bg-emerald-700' :
                    movementType === 'STOCK_OUT' ? 'bg-amber-500 hover:bg-amber-600' :
                    'bg-blue-500 hover:bg-blue-600'
                  }`}
                >
                  {submitting ? 'Saving...' : 'Confirm'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Barcode Scanner */}
      {showScanner && (
        <BarcodeScanner
          onDetected={handleBarcodeDetected}
          onClose={() => setShowScanner(false)}
        />
      )}
    </div>
  );
}