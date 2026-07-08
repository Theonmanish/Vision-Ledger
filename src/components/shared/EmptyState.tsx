import { cn } from '../../lib/utils';
import { LucideIcon, Inbox } from 'lucide-react';
import { Button } from '../ui/button';
import { Link } from 'react-router-dom';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  actionPath?: string;
  className?: string;
}

export default function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  actionLabel,
  actionPath,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-5 py-16 px-4',
        className
      )}
    >
      <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-accent">
        <Icon className="h-10 w-10 text-muted" />
      </div>
      <div className="text-center max-w-sm space-y-2">
        <h3 className="text-lg font-semibold">{title}</h3>
        <p className="text-sm text-muted leading-relaxed">{description}</p>
      </div>
      {actionLabel && actionPath && (
        <Button asChild>
          <Link to={actionPath}>{actionLabel}</Link>
        </Button>
      )}
    </div>
  );
}