import { motion } from 'motion/react';
import { cn } from '../../lib/utils';

interface BackgroundGlowProps {
  className?: string;
  intensity?: 'subtle' | 'medium';
}

export function BackgroundGlow({ className, intensity = 'subtle' }: BackgroundGlowProps) {
  return (
    <div className={cn('pointer-events-none absolute inset-0 overflow-hidden', className)}>
      <div className="absolute inset-0 bg-noise opacity-20" />
      <div className="absolute -right-60 -top-10 flex flex-col items-end blur-xl">
        <motion.div
          animate={{ x: [0, 20, 0], opacity: intensity === 'subtle' ? [0.3, 0.4, 0.3] : [0.5, 0.7, 0.5] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
          className="h-[8rem] w-[40rem] rounded-full bg-gradient-to-b from-[#2563EB] to-[#3B82F6] blur-[6rem]"
        />
        <motion.div
          animate={{ x: [0, -15, 0], opacity: intensity === 'subtle' ? [0.2, 0.3, 0.2] : [0.4, 0.6, 0.4] }}
          transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
          className="h-[8rem] w-[60rem] rounded-full bg-gradient-to-b from-[#1D4ED8] to-[#2563EB] blur-[6rem]"
        />
      </div>
    </div>
  );
}
