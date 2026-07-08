import { cn } from '../../lib/utils';
import { LucideIcon } from 'lucide-react';
import { GlassCard } from './glass-card';

interface StatCardProps {
  icon?: LucideIcon;
  label: string;
  value: string | number;
  className?: string;
}

export function StatCard({ icon: Icon, label, value, className }: StatCardProps) {
  return (
    <GlassCard hover padding="sm" className={cn('text-center sm:text-left', className)}>
      <div className="flex flex-col items-center gap-3 sm:flex-row sm:items-start">
        {Icon && (
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#2563EB]/15 text-[#3B82F6]">
            <Icon className="h-4 w-4" />
          </div>
        )}
        <div>
          <p className="text-[10px] uppercase tracking-wider text-white/40">{label}</p>
          <p className="mt-0.5 text-lg font-semibold text-white">{value}</p>
        </div>
      </div>
    </GlassCard>
  );
}
