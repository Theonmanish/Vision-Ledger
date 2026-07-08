import { motion } from 'motion/react';
import { cn } from '../../lib/utils';
import { LucideIcon } from 'lucide-react';
import { ds } from '../../lib/design-tokens';

interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  className?: string;
  index?: number;
}

export default function FeatureCard({
  icon: Icon,
  title,
  description,
  className,
  index = 0,
}: FeatureCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className={cn(
        ds.glassCard,
        ds.glassCardHover,
        'group p-6',
        className
      )}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-[#2563EB]/10 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

      <div className="relative z-10 space-y-4">
        <div className={cn(ds.iconBoxLg, 'transition-transform duration-300 group-hover:scale-105')}>
          <Icon className="h-5 w-5" />
        </div>
        <h3 className={ds.heading3}>{title}</h3>
        <p className={ds.bodySm}>{description}</p>
      </div>
    </motion.div>
  );
}
