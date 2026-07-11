import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'motion/react';
import { fadeUp } from '../../lib/motion';
import {
  ArrowDown,
  ArrowRight,
  Upload,
  Cpu,
  ShieldCheck,
  Gauge,
  Link2,
  FileBadge,
} from 'lucide-react';

const pipelineSteps = [
  {
    icon: Upload,
    label: 'Upload Image',
    detail: 'evidence.jpg',
    status: 'Complete',
  },
  {
    icon: Cpu,
    label: 'AI Analysis',
    detail: 'Object detection active',
    status: 'Processing',
  },
  {
    icon: ShieldCheck,
    label: 'Verification Status',
    detail: 'Claim validated',
    status: 'Verified',
  },
  {
    icon: Gauge,
    label: 'Confidence Score',
    detail: '94.7%',
    status: 'High',
  },
  {
    icon: Link2,
    label: 'Blockchain Proof',
    detail: '0x7f3a…9c2e',
    status: 'Anchored',
  },
  {
    icon: FileBadge,
    label: 'Certificate Generated',
    detail: 'VL-2026-0847',
    status: 'Ready',
  },
];

function PipelineCard({
  step,
  index,
  reduceMotion,
}: {
  step: (typeof pipelineSteps)[number];
  index: number;
  reduceMotion: boolean | null;
}) {
  const Icon = step.icon;
  const isComplete = index <= 4;

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: reduceMotion ? 0 : 0.6 + index * 0.1 }}
      className="group relative w-[min(100%,160px)] shrink-0 snap-center sm:min-w-[140px] sm:flex-1"
    >
      <div className="relative overflow-hidden rounded-xl border border-white/[0.08] bg-[#111113]/80 p-3 backdrop-blur-xl transition-all duration-300 hover:border-[#3B82F6]/30 sm:p-4">
        <div className="relative z-10 space-y-2 sm:space-y-3">
          <div className="flex items-center justify-between gap-1">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#2563EB]/15 text-[#3B82F6]">
              <Icon className="h-4 w-4" aria-hidden="true" />
            </div>
            {isComplete && (
              <span className="rounded-full bg-[#22C55E]/15 px-1.5 py-0.5 text-[9px] font-medium text-[#22C55E] sm:px-2 sm:text-[10px]">
                {step.status}
              </span>
            )}
          </div>
          <div>
            <p className="text-xs font-semibold text-white">{step.label}</p>
            <p className="mt-0.5 truncate text-[10px] text-white/50 sm:mt-1 sm:text-[11px]">{step.detail}</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function PipelineConnector({ index, reduceMotion }: { index: number; reduceMotion: boolean | null }) {
  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, delay: reduceMotion ? 0 : 0.7 + index * 0.1 }}
      className="flex shrink-0 items-center justify-center text-[#3B82F6]/60"
      aria-hidden="true"
    >
      <ArrowRight className="hidden h-4 w-4 lg:block" />
      <ArrowDown className="hidden h-4 w-4 max-lg:landscape:block lg:hidden" />
    </motion.div>
  );
}

function DashboardPreview({ reduceMotion }: { reduceMotion: boolean | null }) {
  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, delay: reduceMotion ? 0 : 0.5 }}
      className="relative mx-auto mt-8 w-full max-w-6xl sm:mt-10"
    >
      <div className="absolute inset-0 rounded-2xl bg-[#2563EB]/20 blur-[80px] opacity-30 max-md:hidden" aria-hidden="true" />

      <div className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-[#111113]/60 p-4 backdrop-blur-2xl sm:p-6 lg:p-8">
        <div className="absolute inset-0 bg-noise opacity-20" aria-hidden="true" />

        <div className="relative z-10 mb-4 flex items-center justify-between border-b border-white/[0.08] pb-4 sm:mb-6">
          <div className="flex items-center gap-3">
            <div className="flex gap-1.5" aria-hidden="true">
              <span className="h-2.5 w-2.5 rounded-full bg-white/20" />
              <span className="h-2.5 w-2.5 rounded-full bg-white/20" />
              <span className="h-2.5 w-2.5 rounded-full bg-white/20" />
            </div>
            <span className="text-xs font-medium text-white/40">VisionLedger Dashboard</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden rounded-full bg-[#22C55E]/15 px-2.5 py-1 text-[10px] font-medium text-[#22C55E] sm:inline">
              Live Pipeline
            </span>
            <span className="h-2 w-2 animate-pulse rounded-full bg-[#22C55E]" aria-hidden="true" />
          </div>
        </div>

        {/* Mobile: horizontal scroll; Desktop: row flow; Portrait tablet: vertical */}
        <div className="relative z-10 scroll-touch flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2 lg:flex lg:flex-wrap lg:items-center lg:overflow-visible lg:snap-none">
          {pipelineSteps.map((step, index) => (
            <div
              key={step.label}
              className="flex shrink-0 items-center gap-2 lg:flex-1 lg:shrink"
            >
              <PipelineCard step={step} index={index} reduceMotion={reduceMotion} />
              {index < pipelineSteps.length - 1 && (
                <PipelineConnector index={index} reduceMotion={reduceMotion} />
              )}
            </div>
          ))}
        </div>

        
      </div>
    </motion.div>
  );
}

