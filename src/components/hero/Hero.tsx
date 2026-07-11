import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
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
}: {
  step: (typeof pipelineSteps)[number];
  index: number;
}) {
  const Icon = step.icon;
  const isComplete = index <= 4;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.6 + index * 0.1 }}
      className="group relative min-w-[140px] flex-1"
    >
      <div className="relative overflow-hidden rounded-xl border border-white/[0.08] bg-[#111113]/80 p-4 backdrop-blur-xl transition-all duration-300 hover:border-[#3B82F6]/30 hover:shadow-[0_0_30px_rgba(37,99,235,0.12)]">
        <div className="absolute inset-0 bg-gradient-to-br from-[#2563EB]/10 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

        <div className="relative z-10 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#2563EB]/15 text-[#3B82F6]">
              <Icon className="h-4 w-4" />
            </div>
            {isComplete && (
              <span className="rounded-full bg-[#22C55E]/15 px-2 py-0.5 text-[10px] font-medium text-[#22C55E]">
                {step.status}
              </span>
            )}
          </div>
          <div>
            <p className="text-xs font-semibold text-white">{step.label}</p>
            <p className="mt-1 truncate text-[11px] text-white/50">{step.detail}</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function PipelineConnector({ index }: { index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, delay: 0.7 + index * 0.1 }}
      className="flex shrink-0 items-center justify-center text-[#3B82F6]/60"
    >
      <ArrowRight className="hidden h-4 w-4 lg:block" />
      <ArrowDown className="h-4 w-4 lg:hidden" />
    </motion.div>
  );
}

function DashboardPreview() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, delay: 0.5 }}
      className="relative mx-auto mt-8 w-full max-w-6xl sm:mt-10"
    >
      <div className="absolute inset-0 rounded-2xl bg-[#2563EB]/20 blur-[80px] opacity-30" />

      <div className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-[#111113]/60 p-4 backdrop-blur-2xl sm:p-6 lg:p-8">
        <div className="absolute inset-0 bg-noise opacity-20" />

        {/* Dashboard chrome */}
        <div className="relative z-10 mb-6 flex items-center justify-between border-b border-white/[0.08] pb-4">
          <div className="flex items-center gap-3">
            <div className="flex gap-1.5">
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
            <span className="h-2 w-2 animate-pulse rounded-full bg-[#22C55E]" />
          </div>
        </div>

        {/* Pipeline flow */}
        <div className="relative z-10 flex flex-col items-stretch gap-3 lg:flex-row lg:items-center lg:gap-2">
          {pipelineSteps.map((step, index) => (
            <div key={step.label} className="flex flex-col items-center gap-3 lg:flex-row lg:gap-2">
              <PipelineCard step={step} index={index} />
              {index < pipelineSteps.length - 1 && <PipelineConnector index={index} />}
            </div>
          ))}
        </div>

        
      </div>
    </motion.div>
  );
}

export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-[#09090B]">
      {/* Animated gradient background */}
      <div >
        <motion.div
          animate={{ x: [0, 30, 0], opacity: [0.6, 0.8, 0.6] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          className="z-1 h-[10rem] w-[60rem] rounded-full bg-gradient-to-b from-[#2563EB] to-[#3B82F6] blur-[6rem]"
        />
        <motion.div
          animate={{ x: [0, -20, 0], opacity: [0.5, 0.7, 0.5] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
          className="z-1 h-[10rem] w-[90rem] rounded-full bg-gradient-to-b from-[#1D4ED8] to-[#2563EB] blur-[6rem]"
        />
        <motion.div
          animate={{ x: [0, 15, 0], opacity: [0.4, 0.6, 0.4] }}
          transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
          className="z-1 h-[10rem] w-[60rem] rounded-full bg-gradient-to-b from-[#3B82F6] to-[#60A5FA] blur-[6rem]"
        />
      </div>
      <div className="absolute inset-0 z-0 bg-noise opacity-30" />

      <div className="relative z-10 mx-auto max-w-7xl px-4 pb-20 pt-2 text-center sm:px-6 sm:pb-28 sm:pt-4 lg:px-8">
        {/* Badge */}
        <motion.div
          {...fadeUp}
          transition={{ duration: 0.5 }}
          className="mx-auto flex max-w-fit items-center justify-center gap-2 rounded-full border border-white/[0.08] bg-white/10 px-4 py-2 backdrop-blur-sm"
        >
          <span className="text-sm font-medium text-white">
            🛡 AI-Powered Evidence Verification
          </span>
          <ArrowRight className="h-4 w-4 text-white/70" />
        </motion.div>

        {/* Headline */}
        <motion.h1
          {...fadeUp}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mx-auto mt-8 max-w-4xl text-4xl font-bold leading-tight text-white sm:text-5xl md:text-6xl lg:text-7xl"
        >
          Proof of Reality in an AI-Generated World
        </motion.h1>

        {/* Description */}
        <motion.p
          {...fadeUp}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mx-auto mt-6 max-w-2xl text-base text-white/60 sm:text-lg"
        >
          VisionLedger combines AI-powered visual verification with blockchain-backed proof to
          help organizations verify environmental and infrastructure claims with confidence.
        </motion.p>

        {/* CTAs */}
        <motion.div
          {...fadeUp}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row sm:gap-4"
        >
          <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}>
            <Link
              to="/verify"
              className="inline-flex h-12 items-center justify-center rounded-full bg-[#2563EB] px-8 text-base font-medium text-white transition-colors hover:bg-[#3B82F6]"
            >
              Verify Evidence
            </Link>
          </motion.div>
          <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}>
            <a
              href="#how-it-works"
              className="inline-flex h-12 items-center justify-center rounded-full border border-white/[0.08] px-8 text-base font-medium text-white transition-colors hover:bg-white/10"
            >
              Watch Demo
            </a>
          </motion.div>
        </motion.div>

        <DashboardPreview />
      </div>
    </section>
  );
}
