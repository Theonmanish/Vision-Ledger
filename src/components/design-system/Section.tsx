import { cn } from '../../lib/utils';
import { ds } from '../../lib/design-tokens';
import { motion } from 'motion/react';
import { scrollReveal } from '../../lib/motion';

interface SectionProps {
  children: React.ReactNode;
  className?: string;
  id?: string;
  animate?: boolean;
}

export default function Section({ children, className, id, animate = true }: SectionProps) {
  const Wrapper = animate ? motion.section : 'section';
  const animProps = animate ? scrollReveal : {};

  return (
    <Wrapper
      id={id}
      className={cn('relative border-t border-white/[0.08]', ds.section, className)}
      {...animProps}
    >
      {children}
    </Wrapper>
  );
}
