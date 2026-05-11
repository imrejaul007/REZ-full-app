import { AlertTriangle, XCircle, Clock } from 'lucide-react';
import clsx from 'clsx';
import type { Alert } from '../types';

interface LowStockAlertProps {
  alert: Alert;
  onAcknowledge?: (alertId: string) => void;
  compact?: boolean;
  className?: string;
}

export function LowStockAlert({
  alert,
  onAcknowledge,
  compact = false,
  className,
}: LowStockAlertProps) {
  const getAlertIcon = () => {
    switch (alert.type) {
      case 'low_stock':
        return <AlertTriangle className="w-5 h-5" />;
      case 'out_of_stock':
        return <XCircle className="w-5 h-5" />;
      case 'expiring_soon':
        return <Clock className="w-5 h-5" />;
      default:
        return <AlertTriangle className="w-5 h-5" />;
    }
  };

  const getAlertStyles = () => {
    switch (alert.severity) {
      case 'critical':
        return {
          container: 'bg-red-50 border-red-200',
          icon: 'text-red-600',
          text: 'text-red-800',
          badge: 'bg-red-100 text-red-800',
        };
      case 'warning':
        return {
          container: 'bg-orange-50 border-orange-200',
          icon: 'text-orange-600',
          text: 'text-orange-800',
          badge: 'bg-orange-100 text-orange-800',
        };
      case 'info':
        return {
          container: 'bg-blue-50 border-blue-200',
          icon: 'text-blue-600',
          text: 'text-blue-800',
          badge: 'bg-blue-100 text-blue-800',
        };
    }
  };

  const styles = getAlertStyles();

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));

    if (hours < 1) {
      const minutes = Math.floor(diff / (1000 * 60));
      return `${minutes}m ago`;
    }
    if (hours < 24) {
      return `${hours}h ago`;
    }
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  if (compact) {
    return (
      <div className={clsx('flex items-center gap-2', className)}>
        <span
          className={clsx(
            'flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium',
            styles.badge
          )}
        >
          {getAlertIcon()}
          <span>{alert.type.replace('_', ' ')}</span>
        </span>
        <span className="text-sm text-gray-600 truncate">{alert.storeName}</span>
      </div>
    );
  }

  return (
    <div
      className={clsx(
        'p-4 rounded-lg border',
        'flex items-start gap-3',
        styles.container,
        className
      )}
    >
      <div className={clsx('flex-shrink-0 mt-0.5', styles.icon)}>{getAlertIcon()}</div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className={clsx('font-medium text-sm', styles.text)}>{alert.message}</p>
            <p className="text-xs text-gray-500 mt-1">
              {alert.storeName} • {formatTime(alert.createdAt)}
            </p>
          </div>

          {!alert.acknowledged && onAcknowledge && (
            <button
              onClick={() => onAcknowledge(alert.id)}
              className={clsx(
                'flex-shrink-0 px-2.5 py-1 text-xs font-medium rounded-lg',
                'bg-white border border-gray-200 text-gray-600',
                'hover:bg-gray-50 transition-colors'
              )}
            >
              Dismiss
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default LowStockAlert;
