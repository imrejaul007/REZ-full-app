import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  MapPin,
  Phone,
  Mail,
  Users,
  Star,
  TrendingUp,
  Calendar,
  Package,
  ShoppingBag,
  AlertTriangle,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';
import clsx from 'clsx';
import { LowStockAlert } from '../components/LowStockAlert';
import { useStore, useStoreRevenue, useStoreOrders, useStoreStaff, useAlerts } from '../hooks/useMultiStore';
import type { RevenueData, Order, Staff } from '../types';

// Generate sample revenue data
function generateStoreRevenueData(): RevenueData[] {
  const data: RevenueData[] = [];
  const today = new Date();
  for (let i = 29; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    data.push({
      date: date.toISOString().split('T')[0],
      revenue: 3000 + Math.random() * 2000,
      orders: Math.floor(30 + Math.random() * 20),
      avgOrder: 85 + Math.random() * 30,
    });
  }
  return data;
}

const REVENUE_DATA = generateStoreRevenueData();

const ORDER_STATUS_COLORS = {
  completed: 'bg-green-100 text-green-800',
  pending: 'bg-yellow-100 text-yellow-800',
  processing: 'bg-blue-100 text-blue-800',
  cancelled: 'bg-red-100 text-red-800',
};

const STAFF_ROLE_COLORS = {
  manager: 'bg-purple-100 text-purple-800',
  cashier: 'bg-blue-100 text-blue-800',
  stock_clerk: 'bg-green-100 text-green-800',
  security: 'bg-gray-100 text-gray-800',
};

