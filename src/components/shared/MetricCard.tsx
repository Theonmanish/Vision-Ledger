import { cn } from '../../lib/utils';
import { LucideIcon } from 'lucide-react';
import { GlassCard } from '../ui/glass-card';
import { ds } from '../../lib/design-tokens';

interface MetricCardProps {
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

export default function MetricCard({
  icon: Icon,
  label,
  value,
  trend = 'neutral',
  className,
}: MetricCardProps) {
  return (
    <GlassCard hover padding="md" className={className}>
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-[10px] uppercase tracking-wider text-white/40">{label}</p>
          <p className="text-2xl font-bold tracking-tight text-white">{value}</p>
        </div>
        <div className={cn('rounded-lg bg-[#2563EB]/15 p-2', trendColors[trend])}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </GlassCard>
  );
}
