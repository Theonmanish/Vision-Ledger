import { motion } from 'motion/react';
import { cn } from '../../lib/utils';
import { Loader2 } from 'lucide-react';

interface LoadingScreenProps {
  message?: string;
  className?: string;
}

export default function LoadingScreen({
  message = 'Processing verification...',
  className,
}: LoadingScreenProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={cn('flex flex-col items-center justify-center gap-6 py-20', className)}
    >
      <div className="relative">
        <div className="absolute inset-0 animate-pulse rounded-full bg-[#2563EB]/20 blur-xl" />
        <Loader2 className="relative h-12 w-12 animate-spin text-[#3B82F6]" />
      </div>
      <div className="space-y-1 text-center">
        <p className="text-lg font-medium text-white">{message}</p>
        <p className="text-sm text-white/50">This usually takes a few seconds</p>
      </div>
    </motion.div>
  );
}
