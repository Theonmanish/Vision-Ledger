import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Container } from '../components/ui/container';
import { GlassCard } from '../components/ui/glass-card';
import { BackgroundGlow } from '../components/ui/background-glow';
import StatusBadge from '../components/shared/StatusBadge';
import ResultCard from '../components/shared/ResultCard';
import LoadingScreen from '../components/shared/LoadingScreen';
import MetricCard from '../components/shared/MetricCard';
import { ds } from '../lib/design-tokens';
import {
  ArrowLeft,
  Shield,
  Brain,
  Hash,
  FileCheck,
  Download,
  ExternalLink,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  HelpCircle,
  QrCode,
  Lightbulb,
  AlertCircle,
  Clock,
  Upload,
  Cpu,
  Link2,
  FileBadge,
} from 'lucide-react';
import { CLAIM_TYPE_LABELS, type VerificationResult, type VerificationStatus } from '../types';
import { formatDateTime, formatConfidence, truncateHash, cn } from '../lib/utils';
import { fetchClaim, downloadCertificate, ApiError } from '../lib/api';

const statusIcons = {
  verified: CheckCircle2,
  partially_verified: AlertTriangle,
  inconclusive: HelpCircle,
  failed: XCircle,
} as const;

const statusColors = {
  verified: 'text-[#22C55E]',
  partially_verified: 'text-amber-400',
  inconclusive: 'text-white/50',
  failed: 'text-red-400',
} as const;

const statusMessages = {
  verified: { title: 'Claim Verified', subtitle: 'All evidence criteria met' },
  partially_verified: { title: 'Partially Verified', subtitle: 'Some criteria not fully met' },
  inconclusive: { title: 'Inconclusive', subtitle: 'Insufficient evidence' },
  failed: { title: 'Verification Failed', subtitle: 'Evidence does not match claim' },
};

function getLimitations(status: VerificationStatus): string {
  switch (status) {
    case 'verified':
      return 'Analysis is limited to visible objects in the uploaded image. Temporal context and off-frame evidence cannot be verified.';
    case 'partially_verified':
      return 'Some claimed elements could not be fully confirmed. Image quality, angle, or partial occlusion may affect detection accuracy.';
    case 'inconclusive':
      return 'Insufficient visual evidence to draw a definitive conclusion. Additional images or documentation may be required.';
    case 'failed':
      return 'Detected objects do not align with the submitted claim. Image may be outdated, mislabeled, or unrelated to the claim.';
  }
}

function getRecommendation(status: VerificationStatus, confidence: number): string {
  switch (status) {
    case 'verified':
      return confidence >= 0.9
        ? 'Proceed with confidence. Certificate has been generated and blockchain record is available for audit.'
        : 'Verification passed with moderate confidence. Consider supplementary evidence for high-stakes decisions.';
    case 'partially_verified':
      return 'Review detected objects against your claim. Consider submitting additional evidence from different angles or dates.';
    case 'inconclusive':
      return 'Submit clearer, higher-resolution images with better lighting. Include contextual metadata such as location and date.';
    case 'failed':
      return 'Do not use this evidence for compliance purposes. Re-capture images that directly correspond to the stated claim.';
  }
}

