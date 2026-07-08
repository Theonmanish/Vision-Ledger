import { motion } from 'motion/react';
import { cn } from '../../lib/utils';
import { scrollReveal } from '../../lib/motion';

interface SectionProps extends React.HTMLAttributes<HTMLElement> {
  animate?: boolean;
  bordered?: boolean;
}

export function Section({
  className,
  animate = false,
  bordered = false,
  children,
  ...props
}: SectionProps) {
  const Comp = animate ? motion.section : 'section';

  const motionProps = animate
    ? {
        ...scrollReveal,
        transition: scrollReveal.transition,
      }
    : {};

  return (
    <Comp
      className={cn(
        'relative py-20 sm:py-28',
        bordered && 'border-t border-white/[0.08]',
        className
      )}
      {...(animate ? motionProps : {})}
      {...props}
    >
      {children}
    </Comp>
  );
}
