import { useState, useEffect, useRef } from 'react';
import { NavLink, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getProducts, getLowStockProducts, getOrdersSummary } from '../services/api';
import { Search, Bell, Sun, Moon, ChevronDown, LogOut, Menu, Package2, AlertTriangle, ShoppingBag } from 'lucide-react';

const navItems = [
  {
    path: '/',
    label: 'Dashboard',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    path: '/products',
    label: 'Products',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
      </svg>
    ),
  },
  {
    path: '/stock',
    label: 'Stock Movements',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
      </svg>
    ),
  },
  {
    path: '/users',
    label: 'Users',
    roles: ['ADMIN'],
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    ),
  },
  {
    path: '/suppliers',
    label: 'Suppliers',
    roles: ['ADMIN', 'MANAGER'],
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
      </svg>
    ),
  },
  {
    path: '/categories',
    label: 'Categories',
    roles: ['ADMIN', 'MANAGER'],
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
      </svg>
    ),
  },
  {
    path: '/analytics',
    label: 'Analytics',
    roles: ['ADMIN', 'MANAGER'],
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
  },
  {
    path: '/activity',
    label: 'Activity Log',
    roles: ['ADMIN', 'MANAGER'],
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
    ),
  },
  {
    path: '/pos',
    label: 'POS Billing',
    roles: ['ADMIN', 'MANAGER', 'STAFF'],
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 11h.01M12 11h.01M15 11h.01M4 19h16a2 2 0 002-2V7a2 2 0 00-2-2H4a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    path: '/orders',
    label: 'Orders',
    roles: ['ADMIN', 'MANAGER', 'STAFF'],
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
      </svg>
    ),
  },
  {
    path: '/table-qr',
    label: 'Table QR Codes',
    roles: ['ADMIN', 'MANAGER'],
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.24M16.24 12l1.76-1.76M12 12l-1.76 1.76M12 12V8" />
      </svg>
    ),
  },
];

