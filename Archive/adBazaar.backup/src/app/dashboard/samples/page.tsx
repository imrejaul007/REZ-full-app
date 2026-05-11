'use client'

import { useState } from 'react'
import {
  Package,
  Plus,
  Search,
  Filter,
  Clock,
  CheckCircle,
  Truck,
  QrCode,
  Edit,
  Trash2,
  MoreHorizontal,
  MapPin,
  User,
  Calendar,
  ChevronRight,
  X,
  Copy,
} from 'lucide-react'

interface Sample {
  id: string
  name: string
  description: string
  category: string
  quantity: number
  available: number
  claimed: number
  image: string
  expiryDate: string
  status: 'active' | 'paused' | 'out_of_stock'
}

interface SampleRequest {
  id: string
  sampleId: string
  sampleName: string
  userName: string
  userEmail: string
  userPhone: string
  pickupLocation: string
  requestedAt: string
  status: 'pending' | 'approved' | 'ready' | 'claimed' | 'expired'
  qrCode: string
}

const SAMPLES: Sample[] = [
  {
    id: 'samp_001',
    name: 'Premium Face Serum Trial',
    description: 'Free 7-day trial of our bestselling vitamin C serum',
    category: 'Beauty',
    quantity: 500,
    available: 234,
    claimed: 266,
    image: '🧴',
    expiryDate: '2024-12-31',
    status: 'active',
  },
  {
    id: 'samp_002',
    name: 'Organic Coffee Beans',
    description: 'Sample pack of single-origin arabica beans',
    category: 'Food',
    quantity: 200,
    available: 89,
    claimed: 111,
    image: '☕',
    expiryDate: '2024-10-15',
    status: 'active',
  },
  {
    id: 'samp_003',
    name: 'Wireless Earbuds',
    description: 'Premium wireless earbuds with active noise cancellation',
    category: 'Electronics',
    quantity: 100,
    available: 0,
    claimed: 100,
    image: '🎧',
    expiryDate: '2024-08-30',
    status: 'out_of_stock',
  },
  {
    id: 'samp_004',
    name: 'Protein Bar Pack',
    description: 'Assorted pack of 5 protein bars, chocolate & peanut butter',
    category: 'Health',
    quantity: 300,
    available: 156,
    claimed: 144,
    image: '🍫',
    expiryDate: '2024-11-20',
    status: 'active',
  },
]

const REQUESTS: SampleRequest[] = [
  { id: 'req_001', sampleId: 'samp_001', sampleName: 'Premium Face Serum Trial', userName: 'Priya Sharma', userEmail: 'priya@example.com', userPhone: '+91 98765 43210', pickupLocation: 'Phoenix Mall, Bangalore', requestedAt: '2024-08-15 14:30', status: 'ready', qrCode: 'QR_Priya_001' },
  { id: 'req_002', sampleId: 'samp_002', sampleName: 'Organic Coffee Beans', userName: 'Rahul Kumar', userEmail: 'rahul@example.com', userPhone: '+91 87654 32109', pickupLocation: ' Orion Mall, Bangalore', requestedAt: '2024-08-15 12:15', status: 'approved', qrCode: 'QR_Rahul_002' },
  { id: 'req_003', sampleId: 'samp_004', sampleName: 'Protein Bar Pack', userName: 'Amit Patel', userEmail: 'amit@example.com', userPhone: '+91 76543 21098', pickupLocation: 'Forum Mall, Bangalore', requestedAt: '2024-08-15 10:45', status: 'pending', qrCode: 'QR_Amit_003' },
  { id: 'req_004', sampleId: 'samp_001', sampleName: 'Premium Face Serum Trial', userName: 'Sneha Reddy', userEmail: 'sneha@example.com', userPhone: '+91 65432 10987', pickupLocation: 'UB City, Bangalore', requestedAt: '2024-08-14 16:20', status: 'claimed', qrCode: 'QR_Sneha_004' },
]

const STATUS_CONFIG = {
  active: { color: '#22c55e', bg: 'rgba(34, 197, 94, 0.15)', icon: CheckCircle },
  paused: { color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)', icon: Clock },
  out_of_stock: { color: '#ef4444', bg: 'rgba(239, 68, 68, 0.15)', icon: Package },
}