export function StoreDetail() {
  const { storeId } = useParams<{ storeId: string }>();
  const { store, loading, error } = useStore(storeId || '');
  const { revenueData } = useStoreRevenue(storeId || '', 30);
  const { orders } = useStoreOrders(storeId || '');
  const { staff } = useStoreStaff(storeId || '');
  const { alerts } = useAlerts();

  const storeAlerts = alerts?.filter((a) => a.storeId === storeId) || [];

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent"></div>
      </div>
    );
  }

  if (error || !store) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-800">Error loading store: {error?.message || 'Store not found'}</p>
        <Link to="/stores" className="text-primary-600 hover:text-primary-700 mt-2 inline-block">
          Back to Stores
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <Link
            to="/stores"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-500" />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">{store.name}</h1>
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
            </div>
            <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
              <div className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                <span>{store.address}, {store.city}</span>
              </div>
              <div className="flex items-center gap-1">
                <Phone className="w-4 h-4" />
                <span>{store.phone}</span>
              </div>
              <div className="flex items-center gap-1">
                <Mail className="w-4 h-4" />
                <span>{store.email}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <QuickStatCard
          icon={<TrendingUp className="w-5 h-5" />}
          label="Revenue"
          value={formatCurrency(store.revenue)}
          trend="+12.5%"
          trendUp
        />
        <QuickStatCard
          icon={<ShoppingBag className="w-5 h-5" />}
          label="Orders"
          value={store.orders.toLocaleString()}
          trend="+8.2%"
          trendUp
        />
        <QuickStatCard
          icon={<Users className="w-5 h-5" />}
          label="Staff"
          value={store.staffCount.toString()}
          subtext={`${staff?.filter((s) => s.status === 'active').length || 0} active`}
        />
        <QuickStatCard
          icon={<Star className="w-5 h-5" />}
          label="Rating"
          value={store.rating.toFixed(1)}
          subtext="out of 5.0"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Chart */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-900 mb-6">Revenue Trend (30 Days)</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={REVENUE_DATA} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="storeRevenueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis
                  dataKey="date"
                  tickFormatter={(value) => {
                    const date = new Date(value);
                    return `${date.getMonth() + 1}/${date.getDate()}`;
                  }}
                  tick={{ fontSize: 12, fill: '#6b7280' }}
                  axisLine={{ stroke: '#e5e7eb' }}
                  tickLine={false}
                />
                <YAxis
                  tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                  tick={{ fontSize: 12, fill: '#6b7280' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                  }}
                  formatter={(value: number) => [formatCurrency(value), 'Revenue']}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  fill="url(#storeRevenueGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Alerts */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-5 h-5 text-orange-500" />
            <h2 className="font-semibold text-gray-900">Store Alerts</h2>
            {storeAlerts.length > 0 && (
              <span className="px-2 py-0.5 bg-orange-100 text-orange-800 text-xs font-medium rounded-full">
                {storeAlerts.length}
              </span>
            )}
          </div>
          {storeAlerts.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Star className="w-6 h-6 text-green-600" />
              </div>
              <p className="text-gray-500">No active alerts</p>
            </div>
          ) : (
            <div className="space-y-3">
              {storeAlerts.slice(0, 3).map((alert) => (
                <LowStockAlert key={alert.id} alert={alert} compact />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Orders and Staff */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Recent Orders</h2>
            <Link to="/inventory" className="text-sm text-primary-600 hover:text-primary-700">
              View all
            </Link>
          </div>
          {orders && orders.length > 0 ? (
            <div className="space-y-3">
              {orders.slice(0, 5).map((order: Order) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div>
                    <p className="font-medium text-gray-900">{order.orderNumber}</p>
                    <p className="text-sm text-gray-500">{order.customerName}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-900">{formatCurrency(order.total)}</p>
                    <span
                      className={clsx(
                        'px-2 py-0.5 text-xs font-medium rounded-full capitalize',
                        ORDER_STATUS_COLORS[order.status]
                      )}
                    >
                      {order.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No recent orders</p>
            </div>
          )}
        </div>

        {/* Staff List */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Staff Members</h2>
            <span className="text-sm text-gray-500">{staff?.length || 0} total</span>
          </div>
          {staff && staff.length > 0 ? (
            <div className="space-y-3">
              {staff.map((member: Staff) => (
                <div
                  key={member.id}
                  className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                >
                  <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                    <span className="font-semibold text-primary-700">
                      {member.name.split(' ').map((n) => n[0]).join('')}
                    </span>
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{member.name}</p>
                    <p className="text-sm text-gray-500 capitalize">{member.role.replace('_', ' ')}</p>
                  </div>
                  <span
                    className={clsx(
                      'px-2 py-0.5 text-xs font-medium rounded-full capitalize',
                      STAFF_ROLE_COLORS[member.role]
                    )}
                  >
                    {member.role}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No staff members</p>
            </div>
          )}
        </div>
      </div>

      {/* Store Info */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="font-semibold text-gray-900 mb-4">Store Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <p className="text-sm text-gray-500 mb-1">Manager</p>
            <p className="font-medium text-gray-900">{store.manager}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1">Contact</p>
            <p className="font-medium text-gray-900">{store.phone}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1">Email</p>
            <p className="font-medium text-gray-900">{store.email}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1">Address</p>
            <p className="font-medium text-gray-900">{store.address}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1">City</p>
            <p className="font-medium text-gray-900">{store.city}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1">Opened</p>
            <p className="font-medium text-gray-900">{formatDate(store.createdAt)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

interface QuickStatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  subtext?: string;
  trend?: string;
  trendUp?: boolean;
}

function QuickStatCard({ icon, label, value, subtext, trend, trendUp }: QuickStatCardProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="p-2 bg-gray-100 rounded-lg text-gray-600">{icon}</div>
        {trend && (
          <span
            className={`text-xs font-medium ${trendUp ? 'text-green-600' : 'text-red-600'}`}
          >
            {trend}
          </span>
        )}
      </div>
      <p className="text-sm text-gray-500">{label}</p>
      <p className="text-xl font-bold text-gray-900 mt-1">{value}</p>
      {subtext && <p className="text-xs text-gray-400 mt-0.5">{subtext}</p>}
    </div>
  );
}

export default StoreDetail;
