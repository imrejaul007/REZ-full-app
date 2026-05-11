import { useState } from 'react';
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  ShoppingBag,
  Calendar,
  Download,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from 'recharts';
import clsx from 'clsx';
import { ComparisonChart } from '../components/ComparisonChart';
import { useStoreComparison, useStores } from '../hooks/useMultiStore';
import type { StoreComparison } from '../types';

type Period = 'day' | 'week' | 'month';
type ReportTab = 'comparison' | 'performance' | 'trends';

export function Reports() {
  const [period, setPeriod] = useState<Period>('month');
  const [activeTab, setActiveTab] = useState<ReportTab>('comparison');
  const { stores } = useStores();
  const { comparison, loading, error } = useStoreComparison(period);

  const tabs: { id: ReportTab; label: string; icon: React.ReactNode }[] = [
    { id: 'comparison', label: 'Store Comparison', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'performance', label: 'Performance Metrics', icon: <TrendingUp className="w-4 h-4" /> },
    { id: 'trends', label: 'Revenue Trends', icon: <DollarSign className="w-4 h-4" /> },
  ];

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

  if (error || !comparison) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-800">Error loading reports: {error?.message}</p>
      </div>
    );
  }

  // Prepare chart data
  const revenueChartData = comparison.stores
    .map((s) => ({
      name: s.name.replace('ReZ ', ''),
      fullName: s.name,
      revenue: s.revenue,
      orders: s.orders,
      avgOrder: s.avgOrder,
    }))
    .sort((a, b) => b.revenue - a.revenue);

  const ordersChartData = comparison.stores
    .map((s) => ({
      name: s.name.replace('ReZ ', ''),
      fullName: s.name,
      orders: s.orders,
    }))
    .sort((a, b) => b.orders - a.orders);

  // Generate mock trend data
  const trendData = generateTrendData(period);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Multi-Store Reports</h1>
          <p className="text-gray-500 mt-1">
            Compare performance across all your stores
          </p>
        </div>

        {/* Period Selector */}
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-gray-400" />
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value as Period)}
            className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="day">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
          </select>
        </div>
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
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      {activeTab === 'comparison' && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <SummaryCard
              icon={<DollarSign className="w-5 h-5" />}
              label="Total Revenue"
              value={formatCurrency(
                comparison.stores.reduce((sum, s) => sum + s.revenue, 0)
              )}
              subtext={`${comparison.stores.length} stores`}
              color="blue"
            />
            <SummaryCard
              icon={<ShoppingBag className="w-5 h-5" />}
              label="Total Orders"
              value={comparison.stores
                .reduce((sum, s) => sum + s.orders, 0)
                .toLocaleString()}
              subtext="Across all stores"
              color="green"
            />
            <SummaryCard
              icon={<TrendingUp className="w-5 h-5" />}
              label="Avg Order Value"
              value={formatCurrency(
                comparison.stores.reduce((sum, s) => sum + s.avgOrder, 0) /
                  comparison.stores.length
              )}
              subtext="Per transaction"
              color="purple"
            />
            <SummaryCard
              icon={<BarChart3 className="w-5 h-5" />}
              label="Top Store"
              value={revenueChartData[0]?.fullName || 'N/A'}
              subtext={formatCurrency(revenueChartData[0]?.revenue || 0)}
              color="orange"
            />
          </div>

          {/* Revenue Comparison Chart */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="font-semibold text-gray-900 mb-6">Revenue by Store</h2>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueChartData} layout="vertical" margin={{ left: 20, right: 30 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                  <XAxis
                    type="number"
                    tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                    tick={{ fontSize: 12, fill: '#6b7280' }}
                    axisLine={{ stroke: '#e5e7eb' }}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={100}
                    tick={{ fontSize: 12, fill: '#374151' }}
                    axisLine={{ stroke: '#e5e7eb' }}
                  />
                  <Tooltip
                    formatter={(value: number) => [formatCurrency(value), 'Revenue']}
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                    }}
                  />
                  <Bar dataKey="revenue" fill="#3b82f6" radius={[0, 4, 4, 0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Orders and Avg Order Side by Side */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Orders Chart */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h2 className="font-semibold text-gray-900 mb-6">Orders by Store</h2>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={ordersChartData} layout="vertical" margin={{ left: 20, right: 30 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                    <XAxis
                      type="number"
                      tick={{ fontSize: 12, fill: '#6b7280' }}
                      axisLine={{ stroke: '#e5e7eb' }}
                    />
                    <YAxis
                      type="category"
                      dataKey="name"
                      width={100}
                      tick={{ fontSize: 12, fill: '#374151' }}
                      axisLine={{ stroke: '#e5e7eb' }}
                    />
                    <Tooltip
                      formatter={(value: number) => [value.toLocaleString(), 'Orders']}
                      contentStyle={{
                        backgroundColor: 'white',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                      }}
                    />
                    <Bar dataKey="orders" fill="#22c55e" radius={[0, 4, 4, 0]} maxBarSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Top Category */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h2 className="font-semibold text-gray-900 mb-6">Top Categories</h2>
              <div className="h-64 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-32 h-32 mx-auto mb-4 rounded-full bg-primary-100 flex items-center justify-center">
                    <ShoppingBag className="w-16 h-16 text-primary-600" />
                  </div>
                  <p className="text-lg font-semibold text-gray-900">Electronics</p>
                  <p className="text-sm text-gray-500">45% of total sales</p>
                </div>
              </div>
            </div>
          </div>

          {/* Store Comparison Component */}
          <ComparisonChart data={comparison} metric="revenue" />
        </div>
      )}

      {activeTab === 'performance' && (
        <div className="space-y-6">
          {/* Performance Table */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-200">
              <h2 className="font-semibold text-gray-900">Store Performance Summary</h2>
            </div>
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Store
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Revenue
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Orders
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Avg Order
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Top Category
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Performance
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {comparison.stores.map((store, index) => {
                  const maxRevenue = Math.max(...comparison.stores.map((s) => s.revenue));
                  const performance = Math.round((store.revenue / maxRevenue) * 100);

                  return (
                    <tr key={store.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 font-medium text-gray-900">{store.name}</td>
                      <td className="px-6 py-4 text-right">{formatCurrency(store.revenue)}</td>
                      <td className="px-6 py-4 text-right">{store.orders.toLocaleString()}</td>
                      <td className="px-6 py-4 text-right">{formatCurrency(store.avgOrder)}</td>
                      <td className="px-6 py-4 text-right">{store.topCategory}</td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className={clsx(
                                'h-full rounded-full',
                                index === 0 ? 'bg-green-500' : index === 1 ? 'bg-blue-500' : 'bg-primary-500'
                              )}
                              style={{ width: `${performance}%` }}
                            />
                          </div>
                          <span className="text-sm text-gray-600 w-10">{performance}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'trends' && (
        <div className="space-y-6">
          {/* Revenue Trend Chart */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-semibold text-gray-900">Revenue Trend</h2>
              <button className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
                <Download className="w-4 h-4" />
                Export
              </button>
            </div>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                  <XAxis
                    dataKey="date"
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
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4, fill: '#3b82f6' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="previousPeriod"
                    stroke="#e5e7eb"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="flex items-center justify-center gap-6 mt-4">
              <div className="flex items-center gap-2">
                <div className="w-4 h-0.5 bg-primary-500" />
                <span className="text-sm text-gray-600">Current Period</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-0.5 bg-gray-300 border-dashed" style={{ borderBottom: '2px dashed #e5e7eb', height: 0 }} />
                <span className="text-sm text-gray-600">Previous Period</span>
              </div>
            </div>
          </div>

          {/* Trend Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <TrendStatCard
              label="Revenue Growth"
              value="+15.2%"
              trend="up"
              description="vs previous period"
            />
            <TrendStatCard
              label="Order Growth"
              value="+8.5%"
              trend="up"
              description="vs previous period"
            />
            <TrendStatCard
              label="Avg Order Value"
              value="+3.2%"
              trend="up"
              description="vs previous period"
            />
          </div>
        </div>
      )}
    </div>
  );
}

interface SummaryCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  subtext: string;
  color: 'blue' | 'green' | 'purple' | 'orange';
}

function SummaryCard({ icon, label, value, subtext, color }: SummaryCardProps) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    purple: 'bg-purple-50 text-purple-600',
    orange: 'bg-orange-50 text-orange-600',
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="flex items-start justify-between">
        <div className={clsx('p-2 rounded-lg', colorClasses[color])}>{icon}</div>
      </div>
      <p className="text-sm text-gray-500 mt-3">{label}</p>
      <p className="text-xl font-bold text-gray-900 mt-1">{value}</p>
      <p className="text-xs text-gray-400 mt-0.5">{subtext}</p>
    </div>
  );
}

interface TrendStatCardProps {
  label: string;
  value: string;
  trend: 'up' | 'down';
  description: string;
}

function TrendStatCard({ label, value, trend, description }: TrendStatCardProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <p className="text-sm text-gray-500">{label}</p>
      <div className="flex items-center gap-2 mt-1">
        <span
          className={clsx(
            'text-2xl font-bold',
            trend === 'up' ? 'text-green-600' : 'text-red-600'
          )}
        >
          {value}
        </span>
        <TrendingUp
          className={clsx('w-5 h-5', trend === 'up' ? 'text-green-500' : 'text-red-500 rotate-180')}
        />
      </div>
      <p className="text-xs text-gray-400 mt-1">{description}</p>
    </div>
  );
}

// Generate mock trend data
function generateTrendData(period: Period) {
  const days = period === 'day' ? 24 : period === 'week' ? 7 : 30;
  const data = [];
  const today = new Date();

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    if (period === 'day') {
      date.setHours(date.getHours() - i);
    } else {
      date.setDate(date.getDate() - i);
    }

    const baseRevenue = 3000 + Math.random() * 2000;
    const previousRevenue = baseRevenue * (0.85 + Math.random() * 0.15);

    data.push({
      date: period === 'day'
        ? `${date.getHours()}:00`
        : `${date.getMonth() + 1}/${date.getDate()}`,
      revenue: Math.round(baseRevenue),
      previousPeriod: Math.round(previousRevenue),
    });
  }

  return data;
}

export default Reports;
