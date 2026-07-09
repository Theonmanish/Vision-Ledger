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
      <div className="absolute left-6 top-0 hidden h-full w-px bg-gradient-to-b from-[#2563EB]/40 via-[#3B82F6]/20 to-transparent md:left-1/2 md:-translate-x-px md:block" />

      <div className="space-y-8 md:space-y-0">
        {steps.map((step, index) => {
          const Icon = step.icon;
          const isEven = index % 2 === 0;

          return (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 32 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.6, delay: index * 0.15 }}
              className={cn(
                'relative md:grid md:grid-cols-2 md:gap-8 md:py-6',
                !isEven && 'md:direction-rtl'
              )}
            >
              <div
                className={cn(
                  'hidden md:block',
                  isEven ? 'md:pr-12 md:text-right' : 'md:col-start-2 md:pl-12 md:text-left'
                )}
              >
                {!isEven && (
                  <div className="space-y-2">
                    <h3 className={ds.heading3}>{step.title}</h3>
                    <p className={ds.bodySm}>{step.description}</p>
                  </div>
                )}
              </div>

              <div
                className={cn(
                  'absolute left-6 top-6 z-10 hidden -translate-x-1/2 md:left-1/2 md:flex md:items-center md:justify-center',
                  'h-12 w-12 rounded-xl border border-white/[0.08] bg-[#111113] shadow-[0_0_20px_rgba(37,99,235,0.15)]'
                )}
              >
                <div className={ds.iconBoxLg}>
                  <Icon className="h-5 w-5" />
                </div>
              </div>

              <div
                className={cn(
                  'md:col-span-1',
                  isEven ? 'md:col-start-2 md:pl-12' : 'md:pr-12 md:text-right'
                )}
              >
                <div className={cn(ds.glassCard, ds.glassCardHover, 'group p-6 md:max-w-md', !isEven && 'md:ml-auto')}>
                  <div className={ds.overlay} />
                  <div className="relative z-10 flex gap-4 md:hidden">
                    <div className={ds.iconBoxLg}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="space-y-2">
                      <span className="text-xs font-medium text-[#3B82F6]">Step {String(index + 1).padStart(2, '0')}</span>
                      <h3 className={ds.heading3}>{step.title}</h3>
                      <p className={ds.bodySm}>{step.description}</p>
                    </div>
                  </div>
                  <div className="relative z-10 hidden md:block space-y-2">
                    {isEven && (
                      <>
                        <span className="text-xs font-medium text-[#3B82F6]">Step {String(index + 1).padStart(2, '0')}</span>
                        <h3 className={ds.heading3}>{step.title}</h3>
                        <p className={ds.bodySm}>{step.description}</p>
                      </>
                    )}
                    {!isEven && (
                      <span className="text-xs font-medium text-[#3B82F6]">Step {String(index + 1).padStart(2, '0')}</span>
                    )}
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
