import { motion } from 'motion/react';
import { cn } from '../../lib/utils';
import { ds } from '../../lib/design-tokens';

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  rounded?: 'xl' | '2xl';
  animate?: boolean;
}

const paddingMap = {
  none: '',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
};

export function GlassCard({
  className,
  hover = false,
  padding = 'md',
  rounded = 'xl',
  animate = false,
  children,
  ...props
}: GlassCardProps) {
  const Comp = animate ? motion.div : 'div';

  const motionProps = animate
    ? {
        initial: { opacity: 0, y: 20 },
        whileInView: { opacity: 1, y: 0 },
        viewport: { once: true, margin: '-60px' },
        transition: { duration: 0.5, ease: 'easeOut' as const },
      }
    : {};

  return (
    <Comp
      className={cn(
        rounded === 'xl' ? ds.glassCard : ds.glassPanel,
        hover && ds.glassCardHover,
        'group',
        paddingMap[padding],
        className
      )}
      {...(animate ? motionProps : {})}
      {...props}
    >
      {hover && (
        <div className="absolute inset-0 bg-gradient-to-br from-[#2563EB]/10 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
      )}
      <div className="relative z-10">{children}</div>
    </Comp>
  );
}
