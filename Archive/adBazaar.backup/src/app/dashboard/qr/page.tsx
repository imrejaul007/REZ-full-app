'use client'

import { useState } from 'react'
import {
  QrCode,
  Plus,
  Search,
  Download,
  Copy,
  ExternalLink,
  Edit,
  Trash2,
  MoreHorizontal,
  Eye,
  Printer,
  Grid,
  List,
  Filter,
  Image,
  FileCode,
  FileText,
  Check,
  X,
  RefreshCw,
  Link as LinkIcon,
} from 'lucide-react'

interface QRCode {
  id: string
  name: string
  campaign: string
  campaignId: string
  shortUrl: string
  fullUrl: string
  scans: number
  createdAt: string
  status: 'active' | 'paused' | 'expired' | 'completed'
  format: 'static' | 'dynamic'
  lastScan: string
}

const QR_CODES: QRCode[] = [
  {
    id: 'qr_001',
    name: 'Summer Sale Banner QR',
    campaign: 'Summer Sale 2024',
    campaignId: 'camp_001',
    shortUrl: 'rez.in/ss24',
    fullUrl: 'https://rez.in/campaign/summer-sale-2024',
    scans: 12450,
    createdAt: '2024-05-01',
    status: 'active',
    format: 'dynamic',
    lastScan: '2 minutes ago',
  },
  {
    id: 'qr_002',
    name: 'Monsoon Offers Sticker',
    campaign: 'Monsoon Offers',
    campaignId: 'camp_002',
    shortUrl: 'rez.in/mo24',
    fullUrl: 'https://rez.in/campaign/monsoon-offers',
    scans: 8932,
    createdAt: '2024-06-15',
    status: 'active',
    format: 'dynamic',
    lastScan: '15 minutes ago',
  },
  {
    id: 'qr_003',
    name: 'Festival Billboard QR',
    campaign: 'Festival Special',
    campaignId: 'camp_003',
    shortUrl: 'rez.in/fs24',
    fullUrl: 'https://rez.in/campaign/festival-special',
    scans: 5621,
    createdAt: '2024-07-01',
    status: 'paused',
    format: 'dynamic',
    lastScan: '1 day ago',
  },
  {
    id: 'qr_004',
    name: 'Product Launch Poster',
    campaign: 'New Product Launch',
    campaignId: 'camp_005',
    shortUrl: 'rez.in/npl24',
    fullUrl: 'https://rez.in/campaign/new-product-launch',
    scans: 0,
    createdAt: '2024-08-10',
    status: 'active',
    format: 'static',
    lastScan: 'Never',
  },
  {
    id: 'qr_005',
    name: 'Influencer Collab QR',
    campaign: 'Influencer Collab',
    campaignId: 'camp_004',
    shortUrl: 'rez.in/ic24',
    fullUrl: 'https://rez.in/campaign/influencer-collab',
    scans: 45678,
    createdAt: '2024-03-01',
    status: 'completed',
    format: 'dynamic',
    lastScan: '3 days ago',
  },
]

const STATUS_CONFIG = {
  active: { color: '#22c55e', bg: 'rgba(34, 197, 94, 0.15)', label: 'Active' },
  paused: { color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)', label: 'Paused' },
  expired: { color: 'rgba(255,255,255,0.4)', bg: 'rgba(255, 255, 255, 0.1)', label: 'Expired' },
  completed: { color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.15)', label: 'Completed' },
}

const TAB_LIST = [
  { id: 'all', label: 'All QR Codes' },
  { id: 'active', label: 'Active' },
  { id: 'paused', label: 'Paused' },
  { id: 'expired', label: 'Expired' },
]