export default function Hero() {
  const reduceMotion = useReducedMotion();

  return (
    <section className="relative overflow-hidden bg-[#09090B]">
      {!reduceMotion && (
        <div className="pointer-events-none absolute inset-x-0 top-0 max-md:opacity-50" aria-hidden="true">
          <motion.div
            animate={{ x: [0, 30, 0], opacity: [0.6, 0.8, 0.6] }}
            transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
            className="mx-auto h-[10rem] w-[60rem] max-w-[120vw] rounded-full bg-gradient-to-b from-[#2563EB] to-[#3B82F6] blur-[6rem]"
          />
        </div>
      )}
      <div className="absolute inset-0 z-0 bg-noise opacity-30" aria-hidden="true" />

      <div className="relative z-10 mx-auto max-w-7xl px-4 pb-16 pt-2 text-center sm:px-6 sm:pb-28 sm:pt-4 lg:px-8">
        <motion.div
          {...(reduceMotion ? {} : fadeUp)}
          initial={reduceMotion ? false : fadeUp.initial}
          animate={fadeUp.animate}
          transition={{ duration: 0.5 }}
          className="mx-auto flex max-w-fit items-center justify-center gap-2 rounded-full border border-white/[0.08] bg-white/10 px-4 py-2 backdrop-blur-sm"
        >
          <span className="text-sm font-medium text-white">
            🛡 AI-Powered Evidence Verification
          </span>
          <ArrowRight className="h-4 w-4 text-white/70" aria-hidden="true" />
        </motion.div>

        <motion.h1
          initial={reduceMotion ? false : fadeUp.initial}
          animate={fadeUp.animate}
          transition={{ duration: 0.6, delay: reduceMotion ? 0 : 0.1 }}
          className="mx-auto mt-6 max-w-4xl text-3xl font-bold leading-tight text-white sm:mt-8 sm:text-5xl md:text-6xl lg:text-7xl"
        >
          Proof of Reality in an AI-Generated World
        </motion.h1>

        <motion.p
          initial={reduceMotion ? false : fadeUp.initial}
          animate={fadeUp.animate}
          transition={{ duration: 0.6, delay: reduceMotion ? 0 : 0.2 }}
          className="mx-auto mt-4 max-w-2xl text-base text-white/60 sm:mt-6 sm:text-lg"
        >
          VisionLedger combines AI-powered visual verification with blockchain-backed proof to
          help organizations verify environmental and infrastructure claims with confidence.
        </motion.p>

        <motion.div
          initial={reduceMotion ? false : fadeUp.initial}
          animate={fadeUp.animate}
          transition={{ duration: 0.6, delay: reduceMotion ? 0 : 0.3 }}
          className="mt-8 flex flex-col items-stretch justify-center gap-3 sm:mt-10 sm:flex-row sm:items-center sm:gap-4"
        >
          <Link
            to="/verify"
            className="inline-flex min-h-[44px] items-center justify-center rounded-full bg-[#2563EB] px-8 text-base font-medium text-white transition-colors hover:bg-[#3B82F6] active:scale-[0.98]"
          >
            Verify Evidence
          </Link>
          <a
            href="#how-it-works"
            className="inline-flex min-h-[44px] items-center justify-center rounded-full border border-white/[0.08] px-8 text-base font-medium text-white transition-colors hover:bg-white/10 active:scale-[0.98]"
          >
            Watch Demo
          </a>
        </motion.div>

        <DashboardPreview reduceMotion={reduceMotion} />
      </div>
    </section>
  );
}
