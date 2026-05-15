import { useState, useEffect } from 'react';
import { getSuppliers, createSupplier } from '../services/api';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const EMPTY_FORM = { name: '', contact_person: '', phone: '', email: '', address: '' };

export default function Suppliers() {
  const { user } = useAuth();
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const isAdminOrManager = user?.role === 'ADMIN' || user?.role === 'MANAGER';

  const fetchSuppliers = async () => {
    try {
      const res = await getSuppliers();
      setSuppliers(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSuppliers(); }, []);

  const openAddModal = () => {
    setEditingSupplier(null);
    setForm(EMPTY_FORM);
    setError('');
    setShowModal(true);
  };

  const openEditModal = (supplier) => {
    setEditingSupplier(supplier);
    setForm({
      name: supplier.name || '',
      contact_person: supplier.contact_person || '',
      phone: supplier.phone || '',
      email: supplier.email || '',
      address: supplier.address || '',
    });
    setError('');
    setShowModal(true);
  };

  const handleSubmit = async () => {
    if (!form.name) { setError('Supplier name is required'); return; }
    setSubmitting(true);
    setError('');
    try {
      if (editingSupplier) {
        await api.put(`/api/suppliers/${editingSupplier.id}`, form);
      } else {
        await createSupplier(form);
      }
      setShowModal(false);
      fetchSuppliers();
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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Suppliers</h2>
          <p className="text-sm text-gray-500">{suppliers.length} suppliers registered</p>
        </div>
        {isAdminOrManager && (
          <button
            onClick={openAddModal}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
          >
            + Add Supplier
          </button>
        )}
      </div>

      {/* Suppliers Grid */}
      {suppliers.length === 0 ? (
        <div className="text-center py-16 text-gray-400 bg-white rounded-xl border border-gray-100">
          <p className="text-4xl mb-3">🏭</p>
          <p>No suppliers yet. Add your first supplier.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {suppliers.map(supplier => (
            <div key={supplier.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <span className="text-indigo-600 font-bold text-lg">
                    {supplier.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                {isAdminOrManager && (
                  <button
                    onClick={() => openEditModal(supplier)}
                    className="text-xs text-indigo-600 hover:text-indigo-800 font-medium border border-indigo-200 hover:border-indigo-400 px-2 py-1 rounded-lg transition"
                  >
                    Edit
                  </button>
                )}
              </div>
              <h3 className="font-bold text-gray-900 mb-1">{supplier.name}</h3>
              {supplier.contact_person && (
                <p className="text-sm text-gray-500 mb-1">👤 {supplier.contact_person}</p>
              )}
              {supplier.phone && (
                <p className="text-sm text-gray-500 mb-1">📞 {supplier.phone}</p>
              )}
              {supplier.email && (
                <p className="text-sm text-gray-500 mb-1">✉️ {supplier.email}</p>
              )}
              {supplier.address && (
                <p className="text-sm text-gray-400 mt-2 text-xs">{supplier.address}</p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-bold text-gray-900">
                  {editingSupplier ? 'Edit Supplier' : 'Add New Supplier'}
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
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Supplier Name *</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Contact Person</label>
                  <input
                    type="text"
                    value={form.contact_person}
                    onChange={(e) => setForm({ ...form, contact_person: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Phone</label>
                    <input
                      type="text"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Email</label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Address</label>
                  <textarea
                    value={form.address}
                    onChange={(e) => setForm({ ...form, address: e.target.value })}
                    rows={2}
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
                  {submitting ? 'Saving...' : editingSupplier ? 'Update Supplier' : 'Add Supplier'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}