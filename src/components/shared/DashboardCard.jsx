import { TrendingUp, TrendingDown } from 'lucide-react';

export default function DashboardCard({ title, value, icon: Icon, trend, trendValue, color = 'primary', className = '' }) {
  const colorMap = {
    primary: { bg: 'bg-primary-50 dark:bg-primary-900/20', icon: 'text-primary-500', border: 'border-primary-100 dark:border-primary-800' },
    accent: { bg: 'bg-accent-50 dark:bg-accent-900/20', icon: 'text-accent-500', border: 'border-accent-100 dark:border-accent-800' },
    success: { bg: 'bg-success-50 dark:bg-success-500/10', icon: 'text-success-500', border: 'border-green-100 dark:border-green-900' },
    warning: { bg: 'bg-warning-50 dark:bg-warning-500/10', icon: 'text-warning-500', border: 'border-amber-100 dark:border-amber-900' },
    danger: { bg: 'bg-danger-50 dark:bg-danger-500/10', icon: 'text-danger-500', border: 'border-red-100 dark:border-red-900' },
  };

  const colors = colorMap[color] || colorMap.primary;

  return (
    <div className={`glass-card p-5 border ${colors.border} ${className}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-[0.8125rem] font-medium text-surface-500 dark:text-surface-400 mb-1">{title}</p>
          <p className="text-2xl font-bold text-surface-900 dark:text-white">{value}</p>
          {trend && (
            <div className={`flex items-center gap-1 mt-2 text-xs font-medium ${trend === 'up' ? 'text-success-500' : 'text-danger-500'}`}>
              {trend === 'up' ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
              <span>{trendValue}</span>
            </div>
          )}
        </div>
        <div className={`p-3 rounded-xl ${colors.bg}`}>
          <Icon size={22} className={colors.icon} />
        </div>
      </div>
    </div>
  );
}
