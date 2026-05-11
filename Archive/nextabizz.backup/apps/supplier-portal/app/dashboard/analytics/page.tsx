'use client';

import { useState } from 'react';
import Link from 'next/link';

interface RevenueData {
  month: string;
  revenue: number;
  orders: number;
}

interface CategoryData {
  name: string;
  value: number;
  color: string;
}

interface TopProduct {
  id: string;
  name: string;
  units: number;
  revenue: number;
  growth: number;
}

interface MerchantData {
  id: string;
  name: string;
  orders: number;
  revenue: number;
  lastOrder: string;
}

const mockRevenueData: RevenueData[] = [
  { month: 'Jan', revenue: 420000, orders: 145 },
  { month: 'Feb', revenue: 380000, orders: 132 },
  { month: 'Mar', revenue: 510000, orders: 168 },
  { month: 'Apr', revenue: 475000, orders: 155 },
  { month: 'May', revenue: 580000, orders: 189 },
  { month: 'Jun', revenue: 620000, orders: 201 },
  { month: 'Jul', revenue: 590000, orders: 195 },
  { month: 'Aug', revenue: 680000, orders: 218 },
  { month: 'Sep', revenue: 720000, orders: 234 },
  { month: 'Oct', revenue: 695000, orders: 228 },
  { month: 'Nov', revenue: 780000, orders: 256 },
  { month: 'Dec', revenue: 850000, orders: 278 },
];

const mockCategoryData: CategoryData[] = [
  { name: 'Grains & Rice', value: 35, color: 'bg-purple-500' },
  { name: 'Spices', value: 22, color: 'bg-blue-500' },
  { name: 'Oils & Ghee', value: 18, color: 'bg-green-500' },
  { name: 'Frozen Veg', value: 12, color: 'bg-yellow-500' },
  { name: 'Dairy', value: 8, color: 'bg-red-500' },
  { name: 'Other', value: 5, color: 'bg-gray-500' },
];

const mockTopProducts: TopProduct[] = [
  { id: '1', name: 'Organic Basmati Rice - Premium', units: 12500, revenue: 1062500, growth: 12.5 },
  { id: '2', name: 'Cold Pressed Mustard Oil', units: 4200, revenue: 756000, growth: 8.3 },
  { id: '3', name: 'Organic Turmeric Powder', units: 3100, revenue: 542500, growth: 15.2 },
  { id: '4', name: 'Whole Wheat Atta - Stone Ground', units: 28000, revenue: 420000, growth: 6.8 },
  { id: '5', name: 'Fresh Green Peas - Frozen', units: 1850, revenue: 370000, growth: -2.1 },
];

const mockTopMerchants: MerchantData[] = [
  { id: '1', name: 'Spice Garden Restaurant', orders: 45, revenue: 892000, lastOrder: '2024-01-15' },
  { id: '2', name: 'Hotel Sunrise', orders: 38, revenue: 756000, lastOrder: '2024-01-14' },
  { id: '3', name: 'Taj Banquet Hall', orders: 32, revenue: 684000, lastOrder: '2024-01-13' },
  { id: '4', name: 'Cafe Mocha', orders: 28, revenue: 445000, lastOrder: '2024-01-15' },
  { id: '5', name: 'Urban Kitchen', orders: 24, revenue: 398000, lastOrder: '2024-01-12' },
];

const deliveryMetrics = [
  { label: 'On-Time Delivery', value: 95, target: 98, color: 'bg-green-500' },
  { label: 'Order Accuracy', value: 98.5, target: 99, color: 'bg-blue-500' },
  { label: 'Avg Lead Time', value: 2.3, target: 2, color: 'bg-yellow-500', unit: 'days' },
  { label: 'Return Rate', value: 1.2, target: 1, color: 'bg-red-500', unit: '%', inverse: true },
];

