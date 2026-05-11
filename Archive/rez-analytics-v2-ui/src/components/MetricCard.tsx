import { ReactNode } from 'react'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import clsx from 'clsx'

interface MetricCardProps {
  title: string
  value: string | number
  change?: number
  changeLabel?: string
  icon?: ReactNode
  trend?: 'up' | 'down' | 'neutral'
  format?: 'currency' | 'number' | 'percent' | 'time'
  className?: string
}

function MetricCard({
  title,
  value,
  change,
  changeLabel,
  icon,
  trend,
  format = 'number',
  className,
}: MetricCardProps) {
  const trendType = trend || (change === undefined ? 'neutral' : change > 0 ? 'up' : change < 0 ? 'down' : 'neutral')

  const formattedValue = () => {
    if (typeof value === 'string') return value
    switch (format) {
      case 'currency':
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        }).format(value)
      case 'percent':
        return `${value.toFixed(1)}%`
      case 'time':
        return `${value} min`
      default:
        return new Intl.NumberFormat('en-US').format(value)
    }
  }

  const TrendIcon = trendType === 'up' ? TrendingUp : trendType === 'down' ? TrendingDown : Minus

  const trendColor = clsx(
    trendType === 'up' && 'text-success-600 dark:text-success-400',
    trendType === 'down' && 'text-danger-600 dark:text-danger-400',
    trendType === 'neutral' && 'text-gray-500 dark:text-gray-400'
  )

  const trendBg = clsx(
    trendType === 'up' && 'bg-success-50 dark:bg-success-900/30',
    trendType === 'down' && 'bg-danger-50 dark:bg-danger-900/30',
    trendType === 'neutral' && 'bg-gray-100 dark:bg-gray-700'
  )

  return (
    <div
      className={clsx(
        'bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 transition-shadow hover:shadow-md',
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
          <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-white tabular-nums">
            {formattedValue()}
          </p>
          {change !== undefined && (
            <div className="mt-2 flex items-center gap-1.5">
              <span className={clsx('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium', trendBg, trendColor)}>
                <TrendIcon className="w-3 h-3" />
                {Math.abs(change).toFixed(1)}%
              </span>
              {changeLabel && (
                <span className="text-xs text-gray-500 dark:text-gray-400">{changeLabel}</span>
              )}
            </div>
          )}
        </div>
        {icon && (
          <div className="p-2.5 bg-primary-50 dark:bg-primary-900/30 rounded-lg">
            <div className="text-primary-600 dark:text-primary-400">{icon}</div>
          </div>
        )}
      </div>
    </div>
  )
}

export default MetricCard
