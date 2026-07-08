import { cn } from '../../lib/utils';
import { LucideIcon } from 'lucide-react';
import { Badge } from '../ui/badge';
import { GlassCard } from '../ui/glass-card';
import { ds } from '../../lib/design-tokens';

interface ResultCardProps {
  icon: LucideIcon;
  title: string;
  children: React.ReactNode;
  badge?: string;
  badgeVariant?: 'default' | 'secondary' | 'success' | 'warning' | 'danger';
  className?: string;
}

export default function ResultCard({
  icon: Icon,
  title,
  children,
  badge,
  badgeVariant = 'default',
  className,
}: ResultCardProps) {
  return (
    <GlassCard hover padding="md" className={className}>
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={ds.iconBox}>
            <Icon className="h-4 w-4" />
          </div>
          <h3 className={ds.heading3}>{title}</h3>
        </div>
        {badge && <Badge variant={badgeVariant}>{badge}</Badge>}
      </div>
      {children}
    </GlassCard>
  );
}
