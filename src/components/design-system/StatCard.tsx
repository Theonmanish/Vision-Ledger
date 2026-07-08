import { cn } from '../../lib/utils';
import { LucideIcon } from 'lucide-react';
import GlassCard from './GlassCard';

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: LucideIcon;
  className?: string;
}

export default function StatCard({ label, value, icon: Icon, className }: StatCardProps) {
  return (
    <GlassCard padding="sm" className={cn('!p-0', className)}>
      <div className="rounded-lg border border-white/[0.06] bg-white/[0.03] px-3 py-2.5 backdrop-blur-sm">
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="text-[10px] text-white/40">{label}</p>
            <p className="mt-0.5 text-sm font-semibold text-white">{value}</p>
          </div>
          {Icon && (
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#2563EB]/15 text-[#3B82F6]">
              <Icon className="h-4 w-4" />
            </div>
          )}
        </div>
      </div>
    </GlassCard>
  );
}
