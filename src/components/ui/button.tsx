import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#09090B] disabled:pointer-events-none disabled:opacity-50 cursor-pointer select-none',
  {
    variants: {
      variant: {
        default:
          'rounded-full bg-[#2563EB] text-white hover:bg-[#3B82F6] active:scale-[0.98]',
        secondary:
          'rounded-full border border-white/[0.08] bg-white/[0.03] text-white backdrop-blur-sm hover:bg-white/10 active:scale-[0.98]',
        outline:
          'rounded-full border border-white/[0.08] bg-transparent text-white hover:bg-white/10 active:scale-[0.98]',
        ghost:
          'rounded-full text-white/60 hover:bg-white/10 hover:text-white active:scale-[0.98]',
        destructive:
          'rounded-full bg-red-600 text-white hover:bg-red-500 active:scale-[0.98]',
        link: 'text-[#3B82F6] underline-offset-4 hover:underline rounded-none',
      },
      size: {
        default: 'h-10 px-5 text-sm',
        sm: 'h-9 px-4 text-xs',
        lg: 'h-12 px-8 text-base',
        icon: 'h-10 w-10 rounded-xl',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, children, ...props }, ref) => {
    const classes = cn(buttonVariants({ variant, size, className }));

    if (asChild && React.isValidElement(children)) {
      return React.cloneElement(children as React.ReactElement<{ className?: string; ref?: React.Ref<unknown> }>, {
        className: cn(classes, (children as React.ReactElement<{ className?: string }>).props.className),
        ref,
      });
    }

    return (
      <button className={classes} ref={ref} {...props}>
        {children}
      </button>
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
