import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts';
import clsx from 'clsx';
import type { StoreComparison } from '../types';

interface ComparisonChartProps {
  data: StoreComparison;
  metric?: 'revenue' | 'orders' | 'avgOrder';
  showTrend?: boolean;
  className?: string;
}

export function ComparisonChart({
  data,
  metric = 'revenue',
  showTrend = false,
  className,
}: ComparisonChartProps) {
  const formatValue = (value: number, metricType: string) => {
    if (metricType === 'revenue') {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(value);
    }
    if (metricType === 'orders') {
      return value.toLocaleString();
    }
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(value);
  };

  const metricLabels = {
    revenue: 'Revenue',
    orders: 'Orders',
    avgOrder: 'Avg Order Value',
  };

  const chartData = data.stores.map((store) => ({
    name: store.name.replace('ReZ ', ''),
    fullName: store.name,
    value: store[metric],
    orders: store.orders,
    avgOrder: store.avgOrder,
    revenue: store.revenue,
  }));

  const sortedData = [...chartData].sort((a, b) => b.value - a.value);

  return (
    <div className={clsx('bg-white rounded-xl border border-gray-200 p-5', className)}>
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-semibold text-gray-900">
          Store Comparison - {metricLabels[metric]}
        </h3>
        <span className="text-sm text-gray-500 capitalize">{data.period}</span>
      </div>

      {/* Metric Tabs */}
      <div className="flex gap-2 mb-6">
        {(['revenue', 'orders', 'avgOrder'] as const).map((m) => (
          <button
            key={m}
            onClick={() => {}}
            className={clsx(
              'px-3 py-1.5 text-sm rounded-lg transition-colors',
              metric === m
                ? 'bg-primary-100 text-primary-700 font-medium'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            )}
          >
            {metricLabels[m]}
          </button>
        ))}
      </div>

      {/* Bar Chart */}
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={sortedData} layout="vertical" margin={{ left: 20, right: 30 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
            <XAxis
              type="number"
              tickFormatter={(value) => formatValue(value, metric)}
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
              formatter={(value: number) => [formatValue(value, metric), metricLabels[metric]]}
              labelFormatter={(label) => {
                const store = sortedData.find((d) => d.name === label);
                return store?.fullName || label;
              }}
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
              }}
            />
            <Bar
              dataKey="value"
              fill="#3b82f6"
              radius={[0, 4, 4, 0]}
              maxBarSize={40}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Summary Stats */}
      <div className="mt-6 pt-6 border-t border-gray-100 grid grid-cols-3 gap-4">
        <div>
          <p className="text-xs text-gray-500 mb-1">Highest</p>
          <p className="font-semibold text-gray-900 truncate">
            {sortedData[0]?.fullName || 'N/A'}
          </p>
          <p className="text-sm text-green-600">
            {formatValue(sortedData[0]?.value || 0, metric)}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500 mb-1">Average</p>
          <p className="font-semibold text-gray-900">
            {formatValue(
              sortedData.reduce((sum, d) => sum + d.value, 0) / (sortedData.length || 1),
              metric
            )}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500 mb-1">Lowest</p>
          <p className="font-semibold text-gray-900 truncate">
            {sortedData[sortedData.length - 1]?.fullName || 'N/A'}
          </p>
          <p className="text-sm text-red-600">
            {formatValue(sortedData[sortedData.length - 1]?.value || 0, metric)}
          </p>
        </div>
      </div>
    </div>
  );
}

export default ComparisonChart;
