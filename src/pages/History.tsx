import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Container } from '../components/ui/container';
import { PageHeader } from '../components/ui/page-header';
import { BackgroundGlow } from '../components/ui/background-glow';
import { Progress } from '../components/ui/progress';
import { GlassCard } from '../components/ui/glass-card';
import { ds } from '../lib/design-tokens';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';
import StatusBadge from '../components/shared/StatusBadge';
import EmptyState from '../components/shared/EmptyState';
import LoadingScreen from '../components/shared/LoadingScreen';
import VerificationDashboard from '../components/analytics/VerificationDashboard';
import { CLAIM_TYPE_LABELS, type HistoryRecord, type Batch, type BatchStatus } from '../types';
import { formatDate, truncateHash, cn } from '../lib/utils';
import { fetchHistory, fetchBatches, ApiError } from '../lib/api';
import { Search, Eye, History, AlertCircle, Link2, FolderOpen, CheckCircle2, XCircle, Clock } from 'lucide-react';

function HistoryMobileCard({ record }: { record: HistoryRecord }) {
  return (
    <GlassCard padding="md" className="space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-mono text-xs font-medium text-white">{record.claimId}</p>
          <p className="mt-1 text-sm text-white/60">{CLAIM_TYPE_LABELS[record.claimType]}</p>
        </div>
        <StatusBadge status={record.status} />
      </div>

      <div className="flex items-center gap-2">
        <Progress value={record.confidence * 100} className="h-1.5 flex-1" />
        <span className="shrink-0 text-xs text-muted">
          {(record.confidence * 100).toFixed(0)}%
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted">
        <span>{formatDate(record.date)}</span>
        {record.blockchainStatus === 'Confirmed' && (
          <span className="inline-flex items-center gap-1 font-medium text-[#22C55E]">
            <Link2 className="h-3 w-3" aria-hidden="true" />
            On-chain
          </span>
        )}
      </div>

      <p className="truncate font-mono text-[11px] text-white/40">
        {truncateHash(record.transactionHash)}
      </p>

      <Button variant="secondary" size="sm" asChild className="w-full min-h-[44px]">
        <Link to={`/results/${record.claimId}`}>
          <Eye className="mr-1.5 h-4 w-4" aria-hidden="true" />
          View Report
        </Link>
      </Button>
    </GlassCard>
  );
}

function BatchStatusBadge({ status }: { status: BatchStatus }) {
  const config = {
    completed: { color: 'text-emerald-400', bg: 'bg-emerald-500/10', label: 'Completed' },
    partial: { color: 'text-amber-400', bg: 'bg-amber-500/10', label: 'Partial' },
    failed: { color: 'text-red-400', bg: 'bg-red-500/10', label: 'Failed' },
    processing: { color: 'text-blue-400', bg: 'bg-blue-500/10', label: 'Processing' },
  };
  const { color, bg, label } = config[status];

  return (
    <span className={cn('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium', bg, color)}>
      {status === 'completed' && <CheckCircle2 className="h-3 w-3" />}
      {status === 'failed' && <XCircle className="h-3 w-3" />}
      {status === 'processing' && <Clock className="h-3 w-3" />}
      {label}
    </span>
  );
}

