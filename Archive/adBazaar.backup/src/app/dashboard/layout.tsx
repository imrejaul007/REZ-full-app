'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Megaphone,
  QrCode,
  BarChart3,
  ShieldAlert,
  Coins,
  Package,
  Settings,
  Menu,
  X,
  LogOut,
  User,
} from 'lucide-react'
import { useState } from 'react'

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/dashboard/campaigns', label: 'Campaigns', icon: Megaphone },
  { href: '/dashboard/qr', label: 'QR Codes', icon: QrCode },
  { href: '/dashboard/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/dashboard/fraud', label: 'Fraud', icon: ShieldAlert },
  { href: '/dashboard/brand-coins', label: 'Brand Coins', icon: Coins },
  { href: '/dashboard/samples', label: 'Samples', icon: Package },
  { href: '/dashboard/settings', label: 'Settings', icon: Settings },
]

interface NavItem {
  href: string
  label: string
  icon: React.ComponentType<{ className?: string; size?: number; style?: React.CSSProperties }>
  exact?: boolean
}

function NavLink({ item, isActive, onClick }: { item: NavItem; isActive: boolean; onClick?: () => void }) {
  const Icon = item.icon
  return (
    <Link
      href={item.href}
      onClick={onClick}
      className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
        isActive
          ? 'font-semibold'
          : 'text-white/60 hover:text-white hover:bg-white/5'
      }`}
      style={isActive ? { backgroundColor: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b' } : undefined}
    >
      <Icon className="w-5 h-5" />
      <span className="text-sm">{item.label}</span>
    </Link>
  )
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const isActive = (href: string, exact?: boolean) => {
    if (exact) return pathname === href
    return pathname.startsWith(href)
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#0a0a0a' }}>
      {/* Mobile header */}
      <div className="lg:hidden flex items-center justify-between px-4 py-3" style={{ backgroundColor: '#1a1a1a' }}>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 rounded-lg hover:bg-white/10"
        >
          {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
        <span className="font-bold">AdBazaar</span>
        <div className="w-10" />
      </div>

      <div className="flex">
        {/* Sidebar */}
        <aside
          className={`fixed inset-y-0 left-0 z-50 w-64 transform transition-transform lg:static lg:translate-x-0 ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
          style={{ backgroundColor: '#1a1a1a' }}
        >
          <div className="flex flex-col h-full">
            {/* Logo */}
            <div className="px-6 py-5 border-b border-white/10">
              <Link href="/dashboard" className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg font-bold" style={{ backgroundColor: '#f59e0b', color: '#000' }}>
                  AD
                </div>
                <span className="font-bold text-lg">AdBazaar</span>
              </Link>
            </div>

            {/* Nav */}
            <nav className="flex-1 px-4 py-6 space-y-1">
              {NAV_ITEMS.map((item) => (
                <NavLink
                  key={item.href}
                  item={item}
                  isActive={isActive(item.href, item.exact)}
                  onClick={() => setSidebarOpen(false)}
                />
              ))}
            </nav>

            {/* Footer */}
            <div className="px-4 py-4 border-t border-white/10">
              <Link
                href="/api/auth/logout"
                className="flex items-center gap-3 px-4 py-3 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors"
              >
                <LogOut className="w-5 h-5" />
                <span className="text-sm">Log out</span>
              </Link>
            </div>
          </div>
        </aside>

        {/* Overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main */}
        <main className="flex-1 min-h-screen">
          {children}
        </main>
      </div>
    </div>
  )
}
