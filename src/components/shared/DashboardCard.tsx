import { memo } from 'react';
import { cn } from '../../lib/utils';
import { LucideIcon } from 'lucide-react';
import { GlassCard } from '../ui/glass-card';
import { ds } from '../../lib/design-tokens';

interface DashboardCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  trend?: 'up' | 'down' | 'neutral';
  className?: string;
}

const trendColors = {
  up: 'text-[#22C55E]',
  down: 'text-red-400',
  neutral: 'text-white/50',
};

function DashboardCardInner({
  icon: Icon,
  label,
  value,
  trend = 'neutral',
  className,
}: DashboardCardProps) {
  return (
    <GlassCard hover padding="md" className={className}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 space-y-2">
          <p className={ds.metricLabel}>{label}</p>
          <p className={cn(ds.metricValue, 'truncate text-xl sm:text-2xl')}>{value}</p>
        </div>
        <div className={cn('shrink-0 rounded-lg bg-[#2563EB]/15 p-2', trendColors[trend])}>
          <Icon className="h-5 w-5" aria-hidden="true" />
        </div>
      </div>
    </GlassCard>
  );
}

const DashboardCard = memo(DashboardCardInner);
export default DashboardCard;