function BatchCard({ batch }: { batch: Batch }) {
  return (
    <GlassCard padding="md" className="space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <FolderOpen className="h-4 w-4 text-[#3B82F6]" />
            <p className="font-medium text-white truncate">
              {batch.project_name || 'Unnamed Batch'}
            </p>
          </div>
          <p className="mt-1 text-xs text-white/50 font-mono">{truncateHash(batch.id)}</p>
        </div>
        <BatchStatusBadge status={batch.status} />
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div>
          <p className="text-lg font-bold text-white">{batch.total_images}</p>
          <p className="text-xs text-white/50">Total</p>
        </div>
        <div>
          <p className="text-lg font-bold text-emerald-400">{batch.completed_images}</p>
          <p className="text-xs text-white/50">Verified</p>
        </div>
        <div>
          <p className="text-lg font-bold text-amber-400">{batch.failed_images}</p>
          <p className="text-xs text-white/50">Failed</p>
        </div>
      </div>

      <div className="flex items-center justify-between text-xs text-white/60">
        <span>Avg Confidence: {batch.average_confidence.toFixed(1)}%</span>
        <span>{formatDate(batch.created_at)}</span>
      </div>

      <Button variant="secondary" size="sm" asChild className="w-full min-h-[44px]">
        <Link to={`/results/${batch.id}`}>
          <Eye className="mr-1.5 h-4 w-4" aria-hidden="true" />
          Open Batch
        </Link>
      </Button>
    </GlassCard>
  );
}

export default function HistoryPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [records, setRecords] = useState<HistoryRecord[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    Promise.all([fetchHistory(), fetchBatches()])
      .then(([historyData, batchData]) => {
        if (!cancelled) {
          setRecords(historyData);
          setBatches(batchData.batches);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(
            err instanceof ApiError
              ? err.message
              : 'Failed to load verification history.'
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = searchQuery
    ? records.filter(
      (r) =>
        r.claimId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        CLAIM_TYPE_LABELS[r.claimType]
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        r.transactionHash.toLowerCase().includes(searchQuery.toLowerCase())
    )
    : records;

  if (loading) {
    return (
      <div className="relative min-h-[calc(100vh-4rem)] min-h-[calc(100dvh-4rem)] bg-[#09090B]">
        <BackgroundGlow intensity="subtle" />
        <Container className="relative z-10 py-10">
          <LoadingScreen message="Loading verification history..." />
        </Container>
      </div>
    );
  }

  return (
    <div className="relative min-h-[calc(100vh-4rem)] min-h-[calc(100dvh-4rem)] bg-[#09090B]">
      <BackgroundGlow intensity="subtle" />

      <Container className="relative z-10 py-8 sm:py-16">
        <PageHeader
          title="Verification History"
          description="Browse all your past verification results and their blockchain records."
        />

        {error && (
          <div className={cn(ds.errorAlert, 'mb-6')} role="alert">
            <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{error}</span>
          </div>
        )}

        {records.length === 0 && batches.length === 0 && !error ? (
          <EmptyState
            icon={History}
            title="No verifications yet"
            description="Start your first verification by uploading evidence and running AI analysis."
            actionLabel="Verify Evidence"
            actionPath="/verify"
          />
        ) : (
          <>
            {/* Verification Analytics Dashboard */}
            <VerificationDashboard records={records} />

            {/* Batches Section */}
            {batches.length > 0 && (
              <div className="mb-8">
                <h2 className={cn(ds.label, 'mb-4')}>Verification Batches</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {batches.map((batch) => (
                    <BatchCard key={batch.id} batch={batch} />
                  ))}
                </div>
              </div>
            )}

            <div className="mb-6">
              <div className="relative w-full max-w-sm">
                <Search
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
                  aria-hidden="true"
                />
                <Input
                  type="search"
                  placeholder="Search by ID, type, or hash..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                  aria-label="Search verification history"
                />
              </div>
            </div>

            {/* Mobile card layout */}
            <div className="space-y-3 md:hidden">
              {filtered.map((record) => (
                <HistoryMobileCard key={record.id} record={record} />
              ))}
              {filtered.length === 0 && (
                <div className="flex flex-col items-center py-12 px-4">
                  <p className="text-muted text-sm">No results match your search.</p>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-2 min-h-[44px]"
                    onClick={() => setSearchQuery('')}
                  >
                    Clear search
                  </Button>
                </div>
              )}
            </div>

            {/* Desktop table layout */}
            <div className={cn(ds.glassPanel, 'hidden md:block scroll-touch')}>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[100px]">Claim ID</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="hidden sm:table-cell">Confidence</TableHead>
                    <TableHead className="hidden md:table-cell">Date</TableHead>
                    <TableHead className="hidden lg:table-cell">Transaction</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell className="font-medium font-mono text-xs">
                        {record.claimId}
                      </TableCell>
                      <TableCell>{CLAIM_TYPE_LABELS[record.claimType]}</TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <StatusBadge status={record.status} />
                          {record.blockchainStatus === 'Confirmed' && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-medium text-[#22C55E]">
                              <Link2 className="h-2.5 w-2.5" aria-hidden="true" />
                              On-chain
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <div className="flex items-center gap-2">
                          <Progress value={record.confidence * 100} className="h-1.5 w-16" />
                          <span className="text-xs text-muted">
                            {(record.confidence * 100).toFixed(0)}%
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-muted text-sm">
                        {formatDate(record.date)}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell font-mono text-xs text-muted">
                        {truncateHash(record.transactionHash)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" asChild>
                          <Link to={`/results/${record.claimId}`}>
                            <Eye className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
                            View Report
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {filtered.length === 0 && (
                <div className="flex flex-col items-center py-16 px-4">
                  <p className="text-muted text-sm">No results match your search.</p>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-2"
                    onClick={() => setSearchQuery('')}
                  >
                    Clear search
                  </Button>
                </div>
              )}
            </div>

            <p className="mt-4 text-xs text-muted">
              Showing {filtered.length} of {records.length} records
              {batches.length > 0 && ` • ${batches.length} batches`}
            </p>
          </>
        )}
      </Container>
    </div>
  );
}
