import { useState } from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Store,
  Package,
  ShoppingBag,
  BarChart3,
  Bell,
  Search,
  Menu,
  X,
  Settings,
  LogOut,
} from 'lucide-react';
import clsx from 'clsx';

import { Dashboard } from './pages/Dashboard';
import { Stores } from './pages/Stores';
import { StoreDetail } from './pages/StoreDetail';
import { Inventory } from './pages/Inventory';
import { Products } from './pages/Products';
import { Reports } from './pages/Reports';
import { StoreSelector } from './components/StoreSelector';
import { useStores } from './hooks/useMultiStore';

function AppContent() {
  const location = useLocation();
  const { stores } = useStores();
  const [selectedStoreId, setSelectedStoreId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const navItems = [
    { path: '/', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/stores', label: 'Stores', icon: Store },
    { path: '/inventory', label: 'Inventory', icon: Package },
    { path: '/products', label: 'Products', icon: ShoppingBag },
    { path: '/reports', label: 'Reports', icon: BarChart3 },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside
        className={clsx(
          'bg-gray-900 text-white transition-all duration-300 flex flex-col',
          sidebarOpen ? 'w-64' : 'w-20'
        )}
      >
        {/* Logo */}
        <div className="p-4 border-b border-gray-800 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center">
              <span className="text-xl font-bold">R</span>
            </div>
            {sidebarOpen && (
              <div>
                <h1 className="font-bold text-lg">ReZ Stores</h1>
                <p className="text-xs text-gray-400">Multi-Store Dashboard</p>
              </div>
            )}
          </Link>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path ||
              (item.path !== '/' && location.pathname.startsWith(item.path));

            return (
              <Link
                key={item.path}
                to={item.path}
                className={clsx(
                  'flex items-center gap-3 px-4 py-3 rounded-lg transition-colors',
                  isActive
                    ? 'bg-primary-600 text-white'
                    : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                )}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                {sidebarOpen && <span className="font-medium">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Bottom Section */}
        <div className="p-4 border-t border-gray-800 space-y-1">
          <Link
            to="/settings"
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-400 hover:bg-gray-800 hover:text-white transition-colors"
          >
            <Settings className="w-5 h-5 flex-shrink-0" />
            {sidebarOpen && <span className="font-medium">Settings</span>}
          </Link>
          <button
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-400 hover:bg-gray-800 hover:text-white transition-colors"
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            {sidebarOpen && <span className="font-medium">Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Left: Search */}
            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search stores, products..."
                  className={clsx(
                    'pl-10 pr-4 py-2 border border-gray-200 rounded-lg',
                    'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent',
                    'w-80'
                  )}
                />
              </div>
            </div>

            {/* Center: Store Selector */}
            <div className="flex items-center gap-4">
              <StoreSelector
                stores={stores}
                selectedStoreId={selectedStoreId}
                onSelectStore={setSelectedStoreId}
              />
            </div>

            {/* Right: Notifications */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Bell className="w-5 h-5 text-gray-500" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
              </button>

              {/* User Avatar */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                  <span className="font-semibold text-primary-700">JD</span>
                </div>
                <div className="hidden md:block">
                  <p className="font-medium text-gray-900">John Doe</p>
                  <p className="text-xs text-gray-500">Administrator</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6 overflow-auto">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/stores" element={<Stores />} />
            <Route path="/stores/:storeId" element={<StoreDetail />} />
            <Route path="/inventory" element={<Inventory />} />
            <Route path="/products" element={<Products />} />
            <Route path="/reports" element={<Reports />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}
