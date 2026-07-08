import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import FeatureCard from '../components/shared/FeatureCard';
import { Shield, Cpu, FileCheck, BarChart3, ArrowRight, Sparkles, CheckCircle2 } from 'lucide-react';

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
    step: '01',
    title: 'Upload Evidence',
    description: 'Submit images or documents related to your claim — tree plantation, solar installation, or construction progress.',
  },
  {
    step: '02',
    title: 'AI Analysis',
    description: 'Our computer vision engine analyzes the evidence, detecting objects and assessing claim validity with confidence scoring.',
  },
  {
    step: '03',
    title: 'Blockchain Record',
    description: 'Results are hashed and recorded on the Ethereum Sepolia network, creating a permanent, tamper-proof record.',
  },
  {
    step: '04',
    title: 'Get Your Certificate',
    description: 'Download a verifiable certificate with transaction hash, block number, and timestamp for your records.',
  },
];

export default function Landing() {
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="bg-hero-glow pointer-events-none absolute inset-0" />
        <div className="bg-dot-grid pointer-events-none absolute inset-0 opacity-40" />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-20 pb-28 sm:pt-28 sm:pb-36">
          <div className="mx-auto max-w-3xl text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-border/50 bg-accent/50 px-4 py-1.5 text-sm text-muted mb-8">
              <Sparkles className="h-4 w-4 text-primary" />
              <span>AI-Powered Verification Platform</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight">
              Proof of Reality in an{' '}
              <span className="text-primary">AI-Generated</span> World
            </h1>

            <p className="mt-6 text-lg sm:text-xl text-muted max-w-2xl mx-auto leading-relaxed">
              VisionLedger uses advanced AI and blockchain technology to verify real-world claims —
              from tree plantations to solar installations. Upload evidence, get instant analysis,
              and receive tamper-proof certificates.
            </p>

            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button size="lg" asChild>
                <Link to="/verify">
                  Verify Evidence
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <a href="#how-it-works">How It Works</a>
              </Button>
            </div>

            <div className="mt-12 flex items-center justify-center gap-6 sm:gap-10 text-sm text-muted">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-success" />
                <span>2,847 verified claims</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-success" />
                <span>99.2% accuracy</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-success" />
                <span>Blockchain secured</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="border-t border-border/50 bg-background">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20 sm:py-28">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
              Everything you need to verify claims
            </h2>
            <p className="mt-4 text-muted text-lg max-w-2xl mx-auto">
              From AI analysis to blockchain records — a complete verification toolkit.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {FEATURES.map((feature) => (
              <FeatureCard key={feature.title} {...feature} />
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="border-t border-border/50 bg-background/50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20 sm:py-28">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
              How It Works
            </h2>
            <p className="mt-4 text-muted text-lg max-w-2xl mx-auto">
              Four simple steps to verify any claim with AI-powered analysis and blockchain security.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {HOW_IT_WORKS.map((item, index) => (
              <div key={item.step} className="relative">
                {index < HOW_IT_WORKS.length - 1 && (
                  <div className="hidden lg:block absolute top-8 left-[60%] w-[80%] h-px border-t border-dashed border-border/40" />
                )}
                <div className="relative flex flex-col items-center text-center gap-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary text-xl font-bold">
                    {item.step}
                  </div>
                  <h3 className="text-lg font-semibold">{item.title}</h3>
                  <p className="text-sm text-muted leading-relaxed">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="border-t border-border/50 bg-background">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-20 sm:py-28 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
            Ready to verify your claims?
          </h2>
          <p className="text-muted text-lg max-w-xl mx-auto mb-8">
            Upload your evidence and get AI-powered verification results with blockchain-backed certificates in minutes.
          </p>
          <Button size="lg" asChild>
            <Link to="/verify">
              Get Started Now
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
}