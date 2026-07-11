import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  CheckCircle2,
  AlertCircle,
  FileCheck,
  FileText,
  Link2,
  Layers,
  Clock,
  Download,
  Eye,
  ExternalLink,
  RotateCcw,
} from 'lucide-react';
import type { Notification } from '../../types';
import { formatRelativeTime } from '../../lib/utils';
import { cn } from '../../lib/utils';

interface NotificationCardProps {
  notification: Notification;
  onMarkRead: (id: string) => void;
}

const NOTIFICATION_CONFIG = {
  verification_started: {
    icon: Clock,
    color: 'text-blue-400',
    bg: 'bg-blue-500/10',
  },
  verification_completed: {
    icon: CheckCircle2,
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
  },
  verification_review: {
    icon: AlertCircle,
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
  },
  verification_failed: {
    icon: AlertCircle,
    color: 'text-red-400',
    bg: 'bg-red-500/10',
  },
  certificate_generated: {
    icon: FileText,
    color: 'text-purple-400',
    bg: 'bg-purple-500/10',
  },
  blockchain_anchored: {
    icon: Link2,
    color: 'text-cyan-400',
    bg: 'bg-cyan-500/10',
  },
  batch_completed: {
    icon: Layers,
    color: 'text-indigo-400',
    bg: 'bg-indigo-500/10',
  },
};

const ACTION_CONFIG: Record<string, { label: string; icon: React.ComponentType<{ className?: string }> }> = {
  verification_started: { label: 'View Status', icon: Eye },
  verification_completed: { label: 'View Result', icon: Eye },
  verification_review: { label: 'Open Verification', icon: Eye },
  verification_failed: { label: 'Retry Verification', icon: RotateCcw },
  certificate_generated: { label: 'Download PDF', icon: Download },
  blockchain_anchored: { label: 'View on Sepolia', icon: ExternalLink },
  batch_completed: { label: 'Open Batch Summary', icon: Eye },
};

export default function NotificationCard({ notification, onMarkRead }: NotificationCardProps) {
  const config = NOTIFICATION_CONFIG[notification.notification_type] || NOTIFICATION_CONFIG.verification_completed;
  const actionConfig = ACTION_CONFIG[notification.notification_type] || ACTION_CONFIG.verification_completed;
  const Icon = config.icon;
  const ActionIcon = actionConfig.icon;

  const handleClick = () => {
    if (!notification.is_read) {
      onMarkRead(notification.id);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
      className={cn(
        'group relative rounded-xl border p-4 transition-all duration-200',
        notification.is_read
          ? 'border-white/5 bg-white/[0.02]'
          : 'border-white/10 bg-white/[0.05] hover:bg-white/[0.08]'
      )}
    >
      {/* Unread indicator */}
      {!notification.is_read && (
        <div className="absolute left-0 top-1/2 h-2 w-2 -translate-y-1/2 rounded-full bg-[#3B82F6]" />
      )}

      <div className="flex gap-3">
        {/* Icon */}
        <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-lg', config.bg)}>
          <Icon className={cn('h-5 w-5', config.color)} />
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h4 className="text-sm font-medium text-white">{notification.title}</h4>
            <span className="shrink-0 text-xs text-white/40">
              {formatRelativeTime(notification.created_at)}
            </span>
          </div>
          <p className="mt-1 text-xs text-white/60 line-clamp-2">{notification.message}</p>

          {/* Action button */}
          {notification.action_url && (
            <Link
              to={notification.action_url}
              onClick={handleClick}
              className={cn(
                'mt-3 inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors',
                'bg-white/5 text-white/80 hover:bg-white/10 hover:text-white'
              )}
            >
              <ActionIcon className="h-3.5 w-3.5" />
              {actionConfig.label}
            </Link>
          )}
        </div>
      </div>
    </motion.div>
  );
}