function useDarkMode() {
  const [dark, setDark] = useState(() => localStorage.getItem('theme') === 'dark');

  useEffect(() => {
    const root = document.documentElement;
    if (dark) root.classList.add('dark');
    else root.classList.remove('dark');
    localStorage.setItem('theme', dark ? 'dark' : 'light');
  }, [dark]);

  return [dark, setDark];
}

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [dark, setDark] = useDarkMode();

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);

  const [notifOpen, setNotifOpen] = useState(false);
  const [lowStockAlerts, setLowStockAlerts] = useState([]);
  const [pendingOrders, setPendingOrders] = useState(0);

  const [profileOpen, setProfileOpen] = useState(false);

  const searchRef = useRef(null);
  const notifRef = useRef(null);
  const profileRef = useRef(null);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const currentLabel = navItems.find((item) =>
    item.path === '/' ? location.pathname === '/' : location.pathname.startsWith(item.path)
  )?.label || 'Dashboard';

  const today = new Date().toLocaleDateString('en-US', { day: '2-digit', month: 'long', year: 'numeric' });

  // Close any open dropdown when clicking outside of it
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) setShowSearchResults(false);
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Notification bell — real low-stock and pending-order alerts
  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const [lowStockRes, ordersSummaryRes] = await Promise.all([getLowStockProducts(), getOrdersSummary()]);
        setLowStockAlerts(lowStockRes.data);
        setPendingOrders(ordersSummaryRes.data.pending_orders ?? 0);
      } catch {
        // STAFF accounts may not have access to orders summary — bell just stays empty
      }
    };
    fetchAlerts();
  }, []);

  // Debounced live product search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    const timeout = setTimeout(async () => {
      try {
        const res = await getProducts({ search: searchQuery, limit: 6 });
        setSearchResults(res.data);
      } catch {
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => clearTimeout(timeout);
  }, [searchQuery]);

  const goToSearchResults = (query) => {
    navigate(`/products?search=${encodeURIComponent(query)}`);
    setShowSearchResults(false);
  };

  const hasAlerts = lowStockAlerts.length > 0 || pendingOrders > 0;

  return (
    <div className="h-screen flex flex-col bg-[#f6f5fb] dark:bg-[#0f0b2e] transition-colors">

      {/* Full-width top bar */}
      <header className="flex items-center gap-4 px-5 py-3 bg-white dark:bg-[#171335] border-b border-gray-100 dark:border-white/5 shrink-0">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 lg:hidden"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 shrink-0">
          <div className="w-8 h-8 bg-brand-600 rounded-xl flex items-center justify-center">
            <Package2 className="w-[18px] h-[18px] text-white" strokeWidth={2.2} />
          </div>
          <span className="font-extrabold text-gray-900 dark:text-white hidden sm:block">Smart Inventory</span>
        </div>

        <div ref={searchRef} className="relative flex-1 max-w-md hidden md:block ml-4">
          <div className="flex items-center gap-2 bg-gray-50 dark:bg-white/5 rounded-xl px-3 py-2">
            <Search className="w-4 h-4 text-gray-400 shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setShowSearchResults(true); }}
              onFocus={() => searchQuery && setShowSearchResults(true)}
              onKeyDown={(e) => { if (e.key === 'Enter' && searchQuery.trim()) goToSearchResults(searchQuery); }}
              placeholder="Search products..."
              className="bg-transparent border-none outline-none text-sm w-full text-gray-700 dark:text-gray-200 placeholder:text-gray-400"
            />
          </div>
          {showSearchResults && searchQuery.trim() && (
            <div className="absolute top-full mt-2 left-0 right-0 bg-white dark:bg-[#171335] rounded-xl border border-gray-100 dark:border-white/10 shadow-lg overflow-hidden z-50">
              {searching ? (
                <p className="text-sm text-gray-400 px-4 py-3">Searching...</p>
              ) : searchResults.length === 0 ? (
                <p className="text-sm text-gray-400 px-4 py-3">No products found</p>
              ) : (
                <>
                  {searchResults.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => goToSearchResults(p.sku)}
                      className="w-full flex items-center justify-between gap-3 px-4 py-2.5 text-left hover:bg-gray-50 dark:hover:bg-white/5"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-800 dark:text-gray-100 truncate">{p.name}</p>
                        <p className="text-xs text-gray-400 font-mono">{p.sku}</p>
                      </div>
                      <span className="text-xs text-gray-400 shrink-0">{p.current_stock} in stock</span>
                    </button>
                  ))}
                  <button
                    onClick={() => goToSearchResults(searchQuery)}
                    className="w-full text-center text-xs font-semibold text-brand-600 hover:bg-gray-50 dark:hover:bg-white/5 px-4 py-2.5 border-t border-gray-50 dark:border-white/5"
                  >
                    View all results
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        <div className="ml-auto flex items-center gap-2 sm:gap-3">
          <div className="hidden sm:flex items-center gap-1.5 text-xs font-medium text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-white/5 rounded-lg px-3 py-2">
            {today}
          </div>
          <div ref={notifRef} className="relative">
            <button
              onClick={() => setNotifOpen(!notifOpen)}
              className="relative p-2 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5"
            >
              <Bell className="w-[18px] h-[18px]" />
              {hasAlerts && <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-rose-500 rounded-full"></span>}
            </button>
            {notifOpen && (
              <div className="absolute top-full mt-2 right-0 w-72 bg-white dark:bg-[#171335] rounded-xl border border-gray-100 dark:border-white/10 shadow-lg overflow-hidden z-50">
                <div className="px-4 py-3 border-b border-gray-50 dark:border-white/5">
                  <p className="text-sm font-bold text-gray-800 dark:text-white">Notifications</p>
                </div>
                {!hasAlerts ? (
                  <p className="text-sm text-gray-400 px-4 py-4">You're all caught up</p>
                ) : (
                  <div className="max-h-72 overflow-y-auto">
                    {pendingOrders > 0 && (
                      <Link
                        to="/orders"
                        onClick={() => setNotifOpen(false)}
                        className="flex items-start gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-white/5 border-b border-gray-50 dark:border-white/5"
                      >
                        <ShoppingBag className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
                        <div>
                          <p className="text-sm text-gray-700 dark:text-gray-200">{pendingOrders} order{pendingOrders === 1 ? '' : 's'} pending</p>
                          <p className="text-xs text-gray-400">Needs attention</p>
                        </div>
                      </Link>
                    )}
                    {lowStockAlerts.slice(0, 5).map((p) => (
                      <Link
                        key={p.id}
                        to="/products"
                        onClick={() => setNotifOpen(false)}
                        className="flex items-start gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-white/5 border-b border-gray-50 dark:border-white/5 last:border-0"
                      >
                        <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                        <div>
                          <p className="text-sm text-gray-700 dark:text-gray-200">{p.name} is low on stock</p>
                          <p className="text-xs text-gray-400">{p.current_stock} left · reorder at {p.reorder_level}</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
          <button
            onClick={() => setDark(!dark)}
            className="p-2 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5"
            title="Toggle theme"
          >
            {dark ? <Sun className="w-[18px] h-[18px]" /> : <Moon className="w-[18px] h-[18px]" />}
          </button>
          <div ref={profileRef} className="relative">
            <button
              onClick={() => setProfileOpen(!profileOpen)}
              className="flex items-center gap-2 pl-2 border-l border-gray-100 dark:border-white/10"
            >
              <div className="w-8 h-8 rounded-full bg-brand-100 dark:bg-brand-500/20 flex items-center justify-center text-brand-700 dark:text-brand-300 text-sm font-bold">
                {user?.name?.charAt(0).toUpperCase()}
              </div>
              <div className="hidden lg:block text-left">
                <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 leading-tight">{user?.name}</p>
                <p className="text-xs text-gray-400 leading-tight">{user?.role}</p>
              </div>
              <ChevronDown className={`w-4 h-4 text-gray-400 hidden lg:block transition-transform ${profileOpen ? 'rotate-180' : ''}`} />
            </button>
            {profileOpen && (
              <div className="absolute top-full mt-2 right-0 w-56 bg-white dark:bg-[#171335] rounded-xl border border-gray-100 dark:border-white/10 shadow-lg overflow-hidden z-50">
                <div className="px-4 py-3 border-b border-gray-50 dark:border-white/5">
                  <p className="text-sm font-semibold text-gray-800 dark:text-white truncate">{user?.name}</p>
                  <p className="text-xs text-gray-400 truncate">{user?.email}</p>
                  <span className="inline-block mt-1.5 text-[11px] font-medium text-brand-700 bg-brand-100 dark:bg-brand-500/15 dark:text-brand-300 rounded-full px-2 py-0.5">
                    {user?.role}
                  </span>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition"
                >
                  <LogOut className="w-4 h-4" /> Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="flex flex-1 min-h-0">
        {/* Sidebar */}
        <aside className={`${sidebarOpen ? 'w-64' : 'w-0 lg:w-20'} overflow-hidden shrink-0 bg-white dark:bg-[#171335] border-r border-gray-100 dark:border-white/5 flex flex-col transition-all duration-300`}>
          {sidebarOpen && (
            <div className="px-5 pt-5 pb-3">
              <h2 className="text-lg font-extrabold text-gray-900 dark:text-white leading-tight">
                Welcome Back,<br />{user?.name?.split(' ')[0]}
              </h2>
              <p className="text-xs text-gray-400 mt-1">Last login · {today}</p>
            </div>
          )}

          <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
            {navItems
              .filter((item) => !item.roles || item.roles.includes(user?.role))
              .map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === '/'}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-xl transition text-sm font-medium ${
                      isActive
                        ? 'bg-brand-600 text-white shadow-soft'
                        : 'text-gray-500 dark:text-gray-400 hover:bg-brand-50 dark:hover:bg-white/5 hover:text-brand-700 dark:hover:text-white'
                    } ${sidebarOpen ? '' : 'justify-center'}`
                  }
                >
                  {item.icon}
                  {sidebarOpen && <span>{item.label}</span>}
                </NavLink>
              ))}
          </nav>

          <div className="p-3 border-t border-gray-100 dark:border-white/5">
            <button
              onClick={handleLogout}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-500 dark:text-gray-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-500/10 dark:hover:text-rose-400 transition w-full text-sm font-medium ${sidebarOpen ? '' : 'justify-center'}`}
            >
              <LogOut className="w-5 h-5 shrink-0" />
              {sidebarOpen && <span>Logout</span>}
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-auto">
          <div className="px-4 sm:px-6 py-5">
            <div className="flex items-center justify-between mb-5">
              <h1 className="text-xl font-extrabold text-gray-900 dark:text-white">{currentLabel}</h1>
            </div>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
