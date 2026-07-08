import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors',
  {
    variants: {
      variant: {
        default: 'border-[#2563EB]/30 bg-[#2563EB]/15 text-[#3B82F6]',
        secondary: 'border-white/[0.08] bg-white/[0.06] text-white/70',
        success: 'border-[#22C55E]/30 bg-[#22C55E]/15 text-[#22C55E]',
        warning: 'border-amber-500/30 bg-amber-500/15 text-amber-400',
        danger: 'border-red-500/30 bg-red-500/15 text-red-400',
        outline: 'border-white/[0.08] text-white/70',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
