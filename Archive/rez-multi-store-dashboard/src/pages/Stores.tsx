import { useState } from 'react';
import { Search, Grid, List, Filter, SlidersHorizontal } from 'lucide-react';
import clsx from 'clsx';
import { StoreCard } from '../components/StoreCard';
import { useStores } from '../hooks/useMultiStore';
import type { StoreFilters, Store } from '../types';

export function Stores() {
  const { stores, loading, filters, updateFilters } = useStores();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateFilters({ ...filters!, search: e.target.value });
  };

  const handleStatusChange = (status: StoreFilters['status']) => {
    updateFilters({ ...filters!, status });
  };

  const handleSortChange = (sortBy: StoreFilters['sortBy']) => {
    const newOrder = filters?.sortBy === sortBy && filters.sortOrder === 'asc' ? 'desc' : 'asc';
    updateFilters({ ...filters!, sortBy, sortOrder: newOrder });
  };

  const statusCounts = {
    all: stores.length,
    active: stores.filter((s: Store) => s.status === 'active').length,
    inactive: stores.filter((s: Store) => s.status === 'inactive').length,
    pending: stores.filter((s: Store) => s.status === 'pending').length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Store Management</h1>
          <p className="text-gray-500 mt-1">
            {stores.length} stores found
          </p>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search stores by name, city, or manager..."
              value={filters?.search || ''}
              onChange={handleSearchChange}
              className={clsx(
                'w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg',
                'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent',
                'placeholder:text-gray-400'
              )}
            />
          </div>

          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={clsx(
              'flex items-center gap-2 px-4 py-2.5 border rounded-lg transition-colors',
              showFilters
                ? 'bg-primary-50 border-primary-200 text-primary-700'
                : 'border-gray-200 text-gray-600 hover:bg-gray-50'
            )}
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span>Filters</span>
          </button>

          {/* View Toggle */}
          <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
            <button
              onClick={() => setViewMode('grid')}
              className={clsx(
                'p-2.5 transition-colors',
                viewMode === 'grid'
                  ? 'bg-primary-50 text-primary-600'
                  : 'text-gray-400 hover:bg-gray-50'
              )}
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={clsx(
                'p-2.5 transition-colors',
                viewMode === 'list'
                  ? 'bg-primary-50 text-primary-600'
                  : 'text-gray-400 hover:bg-gray-50'
              )}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Expanded Filters */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Status Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <div className="flex flex-wrap gap-2">
                  {(['all', 'active', 'inactive', 'pending'] as const).map((status) => (
                    <button
                      key={status}
                      onClick={() => handleStatusChange(status)}
                      className={clsx(
                        'px-3 py-1.5 text-sm rounded-lg transition-colors capitalize',
                        filters?.status === status || (!filters?.status && status === 'all')
                          ? 'bg-primary-100 text-primary-700 font-medium'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      )}
                    >
                      {status === 'all' ? 'All' : status}
                      <span className="ml-1.5 text-xs opacity-70">
                        ({statusCounts[status]})
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Sort By */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { key: 'name', label: 'Name' },
                    { key: 'revenue', label: 'Revenue' },
                    { key: 'orders', label: 'Orders' },
                    { key: 'rating', label: 'Rating' },
                  ].map(({ key, label }) => (
                    <button
                      key={key}
                      onClick={() => handleSortChange(key as StoreFilters['sortBy'])}
                      className={clsx(
                        'px-3 py-1.5 text-sm rounded-lg transition-colors',
                        filters?.sortBy === key
                          ? 'bg-primary-100 text-primary-700 font-medium'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      )}
                    >
                      {label}
                      {filters?.sortBy === key && (
                        <span className="ml-1">
                          {filters.sortOrder === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Store Grid/List */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent"></div>
        </div>
      ) : stores.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <Filter className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No stores found</h3>
          <p className="text-gray-500">Try adjusting your search or filter criteria</p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {stores.map((store) => (
            <StoreCard key={store.id} store={store} />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Store
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Location
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Revenue
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Orders
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rating
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {stores.map((store) => (
                <tr
                  key={store.id}
                  className="hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => window.location.href = `/stores/${store.id}`}
                >
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-medium text-gray-900">{store.name}</p>
                      <p className="text-sm text-gray-500">{store.manager}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-gray-900">{store.city}</p>
                    <p className="text-xs text-gray-500">{store.address}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={clsx(
                        'px-2.5 py-1 text-xs font-medium rounded-full capitalize',
                        store.status === 'active' && 'bg-green-100 text-green-800',
                        store.status === 'inactive' && 'bg-gray-100 text-gray-800',
                        store.status === 'pending' && 'bg-yellow-100 text-yellow-800'
                      )}
                    >
                      {store.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right font-medium text-gray-900">
                    ${store.revenue.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-right text-gray-600">
                    {store.orders.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <span className="text-yellow-500">★</span>
                      <span className="font-medium text-gray-900">{store.rating.toFixed(1)}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default Stores;