const REQUEST_STATUS_CONFIG = {
  pending: { color: '#eab308', bg: 'rgba(234, 179, 8, 0.15)', label: 'Pending' },
  approved: { color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.15)', label: 'Approved' },
  ready: { color: '#22c55e', bg: 'rgba(34, 197, 94, 0.15)', label: 'Ready for Pickup' },
  claimed: { color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.15)', label: 'Claimed' },
  expired: { color: 'rgba(255,255,255,0.4)', bg: 'rgba(255, 255, 255, 0.1)', label: 'Expired' },
}

const TAB_LIST = [
  { id: 'overview', label: 'Overview', icon: Package },
  { id: 'catalog', label: 'Sample Catalog', icon: Package },
  { id: 'requests', label: 'Requests', icon: Truck },
]

export default function SamplesPage() {
  const [activeTab, setActiveTab] = useState('overview')
  const [search, setSearch] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [newSample, setNewSample] = useState({
    name: '',
    description: '',
    category: '',
    quantity: '',
  })

  const totalSamples = SAMPLES.length
  const availableSamples = SAMPLES.reduce((sum, s) => sum + s.available, 0)
  const claimedSamples = SAMPLES.reduce((sum, s) => sum + s.claimed, 0)
  const pendingRequests = REQUESTS.filter((r) => r.status === 'pending').length

  const filteredSamples = SAMPLES.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase())
  )

  const filteredRequests = REQUESTS.filter((r) =>
    r.userName.toLowerCase().includes(search.toLowerCase()) ||
    r.sampleName.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Free Samples</h1>
          <p className="text-white/60">Manage your sample products and distribution</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg font-semibold transition-opacity hover:opacity-90"
          style={{ backgroundColor: '#f59e0b', color: '#000' }}
        >
          <Plus className="w-4 h-4" />
          Add Sample
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-lg mb-6" style={{ backgroundColor: '#1a1a1a' }}>
        {TAB_LIST.map((tab) => {
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
              {tab.label}
              {tab.id === 'requests' && pendingRequests > 0 && (
                <span
                  className="ml-1 px-1.5 py-0.5 rounded-full text-xs"
                  style={{ backgroundColor: 'rgba(0,0,0,0.2)' }}
                >
                  {pendingRequests}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <>
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="p-5 rounded-xl border border-white/10" style={{ backgroundColor: '#1a1a1a' }}>
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2.5 rounded-lg" style={{ backgroundColor: 'rgba(139, 92, 246, 0.15)' }}>
                  <Package className="w-5 h-5" style={{ color: '#8b5cf6' }} />
                </div>
                <span className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>Total Samples</span>
              </div>
              <p className="text-3xl font-bold">{totalSamples}</p>
              <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>{SAMPLES.filter(s => s.status === 'out_of_stock').length} out of stock</p>
            </div>

            <div className="p-5 rounded-xl border border-white/10" style={{ backgroundColor: '#1a1a1a' }}>
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2.5 rounded-lg" style={{ backgroundColor: 'rgba(34, 197, 94, 0.15)' }}>
                  <CheckCircle className="w-5 h-5" style={{ color: '#22c55e' }} />
                </div>
                <span className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>Available</span>
              </div>
              <p className="text-3xl font-bold">{availableSamples}</p>
              <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>units in stock</p>
            </div>

            <div className="p-5 rounded-xl border border-white/10" style={{ backgroundColor: '#1a1a1a' }}>
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2.5 rounded-lg" style={{ backgroundColor: 'rgba(245, 158, 11, 0.15)' }}>
                  <Truck className="w-5 h-5" style={{ color: '#f59e0b' }} />
                </div>
                <span className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>Claimed</span>
              </div>
              <p className="text-3xl font-bold">{claimedSamples}</p>
              <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>total distributed</p>
            </div>

            <div className="p-5 rounded-xl border border-white/10" style={{ backgroundColor: '#1a1a1a' }}>
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2.5 rounded-lg" style={{ backgroundColor: 'rgba(239, 68, 68, 0.15)' }}>
                  <Clock className="w-5 h-5" style={{ color: '#ef4444' }} />
                </div>
                <span className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>Pending Requests</span>
              </div>
              <p className="text-3xl font-bold">{pendingRequests}</p>
              <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>awaiting approval</p>
            </div>
          </div>

          {/* Recent Requests */}
          <div className="rounded-xl border border-white/10 overflow-hidden" style={{ backgroundColor: '#1a1a1a' }}>
            <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <h3 className="font-semibold">Recent Requests</h3>
              <button className="text-sm hover:underline" style={{ color: '#f59e0b' }}>View All</button>
            </div>
            <div className="divide-y divide-white/5">
              {REQUESTS.slice(0, 4).map((req) => {
                const statusConfig = REQUEST_STATUS_CONFIG[req.status]
                return (
                  <div key={req.id} className="px-4 py-3 hover:bg-white/5 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium">{req.userName}</p>
                          <span
                            className="text-xs px-2 py-0.5 rounded"
                            style={{ backgroundColor: statusConfig.bg, color: statusConfig.color }}
                          >
                            {statusConfig.label}
                          </span>
                        </div>
                        <p className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>
                          {req.sampleName} - {req.pickupLocation}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>{req.requestedAt}</p>
                      </div>
                      <ChevronRight className="w-4 h-4" style={{ color: 'rgba(255,255,255,0.3)' }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </>
      )}

      {/* Catalog Tab */}
      {activeTab === 'catalog' && (
        <>
          {/* Search */}
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: 'rgba(255,255,255,0.4)' }} />
            <input
              type="text"
              placeholder="Search samples..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-white/10 bg-white/5 focus:border-amber-500 focus:outline-none text-sm"
              style={{ backgroundColor: '#1a1a1a' }}
            />
          </div>

          {/* Samples Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredSamples.map((sample) => {
              const statusConfig = STATUS_CONFIG[sample.status]
              const StatusIcon = statusConfig.icon
              return (
                <div
                  key={sample.id}
                  className="rounded-xl border border-white/10 overflow-hidden hover:border-white/20 transition-colors"
                  style={{ backgroundColor: '#1a1a1a' }}
                >
                  <div className="p-5">
                    <div className="flex items-start justify-between mb-4">
                      <div
                        className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl"
                        style={{ backgroundColor: '#f59e0b20' }}
                      >
                        {sample.image}
                      </div>
                      <span
                        className="flex items-center gap-1 text-xs px-2 py-1 rounded"
                        style={{ backgroundColor: statusConfig.bg, color: statusConfig.color }}
                      >
                        <StatusIcon className="w-3 h-3" />
                        {sample.status.replace('_', ' ')}
                      </span>
                    </div>
                    <h3 className="font-semibold mb-1">{sample.name}</h3>
                    <p className="text-sm mb-3" style={{ color: 'rgba(255,255,255,0.5)' }}>{sample.description}</p>
                    <div className="flex items-center gap-2 text-xs mb-4">
                      <span className="px-2 py-0.5 rounded" style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}>
                        {sample.category}
                      </span>
                      <span className="flex items-center gap-1" style={{ color: 'rgba(255,255,255,0.4)' }}>
                        <Calendar className="w-3 h-3" />
                        Exp: {sample.expiryDate}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-2xl font-bold">{sample.available}</p>
                        <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>available</p>
                      </div>
                      <div className="flex gap-2">
                        <button className="p-2 rounded-lg border border-white/10 hover:bg-white/10">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button className="p-2 rounded-lg border border-white/10 hover:bg-white/10" style={{ color: '#ef4444' }}>
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}

      {/* Requests Tab */}
      {activeTab === 'requests' && (
        <>
          {/* Search */}
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: 'rgba(255,255,255,0.4)' }} />
            <input
              type="text"
              placeholder="Search by name or sample..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-white/10 bg-white/5 focus:border-amber-500 focus:outline-none text-sm"
              style={{ backgroundColor: '#1a1a1a' }}
            />
          </div>

          {/* Requests Table */}
          <div className="rounded-xl border border-white/10 overflow-hidden" style={{ backgroundColor: '#1a1a1a' }}>
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <th className="text-left text-xs font-medium px-4 py-3" style={{ color: 'rgba(255,255,255,0.5)' }}>User</th>
                  <th className="text-left text-xs font-medium px-4 py-3" style={{ color: 'rgba(255,255,255,0.5)' }}>Sample</th>
                  <th className="text-left text-xs font-medium px-4 py-3" style={{ color: 'rgba(255,255,255,0.5)' }}>Pickup Location</th>
                  <th className="text-left text-xs font-medium px-4 py-3" style={{ color: 'rgba(255,255,255,0.5)' }}>Status</th>
                  <th className="text-left text-xs font-medium px-4 py-3" style={{ color: 'rgba(255,255,255,0.5)' }}>QR Code</th>
                  <th className="text-right text-xs font-medium px-4 py-3" style={{ color: 'rgba(255,255,255,0.5)' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRequests.map((req) => {
                  const statusConfig = REQUEST_STATUS_CONFIG[req.status]
                  return (
                    <tr key={req.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <td className="px-4 py-4">
                        <p className="font-medium">{req.userName}</p>
                        <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>{req.userEmail}</p>
                      </td>
                      <td className="px-4 py-4 text-sm">{req.sampleName}</td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-1 text-sm" style={{ color: 'rgba(255,255,255,0.6)' }}>
                          <MapPin className="w-3 h-3" />
                          {req.pickupLocation}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span
                          className="text-xs px-2 py-1 rounded"
                          style={{ backgroundColor: statusConfig.bg, color: statusConfig.color }}
                        >
                          {statusConfig.label}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>{req.qrCode}</span>
                          <button className="p-1 rounded hover:bg-white/10">
                            <Copy className="w-3 h-3" />
                          </button>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {req.status === 'pending' && (
                            <button className="px-3 py-1.5 rounded text-xs font-medium" style={{ backgroundColor: 'rgba(34, 197, 94, 0.15)', color: '#22c55e' }}>
                              Approve
                            </button>
                          )}
                          {req.status === 'approved' && (
                            <button className="px-3 py-1.5 rounded text-xs font-medium" style={{ backgroundColor: 'rgba(34, 197, 94, 0.15)', color: '#22c55e' }}>
                              Mark Ready
                            </button>
                          )}
                          {req.status === 'ready' && (
                            <button className="px-3 py-1.5 rounded text-xs font-medium" style={{ backgroundColor: 'rgba(139, 92, 246, 0.15)', color: '#8b5cf6' }}>
                              Mark Claimed
                            </button>
                          )}
                          <button className="p-1.5 rounded-lg border border-white/10 hover:bg-white/10">
                            <QrCode className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Add Sample Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60" onClick={() => setShowAddModal(false)} />
          <div
            className="relative w-full max-w-md rounded-xl border border-white/10 p-6"
            style={{ backgroundColor: '#1a1a1a' }}
          >
            <button
              className="absolute top-4 right-4 p-1 rounded hover:bg-white/10"
              onClick={() => setShowAddModal(false)}
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-semibold mb-6">Add New Sample</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Sample Name</label>
                <input
                  type="text"
                  placeholder="e.g., Premium Face Serum Trial"
                  value={newSample.name}
                  onChange={(e) => setNewSample({ ...newSample, name: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg border border-white/10 bg-white/5 focus:border-amber-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Description</label>
                <textarea
                  placeholder="Describe the sample..."
                  value={newSample.description}
                  onChange={(e) => setNewSample({ ...newSample, description: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg border border-white/10 bg-white/5 focus:border-amber-500 focus:outline-none resize-none h-24"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Category</label>
                  <select
                    value={newSample.category}
                    onChange={(e) => setNewSample({ ...newSample, category: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-lg border border-white/10 bg-white/5 focus:border-amber-500 focus:outline-none"
                  >
                    <option value="">Select category</option>
                    <option value="beauty">Beauty</option>
                    <option value="food">Food</option>
                    <option value="electronics">Electronics</option>
                    <option value="health">Health</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Quantity</label>
                  <input
                    type="number"
                    placeholder="e.g., 100"
                    value={newSample.quantity}
                    onChange={(e) => setNewSample({ ...newSample, quantity: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-lg border border-white/10 bg-white/5 focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2.5 rounded-lg font-semibold"
                  style={{ backgroundColor: '#f59e0b', color: '#000' }}
                >
                  Add Sample
                </button>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="px-6 py-2.5 rounded-lg font-medium border border-white/10 hover:bg-white/5"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
