import { cn } from '../../lib/utils';
import { LucideIcon } from 'lucide-react';
import { Badge } from '../ui/badge';

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
    <div className={cn('rounded-xl border border-border/50 bg-card p-6', className)}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Icon className="h-5 w-5" />
          </div>
          <h3 className="font-semibold">{title}</h3>
        </div>
        {badge && <Badge variant={badgeVariant as any}>{badge}</Badge>}
      </div>
      {children}
    </div>
  );
}