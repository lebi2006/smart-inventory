import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import StockMovements from './pages/StockMovements';
import Users from './pages/Users';
import Suppliers from './pages/Suppliers';
import Categories from './pages/Categories';
import Analytics from './pages/Analytics';
import ActivityLog from './pages/ActivityLog';
import CustomerMenu from './pages/CustomerMenu';
import POS from './pages/POS';
import Orders from './pages/Orders';
import TableQR from './pages/TableQR';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex items-center justify-center h-screen">Loading...</div>;
  return user ? <Layout>{children}</Layout> : <Navigate to="/login" />;
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/products" element={<ProtectedRoute><Products /></ProtectedRoute>} />
          <Route path="/stock" element={<ProtectedRoute><StockMovements /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/" />} />
          <Route path="/users" element={<ProtectedRoute><Users /></ProtectedRoute>} />
          <Route path="/suppliers" element={<ProtectedRoute><Suppliers /></ProtectedRoute>} />
          <Route path="/categories" element={<ProtectedRoute><Categories /></ProtectedRoute>} />
          <Route path="/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
          <Route path="/activity" element={<ProtectedRoute><ActivityLog /></ProtectedRoute>} />
          // Inside Routes — CustomerMenu is PUBLIC (no ProtectedRoute)
          <Route path="/menu" element={<CustomerMenu />} />
          // These are protected
          <Route path="/pos" element={<ProtectedRoute><POS /></ProtectedRoute>} />
          <Route path="/orders" element={<ProtectedRoute><Orders /></ProtectedRoute>} />
          <Route path="/table-qr" element={<ProtectedRoute><TableQR /></ProtectedRoute>} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;