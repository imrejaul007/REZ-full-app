import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'

interface DishChartProps {
  data: Array<{
    name: string
    sales: number
    revenue: number
    margin?: number
  }>
  dataKey?: 'sales' | 'revenue'
  height?: number
  showMargin?: boolean
}

const COLORS = [
  '#0ea5e9',
  '#3b82f6',
  '#6366f1',
  '#8b5cf6',
  '#a855f7',
  '#d946ef',
  '#ec4899',
  '#f43f5e',
]

function DishChart({ data, dataKey = 'sales', height = 300, showMargin = false }: DishChartProps) {
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload
      return (
        <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
          <p className="text-sm font-medium text-gray-900 dark:text-white">{label}</p>
          <div className="mt-2 space-y-1">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Sales: {item.sales.toLocaleString()} orders
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Revenue: {new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD',
              }).format(item.revenue)}
            </p>
            {showMargin && item.margin !== undefined && (
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Margin: {item.margin.toFixed(1)}%
              </p>
            )}
          </div>
        </div>
      )
    }
    return null
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} layout="vertical" margin={{ top: 10, right: 30, left: 80, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" darkStroke="#374151" />
        <XAxis
          type="number"
          tick={{ fontSize: 12 }}
          tickLine={false}
          axisLine={{ stroke: '#e5e7eb', darkStroke: '#374151' }}
          tickFormatter={(value) => dataKey === 'revenue' ? `$${value / 1000}k` : value.toLocaleString()}
        />
        <YAxis
          type="category"
          dataKey="name"
          tick={{ fontSize: 12 }}
          tickLine={false}
          axisLine={false}
          width={75}
        />
        <Tooltip content={<CustomTooltip />} />
        <Bar dataKey={dataKey} radius={[0, 4, 4, 0]} name={dataKey === 'revenue' ? 'Revenue' : 'Sales'}>
          {data.map((_, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

export default DishChart
