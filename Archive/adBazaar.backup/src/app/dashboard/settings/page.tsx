'use client'

import { useState } from 'react'
import {
  Settings,
  User,
  Bell,
  Shield,
  CreditCard,
  Globe,
  Key,
  Palette,
  Save,
  Check,
} from 'lucide-react'

const TABS = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'security', label: 'Security', icon: Shield },
  { id: 'billing', label: 'Billing', icon: CreditCard },
  { id: 'integrations', label: 'Integrations', icon: Globe },
]

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('profile')
  const [saved, setSaved] = useState(false)

  const handleSave = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Settings</h1>
        <p className="text-white/60">Manage your account settings and preferences</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-lg mb-8" style={{ backgroundColor: '#1a1a1a' }}>
        {TABS.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                isActive ? '' : 'hover:bg-white/5'
              }`}
              style={isActive ? { backgroundColor: '#f59e0b', color: '#000' } : { color: 'rgba(255,255,255,0.6)' }}
            >
              <Icon className="w-4 h-4" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          )
        })}
      </div>

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <div className="rounded-xl border border-white/10 p-6" style={{ backgroundColor: '#1a1a1a' }}>
          <h2 className="text-lg font-semibold mb-6">Profile Information</h2>
          <div className="space-y-5">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold" style={{ backgroundColor: '#f59e0b', color: '#000' }}>
                VN
              </div>
              <div>
                <button className="px-4 py-2 rounded-lg text-sm font-medium" style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}>
                  Change Avatar
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">First Name</label>
                <input
                  type="text"
                  defaultValue="Vendor"
                  className="w-full px-4 py-2.5 rounded-lg border border-white/10 bg-white/5 focus:border-amber-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Last Name</label>
                <input
                  type="text"
                  defaultValue="Name"
                  className="w-full px-4 py-2.5 rounded-lg border border-white/10 bg-white/5 focus:border-amber-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Email</label>
              <input
                type="email"
                defaultValue="vendor@example.com"
                className="w-full px-4 py-2.5 rounded-lg border border-white/10 bg-white/5 focus:border-amber-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Company Name</label>
              <input
                type="text"
                defaultValue="My Company Pvt Ltd"
                className="w-full px-4 py-2.5 rounded-lg border border-white/10 bg-white/5 focus:border-amber-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Phone Number</label>
              <input
                type="tel"
                defaultValue="+91 98765 43210"
                className="w-full px-4 py-2.5 rounded-lg border border-white/10 bg-white/5 focus:border-amber-500 focus:outline-none"
              />
            </div>

            <div className="pt-4">
              <button
                onClick={handleSave}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg font-semibold transition-opacity hover:opacity-90"
                style={{ backgroundColor: '#f59e0b', color: '#000' }}
              >
                {saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                {saved ? 'Saved!' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notifications Tab */}
      {activeTab === 'notifications' && (
        <div className="space-y-6">
          <div className="rounded-xl border border-white/10 p-6" style={{ backgroundColor: '#1a1a1a' }}>
            <h2 className="text-lg font-semibold mb-6">Email Notifications</h2>
            <div className="space-y-4">
              {[
                { label: 'Campaign updates', desc: 'Get notified about campaign performance changes', enabled: true },
                { label: 'Scan alerts', desc: 'Daily summary of QR code scan activity', enabled: true },
                { label: 'Fraud alerts', desc: 'Immediate notification for suspicious activity', enabled: true },
                { label: 'Weekly reports', desc: 'Receive weekly analytics reports', enabled: false },
                { label: 'Marketing emails', desc: 'Tips and best practices from AdBazaar', enabled: false },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between py-3" style={{ borderBottom: i < 4 ? '1px solid rgba(255,255,255,0.05)' : undefined }}>
                  <div>
                    <p className="font-medium">{item.label}</p>
                    <p className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>{item.desc}</p>
                  </div>
                  <button
                    className="w-12 h-6 rounded-full transition-colors relative"
                    style={{ backgroundColor: item.enabled ? '#22c55e' : 'rgba(255,255,255,0.2)' }}
                  >
                    <span
                      className="absolute top-1 w-4 h-4 rounded-full bg-white transition-transform"
                      style={{ left: item.enabled ? 'calc(100% - 20px)' : '4px' }}
                    />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-white/10 p-6" style={{ backgroundColor: '#1a1a1a' }}>
            <h2 className="text-lg font-semibold mb-6">Push Notifications</h2>
            <div className="space-y-4">
              {[
                { label: 'Mobile app notifications', desc: 'Receive push notifications on your mobile device', enabled: true },
                { label: 'Browser notifications', desc: 'Get real-time alerts in your browser', enabled: false },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between py-3" style={{ borderBottom: i < 1 ? '1px solid rgba(255,255,255,0.05)' : undefined }}>
                  <div>
                    <p className="font-medium">{item.label}</p>
                    <p className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>{item.desc}</p>
                  </div>
                  <button
                    className="w-12 h-6 rounded-full transition-colors relative"
                    style={{ backgroundColor: item.enabled ? '#22c55e' : 'rgba(255,255,255,0.2)' }}
                  >
                    <span
                      className="absolute top-1 w-4 h-4 rounded-full bg-white transition-transform"
                      style={{ left: item.enabled ? 'calc(100% - 20px)' : '4px' }}
                    />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Security Tab */}
      {activeTab === 'security' && (
        <div className="space-y-6">
          <div className="rounded-xl border border-white/10 p-6" style={{ backgroundColor: '#1a1a1a' }}>
            <h2 className="text-lg font-semibold mb-6">Password</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Current Password</label>
                <input
                  type="password"
                  placeholder="Enter current password"
                  className="w-full px-4 py-2.5 rounded-lg border border-white/10 bg-white/5 focus:border-amber-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">New Password</label>
                <input
                  type="password"
                  placeholder="Enter new password"
                  className="w-full px-4 py-2.5 rounded-lg border border-white/10 bg-white/5 focus:border-amber-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Confirm New Password</label>
                <input
                  type="password"
                  placeholder="Confirm new password"
                  className="w-full px-4 py-2.5 rounded-lg border border-white/10 bg-white/5 focus:border-amber-500 focus:outline-none"
                />
              </div>
              <button
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg font-semibold transition-opacity hover:opacity-90"
                style={{ backgroundColor: '#f59e0b', color: '#000' }}
              >
                <Key className="w-4 h-4" />
                Update Password
              </button>
            </div>
          </div>

          <div className="rounded-xl border border-white/10 p-6" style={{ backgroundColor: '#1a1a1a' }}>
            <h2 className="text-lg font-semibold mb-6">Two-Factor Authentication</h2>
            <p className="text-sm mb-4" style={{ color: 'rgba(255,255,255,0.5)' }}>
              Add an extra layer of security to your account by enabling two-factor authentication.
            </p>
            <button
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium border border-white/10 hover:bg-white/5 transition-colors"
            >
              <Shield className="w-4 h-4" />
              Enable 2FA
            </button>
          </div>

          <div className="rounded-xl border border-white/10 p-6" style={{ backgroundColor: '#1a1a1a' }}>
            <h2 className="text-lg font-semibold mb-6">Active Sessions</h2>
            <div className="space-y-3">
              {[
                { device: 'Chrome on MacOS', location: 'Bangalore, India', current: true },
                { device: 'Safari on iPhone', location: 'Bangalore, India', current: false },
                { device: 'Firefox on Windows', location: 'Mumbai, India', current: false },
              ].map((session, i) => (
                <div key={i} className="flex items-center justify-between py-3" style={{ borderBottom: i < 2 ? '1px solid rgba(255,255,255,0.05)' : undefined }}>
                  <div>
                    <p className="font-medium flex items-center gap-2">
                      {session.device}
                      {session.current && (
                        <span className="text-xs px-2 py-0.5 rounded" style={{ backgroundColor: 'rgba(34, 197, 94, 0.15)', color: '#22c55e' }}>
                          Current
                        </span>
                      )}
                    </p>
                    <p className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>{session.location}</p>
                  </div>
                  {!session.current && (
                    <button className="text-sm hover:underline" style={{ color: '#ef4444' }}>
                      Revoke
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Billing Tab */}
      {activeTab === 'billing' && (
        <div className="space-y-6">
          <div className="rounded-xl border border-white/10 p-6" style={{ backgroundColor: '#1a1a1a' }}>
            <h2 className="text-lg font-semibold mb-4">Current Plan</h2>
            <div className="flex items-center justify-between p-4 rounded-lg" style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
              <div>
                <p className="text-xl font-bold" style={{ color: '#f59e0b' }}>Professional</p>
                <p className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>₹4,999/month</p>
              </div>
              <button className="px-4 py-2 rounded-lg text-sm font-medium" style={{ backgroundColor: '#f59e0b', color: '#000' }}>
                Upgrade Plan
              </button>
            </div>
            <p className="text-sm mt-4" style={{ color: 'rgba(255,255,255,0.5)' }}>
              Your plan renews on September 1, 2024
            </p>
          </div>

          <div className="rounded-xl border border-white/10 p-6" style={{ backgroundColor: '#1a1a1a' }}>
            <h2 className="text-lg font-semibold mb-6">Payment Method</h2>
            <div className="flex items-center gap-4 p-4 rounded-lg" style={{ backgroundColor: 'rgba(255,255,255,0.03)' }}>
              <div className="w-12 h-8 rounded flex items-center justify-center text-xs font-bold" style={{ backgroundColor: '#1a73e8', color: '#fff' }}>
                VISA
              </div>
              <div className="flex-1">
                <p className="font-medium">Visa ending in 4242</p>
                <p className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>Expires 12/2025</p>
              </div>
              <button className="text-sm hover:underline" style={{ color: '#f59e0b' }}>
                Change
              </button>
            </div>
          </div>

          <div className="rounded-xl border border-white/10 p-6" style={{ backgroundColor: '#1a1a1a' }}>
            <h2 className="text-lg font-semibold mb-6">Billing History</h2>
            <div className="space-y-3">
              {[
                { date: 'Aug 1, 2024', amount: '₹4,999', status: 'Paid' },
                { date: 'Jul 1, 2024', amount: '₹4,999', status: 'Paid' },
                { date: 'Jun 1, 2024', amount: '₹4,999', status: 'Paid' },
              ].map((invoice, i) => (
                <div key={i} className="flex items-center justify-between py-3" style={{ borderBottom: i < 2 ? '1px solid rgba(255,255,255,0.05)' : undefined }}>
                  <div>
                    <p className="font-medium">{invoice.date}</p>
                    <p className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>Professional Plan</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="font-medium">{invoice.amount}</span>
                    <button className="text-sm hover:underline" style={{ color: '#f59e0b' }}>
                      Download
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Integrations Tab */}
      {activeTab === 'integrations' && (
        <div className="rounded-xl border border-white/10 p-6" style={{ backgroundColor: '#1a1a1a' }}>
          <h2 className="text-lg font-semibold mb-6">Connected Apps</h2>
          <div className="space-y-4">
            {[
              { name: 'Google Analytics', desc: 'Track campaign performance in GA', connected: true },
              { name: 'Facebook Pixel', desc: 'Track conversions from Facebook ads', connected: true },
              { name: 'Shopify', desc: 'Sync products and track sales', connected: false },
              { name: 'Mailchimp', desc: 'Email marketing integration', connected: false },
              { name: 'Slack', desc: 'Get alerts in Slack channels', connected: false },
            ].map((app, i) => (
              <div key={i} className="flex items-center justify-between py-4" style={{ borderBottom: i < 4 ? '1px solid rgba(255,255,255,0.05)' : undefined }}>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center text-lg" style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}>
                    {app.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-medium">{app.name}</p>
                    <p className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>{app.desc}</p>
                  </div>
                </div>
                <button
                  className="px-4 py-2 rounded-lg text-sm font-medium"
                  style={app.connected ? { backgroundColor: 'rgba(239, 68, 68, 0.15)', color: '#ef4444' } : { backgroundColor: '#f59e0b', color: '#000' }}
                >
                  {app.connected ? 'Disconnect' : 'Connect'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