export default function Results() {
  const { id } = useParams<{ id: string }>();
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    fetchClaim(id)
      .then((data) => {
        if (!cancelled) setResult(data);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(
            err instanceof ApiError
              ? err.message
              : 'Failed to load verification results.'
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [id]);

  const handleDownloadCertificate = async () => {
    if (!id) return;
    setDownloading(true);
    setDownloadError(null);
    try {
      await downloadCertificate(id);
    } catch (err) {
      setDownloadError(
        err instanceof ApiError
          ? err.message
          : 'Failed to download certificate.'
      );
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="relative min-h-[calc(100vh-4rem)] bg-[#09090B]">
        <BackgroundGlow intensity="subtle" />
        <Container size="wide" className="relative z-10 py-10">
          <LoadingScreen message="Loading verification results..." />
        </Container>
      </div>
    );
  }

  if (error || !result) {
    return (
      <div className="relative min-h-[calc(100vh-4rem)] bg-[#09090B]">
        <BackgroundGlow intensity="subtle" />
        <Container size="narrow" className="relative z-10 py-20 text-center">
          <GlassCard padding="lg" className="mx-auto max-w-md">
            <div className="flex flex-col items-center gap-4">
              <div className={ds.iconBoxLg}>
                <HelpCircle className="h-6 w-6" />
              </div>
              <h2 className={ds.heading2}>Verification not found</h2>
              <p className={ds.bodySm}>
                {error ?? "The verification result you're looking for doesn't exist or has been removed."}
              </p>
              <Button asChild>
                <Link to="/verify">Start a new verification</Link>
              </Button>
            </div>
          </GlassCard>
        </Container>
      </div>
    );
  }

  const StatusIcon = statusIcons[result.status];
  const statusInfo = statusMessages[result.status];

  const timelineSteps = [
    { icon: Upload, label: 'Evidence Uploaded', time: formatDateTime(result.createdAt) },
    { icon: Cpu, label: 'AI Analysis Complete', time: formatDateTime(result.createdAt) },
    { icon: Link2, label: 'Blockchain Anchored', time: formatDateTime(result.blockchain.timestamp) },
    { icon: FileBadge, label: 'Certificate Issued', time: formatDateTime(result.certificate.issuedAt) },
  ];

  return (
    <div className="relative min-h-[calc(100vh-4rem)] bg-[#09090B]">
      <BackgroundGlow intensity="subtle" />

      <Container size="wide" className="relative z-10 py-10 sm:py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <Link
            to="/history"
            className="mb-6 inline-flex items-center gap-1.5 text-sm text-white/50 transition-colors duration-200 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to history
          </Link>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="mb-2 flex items-center gap-3">
                <h1 className={ds.heading1}>Verification Report</h1>
                <StatusBadge status={result.status} />
              </div>
              <p className="text-white/50">
                {CLAIM_TYPE_LABELS[result.claimType]} &middot;{' '}
                {formatDateTime(result.createdAt)}
              </p>
            </div>
          </div>
        </motion.div>

        <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <MetricCard icon={Shield} label="Status" value={statusInfo.title.split(' ')[0]} />
          <MetricCard icon={Brain} label="Confidence" value={formatConfidence(result.confidenceScore)} />
          <MetricCard icon={Hash} label="Block" value={`#${result.blockchain.blockNumber.toLocaleString()}`} />
          <MetricCard icon={FileCheck} label="Objects" value={result.detectedObjects.length} />
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <GlassCard padding="none" hover className="overflow-hidden">
                <div className="relative aspect-video">
                  {result.imageUrl ? (
                    <img
                      src={result.imageUrl}
                      alt="Evidence"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-white/40">
                      No image available
                    </div>
                  )}
                </div>
              </GlassCard>
            </motion.div>

            <ResultCard icon={Brain} title="AI Reasoning">
              <p className={ds.bodySm}>{result.aiExplanation}</p>

              <div className="mt-6">
                <p className={cn(ds.label, 'mb-3')}>Objects Detected</p>
                {result.detectedObjects.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {result.detectedObjects.map((obj) => (
                      <Badge key={obj.label} variant="secondary">
                        {obj.label}
                        <span className="ml-1.5 text-white/40">
                          {(obj.confidence * 100).toFixed(0)}%
                        </span>
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className={ds.bodySm}>No objects detected.</p>
                )}
              </div>
            </ResultCard>

            <ResultCard icon={AlertCircle} title="Limitations">
              <p className={ds.bodySm}>{getLimitations(result.status)}</p>
            </ResultCard>

            <ResultCard icon={Lightbulb} title="Recommendation">
              <p className={ds.bodySm}>{getRecommendation(result.status, result.confidenceScore)}</p>
            </ResultCard>

            <ResultCard icon={Hash} title="Blockchain Record">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <p className="text-xs text-white/40">Transaction Hash</p>
                  <p className="font-mono text-sm text-[#3B82F6]">
                    {truncateHash(result.blockchain.transactionHash)}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-white/40">Network</p>
                  <p className="text-sm text-white/80">{result.blockchain.network}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-white/40">Block Number</p>
                  <p className="font-mono text-sm text-white/80">
                    #{result.blockchain.blockNumber.toLocaleString()}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-white/40">Timestamp</p>
                  <p className="text-sm text-white/80">
                    {formatDateTime(result.blockchain.timestamp)}
                  </p>
                </div>
              </div>

              <div className="mt-4 border-t border-white/[0.08] pt-4">
                <Button variant="secondary" size="sm" disabled>
                  <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
                  View on Explorer
                </Button>
                <p className="mt-2 text-xs text-white/40">
                  Blockchain integration pending — hash shown is a deterministic placeholder.
                </p>
              </div>
            </ResultCard>
          </div>

          <div className="space-y-6">
            <GlassCard hover padding="md">
              <div className="flex flex-col items-center gap-4 text-center">
                <div
                  className={cn(
                    'flex h-20 w-20 items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.03]',
                    statusColors[result.status]
                  )}
                >
                  <StatusIcon className="h-10 w-10" />
                </div>
                <div>
                  <p className="text-lg font-semibold text-white">{statusInfo.title}</p>
                  <p className="mt-1 text-sm text-white/50">{statusInfo.subtitle}</p>
                </div>
              </div>
            </GlassCard>

            <GlassCard hover padding="md">
              <div className="mb-4 flex items-center gap-3">
                <div className={ds.iconBox}>
                  <Shield className="h-4 w-4" />
                </div>
                <p className="font-semibold text-white">Confidence Score</p>
              </div>

              <div className="flex justify-center py-2">
                <div className="relative flex h-32 w-32 items-center justify-center">
                  <svg className="absolute inset-0 h-full w-full -rotate-90">
                    <circle
                      cx="64"
                      cy="64"
                      r="54"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="6"
                      className="text-white/[0.06]"
                    />
                    <circle
                      cx="64"
                      cy="64"
                      r="54"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="6"
                      strokeDasharray={`${2 * Math.PI * 54}`}
                      strokeDashoffset={`${2 * Math.PI * 54 * (1 - result.confidenceScore)}`}
                      className="text-[#2563EB] transition-all duration-1000 ease-out"
                      strokeLinecap="round"
                    />
                  </svg>
                  <span className="text-3xl font-bold text-white">
                    {formatConfidence(result.confidenceScore)}
                  </span>
                </div>
              </div>
            </GlassCard>

            <ResultCard icon={Clock} title="Verification Timeline">
              <div className="space-y-4">
                {timelineSteps.map((step, index) => {
                  const Icon = step.icon;
                  return (
                    <div key={step.label} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div className={ds.iconBox}>
                          <Icon className="h-4 w-4" />
                        </div>
                        {index < timelineSteps.length - 1 && (
                          <div className="mt-1 h-full w-px bg-white/[0.08]" />
                        )}
                      </div>
                      <div className="pb-4">
                        <p className="text-sm font-medium text-white">{step.label}</p>
                        <p className="text-xs text-white/40">{step.time}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ResultCard>

            <GlassCard hover padding="md">
              <div className="mb-4 flex items-center gap-3">
                <div className={ds.iconBox}>
                  <FileCheck className="h-4 w-4" />
                </div>
                <p className="font-semibold text-white">Certificate</p>
              </div>

              <div className="mb-4 flex justify-center">
                <div className="flex h-28 w-28 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.03]">
                  <QrCode className="h-16 w-16 text-white/20" />
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-white/40">Claim ID</span>
                  <span className="font-mono text-xs text-white/80">{result.id}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-white/40">Issued</span>
                  <span className="text-white/80">{formatDateTime(result.certificate.issuedAt)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-white/40">Hash</span>
                  <span className="font-mono text-xs text-[#3B82F6]">
                    {truncateHash(result.blockchain.transactionHash, 6)}
                  </span>
                </div>
                {downloadError && (
                  <p className="text-xs text-red-400">{downloadError}</p>
                )}
                <Button
                  className="w-full"
                  onClick={handleDownloadCertificate}
                  disabled={downloading}
                >
                  <Download className="mr-2 h-4 w-4" />
                  {downloading ? 'Generating...' : 'Download Certificate'}
                </Button>
              </div>
            </GlassCard>

            <Button variant="secondary" className="w-full" asChild>
              <Link to="/verify">Verify another claim</Link>
            </Button>
          </div>
        </div>
      </Container>
    </div>
  );
}
