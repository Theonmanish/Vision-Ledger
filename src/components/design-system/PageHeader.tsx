import { cn } from '../../lib/utils';
import { ds } from '../../lib/design-tokens';
import { motion } from 'motion/react';
import { fadeUp } from '../../lib/motion';

interface PageHeaderProps {
  title: string;
  description?: string;
  badge?: string;
  children?: React.ReactNode;
  className?: string;
  align?: 'left' | 'center';
}

export default function PageHeader({
  title,
  description,
  badge,
  children,
  className,
  align = 'center',
}: PageHeaderProps) {
  return (
    <motion.div
      {...fadeUp}
      transition={{ duration: 0.5 }}
      className={cn(
        'mb-10 sm:mb-12',
        align === 'center' ? 'text-center' : 'text-left',
        className
      )}
    >
      {badge && (
        <div className={cn(ds.badge, 'mb-6', align === 'center' && 'mx-auto w-fit')}>
          {badge}
        </div>
      )}
      <h1 className={ds.heading1}>{title}</h1>
      {description && (
        <p className={cn(ds.body, 'mt-4', align === 'center' && 'mx-auto max-w-2xl')}>
          {description}
        </p>
      )}
      {children}
    </motion.div>
  );
}
