import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import StatusBadge from '../components/shared/StatusBadge';
import ResultCard from '../components/shared/ResultCard';
import LoadingScreen from '../components/shared/LoadingScreen';
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
} from 'lucide-react';
import { CLAIM_TYPE_LABELS, type VerificationResult } from '../types';
import { formatDateTime, formatConfidence, truncateHash } from '../lib/utils';
import { cn } from '../lib/utils';
import { fetchClaim, downloadCertificate, ApiError } from '../lib/api';

const statusIcons = {
  verified: CheckCircle2,
  partially_verified: AlertTriangle,
  inconclusive: HelpCircle,
  failed: XCircle,
} as const;

const statusColors = {
  verified: 'text-success',
  partially_verified: 'text-warning',
  inconclusive: 'text-muted',
  failed: 'text-danger',
} as const;

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
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-10">
        <LoadingScreen message="Loading verification results..." />
      </div>
    );
  }

  if (error || !result) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center">
        <div className="flex flex-col items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-accent">
            <HelpCircle className="h-8 w-8 text-muted" />
          </div>
          <h2 className="text-2xl font-bold">Verification not found</h2>
          <p className="text-muted">
            {error ?? "The verification result you're looking for doesn't exist or has been removed."}
          </p>
          <Button asChild>
            <Link to="/verify">Start a new verification</Link>
          </Button>
        </div>
      </div>
    );
  }

  const StatusIcon = statusIcons[result.status];

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
      <div className="mb-8">
        <Link
          to="/history"
          className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground transition-colors duration-200 mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to history
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl sm:text-3xl font-bold">
                Verification Results
              </h1>
              <StatusBadge status={result.status} />
            </div>
            <p className="text-muted">
              {CLAIM_TYPE_LABELS[result.claimType]} &middot;{' '}
              {formatDateTime(result.createdAt)}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="overflow-hidden">
            <div className="aspect-video relative">
              {result.imageUrl ? (
                <img
                  src={result.imageUrl}
                  alt="Evidence"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center bg-accent text-muted">
                  No image available
                </div>
              )}
            </div>
          </Card>

          <ResultCard icon={Brain} title="AI Analysis">
            <div className="space-y-4">
              <p className="text-sm text-muted leading-relaxed">
                {result.aiExplanation}
              </p>

              <div>
                <p className="text-sm font-medium mb-3">Detected Objects</p>
                {result.detectedObjects.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {result.detectedObjects.map((obj) => (
                      <Badge
                        key={obj.label}
                        variant="secondary"
                        className="text-xs"
                      >
                        {obj.label}
                        <span className="ml-1.5 text-muted">
                          {(obj.confidence * 100).toFixed(0)}%
                        </span>
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted">No objects detected.</p>
                )}
              </div>
            </div>
          </ResultCard>

          <ResultCard icon={Hash} title="Blockchain Record">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-xs text-muted">Transaction Hash</p>
                <p className="text-sm font-mono text-primary">
                  {truncateHash(result.blockchain.transactionHash)}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted">Network</p>
                <p className="text-sm">{result.blockchain.network}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted">Block Number</p>
                <p className="text-sm font-mono">
                  #{result.blockchain.blockNumber.toLocaleString()}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted">Timestamp</p>
                <p className="text-sm">
                  {formatDateTime(result.blockchain.timestamp)}
                </p>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-border/50">
              <Button variant="outline" size="sm" disabled>
                <span className="inline-flex items-center gap-1.5">
                  View on Explorer
                  <ExternalLink className="h-3.5 w-3.5" />
                </span>
              </Button>
              <p className="mt-2 text-xs text-muted">
                Blockchain integration pending — hash shown is a deterministic placeholder.
              </p>
            </div>
          </ResultCard>
        </div>

        <div className="space-y-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col items-center text-center gap-4">
                <div
                  className={cn(
                    'flex h-20 w-20 items-center justify-center rounded-full',
                    statusColors[result.status],
                    'bg-accent'
                  )}
                >
                  <StatusIcon className="h-10 w-10" />
                </div>
                <div>
                  <p className="text-lg font-semibold">
                    {result.status === 'verified'
                      ? 'Claim Verified'
                      : result.status === 'partially_verified'
                        ? 'Partially Verified'
                        : result.status === 'inconclusive'
                          ? 'Inconclusive'
                          : 'Verification Failed'}
                  </p>
                  <p className="text-sm text-muted mt-1">
                    {result.status === 'verified'
                      ? 'All evidence criteria met'
                      : result.status === 'partially_verified'
                        ? 'Some criteria not fully met'
                        : result.status === 'inconclusive'
                          ? 'Insufficient evidence'
                          : 'Evidence does not match claim'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Shield className="h-4 w-4" />
                </div>
                <p className="font-semibold">Confidence Score</p>
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
                      className="text-accent"
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
                      className="text-primary transition-all duration-1000 ease-out"
                      strokeLinecap="round"
                    />
                  </svg>
                  <span className="text-3xl font-bold">
                    {formatConfidence(result.confidenceScore)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <ResultCard icon={FileCheck} title="Certificate">
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted">Issued</span>
                <span>{formatDateTime(result.certificate.issuedAt)}</span>
              </div>
              {downloadError && (
                <p className="text-xs text-danger">{downloadError}</p>
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
          </ResultCard>

          <Button variant="outline" className="w-full" asChild>
            <Link to="/verify">Verify another claim</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
