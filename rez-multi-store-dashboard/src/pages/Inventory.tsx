import { useState } from 'react';
import {
  Package,
  AlertTriangle,
  XCircle,
  Clock,
  TrendingUp,
  TrendingDown,
  ChevronRight,
} from 'lucide-react';
import clsx from 'clsx';
import { useUnifiedInventory } from '../hooks/useMultiStore';
import type { SKU } from '../types';

type InventoryTab = 'overview' | 'low_stock' | 'out_of_stock' | 'expiring' | 'top_moving' | 'slow_moving';

export function Inventory() {
  const { inventory, loading, error } = useUnifiedInventory();
  const [activeTab, setActiveTab] = useState<InventoryTab>('overview');

  const tabs: { id: InventoryTab; label: string; count?: number }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'low_stock', label: 'Low Stock', count: inventory?.lowStockItems.length },
    { id: 'out_of_stock', label: 'Out of Stock', count: inventory?.outOfStock.length },
    { id: 'expiring', label: 'Expiring Soon', count: inventory?.expiringSoon.length },
    { id: 'top_moving', label: 'Top Moving' },
    { id: 'slow_moving', label: 'Slow Moving' },
  ];

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(value);
  };

  const formatDate = (date?: Date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent"></div>
      </div>
    );
  }

  if (error || !inventory) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-800">Error loading inventory: {error?.message}</p>
      </div>
    );
  }

  const getItems = (): SKU[] => {
    switch (activeTab) {
      case 'low_stock':
        return inventory.lowStockItems;
      case 'out_of_stock':
        return inventory.outOfStock;
      case 'expiring':
        return inventory.expiringSoon;
      case 'top_moving':
        return inventory.topMoving;
      case 'slow_moving':
        return inventory.slowMoving;
      default:
        return [];
    }
  };

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <SummaryCard
          icon={<Package className="w-5 h-5" />}
          label="Total SKUs"
          value={inventory.totalSKUs.toString()}
          color="blue"
        />
        <SummaryCard
          icon={<AlertTriangle className="w-5 h-5" />}
          label="Low Stock Items"
          value={inventory.lowStockItems.length.toString()}
          color="orange"
          alert
        />
        <SummaryCard
          icon={<XCircle className="w-5 h-5" />}
          label="Out of Stock"
          value={inventory.outOfStock.length.toString()}
          color="red"
          alert
        />
        <SummaryCard
          icon={<Clock className="w-5 h-5" />}
          label="Expiring Soon"
          value={inventory.expiringSoon.length.toString()}
          color="yellow"
          alert
        />
      </div>

      {/* Low Stock Preview */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-900">Low Stock Items</h2>
          <button
            onClick={() => setActiveTab('low_stock')}
            className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1"
          >
            View all <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        {inventory.lowStockItems.length > 0 ? (
          <div className="space-y-3">
            {inventory.lowStockItems.slice(0, 3).map((sku) => (
              <SKUItem key={sku.id} sku={sku} formatCurrency={formatCurrency} />
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-4">No low stock items</p>
        )}
      </div>

      {/* Out of Stock Preview */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-900">Out of Stock Items</h2>
          <button
            onClick={() => setActiveTab('out_of_stock')}
            className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1"
          >
            View all <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        {inventory.outOfStock.length > 0 ? (
          <div className="space-y-3">
            {inventory.outOfStock.slice(0, 3).map((sku) => (
              <SKUItem key={sku.id} sku={sku} formatCurrency={formatCurrency} />
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-4">No out of stock items</p>
        )}
      </div>
    </div>
  );

  const renderSKUList = () => {
    const items = getItems();
    if (items.length === 0) {
      return (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No items found</h3>
          <p className="text-gray-500">
            {activeTab === 'low_stock' && 'All items are adequately stocked'}
            {activeTab === 'out_of_stock' && 'No items are currently out of stock'}
            {activeTab === 'expiring' && 'No items expiring soon'}
            {activeTab === 'top_moving' && 'No top moving items data available'}
            {activeTab === 'slow_moving' && 'No slow moving items data available'}
          </p>
        </div>
      );
    }

    return (
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Product
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                SKU
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Category
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                Price
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                Stock
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                Reorder Level
              </th>
              {activeTab === 'expiring' && (
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Expires
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {items.map((sku) => (
              <tr key={sku.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4">
                  <p className="font-medium text-gray-900">{sku.name}</p>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">{sku.sku}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{sku.category}</td>
                <td className="px-6 py-4 text-right font-medium text-gray-900">
                  {formatCurrency(sku.price)}
                </td>
                <td className="px-6 py-4 text-right">
                  <span
                    className={clsx(
                      'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                      sku.stock === 0
                        ? 'bg-red-100 text-red-800'
                        : sku.stock < sku.reorderLevel
                        ? 'bg-orange-100 text-orange-800'
                        : 'bg-green-100 text-green-800'
                    )}
                  >
                    {sku.stock}
                  </span>
                </td>
                <td className="px-6 py-4 text-right text-sm text-gray-600">
                  {sku.reorderLevel}
                </td>
                {activeTab === 'expiring' && (
                  <td className="px-6 py-4 text-sm text-orange-600">
                    {formatDate(sku.expiresAt)}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Unified Inventory</h1>
        <p className="text-gray-500 mt-1">
          Centralized inventory management across all stores
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-4">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={clsx(
                'pb-3 px-1 text-sm font-medium border-b-2 transition-colors flex items-center gap-2',
                activeTab === tab.id
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              )}
            >
              {tab.label}
              {tab.count !== undefined && tab.count > 0 && (
                <span
                  className={clsx(
                    'px-2 py-0.5 text-xs rounded-full',
                    activeTab === tab.id
                      ? 'bg-primary-100 text-primary-700'
                      : 'bg-gray-100 text-gray-600'
                  )}
                >
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      {activeTab === 'overview' ? renderOverview() : renderSKUList()}
    </div>
  );
}

interface SummaryCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: 'blue' | 'orange' | 'red' | 'yellow' | 'green';
  alert?: boolean;
}

function SummaryCard({ icon, label, value, color, alert }: SummaryCardProps) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    orange: 'bg-orange-50 text-orange-600',
    red: 'bg-red-50 text-red-600',
    yellow: 'bg-yellow-50 text-yellow-600',
    green: 'bg-green-50 text-green-600',
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="flex items-start justify-between">
        <div className={clsx('p-2 rounded-lg', colorClasses[color])}>{icon}</div>
        {alert && (
          <span className="px-2 py-0.5 bg-red-100 text-red-800 text-xs font-medium rounded-full">
            Alert
          </span>
        )}
      </div>
      <p className="text-sm text-gray-500 mt-3">{label}</p>
      <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
    </div>
  );
}

interface SKUItemProps {
  sku: SKU;
  formatCurrency: (value: number) => string;
}

function SKUItem({ sku, formatCurrency }: SKUItemProps) {
  const stockPercentage = Math.min((sku.stock / sku.reorderLevel) * 100, 100);

  return (
    <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
      <div className="flex-1">
        <p className="font-medium text-gray-900">{sku.name}</p>
        <p className="text-sm text-gray-500">{sku.sku}</p>
      </div>
      <div className="w-32">
        <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
          <span>Stock</span>
          <span>{sku.stock}</span>
        </div>
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={clsx(
              'h-full rounded-full transition-all',
              stockPercentage < 20 ? 'bg-red-500' : stockPercentage < 50 ? 'bg-orange-500' : 'bg-green-500'
            )}
            style={{ width: `${stockPercentage}%` }}
          />
        </div>
      </div>
      <div className="text-right">
        <p className="font-medium text-gray-900">{formatCurrency(sku.price)}</p>
        <p className="text-xs text-gray-500">Reorder at {sku.reorderLevel}</p>
      </div>
    </div>
  );
}

export default Inventory;
