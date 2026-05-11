import { useState, useEffect } from 'react'
import { Routes, Route, NavLink, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  DollarSign,
  Users,
  UtensilsCrossed,
  Settings,
  Bell,
  Search,
  Menu,
  X,
  Wifi,
  WifiOff,
  ChevronDown,
  Calendar,
} from 'lucide-react'
import clsx from 'clsx'
import { format } from 'date-fns'

import Dashboard from './pages/Dashboard'
import Revenue from './pages/Revenue'
import Customers from './pages/Customers'
import Dishes from './pages/Dishes'
import Operations from './pages/Operations'

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Revenue', href: '/revenue', icon: DollarSign },
  { name: 'Customers', href: '/customers', icon: Users },
  { name: 'Dishes', href: '/dishes', icon: UtensilsCrossed },
  { name: 'Operations', href: '/operations', icon: Settings },
]

const dateRanges = [
  { label: 'Today', days: 0 },
  { label: 'Last 7 Days', days: 7 },
  { label: 'Last 30 Days', days: 30 },
  { label: 'This Month', days: -1 },
  { label: 'Custom Range', days: -2 },
]

function App() {
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches
    }
    return false
  })
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [selectedRange, setSelectedRange] = useState(dateRanges[1])
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [lastUpdated, setLastUpdated] = useState(new Date())

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = (e: MediaQueryListEvent) => setDarkMode(e.matches)
    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  useEffect(() => {
    const interval = setInterval(() => {
      setLastUpdated(new Date())
    }, 30000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [darkMode])

  const currentPage = navigation.find((item) =>
    item.href === '/' ? location.pathname === '/' : location.pathname.startsWith(item.href)
  )?.name || 'Dashboard'

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={clsx(
          'fixed top-0 left-0 z-50 h-full w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transform transition-transform duration-300 lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-200 dark:border-gray-700">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center">
              <span className="text-white font-bold text-lg">R</span>
            </div>
            <div>
              <h1 className="font-semibold text-gray-900 dark:text-white">ReZ Analytics</h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">Dashboard v2</p>
            </div>
            <button
              className="ml-auto lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto scrollbar-thin">
            {navigation.map((item) => (
              <NavLink
                key={item.name}
                to={item.href}
                end={item.href === '/'}
                className={({ isActive }) =>
                  clsx(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
                  )
                }
                onClick={() => setSidebarOpen(false)}
              >
                <item.icon className="w-5 h-5" />
                {item.name}
              </NavLink>
            ))}
          </nav>

          {/* Real-time status */}
          <div className="px-4 py-4 border-t border-gray-200 dark:border-gray-700">
            <div
              className={clsx(
                'flex items-center gap-2 px-3 py-2 rounded-lg text-sm',
                isOnline
                  ? 'bg-success-50 dark:bg-success-900/30 text-success-600 dark:text-success-400'
                  : 'bg-danger-50 dark:bg-danger-900/30 text-danger-600 dark:text-danger-400'
              )}
            >
              {isOnline ? (
                <Wifi className="w-4 h-4 animate-pulse" />
              ) : (
                <WifiOff className="w-4 h-4" />
              )}
              <span>{isOnline ? 'Real-time connected' : 'Offline mode'}</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Header */}
        <header className="sticky top-0 z-30 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-4">
              <button
                className="p-2 rounded-lg lg:hidden hover:bg-gray-100 dark:hover:bg-gray-700"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="w-5 h-5" />
              </button>
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {currentPage}
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Last updated: {format(lastUpdated, 'HH:mm:ss')}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Date range selector */}
              <div className="relative">
                <button
                  onClick={() => setShowDatePicker(!showDatePicker)}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  <Calendar className="w-4 h-4" />
                  <span className="hidden sm:inline">{selectedRange.label}</span>
                  <ChevronDown className="w-4 h-4" />
                </button>
                {showDatePicker && (
                  <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50 animate-fade-in">
                    {dateRanges.map((range) => (
                      <button
                        key={range.label}
                        onClick={() => {
                          setSelectedRange(range)
                          setShowDatePicker(false)
                        }}
                        className={clsx(
                          'w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700',
                          selectedRange.label === range.label
                            ? 'text-primary-600 dark:text-primary-400 font-medium'
                            : 'text-gray-700 dark:text-gray-300'
                        )}
                      >
                        {range.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Search */}
              <div className="hidden md:flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                <Search className="w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search..."
                  className="bg-transparent border-none outline-none text-sm w-48 placeholder-gray-400"
                />
              </div>

              {/* Dark mode toggle */}
              <button
                onClick={() => setDarkMode(!darkMode)}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                {darkMode ? (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                )}
              </button>

              {/* Notifications */}
              <button className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                <Bell className="w-5 h-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-danger-500 rounded-full" />
              </button>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 lg:p-6">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/revenue" element={<Revenue />} />
            <Route path="/customers" element={<Customers />} />
            <Route path="/dishes" element={<Dishes />} />
            <Route path="/operations" element={<Operations />} />
          </Routes>
        </main>
      </div>

      {/* Click outside to close date picker */}
      {showDatePicker && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowDatePicker(false)}
        />
      )}
    </div>
  )
}

export default App
