import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Container } from '../components/ui/container';
import { PageHeader } from '../components/ui/page-header';
import { BackgroundGlow } from '../components/ui/background-glow';
import { Progress } from '../components/ui/progress';
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
import { CLAIM_TYPE_LABELS, type HistoryRecord } from '../types';
import { formatDate, truncateHash, cn } from '../lib/utils';
import { fetchHistory, ApiError } from '../lib/api';
import { Search, Eye, History, AlertCircle, Link2 } from 'lucide-react';

export default function HistoryPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [records, setRecords] = useState<HistoryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    fetchHistory()
      .then((data) => {
        if (!cancelled) setRecords(data);
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
      <div className="relative min-h-[calc(100vh-4rem)] bg-[#09090B]">
        <BackgroundGlow intensity="subtle" />
        <Container className="relative z-10 py-10">
          <LoadingScreen message="Loading verification history..." />
        </Container>
      </div>
    );
  }

  return (
    <div className="relative min-h-[calc(100vh-4rem)] bg-[#09090B]">
      <BackgroundGlow intensity="subtle" />

      <Container className="relative z-10 py-10 sm:py-16">
        <PageHeader
          title="Verification History"
          description="Browse all your past verification results and their blockchain records."
        />

        {error && (
          <div className={cn(ds.errorAlert, 'mb-6')}>
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {records.length === 0 && !error ? (
          <EmptyState
            icon={History}
            title="No verifications yet"
            description="Start your first verification by uploading evidence and running AI analysis."
            actionLabel="Verify Evidence"
            actionPath="/verify"
          />
        ) : (
          <>
            <div className="mb-6">
              <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
                <Input
                  placeholder="Search by ID, type, or hash..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className={ds.glassPanel}>
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
                              <Link2 className="h-2.5 w-2.5" />
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
                            <Eye className="mr-1.5 h-3.5 w-3.5" />
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
            </p>
          </>
        )}
      </Container>
    </div>
  );
}
