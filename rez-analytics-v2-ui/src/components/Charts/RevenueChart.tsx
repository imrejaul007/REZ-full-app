import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts'
import { format } from 'date-fns'

interface RevenueChartProps {
  data: Array<{
    date: string | Date
    revenue: number
    previousPeriod?: number
  }>
  showComparison?: boolean
  height?: number
}

function RevenueChart({ data, showComparison = false, height = 300 }: RevenueChartProps) {
  const formattedData = data.map((item) => ({
    ...item,
    date: typeof item.date === 'string' ? item.date : format(item.date, 'MMM dd'),
    revenue: item.revenue,
    previousPeriod: item.previousPeriod,
  }))

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
          <p className="text-sm font-medium text-gray-900 dark:text-white">{label}</p>
          <div className="mt-2 space-y-1">
            {payload.map((entry: any, index: number) => (
              <div key={index} className="flex items-center gap-2">
                <div
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: entry.color }}
                />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {entry.name}: {new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: 'USD',
                    minimumFractionDigits: 0,
                  }).format(entry.value)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )
    }
    return null
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={formattedData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="previousGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#94a3b8" stopOpacity={0.2} />
            <stop offset="95%" stopColor="#94a3b8" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" darkStroke="#374151" />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 12 }}
          tickLine={false}
          axisLine={{ stroke: '#e5e7eb', darkStroke: '#374151' }}
        />
        <YAxis
          tick={{ fontSize: 12 }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => `$${value / 1000}k`}
        />
        <Tooltip content={<CustomTooltip />} />
        {showComparison && (
          <Area
            type="monotone"
            dataKey="previousPeriod"
            stroke="#94a3b8"
            strokeWidth={2}
            fill="url(#previousGradient)"
            name="Previous Period"
            strokeDasharray="5 5"
          />
        )}
        <Area
          type="monotone"
          dataKey="revenue"
          stroke="#0ea5e9"
          strokeWidth={2}
          fill="url(#revenueGradient)"
          name="Revenue"
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}

export default RevenueChart