export default function AnalyticsPage() {
  const [dateRange, setDateRange] = useState<'30d' | '90d' | '6m' | '1y'>('6m');
  const [selectedMetric, setSelectedMetric] = useState<'revenue' | 'orders'>('revenue');

  const totalRevenue = mockRevenueData.reduce((sum, d) => sum + d.revenue, 0);
  const totalOrders = mockRevenueData.reduce((sum, d) => sum + d.orders, 0);
  const avgOrderValue = totalRevenue / totalOrders;
  const maxRevenue = Math.max(...mockRevenueData.map(d => d.revenue));
  const maxOrders = Math.max(...mockRevenueData.map(d => d.orders));

  const formatCurrency = (value: number) => {
    if (value >= 1000000) return `₹${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `₹${(value / 1000).toFixed(0)}K`;
    return `₹${value}`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Link href="/dashboard" className="text-gray-500 hover:text-gray-700">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </Link>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">NB</span>
                </div>
                <span className="text-xl font-bold text-gray-900">NextaBizz</span>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center">
                <span className="text-white font-semibold text-sm">FS</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            <Link href="/dashboard" className="border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 py-4 px-1 text-sm font-medium">
              Dashboard
            </Link>
            <Link href="/dashboard/orders" className="border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 py-4 px-1 text-sm font-medium">
              Orders
            </Link>
            <Link href="/dashboard/products" className="border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 py-4 px-1 text-sm font-medium">
              Products
            </Link>
            <Link href="/dashboard/rfqs" className="border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 py-4 px-1 text-sm font-medium">
              RFQs
            </Link>
            <Link href="/dashboard/performance" className="border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 py-4 px-1 text-sm font-medium">
              Performance
            </Link>
            <Link href="/dashboard/analytics" className="border-b-2 border-purple-600 text-purple-600 py-4 px-1 text-sm font-medium">
              Analytics
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Business Analytics</h1>
            <p className="mt-1 text-sm text-gray-600">Track your business performance and trends</p>
          </div>
          <div className="mt-4 sm:mt-0 flex items-center space-x-3">
            {/* Date Range Selector */}
            <div className="flex bg-white border border-gray-200 rounded-lg overflow-hidden">
              {(['30d', '90d', '6m', '1y'] as const).map((range) => (
                <button
                  key={range}
                  onClick={() => setDateRange(range)}
                  className={`px-4 py-2 text-sm font-medium transition-colors ${
                    dateRange === range
                      ? 'bg-purple-600 text-white'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {range}
                </button>
              ))}
            </div>
            <button className="px-4 py-2 bg-white border border-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors flex items-center space-x-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span>Export</span>
            </button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div className="p-2 bg-green-100 rounded-lg">
                <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <span className="text-sm font-medium text-green-600 flex items-center">
                <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                </svg>
                +18.5%
              </span>
            </div>
            <div className="mt-4">
              <div className="text-3xl font-bold text-gray-900">₹{formatCurrency(totalRevenue)}</div>
              <div className="text-sm text-gray-500 mt-1">Total Revenue</div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div className="p-2 bg-blue-100 rounded-lg">
                <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <span className="text-sm font-medium text-green-600 flex items-center">
                <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                </svg>
                +12.3%
              </span>
            </div>
            <div className="mt-4">
              <div className="text-3xl font-bold text-gray-900">{totalOrders.toLocaleString()}</div>
              <div className="text-sm text-gray-500 mt-1">Total Orders</div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div className="p-2 bg-purple-100 rounded-lg">
                <svg className="w-6 h-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <span className="text-sm font-medium text-green-600 flex items-center">
                <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                </svg>
                +8.7%
              </span>
            </div>
            <div className="mt-4">
              <div className="text-3xl font-bold text-gray-900">₹{avgOrderValue.toFixed(0)}</div>
              <div className="text-sm text-gray-500 mt-1">Avg Order Value</div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <svg className="w-6 h-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <span className="text-sm font-medium text-green-600 flex items-center">
                <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                </svg>
                +15.2%
              </span>
            </div>
            <div className="mt-4">
              <div className="text-3xl font-bold text-gray-900">156</div>
              <div className="text-sm text-gray-500 mt-1">Active Merchants</div>
            </div>
          </div>
        </div>

        {/* Revenue Chart & Category Distribution */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Revenue Chart */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">Revenue & Orders Trend</h2>
              <div className="flex space-x-2">
                <button
                  onClick={() => setSelectedMetric('revenue')}
                  className={`px-3 py-1 text-sm font-medium rounded-lg ${
                    selectedMetric === 'revenue'
                      ? 'bg-purple-100 text-purple-700'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  Revenue
                </button>
                <button
                  onClick={() => setSelectedMetric('orders')}
                  className={`px-3 py-1 text-sm font-medium rounded-lg ${
                    selectedMetric === 'orders'
                      ? 'bg-purple-100 text-purple-700'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  Orders
                </button>
              </div>
            </div>
            <div className="h-72 flex items-end justify-between space-x-2">
              {mockRevenueData.map((data, index) => {
                const height = selectedMetric === 'revenue'
                  ? (data.revenue / maxRevenue) * 100
                  : (data.orders / maxOrders) * 100;
                return (
                  <div key={index} className="flex-1 flex flex-col items-center group">
                    <div className="w-full relative">
                      <div
                        className={`w-full rounded-t-lg transition-all duration-300 ${
                          index === mockRevenueData.length - 1
                            ? 'bg-purple-600'
                            : 'bg-purple-200 hover:bg-purple-300'
                        }`}
                        style={{ height: `${height}%`, minHeight: '8px' }}
                      >
                        <div className="absolute -top-12 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap z-10">
                          <div className="font-semibold">
                            {selectedMetric === 'revenue' ? formatCurrency(data.revenue) : data.orders}
                          </div>
                          <div className="text-gray-400">{data.month}</div>
                        </div>
                      </div>
                    </div>
                    <span className="mt-2 text-xs text-gray-500">{data.month}</span>
                  </div>
                );
              })}
            </div>
            <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between text-sm">
              <div>
                <span className="text-gray-500">Period: </span>
                <span className="font-medium text-gray-900">Jan 2024 - Dec 2024</span>
              </div>
              <div className="flex items-center space-x-4">
                <span className="flex items-center text-gray-600">
                  <span className="w-3 h-3 bg-purple-600 rounded mr-1"></span>
                  {selectedMetric === 'revenue' ? 'Revenue' : 'Orders'}
                </span>
              </div>
            </div>
          </div>

          {/* Category Distribution */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Sales by Category</h2>
            <div className="flex items-center justify-center mb-6">
              {/* Simple Donut Chart */}
              <div className="relative w-40 h-40">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                  {mockCategoryData.reduce((acc, cat, index) => {
                    const percentage = cat.value;
                    const offset = acc.offset;
                    acc.elements.push(
                      <circle
                        key={cat.name}
                        cx="18"
                        cy="18"
                        r="14"
                        fill="none"
                        stroke={cat.color.replace('bg-', '')}
                        strokeWidth="4"
                        strokeDasharray={`${percentage} ${100 - percentage}`}
                        strokeDashoffset={-offset}
                        className={cat.color}
                      />
                    );
                    acc.offset += percentage;
                    return acc;
                  }, { elements: [] as React.ReactNode[], offset: 0 }).elements}
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-bold text-gray-900">{mockCategoryData[0].value}%</span>
                  <span className="text-xs text-gray-500">Top Category</span>
                </div>
              </div>
            </div>
            <div className="space-y-3">
              {mockCategoryData.map((cat) => (
                <div key={cat.name} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className={`w-3 h-3 rounded-full ${cat.color}`}></div>
                    <span className="text-sm text-gray-600">{cat.name}</span>
                  </div>
                  <span className="text-sm font-medium text-gray-900">{cat.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Top Products & Merchants */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Top Products */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">Top Products</h2>
              <Link href="/dashboard/products" className="text-sm font-medium text-purple-600 hover:text-purple-700">
                View all
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <th className="pb-3">Product</th>
                    <th className="pb-3 text-right">Units</th>
                    <th className="pb-3 text-right">Revenue</th>
                    <th className="pb-3 text-right">Growth</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {mockTopProducts.map((product) => (
                    <tr key={product.id} className="hover:bg-gray-50">
                      <td className="py-3">
                        <span className="text-sm font-medium text-gray-900">{product.name}</span>
                      </td>
                      <td className="py-3 text-right text-sm text-gray-600">
                        {product.units.toLocaleString()}
                      </td>
                      <td className="py-3 text-right text-sm font-medium text-gray-900">
                        {formatCurrency(product.revenue)}
                      </td>
                      <td className="py-3 text-right">
                        <span className={`inline-flex items-center text-sm font-medium ${
                          product.growth >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {product.growth >= 0 ? '+' : ''}{product.growth}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Top Merchants */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">Top Merchants</h2>
              <Link href="/dashboard/orders" className="text-sm font-medium text-purple-600 hover:text-purple-700">
                View all
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <th className="pb-3">Merchant</th>
                    <th className="pb-3 text-right">Orders</th>
                    <th className="pb-3 text-right">Revenue</th>
                    <th className="pb-3 text-right">Last Order</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {mockTopMerchants.map((merchant) => (
                    <tr key={merchant.id} className="hover:bg-gray-50">
                      <td className="py-3">
                        <span className="text-sm font-medium text-gray-900">{merchant.name}</span>
                      </td>
                      <td className="py-3 text-right text-sm text-gray-600">
                        {merchant.orders}
                      </td>
                      <td className="py-3 text-right text-sm font-medium text-gray-900">
                        {formatCurrency(merchant.revenue)}
                      </td>
                      <td className="py-3 text-right text-sm text-gray-500">
                        {new Date(merchant.lastOrder).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short'
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Delivery Metrics */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Delivery Performance Metrics</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {deliveryMetrics.map((metric, index) => (
              <div key={index} className="p-4 bg-gray-50 rounded-xl">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-gray-700">{metric.label}</span>
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                    metric.inverse
                      ? metric.value <= metric.target ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      : metric.value >= metric.target ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {metric.value}{metric.unit || '%'}
                  </span>
                </div>
                <div className="relative h-3 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`absolute left-0 top-0 h-full rounded-full ${metric.color}`}
                    style={{ width: `${Math.min((metric.value / (metric.target * 1.2)) * 100, 100)}%` }}
                  ></div>
                </div>
                <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
                  <span>Target: {metric.target}{metric.unit || '%'}</span>
                  <span className={metric.inverse
                    ? metric.value <= metric.target ? 'text-green-600' : 'text-red-600'
                    : metric.value >= metric.target ? 'text-green-600' : 'text-yellow-600'
                  }>
                    {metric.inverse
                      ? metric.value <= metric.target ? 'On Track' : 'Below Target'
                      : metric.value >= metric.target ? 'On Track' : 'Below Target'
                    }
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
