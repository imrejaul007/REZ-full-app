import { useState } from 'react';
import {
  Search,
  Filter,
  Grid,
  List,
  Edit3,
  ArrowRightLeft,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import clsx from 'clsx';
import { useProducts, usePriceUpdate, useStores } from '../hooks/useMultiStore';
import type { Product, ProductFilters } from '../types';

export function Products() {
  const { products, loading, filters, updateFilters } = useProducts();
  const { updatePrice, loading: updateLoading } = usePriceUpdate();
  const { stores } = useStores();

  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [editingPrice, setEditingPrice] = useState<string | null>(null);
  const [priceValue, setPriceValue] = useState('');
  const [transferModal, setTransferModal] = useState<{ product: Product; open: boolean }>({
    product: null as unknown as Product,
    open: false,
  });

  const categories = Array.from(new Set(products.map((p) => p.category)));

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateFilters({ ...filters!, search: e.target.value });
  };

  const handleCategoryChange = (category: string) => {
    updateFilters({ ...filters!, category });
  };

  const handleStoreChange = (storeId: string) => {
    updateFilters({ ...filters!, storeId });
  };

  const handleStatusChange = (status: ProductFilters['status']) => {
    updateFilters({ ...filters!, status });
  };

  const handlePriceEdit = (product: Product) => {
    setEditingPrice(product.id);
    setPriceValue(product.price.toString());
  };

  const handlePriceSave = async (productId: string) => {
    const newPrice = parseFloat(priceValue);
    if (isNaN(newPrice) || newPrice < 0) {
      alert('Invalid price');
      return;
    }
    try {
      await updatePrice(productId, newPrice);
      setEditingPrice(null);
    } catch (err) {
      console.error('Failed to update price:', err);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(value);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Product Catalog</h1>
          <p className="text-gray-500 mt-1">
            {products.length} products across {stores.length} stores
          </p>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search products by name, SKU, or category..."
              value={filters?.search || ''}
              onChange={handleSearchChange}
              className={clsx(
                'w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg',
                'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent'
              )}
            />
          </div>

          {/* Category Filter */}
          <select
            value={filters?.category || 'all'}
            onChange={(e) => handleCategoryChange(e.target.value)}
            className="px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="all">All Categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          {/* Store Filter */}
          <select
            value={filters?.storeId || 'all'}
            onChange={(e) => handleStoreChange(e.target.value)}
            className="px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="all">All Stores</option>
            {stores.map((store) => (
              <option key={store.id} value={store.id}>
                {store.name}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={filters?.status || 'all'}
            onChange={(e) => handleStatusChange(e.target.value as ProductFilters['status'])}
            className="px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="out_of_stock">Out of Stock</option>
          </select>

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
      </div>

      {/* Products Grid */}
      {products.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <Filter className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
          <p className="text-gray-500">Try adjusting your search or filter criteria</p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              formatCurrency={formatCurrency}
              onEditPrice={handlePriceEdit}
              editingPrice={editingPrice}
              priceValue={priceValue}
              setPriceValue={setPriceValue}
              onPriceSave={handlePriceSave}
              onCancelEdit={() => setEditingPrice(null)}
              onTransfer={() => setTransferModal({ product, open: true })}
            />
          ))}
        </div>
      ) : (
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Stores
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Price
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {products.map((product) => (
                <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={product.images[0]}
                        alt={product.name}
                        className="w-10 h-10 rounded-lg object-cover"
                      />
                      <div>
                        <p className="font-medium text-gray-900">{product.name}</p>
                        <p className="text-sm text-gray-500 line-clamp-1">
                          {product.description}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{product.sku}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{product.category}</td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-600">
                      {product.availableStores.length} stores
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    {editingPrice === product.id ? (
                      <div className="flex items-center justify-end gap-2">
                        <input
                          type="number"
                          value={priceValue}
                          onChange={(e) => setPriceValue(e.target.value)}
                          className="w-24 px-2 py-1 border border-gray-200 rounded text-right"
                          autoFocus
                        />
                        <button
                          onClick={() => handlePriceSave(product.id)}
                          className="p-1 text-green-600 hover:bg-green-50 rounded"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setEditingPrice(null)}
                          className="p-1 text-red-600 hover:bg-red-50 rounded"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handlePriceEdit(product)}
                        className="font-medium text-gray-900 hover:text-primary-600 flex items-center justify-end gap-1"
                      >
                        {formatCurrency(product.price)}
                        <Edit3 className="w-3 h-3" />
                      </button>
                    )}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span
                      className={clsx(
                        'px-2.5 py-1 text-xs font-medium rounded-full capitalize',
                        product.status === 'active' && 'bg-green-100 text-green-800',
                        product.status === 'inactive' && 'bg-gray-100 text-gray-800',
                        product.status === 'out_of_stock' && 'bg-red-100 text-red-800'
                      )}
                    >
                      {product.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button
                      onClick={() => setTransferModal({ product, open: true })}
                      className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                      title="Transfer Stock"
                    >
                      <ArrowRightLeft className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Transfer Modal */}
      {transferModal.open && (
        <StockTransferModal
          product={transferModal.product}
          stores={stores}
          onClose={() => setTransferModal({ product: null as unknown as Product, open: false })}
        />
      )}
    </div>
  );
}

interface ProductCardProps {
  product: Product;
  formatCurrency: (value: number) => string;
  onEditPrice: (product: Product) => void;
  editingPrice: string | null;
  priceValue: string;
  setPriceValue: (value: string) => void;
  onPriceSave: (productId: string) => void;
  onCancelEdit: () => void;
  onTransfer: () => void;
}

function ProductCard({
  product,
  formatCurrency,
  onEditPrice,
  editingPrice,
  priceValue,
  setPriceValue,
  onPriceSave,
  onCancelEdit,
  onTransfer,
}: ProductCardProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow">
      <div className="relative">
        <img
          src={product.images[0]}
          alt={product.name}
          className="w-full h-40 object-cover"
        />
        <span
          className={clsx(
            'absolute top-2 right-2 px-2 py-1 text-xs font-medium rounded-full capitalize',
            product.status === 'active' && 'bg-green-100 text-green-800',
            product.status === 'inactive' && 'bg-gray-100 text-gray-800',
            product.status === 'out_of_stock' && 'bg-red-100 text-red-800'
          )}
        >
          {product.status.replace('_', ' ')}
        </span>
      </div>

      <div className="p-4">
        <p className="text-xs text-gray-500 mb-1">{product.sku}</p>
        <h3 className="font-semibold text-gray-900 mb-1 line-clamp-1">{product.name}</h3>
        <p className="text-sm text-gray-500 mb-3 line-clamp-2">{product.description}</p>

        <div className="flex items-center justify-between text-sm mb-3">
          <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded">{product.category}</span>
          <span className="text-gray-500">{product.availableStores.length} stores</span>
        </div>

        <div className="flex items-center justify-between">
          {editingPrice === product.id ? (
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={priceValue}
                onChange={(e) => setPriceValue(e.target.value)}
                className="w-20 px-2 py-1 border border-gray-200 rounded text-sm"
                autoFocus
              />
              <button
                onClick={() => onPriceSave(product.id)}
                className="p-1 text-green-600 hover:bg-green-50 rounded"
              >
                <CheckCircle className="w-4 h-4" />
              </button>
              <button
                onClick={onCancelEdit}
                className="p-1 text-red-600 hover:bg-red-50 rounded"
              >
                <XCircle className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => onEditPrice(product)}
              className="font-semibold text-gray-900 hover:text-primary-600"
            >
              {formatCurrency(product.price)}
            </button>
          )}

          <button
            onClick={onTransfer}
            className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
            title="Transfer Stock"
          >
            <ArrowRightLeft className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

interface StockTransferModalProps {
  product: Product;
  stores: { id: string; name: string }[];
  onClose: () => void;
}

function StockTransferModal({ product, stores, onClose }: StockTransferModalProps) {
  const [fromStore, setFromStore] = useState('');
  const [toStore, setToStore] = useState('');
  const [quantity, setQuantity] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle stock transfer
    console.log({ productId: product.id, fromStore, toStore, quantity });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Transfer Stock</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Product</label>
            <p className="text-gray-900">{product.name}</p>
            <p className="text-sm text-gray-500">{product.sku}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">From Store</label>
            <select
              value={fromStore}
              onChange={(e) => setFromStore(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              required
            >
              <option value="">Select source store</option>
              {stores.map((store) => (
                <option key={store.id} value={store.id}>
                  {store.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">To Store</label>
            <select
              value={toStore}
              onChange={(e) => setToStore(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              required
            >
              <option value="">Select destination store</option>
              {stores
                .filter((s) => s.id !== fromStore)
                .map((store) => (
                  <option key={store.id} value={store.id}>
                    {store.name}
                  </option>
                ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
            <input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              min="1"
              required
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
            >
              Transfer
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Products;
