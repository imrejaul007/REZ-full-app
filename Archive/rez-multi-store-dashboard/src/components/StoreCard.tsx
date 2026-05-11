import { Link } from 'react-router-dom';
import { MapPin, Users, Star, TrendingUp, MoreVertical } from 'lucide-react';
import clsx from 'clsx';
import type { Store } from '../types';

interface StoreCardProps {
  store: Store;
  variant?: 'default' | 'compact';
  onClick?: () => void;
}

export function StoreCard({ store, variant = 'default', onClick }: StoreCardProps) {
  const statusColors = {
    active: 'bg-green-100 text-green-800',
    inactive: 'bg-gray-100 text-gray-800',
    pending: 'bg-yellow-100 text-yellow-800',
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  if (variant === 'compact') {
    return (
      <Link
        to={`/stores/${store.id}`}
        className={clsx(
          'block p-4 bg-white border border-gray-200 rounded-lg hover:border-primary-300',
          'hover:shadow-md transition-all duration-200 card-hover'
        )}
        onClick={onClick}
      >
        <div className="flex items-start justify-between mb-2">
          <h3 className="font-semibold text-gray-900 truncate">{store.name}</h3>
          <span
            className={clsx(
              'px-2 py-0.5 text-xs font-medium rounded-full',
              statusColors[store.status]
            )}
          >
            {store.status}
          </span>
        </div>

        <div className="flex items-center gap-1 text-sm text-gray-500 mb-3">
          <MapPin className="w-3.5 h-3.5" />
          <span>{store.city}</span>
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="font-medium text-primary-600">
            {formatCurrency(store.revenue)}
          </span>
          <span className="text-gray-500">{store.orders} orders</span>
        </div>
      </Link>
    );
  }

  return (
    <Link
      to={`/stores/${store.id}`}
      className={clsx(
        'block bg-white border border-gray-200 rounded-xl overflow-hidden',
        'hover:border-primary-300 hover:shadow-lg transition-all duration-200 card-hover'
      )}
      onClick={onClick}
    >
      {/* Header */}
      <div className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="font-semibold text-lg text-gray-900">{store.name}</h3>
            <div className="flex items-center gap-1 text-sm text-gray-500 mt-1">
              <MapPin className="w-3.5 h-3.5" />
              <span>{store.address}</span>
            </div>
          </div>
          <span
            className={clsx(
              'px-2.5 py-1 text-xs font-medium rounded-full capitalize',
              statusColors[store.status]
            )}
          >
            {store.status}
          </span>
        </div>

        <div className="flex items-center justify-between text-sm text-gray-600">
          <div className="flex items-center gap-1">
            <Users className="w-4 h-4" />
            <span>{store.staffCount} staff</span>
          </div>
          <div className="flex items-center gap-1">
            <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
            <span className="font-medium">{store.rating.toFixed(1)}</span>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="px-5 py-4 bg-gray-50 border-t border-gray-100">
        <div className="grid grid-cols-3 gap-4">
          <div>
            <p className="text-xs text-gray-500 mb-1">Revenue</p>
            <p className="font-semibold text-gray-900">{formatCurrency(store.revenue)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Orders</p>
            <p className="font-semibold text-gray-900">{store.orders.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Avg Order</p>
            <p className="font-semibold text-gray-900">{formatCurrency(store.avgOrderValue)}</p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-1 text-sm text-gray-500">
          <TrendingUp className="w-4 h-4 text-green-500" />
          <span className="text-green-600 font-medium">+12.5%</span>
          <span>vs last month</span>
        </div>
        <button className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
          <MoreVertical className="w-5 h-5 text-gray-400" />
        </button>
      </div>
    </Link>
  );
}

export default StoreCard;
