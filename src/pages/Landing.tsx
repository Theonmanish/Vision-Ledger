import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Button } from '../components/ui/button';
import { Container } from '../components/ui/container';
import { Section } from '../components/ui/section';
import { Timeline } from '../components/ui/timeline';
import { GlassCard } from '../components/ui/glass-card';
import FeatureCard from '../components/shared/FeatureCard';
import Hero from '../components/hero/Hero';
import { ds } from '../lib/design-tokens';
import { scrollReveal } from '../lib/motion';
import { cn } from '../lib/utils';
import {
  Shield,
  Cpu,
  FileCheck,
  BarChart3,
  ArrowRight,
  Upload,
  Link2,
  FileBadge,
} from 'lucide-react';

const FEATURES = [
  {
    icon: Cpu,
    title: 'AI-Powered Analysis',
    description:
      'Advanced computer vision models analyze uploaded evidence to detect objects, verify claims, and provide detailed confidence scores.',
  },
  {
    icon: Shield,
    title: 'Blockchain-Backed Proof',
    description:
      'Every verification result is immutably recorded on the Ethereum Sepolia network, creating an unalterable chain of evidence.',
  },
  {
    icon: FileCheck,
    title: 'Instant Certificate Generation',
    description:
      'Generate verifiable certificates for every validated claim, complete with cryptographic signatures and timestamp proofs.',
  },
  {
    icon: BarChart3,
    title: 'Real-Time Dashboard',
    description:
      'Track all your verifications in one place with detailed analytics, status updates, and comprehensive audit trails.',
  },
];

const HOW_IT_WORKS = [
  {
    icon: Upload,
    title: 'Upload Evidence',
    description:
      'Submit images or documents related to your claim — tree plantation, solar installation, or construction progress.',
  },
  {
    icon: Cpu,
    title: 'AI Analysis',
    description:
      'Our computer vision engine analyzes the evidence, detecting objects and assessing claim validity with confidence scoring.',
  },
  {
    icon: Link2,
    title: 'Blockchain Verification',
    description:
      'Results are hashed and recorded on the Ethereum Sepolia network, creating a permanent, tamper-proof record.',
  },
  {
    icon: FileBadge,
    title: 'Certificate Generation',
    description:
      'Download a verifiable certificate with transaction hash, block number, and timestamp for your records.',
  },
];

export default function Landing() {
  return (
    <div className="flex flex-col bg-[#09090B]">
      <Hero />

      <Section bordered className="relative">
        <Container>
          <motion.div
            {...scrollReveal}
            transition={scrollReveal.transition}
            className="mb-14 text-center"
          >
            <span className={ds.badge}>Platform Features</span>
            <h2 className={cn('mt-4', ds.heading2)}>
              Everything you need to verify claims
            </h2>
            <p className={cn('mx-auto mt-4 max-w-2xl', ds.body)}>
              From AI analysis to blockchain records — a complete verification toolkit.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((feature, index) => (
              <FeatureCard key={feature.title} {...feature} index={index} />
            ))}
          </div>
        </Container>
      </Section>

      <Section id="how-it-works" bordered className="relative bg-[#09090B]">
        <Container>
          <motion.div
            {...scrollReveal}
            transition={scrollReveal.transition}
            className="mb-16 text-center"
          >
            <span className={ds.badge}>Workflow</span>
            <h2 className={cn('mt-4', ds.heading2)}>How It Works</h2>
            <p className={cn('mx-auto mt-4 max-w-2xl', ds.body)}>
              Four simple steps to verify any claim with AI-powered analysis and blockchain security.
            </p>
          </motion.div>

          <Timeline steps={HOW_IT_WORKS} />
        </Container>
      </Section>

      <Section bordered className="relative">
        <Container size="narrow">
          <motion.div
            {...scrollReveal}
            transition={scrollReveal.transition}
            className="text-center"
          >
            <GlassCard hover padding="lg" rounded="2xl" className="mx-auto max-w-3xl">
              <div className="absolute inset-0 bg-gradient-to-br from-[#2563EB]/10 via-transparent to-transparent opacity-50" />
              <div className="relative z-10 space-y-6">
                <h2 className={ds.heading2}>Ready to verify your claims?</h2>
                <p className={cn('mx-auto max-w-xl', ds.body)}>
                  Upload your evidence and get AI-powered verification results with
                  blockchain-backed certificates in minutes.
                </p>
                <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}>
                  <Button size="lg" asChild>
                    <Link to="/verify">
                      Get Started Now
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Link>
                  </Button>
                </motion.div>
              </div>
            </GlassCard>
          </motion.div>
        </Container>
      </Section>
    </div>
  );
}
