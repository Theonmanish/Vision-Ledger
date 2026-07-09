import { LucideIcon } from 'lucide-react';
import { GlassCard } from '../ui/glass-card';
import { ds } from '../../lib/design-tokens';
import { cn } from '../../lib/utils';

interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  className?: string;
}

export default function FeatureCard({
  icon: Icon,
  title,
  description,
  className,
}: FeatureCardProps) {
  return (
    <GlassCard
      hover
      animate
      padding="md"
      className={cn('p-6', className)}
    >
      <div className="space-y-4">
        <div className={cn(ds.iconBoxLg, 'transition-transform duration-300 group-hover:scale-105')}>
          <Icon className="h-5 w-5" />
        </div>
        <h3 className={ds.heading3}>{title}</h3>
        <p className={ds.bodySm}>{description}</p>
      </div>
    </GlassCard>
  );
}
