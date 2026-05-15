import axios from 'axios';

const API_BASE_URL = 'http://127.0.0.1:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Automatically attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 errors globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth
export const loginUser = (email, password) =>
  api.post('/api/auth/login', new URLSearchParams({ username: email, password }), {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
  });

export const getMe = () => api.get('/api/auth/me');

// Products
export const getProducts = (params) => api.get('/api/products/', { params });
export const getProduct = (id) => api.get(`/api/products/${id}`);
export const createProduct = (data) => api.post('/api/products/', data);
export const updateProduct = (id, data) => api.put(`/api/products/${id}`, data);
export const deleteProduct = (id) => api.delete(`/api/products/${id}`);
export const getLowStockProducts = () => api.get('/api/products/low-stock');

// Categories
export const getCategories = () => api.get('/api/categories/');
export const createCategory = (data) => api.post('/api/categories/', data);

// Suppliers
export const getSuppliers = () => api.get('/api/suppliers/');
export const createSupplier = (data) => api.post('/api/suppliers/', data);

// Stock
export const getStockMovements = (params) => api.get('/api/stock/', { params });
export const stockIn = (data) => api.post('/api/stock/in', data);
export const stockOut = (data) => api.post('/api/stock/out', data);
export const adjustStock = (data) => api.post('/api/stock/adjust', data);

// Analytics
export const getDashboard = () => api.get('/api/analytics/dashboard');
export const getTopProducts = () => api.get('/api/analytics/top-products');
export const getMovementTrend = (days) => api.get(`/api/analytics/movement-trend?days=${days}`);
export const getStockValueByCategory = () => api.get('/api/analytics/stock-value-by-category');
export const getForecast = () => api.get('/api/analytics/forecast');

// Exports
export const exportProductsExcel = () =>
  api.get('/api/exports/products/excel', { responseType: 'blob' });

export const exportProductsPDF = () =>
  api.get('/api/exports/products/pdf', { responseType: 'blob' });

export const exportMovementsExcel = () =>
  api.get('/api/exports/stock-movements/excel', { responseType: 'blob' });

export default api;

// User Management
export const getAllUsers = () => api.get('/api/auth/users');
export const deactivateUser = (id) => api.put(`/api/auth/users/${id}/deactivate`);
export const activateUser = (id) => api.put(`/api/auth/users/${id}/activate`);
export const registerUser = (data) => api.post('/api/auth/register', data);

export const getExpiringSoon = (days) => api.get(`/api/products/expiring-soon?days=${days}`);
export const getExpiredProducts = () => api.get('/api/products/expired');

export const getProfitAnalysis = () => api.get('/api/analytics/profit-analysis');
export const getProfitSummary = () => api.get('/api/analytics/profit-summary');

export const getActivityLogs = (params) => api.get('/api/activity/', { params });
export const getActivitySummary = () => api.get('/api/activity/summary');

export const getProductByBarcode = (sku) => api.get(`/api/products/barcode/${sku}`);

// Orders
export const getPublicProducts = () => api.get('/api/orders/public/products');
export const placePublicOrder = (data) => api.post('/api/orders/public/place', data);
export const placeStaffOrder = (data) => api.post('/api/orders/staff/place', data);
export const getOrders = (params) => api.get('/api/orders/', { params });
export const getOrdersSummary = () => api.get('/api/orders/summary');
export const updateOrderStatus = (id, status, paymentMethod) =>
  api.put(`/api/orders/${id}/status?status=${status}${paymentMethod ? `&payment_method=${paymentMethod}` : ''}`);
export const getOrderById = (id) => api.get(`/api/orders/${id}`);