'use client';

import { ReactNode } from 'react';

interface StatsCardProps {
  title: string;
  value: string | number | null;
  unit?: string;
  icon: ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  subtitle?: string;
  variant?: 'default' | 'primary' | 'success' | 'warning';
}

const variantStyles = {
  default: {
    iconBg: 'bg-[var(--background-secondary)]',
    iconColor: 'text-[var(--foreground-muted)]',
  },
  primary: {
    iconBg: 'bg-[var(--accent-primary)]/10',
    iconColor: 'text-[var(--accent-primary)]',
  },
  success: {
    iconBg: 'bg-[var(--success)]/10',
    iconColor: 'text-[var(--success)]',
  },
  warning: {
    iconBg: 'bg-[var(--warning)]/10',
    iconColor: 'text-[var(--warning)]',
  },
};

export function StatsCard({
  title,
  value,
  unit,
  icon,
  trend,
  subtitle,
  variant = 'default',
}: StatsCardProps) {
  const styles = variantStyles[variant];

  return (
    <div className="bg-[var(--background-card)] rounded-xl p-5 border border-[var(--border)] card-hover">
      <div className="flex items-start justify-between mb-3">
        <div
          className={`w-10 h-10 rounded-lg ${styles.iconBg} ${styles.iconColor} flex items-center justify-center`}
        >
          {icon}
        </div>
        {trend && (
          <div
            className={`text-sm font-medium ${
              trend === 'up'
                ? 'text-[var(--success)]'
                : trend === 'down'
                ? 'text-[var(--danger)]'
                : 'text-[var(--foreground-muted)]'
            }`}
          >
            {trend === 'up' && '↑'}
            {trend === 'down' && '↓'}
            {trend === 'neutral' && '→'}
          </div>
        )}
      </div>
      <div className="space-y-1">
        <p className="text-sm text-[var(--foreground-muted)]">{title}</p>
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-bold text-[var(--foreground)]">
            {value ?? '—'}
          </span>
          {unit && (
            <span className="text-sm text-[var(--foreground-muted)]">{unit}</span>
          )}
        </div>
        {subtitle && (
          <p className="text-xs text-[var(--foreground-muted)]">{subtitle}</p>
        )}
      </div>
    </div>
  );
}

