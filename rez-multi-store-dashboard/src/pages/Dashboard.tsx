import { Link } from 'react-router-dom';
import {
  Building2,
  DollarSign,
  ShoppingCart,
  TrendingUp,
  AlertTriangle,
  ArrowRight,
  CheckCircle,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import clsx from 'clsx';
import { StoreCard } from '../components/StoreCard';
import { LowStockAlert } from '../components/LowStockAlert';
import { useAllStoresDashboard, useAlerts } from '../hooks/useMultiStore';
import type { RevenueData } from '../types';

// Generate sample revenue data
function generateRevenueData(): RevenueData[] {
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

const REVENUE_DATA = generateRevenueData();

const PIE_DATA = [
  { name: 'Active Stores', value: 4, color: '#22c55e' },
  { name: 'Pending', value: 1, color: '#eab308' },
  { name: 'Inactive', value: 1, color: '#94a3b8' },
];

export function Dashboard() {
  const { dashboard, loading, error } = useAllStoresDashboard();
  const { alerts, acknowledgeAlert } = useAlerts();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-800">Error loading dashboard: {error.message}</p>
      </div>
    );
  }

  if (!dashboard) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">All Stores Overview</h1>
          <p className="text-gray-500 mt-1">
            Monitoring {dashboard.totalStores} stores across all locations
          </p>
        </div>
        <Link
          to="/reports"
          className={clsx(
            'flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg',
            'hover:bg-primary-700 transition-colors'
          )}
        >
          View Reports
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          icon={<Building2 className="w-5 h-5" />}
          label="Total Stores"
          value={dashboard.totalStores.toString()}
          subtext={`${dashboard.activeStores} active`}
          trend="+2 this month"
          color="blue"
        />
        <StatCard
          icon={<DollarSign className="w-5 h-5" />}
          label="Total Revenue"
          value={formatCurrency(dashboard.totalRevenue)}
          subtext="Combined all stores"
          trend="+15.2% vs last month"
          color="green"
        />
        <StatCard
          icon={<ShoppingCart className="w-5 h-5" />}
          label="Total Orders"
          value={dashboard.totalOrders.toLocaleString()}
          subtext="Across all stores"
          trend="+8.5% vs last month"
          color="purple"
        />
        <StatCard
          icon={<TrendingUp className="w-5 h-5" />}
          label="Avg Order Value"
          value={formatCurrency(dashboard.avgOrderValue)}
          subtext="Per transaction"
          trend="+3.2% vs last month"
          color="orange"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Chart */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-semibold text-gray-900">Revenue Trend (30 Days)</h2>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-primary-500" />
                <span className="text-gray-600">Revenue</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <span className="text-gray-600">Orders</span>
              </div>
            </div>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={REVENUE_DATA} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
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
                  labelFormatter={(label) => new Date(label).toLocaleDateString()}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  fill="url(#revenueGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Store Status Pie Chart */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-900 mb-6">Store Status</h2>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={PIE_DATA}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={70}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {PIE_DATA.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-2 mt-4">
            {PIE_DATA.map((item) => (
              <div key={item.name} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-gray-600">{item.name}</span>
                </div>
                <span className="font-medium text-gray-900">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Alerts Section */}
      {dashboard.alerts.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-500" />
              <h2 className="font-semibold text-gray-900">Active Alerts</h2>
              <span className="px-2 py-0.5 bg-orange-100 text-orange-800 text-xs font-medium rounded-full">
                {dashboard.alerts.length}
              </span>
            </div>
            <Link to="/inventory" className="text-sm text-primary-600 hover:text-primary-700">
              View all
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {dashboard.alerts.slice(0, 4).map((alert) => (
              <LowStockAlert
                key={alert.id}
                alert={alert}
                onAcknowledge={acknowledgeAlert}
              />
            ))}
          </div>
        </div>
      )}

      {/* Top Stores */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-semibold text-gray-900">Top Performing Stores</h2>
          <Link to="/stores" className="text-sm text-primary-600 hover:text-primary-700">
            View all stores
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {dashboard.topStores.map((store) => (
            <StoreCard key={store.id} store={store} variant="compact" />
          ))}
        </div>
      </div>
    </div>
  );
}

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  subtext: string;
  trend: string;
  color: 'blue' | 'green' | 'purple' | 'orange';
}

function StatCard({ icon, label, value, subtext, trend, color }: StatCardProps) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    purple: 'bg-purple-50 text-purple-600',
    orange: 'bg-orange-50 text-orange-600',
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-start justify-between">
        <div className={clsx('p-2.5 rounded-lg', colorClasses[color])}>{icon}</div>
        <div className="flex items-center gap-1 text-xs text-green-600">
          <TrendingUp className="w-3 h-3" />
          <span>{trend}</span>
        </div>
      </div>
      <div className="mt-4">
        <p className="text-sm text-gray-500">{label}</p>
        <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
        <p className="text-xs text-gray-400 mt-1">{subtext}</p>
      </div>
    </div>
  );
}

export default Dashboard;
