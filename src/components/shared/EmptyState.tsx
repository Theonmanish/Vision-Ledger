import { motion } from 'motion/react';
import { cn } from '../../lib/utils';
import { LucideIcon, Inbox } from 'lucide-react';
import { Button } from '../ui/button';
import { Link } from 'react-router-dom';
import { GlassCard } from '../ui/glass-card';
import { ds } from '../../lib/design-tokens';

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
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={cn('flex flex-col items-center justify-center py-16', className)}
    >
      <GlassCard padding="lg" className="flex max-w-md flex-col items-center gap-6 text-center">
        <div className={ds.iconBoxLg}>
          <Icon className="h-6 w-6" />
        </div>
        <div className="space-y-2">
          <h3 className={ds.heading3}>{title}</h3>
          <p className={ds.bodySm}>{description}</p>
        </div>
        {actionLabel && actionPath && (
          <Button asChild>
            <Link to={actionPath}>{actionLabel}</Link>
          </Button>
        )}
      </GlassCard>
    </motion.div>
  );
}