export default function QRManagementPage() {
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState('all')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list')
  const [menuOpen, setMenuOpen] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [selectedQrs, setSelectedQrs] = useState<string[]>([])
  const [showBulkModal, setShowBulkModal] = useState(false)
  const [bulkCount, setBulkCount] = useState('10')

  const filteredQrs = QR_CODES.filter((qr) => {
    if (activeTab !== 'all' && qr.status !== activeTab) return false
    if (search && !qr.name.toLowerCase().includes(search.toLowerCase()) && !qr.shortUrl.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const totalScans = QR_CODES.reduce((sum, qr) => sum + qr.scans, 0)
  const activeQrs = QR_CODES.filter((qr) => qr.status === 'active').length

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const toggleSelect = (id: string) => {
    setSelectedQrs((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  const toggleSelectAll = () => {
    if (selectedQrs.length === filteredQrs.length) {
      setSelectedQrs([])
    } else {
      setSelectedQrs(filteredQrs.map((qr) => qr.id))
    }
  }

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">QR Codes</h1>
          <p className="text-white/60">Manage and track your QR code generation</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowBulkModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-white/10 hover:bg-white/5 text-sm"
          >
            <Plus className="w-4 h-4" />
            Bulk Generate
          </button>
          <button
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg font-semibold transition-opacity hover:opacity-90"
            style={{ backgroundColor: '#f59e0b', color: '#000' }}
          >
            <Plus className="w-4 h-4" />
            Create QR
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="p-5 rounded-xl border border-white/10" style={{ backgroundColor: '#1a1a1a' }}>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg" style={{ backgroundColor: 'rgba(139, 92, 246, 0.15)' }}>
              <QrCode className="w-5 h-5" style={{ color: '#8b5cf6' }} />
            </div>
            <div>
              <p className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>Total QR Codes</p>
              <p className="text-2xl font-bold">{QR_CODES.length}</p>
            </div>
          </div>
        </div>
        <div className="p-5 rounded-xl border border-white/10" style={{ backgroundColor: '#1a1a1a' }}>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg" style={{ backgroundColor: 'rgba(34, 197, 94, 0.15)' }}>
              <Eye className="w-5 h-5" style={{ color: '#22c55e' }} />
            </div>
            <div>
              <p className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>Total Scans</p>
              <p className="text-2xl font-bold">{totalScans.toLocaleString()}</p>
            </div>
          </div>
        </div>
        <div className="p-5 rounded-xl border border-white/10" style={{ backgroundColor: '#1a1a1a' }}>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg" style={{ backgroundColor: 'rgba(59, 130, 246, 0.15)' }}>
              <Check className="w-5 h-5" style={{ color: '#3b82f6' }} />
            </div>
            <div>
              <p className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>Active</p>
              <p className="text-2xl font-bold">{activeQrs}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: 'rgba(255,255,255,0.4)' }} />
          <input
            type="text"
            placeholder="Search QR codes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-white/10 bg-white/5 focus:border-amber-500 focus:outline-none text-sm"
            style={{ backgroundColor: '#1a1a1a' }}
          />
        </div>

        {/* View toggle */}
        <div className="flex items-center gap-1 p-1 rounded-lg" style={{ backgroundColor: '#1a1a1a' }}>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded-md transition-colors ${viewMode === 'list' ? 'bg-white/10' : 'hover:bg-white/5'}`}
          >
            <List className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-white/10' : 'hover:bg-white/5'}`}
          >
            <Grid className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-lg mb-6" style={{ backgroundColor: '#1a1a1a' }}>
        {TAB_LIST.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
              activeTab === tab.id ? '' : 'hover:bg-white/5'
            }`}
            style={activeTab === tab.id ? { backgroundColor: '#f59e0b', color: '#000' } : { color: 'rgba(255,255,255,0.6)' }}
          >
            {tab.label}
            {tab.id !== 'all' && (
              <span className="ml-2 px-1.5 py-0.5 rounded text-xs" style={{ backgroundColor: 'rgba(0,0,0,0.2)' }}>
                {QR_CODES.filter((qr) => qr.status === tab.id).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Selected actions */}
      {selectedQrs.length > 0 && (
        <div className="flex items-center justify-between p-3 rounded-lg mb-4" style={{ backgroundColor: '#1a1a1a', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
          <span className="text-sm">{selectedQrs.length} QR codes selected</span>
          <div className="flex items-center gap-2">
            <button className="px-3 py-1.5 rounded text-xs font-medium" style={{ backgroundColor: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b' }}>
              Download Selected
            </button>
            <button className="px-3 py-1.5 rounded text-xs font-medium" style={{ backgroundColor: 'rgba(239, 68, 68, 0.15)', color: '#ef4444' }}>
              Delete Selected
            </button>
            <button onClick={() => setSelectedQrs([])} className="p-1.5 rounded hover:bg-white/10">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* QR List */}
      <div
        className={`rounded-xl border border-white/10 overflow-hidden ${viewMode === 'grid' ? '' : ''}`}
        style={{ backgroundColor: '#1a1a1a' }}
      >
        {viewMode === 'list' ? (
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <th className="text-left text-xs font-medium px-4 py-3" style={{ color: 'rgba(255,255,255,0.5)' }}>
                  <input
                    type="checkbox"
                    checked={selectedQrs.length === filteredQrs.length && filteredQrs.length > 0}
                    onChange={toggleSelectAll}
                    className="rounded"
                  />
                </th>
                <th className="text-left text-xs font-medium px-4 py-3" style={{ color: 'rgba(255,255,255,0.5)' }}>QR Code</th>
                <th className="text-left text-xs font-medium px-4 py-3" style={{ color: 'rgba(255,255,255,0.5)' }}>Campaign</th>
                <th className="text-left text-xs font-medium px-4 py-3" style={{ color: 'rgba(255,255,255,0.5)' }}>Short URL</th>
                <th className="text-right text-xs font-medium px-4 py-3" style={{ color: 'rgba(255,255,255,0.5)' }}>Scans</th>
                <th className="text-left text-xs font-medium px-4 py-3" style={{ color: 'rgba(255,255,255,0.5)' }}>Status</th>
                <th className="text-right text-xs font-medium px-4 py-3" style={{ color: 'rgba(255,255,255,0.5)' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredQrs.map((qr) => {
                const statusConfig = STATUS_CONFIG[qr.status]
                return (
                  <tr key={qr.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }} className="hover:bg-white/5 transition-colors">
                    <td className="px-4 py-4">
                      <input
                        type="checkbox"
                        checked={selectedQrs.includes(qr.id)}
                        onChange={() => toggleSelect(qr.id)}
                        className="rounded"
                      />
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#f59e0b20' }}>
                          <QrCode className="w-5 h-5" style={{ color: '#f59e0b' }} />
                        </div>
                        <div>
                          <p className="font-medium">{qr.name}</p>
                          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
                            {qr.format === 'dynamic' ? 'Dynamic' : 'Static'} • Created {qr.createdAt}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm">{qr.campaign}</td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm" style={{ color: '#8b5cf6' }}>{qr.shortUrl}</span>
                        <button
                          onClick={() => handleCopy(qr.shortUrl, `${qr.id}-url`)}
                          className="p-1 rounded hover:bg-white/10"
                        >
                          {copiedId === `${qr.id}-url` ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                        </button>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-right font-medium">{qr.scans.toLocaleString()}</td>
                    <td className="px-4 py-4">
                      <span
                        className="text-xs px-2 py-1 rounded"
                        style={{ backgroundColor: statusConfig.bg, color: statusConfig.color }}
                      >
                        {statusConfig.label}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button className="p-2 rounded-lg hover:bg-white/10" title="Download PNG">
                          <Download className="w-4 h-4" />
                        </button>
                        <button className="p-2 rounded-lg hover:bg-white/10" title="Print">
                          <Printer className="w-4 h-4" />
                        </button>
                        <div className="relative">
                          <button
                            className="p-2 rounded-lg hover:bg-white/10"
                            onClick={() => setMenuOpen(menuOpen === qr.id ? null : qr.id)}
                          >
                            <MoreHorizontal className="w-4 h-4" />
                          </button>
                          {menuOpen === qr.id && (
                            <div
                              className="absolute right-0 top-full mt-1 w-48 rounded-lg border border-white/10 shadow-xl z-10 py-1"
                              style={{ backgroundColor: '#1a1a1a' }}
                            >
                              <button className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-white/10 text-left">
                                <Edit className="w-4 h-4" /> Edit Content
                              </button>
                              <button className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-white/10 text-left">
                                <LinkIcon className="w-4 h-4" /> Update URL
                              </button>
                              <button className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-white/10 text-left">
                                <Image className="w-4 h-4" /> Download SVG
                              </button>
                              <button className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-white/10 text-left">
                                <FileText className="w-4 h-4" /> Download PDF
                              </button>
                              <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }} />
                              <button className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-white/10 text-left" style={{ color: '#ef4444' }}>
                                <Trash2 className="w-4 h-4" /> Delete
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        ) : (
          <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredQrs.map((qr) => {
              const statusConfig = STATUS_CONFIG[qr.status]
              return (
                <div
                  key={qr.id}
                  className="p-4 rounded-xl border border-white/10 hover:border-white/20 transition-colors"
                >
                  <div className="flex items-start justify-between mb-4">
                    <input
                      type="checkbox"
                      checked={selectedQrs.includes(qr.id)}
                      onChange={() => toggleSelect(qr.id)}
                      className="rounded"
                    />
                    <span
                      className="text-xs px-2 py-1 rounded"
                      style={{ backgroundColor: statusConfig.bg, color: statusConfig.color }}
                    >
                      {statusConfig.label}
                    </span>
                  </div>
                  <div className="flex justify-center mb-4 p-4 rounded-lg" style={{ backgroundColor: 'rgba(255,255,255,0.03)' }}>
                    <div className="w-24 h-24 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#fff' }}>
                      <QrCode className="w-16 h-16" style={{ color: '#000' }} />
                    </div>
                  </div>
                  <h3 className="font-medium mb-1 text-center">{qr.name}</h3>
                  <p className="text-sm text-center mb-3" style={{ color: 'rgba(255,255,255,0.5)' }}>{qr.campaign}</p>
                  <div className="flex items-center justify-center gap-1 mb-4">
                    <span className="font-mono text-sm" style={{ color: '#8b5cf6' }}>{qr.shortUrl}</span>
                    <button
                      onClick={() => handleCopy(qr.shortUrl, `${qr.id}-url`)}
                      className="p-1 rounded hover:bg-white/10"
                    >
                      {copiedId === `${qr.id}-url` ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span style={{ color: 'rgba(255,255,255,0.5)' }}>
                      <Eye className="w-4 h-4 inline mr-1" />
                      {qr.scans.toLocaleString()} scans
                    </span>
                    <div className="flex gap-1">
                      <button className="p-2 rounded-lg border border-white/10 hover:bg-white/10">
                        <Download className="w-4 h-4" />
                      </button>
                      <button className="p-2 rounded-lg border border-white/10 hover:bg-white/10">
                        <Printer className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Bulk Generate Modal */}
      {showBulkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60" onClick={() => setShowBulkModal(false)} />
          <div
            className="relative w-full max-w-md rounded-xl border border-white/10 p-6"
            style={{ backgroundColor: '#1a1a1a' }}
          >
            <button
              className="absolute top-4 right-4 p-1 rounded hover:bg-white/10"
              onClick={() => setShowBulkModal(false)}
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-semibold mb-6">Bulk Generate QR Codes</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Campaign</label>
                <select className="w-full px-4 py-2.5 rounded-lg border border-white/10 bg-white/5 focus:border-amber-500 focus:outline-none">
                  <option value="">Select campaign</option>
                  <option value="camp_001">Summer Sale 2024</option>
                  <option value="camp_002">Monsoon Offers</option>
                  <option value="camp_005">New Product Launch</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Number of QR Codes</label>
                <input
                  type="number"
                  value={bulkCount}
                  onChange={(e) => setBulkCount(e.target.value)}
                  min="1"
                  max="1000"
                  className="w-full px-4 py-2.5 rounded-lg border border-white/10 bg-white/5 focus:border-amber-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Naming Pattern</label>
                <input
                  type="text"
                  placeholder="e.g., {campaign}_{number}"
                  className="w-full px-4 py-2.5 rounded-lg border border-white/10 bg-white/5 focus:border-amber-500 focus:outline-none"
                />
                <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>
                  Use {"{campaign}"} and {"{number}"} as placeholders
                </p>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowBulkModal(false)}
                  className="flex-1 py-2.5 rounded-lg font-semibold"
                  style={{ backgroundColor: '#f59e0b', color: '#000' }}
                >
                  Generate
                </button>
                <button
                  onClick={() => setShowBulkModal(false)}
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
