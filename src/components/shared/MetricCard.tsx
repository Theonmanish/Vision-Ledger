import { cn } from '../../lib/utils';
import { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  trend?: 'up' | 'down' | 'neutral';
  className?: string;
}

const trendColors = {
  up: 'text-success',
  down: 'text-danger',
  neutral: 'text-muted',
};

export default function MetricCard({ icon: Icon, label, value, trend = 'neutral', className }: MetricCardProps) {
  return (
    <div
      className={cn(
        'rounded-xl border border-border/50 bg-card p-5 transition-all duration-200 hover:border-border',
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm text-muted">{label}</p>
          <p className="text-2xl font-bold tracking-tight">{value}</p>
        </div>
        <div className={cn('rounded-lg p-2 bg-accent', trendColors[trend])}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}