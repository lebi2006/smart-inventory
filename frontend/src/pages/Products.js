import { useState, useEffect } from 'react';
import {
  getProducts, createProduct, updateProduct, deleteProduct,
  getCategories, getSuppliers, exportProductsExcel, exportProductsPDF,
  getProductByBarcode
} from '../services/api';
import { useAuth } from '../context/AuthContext';
import { downloadFile } from '../utils/downloadFile';
import BarcodeScanner from '../components/BarcodeScanner';

const EMPTY_FORM = {
  name: '', sku: '', description: '', category_id: '',
  supplier_id: '', unit_price: '', selling_price: '',
  current_stock: '', reorder_level: 10, expiry_date: ''
};

export default function Products() {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [exporting, setExporting] = useState(false);
  const [showScanner, setShowScanner] = useState(false);

  const isAdminOrManager = user?.role === 'ADMIN' || user?.role === 'MANAGER';
  const isAdmin = user?.role === 'ADMIN';

  const fetchProducts = async () => {
    try {
      const params = {};
      if (search) params.search = search;
      if (filterCategory) params.category_id = filterCategory;
      const res = await getProducts(params);
      setProducts(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    const init = async () => {
      try {
        const [catRes, supRes] = await Promise.all([getCategories(), getSuppliers()]);
        setCategories(catRes.data);
        setSuppliers(supRes.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchProducts(); }, [search, filterCategory]);

  const openAddModal = () => {
    setEditingProduct(null);
    setForm(EMPTY_FORM);
    setError('');
    setShowModal(true);
  };

  const openEditModal = (product) => {
    setEditingProduct(product);
    setForm({
      name: product.name,
      sku: product.sku,
      description: product.description || '',
      category_id: product.category_id || '',
      supplier_id: product.supplier_id || '',
      unit_price: product.unit_price,
      selling_price: product.selling_price,
      current_stock: product.current_stock,
      reorder_level: product.reorder_level,
      expiry_date: product.expiry_date || ''
    });
    setError('');
    setShowModal(true);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError('');
    try {
      const payload = {
        ...form,
        unit_price: parseFloat(form.unit_price),
        selling_price: parseFloat(form.selling_price),
        current_stock: parseInt(form.current_stock),
        reorder_level: parseInt(form.reorder_level),
        category_id: form.category_id || null,
        supplier_id: form.supplier_id || null,
        expiry_date: form.expiry_date || null,
      };
      if (editingProduct) {
        await updateProduct(editingProduct.id, payload);
      } else {
        await createProduct(payload);
      }
      setShowModal(false);
      fetchProducts();
    } catch (err) {
      setError(err.response?.data?.detail || 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    try {
      await deleteProduct(id);
      fetchProducts();
    } catch (err) {
      alert(err.response?.data?.detail || 'Delete failed');
    }
  };

  const handleExportExcel = async () => {
    setExporting(true);
    try {
      const res = await exportProductsExcel();
      downloadFile(res.data, `inventory_${new Date().toISOString().slice(0, 10)}.xlsx`);
    } catch (err) {
      alert('Export failed');
    } finally {
      setExporting(false);
    }
  };

  const handleExportPDF = async () => {
    setExporting(true);
    try {
      const res = await exportProductsPDF();
      downloadFile(res.data, `inventory_${new Date().toISOString().slice(0, 10)}.pdf`);
    } catch (err) {
      alert('Export failed');
    } finally {
      setExporting(false);
    }
  };

  const handleBarcodeDetected = async (code) => {
    setShowScanner(false);
    try {
      const res = await getProductByBarcode(code);
      openEditModal(res.data);
    } catch (err) {
      openAddModal();
      setForm(prev => ({ ...prev, sku: code }));
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
          <h2 className="text-xl font-bold text-gray-900">Products</h2>
          <p className="text-sm text-gray-500">{products.length} products found</p>
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
            onClick={handleExportPDF}
            disabled={exporting}
            className="bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
          >
            Export PDF
          </button>
          <button
            onClick={() => setShowScanner(true)}
            className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
            </svg>
            Scan
          </button>
          {isAdminOrManager && (
            <button
              onClick={openAddModal}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
            >
              + Add Product
            </button>
          )}
        </div>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          placeholder="Search by name or SKU..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">All Categories</option>
          {categories.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left py-3 px-4 text-gray-500 font-medium">Product</th>
                <th className="text-left py-3 px-4 text-gray-500 font-medium">SKU</th>
                <th className="text-left py-3 px-4 text-gray-500 font-medium">Category</th>
                <th className="text-left py-3 px-4 text-gray-500 font-medium">Stock</th>
                <th className="text-left py-3 px-4 text-gray-500 font-medium">Price</th>
                <th className="text-left py-3 px-4 text-gray-500 font-medium">Status</th>
                {isAdminOrManager && (
                  <th className="text-left py-3 px-4 text-gray-500 font-medium">Actions</th>
                )}
              </tr>
            </thead>
            <tbody>
              {products.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-12 text-gray-400">
                    No products found
                  </td>
                </tr>
              ) : (
                products.map((product) => (
                  <tr key={product.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <p className="font-medium text-gray-900">{product.name}</p>
                      {product.description && (
                        <p className="text-xs text-gray-400 truncate max-w-xs">{product.description}</p>
                      )}
                    </td>
                    <td className="py-3 px-4 text-gray-500 font-mono text-xs">{product.sku}</td>
                    <td className="py-3 px-4 text-gray-500">
                      {product.category?.name || '—'}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`font-semibold ${
                        product.current_stock === 0 ? 'text-red-600' :
                        product.current_stock <= product.reorder_level ? 'text-amber-600' :
                        'text-emerald-600'
                      }`}>
                        {product.current_stock}
                      </span>
                      <span className="text-gray-400 text-xs"> / {product.reorder_level}</span>
                    </td>
                    <td className="py-3 px-4">
                      <p className="text-gray-900 font-medium">₹{product.selling_price}</p>
                      <p className="text-xs text-gray-400">Cost: ₹{product.unit_price}</p>
                    </td>
                    <td className="py-3 px-4">
                      {product.current_stock === 0 ? (
                        <span className="bg-red-100 text-red-700 text-xs px-2 py-1 rounded-full">Out of Stock</span>
                      ) : product.current_stock <= product.reorder_level ? (
                        <span className="bg-amber-100 text-amber-700 text-xs px-2 py-1 rounded-full">Low Stock</span>
                      ) : (
                        <span className="bg-emerald-100 text-emerald-700 text-xs px-2 py-1 rounded-full">In Stock</span>
                      )}
                    </td>
                    {isAdminOrManager && (
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => openEditModal(product)}
                            className="text-indigo-600 hover:text-indigo-800 text-xs font-medium"
                          >
                            Edit
                          </button>
                          {isAdmin && (
                            <button
                              onClick={() => handleDelete(product.id)}
                              className="text-red-500 hover:text-red-700 text-xs font-medium"
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-screen overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-bold text-gray-900">
                  {editingProduct ? 'Edit Product' : 'Add New Product'}
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

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Product Name *</label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">SKU *</label>
                    <input
                      type="text"
                      value={form.sku}
                      onChange={(e) => setForm({ ...form, sku: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Category</label>
                    <select
                      value={form.category_id}
                      onChange={(e) => setForm({ ...form, category_id: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="">None</option>
                      {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Supplier</label>
                    <select
                      value={form.supplier_id}
                      onChange={(e) => setForm({ ...form, supplier_id: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="">None</option>
                      {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Cost Price *</label>
                    <input
                      type="number"
                      value={form.unit_price}
                      onChange={(e) => setForm({ ...form, unit_price: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Selling Price *</label>
                    <input
                      type="number"
                      value={form.selling_price}
                      onChange={(e) => setForm({ ...form, selling_price: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Current Stock *</label>
                    <input
                      type="number"
                      value={form.current_stock}
                      onChange={(e) => setForm({ ...form, current_stock: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Reorder Level</label>
                    <input
                      type="number"
                      value={form.reorder_level}
                      onChange={(e) => setForm({ ...form, reorder_level: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Expiry Date (optional)</label>
                  <input
                    type="date"
                    value={form.expiry_date}
                    onChange={(e) => setForm({ ...form, expiry_date: e.target.value })}
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
                  className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-lg text-sm font-medium transition"
                >
                  {submitting ? 'Saving...' : editingProduct ? 'Update Product' : 'Add Product'}
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