import { motion } from 'motion/react';
import { cn } from '../../lib/utils';
import { LucideIcon } from 'lucide-react';
import { ds } from '../../lib/design-tokens';

export interface TimelineStep {
  icon: LucideIcon;
  title: string;
  description: string;
}

interface TimelineProps {
  steps: TimelineStep[];
  className?: string;
}

export function Timeline({ steps, className }: TimelineProps) {
  return (
    <div className={cn('relative', className)}>
      {/* Center Line */}
      <div className="absolute left-1/2 top-0 hidden h-full w-px -translate-x-1/2 bg-gradient-to-b from-[#2563EB]/40 via-[#3B82F6]/20 to-transparent md:block" />

      <div className="space-y-10">
        {steps.map((step, index) => {
          const Icon = step.icon;
          const isLeft = index % 2 !== 0;

          return (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 32 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.6, delay: index * 0.15 }}
              className="relative grid grid-cols-1 md:grid-cols-2 md:gap-16"
            >
              {/* LEFT SIDE */}
              <div
                className={cn(
                  'hidden md:block',
                  isLeft ? '' : 'opacity-0 pointer-events-none'
                )}
              >
                <div className={cn(ds.glassCard, ds.glassCardHover, 'ml-auto max-w-md p-6')}>
                  <div className={ds.overlay} />
                  <div className="relative z-10 space-y-2">
                    <span className="text-xs font-medium text-[#3B82F6]">
                      Step {String(index + 1).padStart(2, '0')}
                    </span>
                    <h3 className={ds.heading3}>{step.title}</h3>
                    <p className={ds.bodySm}>{step.description}</p>
                  </div>
                </div>
              </div>

              {/* RIGHT SIDE */}
              <div
                className={cn(
                  'hidden md:block',
                  !isLeft ? '' : 'opacity-0 pointer-events-none'
                )}
              >
                <div className={cn(ds.glassCard, ds.glassCardHover, 'max-w-md p-6')}>
                  <div className={ds.overlay} />
                  <div className="relative z-10 space-y-2">
                    <span className="text-xs font-medium text-[#3B82F6]">
                      Step {String(index + 1).padStart(2, '0')}
                    </span>
                    <h3 className={ds.heading3}>{step.title}</h3>
                    <p className={ds.bodySm}>{step.description}</p>
                  </div>
                </div>
              </div>

              {/* CENTER ICON */}
              <div className="absolute left-1/2 top-8 hidden -translate-x-1/2 md:flex">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-white/[0.08] bg-[#111113] shadow-[0_0_20px_rgba(37,99,235,0.15)]">
                  <div className={ds.iconBoxLg}>
                    <Icon className="h-5 w-5" />
                  </div>
                </div>
              </div>

              {/* MOBILE */}
              <div className="md:hidden">
                <div className={cn(ds.glassCard, ds.glassCardHover, 'p-6')}>
                  <div className={ds.overlay} />
                  <div className="relative z-10 flex gap-4">
                    <div className={ds.iconBoxLg}>
                      <Icon className="h-5 w-5" />
                    </div>

                    <div className="space-y-2">
                      <span className="text-xs font-medium text-[#3B82F6]">
                        Step {String(index + 1).padStart(2, '0')}
                      </span>

                      <h3 className={ds.heading3}>{step.title}</h3>

                      <p className={ds.bodySm}>{step.description}</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}