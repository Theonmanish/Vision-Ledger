import * as React from 'react';
import { cn } from '../../lib/utils';

export interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number;
}

const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  ({ className, value = 0, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'relative h-2 w-full overflow-hidden rounded-full border border-white/[0.06] bg-white/[0.03]',
          className
        )}
        {...props}
      >
        <div
          className="h-full rounded-full bg-gradient-to-r from-[#2563EB] to-[#3B82F6] transition-all duration-500 ease-out shadow-[0_0_12px_rgba(37,99,235,0.4)]"
          style={{ width: `${value || 0}%` }}
        />
      </div>
    );
  }
);
Progress.displayName = 'Progress';

export { Progress };
