import { motion } from 'motion/react';
import { cn } from '../../lib/utils';
import { fadeUp } from '../../lib/motion';
import { ds } from '../../lib/design-tokens';

interface PageHeaderProps {
  title: string;
  description?: string;
  badge?: string;
  className?: string;
  children?: React.ReactNode;
}

export function PageHeader({ title, description, badge, className, children }: PageHeaderProps) {
  return (
    <motion.div
      {...fadeUp}
      transition={{ duration: 0.5 }}
      className={cn('mb-10 sm:mb-12', className)}
    >
      {badge && (
        <span className={cn(ds.badge, 'mb-4 inline-flex')}>{badge}</span>
      )}
      <h1 className={ds.heading1}>{title}</h1>
      {description && <p className={cn(ds.body, 'mt-3 max-w-2xl')}>{description}</p>}
      {children}
    </motion.div>
  );
}
