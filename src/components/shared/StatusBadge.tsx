import { cn } from '../../lib/utils';
import { Badge } from '../ui/badge';
import { STATUS_LABELS, type VerificationStatus } from '../../types';

interface StatusBadgeProps {
  status: VerificationStatus;
  className?: string;
}

const statusVariantMap: Record<VerificationStatus, 'success' | 'warning' | 'secondary' | 'danger'> = {
  verified: 'success',
  partially_verified: 'warning',
  inconclusive: 'secondary',
  failed: 'danger',
};

export default function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <Badge
      variant={statusVariantMap[status]}
      className={cn('text-xs font-medium', className)}
    >
      {STATUS_LABELS[status]}
    </Badge>
  );
}
