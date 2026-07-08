import { cn } from '../../lib/utils';
import { ds } from '../../lib/design-tokens';

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  hover?: boolean;
  padding?: 'sm' | 'md' | 'lg';
}

const paddingMap = {
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
};

export default function GlassCard({
  children,
  className,
  hover = true,
  padding = 'md',
  ...props
}: GlassCardProps) {
  return (
    <div
      className={cn(
        'group relative overflow-hidden',
        ds.glassCard,
        hover && ds.glassCardHover,
        paddingMap[padding],
        className
      )}
      {...props}
    >
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[#2563EB]/10 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
      <div className="relative z-10">{children}</div>
    </div>
  );
}
