import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
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
import { formatDate, truncateHash } from '../lib/utils';
import { fetchHistory, ApiError } from '../lib/api';
import { Search, Eye, History, AlertCircle } from 'lucide-react';

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
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
        <LoadingScreen message="Loading verification history..." />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
      <div className="mb-10">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">Verification History</h1>
        <p className="mt-3 text-muted text-lg">
          Browse all your past verification results and their blockchain records.
        </p>
      </div>

      {error && (
        <div className="mb-6 flex items-center gap-2 rounded-lg border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
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

          <div className="rounded-xl border border-border/50 bg-card overflow-hidden">
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
                      <StatusBadge status={record.status} />
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-16 rounded-full bg-secondary overflow-hidden">
                          <div
                            className="h-full rounded-full bg-primary transition-all"
                            style={{ width: `${record.confidence * 100}%` }}
                          />
                        </div>
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
                          View
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
    </div>
  );
}
