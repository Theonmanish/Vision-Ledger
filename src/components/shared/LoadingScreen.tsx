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
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-6 py-20',
        className
      )}
    >
      <div className="relative">
        <div className="absolute inset-0 rounded-full bg-primary/20 blur-xl animate-pulse" />
        <Loader2 className="h-12 w-12 animate-spin text-primary relative" />
      </div>
      <div className="text-center space-y-1">
        <p className="text-lg font-medium">{message}</p>
        <p className="text-sm text-muted">This usually takes a few seconds</p>
      </div>
    </div>
  );
}