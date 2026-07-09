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
        'relative overflow-hidden py-20 sm:py-28',
        bordered && 'border-t border-white/[0.08]',
        className
      )}
      {...(animate ? motionProps : {})}
      {...props}
    >
      {/* Animated Background */}
      <div >
        <motion.div
          animate={{ x: [0, 30, 0], opacity: [0.6, 0.8, 0.6] }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          
        />

        <motion.div
          animate={{ x: [0, -20, 0], opacity: [0.5, 0.7, 0.5] }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          
        />

        <motion.div
          animate={{ x: [0, 15, 0], opacity: [0.4, 0.6, 0.4] }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          
        />
      </div>

      {/* Noise Overlay */}
      <div className="pointer-events-none absolute inset-0 z-0 bg-noise opacity-30" />

      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </Comp>
  );
}