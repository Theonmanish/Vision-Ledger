import { Link, useNavigate } from 'react-router-dom';
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
import { downloadCertificate } from '../../lib/api';
import { useToast } from '../ui/toast';

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

export default function NotificationCard({ notification, onMarkRead }: NotificationCardProps) {
  const config = NOTIFICATION_CONFIG[notification.notification_type] || NOTIFICATION_CONFIG.verification_completed;
  const Icon = config.icon;
  const navigate = useNavigate();
  const { addToast } = useToast();

  const handleAction = async () => {
    // Mark as read when clicked
    if (!notification.is_read) {
      onMarkRead(notification.id);
    }

    // Handle different notification types
    switch (notification.notification_type) {
      case 'verification_completed':
      case 'verification_review':
      case 'verification_started':
        if (notification.claim_id) {
          navigate(`/results/${notification.claim_id}`);
        }
        break;

      case 'verification_failed':
        navigate('/verify');
        break;

      case 'certificate_generated':
        if (notification.claim_id) {
          try {
            await downloadCertificate(notification.claim_id);
            addToast({
              type: 'success',
              title: 'Certificate downloaded',
              message: 'Your certificate has been downloaded successfully.',
            });
          } catch (error) {
            addToast({
              type: 'error',
              title: 'Download failed',
              message: 'Unable to download certificate. Please try again.',
            });
          }
        }
        break;

      case 'blockchain_anchored':
        if (notification.action_url) {
          window.open(notification.action_url, '_blank', 'noopener,noreferrer');
        }
        break;

      case 'batch_completed':
        if (notification.batch_id) {
          navigate(`/history`);
        }
        break;

      default:
        if (notification.action_url) {
          navigate(notification.action_url);
        }
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
      className={cn(
        'group relative rounded-xl border p-4 transition-all duration-200 cursor-pointer',
        notification.is_read
          ? 'border-white/5 bg-white/[0.02]'
          : 'border-white/10 bg-white/[0.05] hover:bg-white/[0.08]'
      )}
      onClick={handleAction}
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
            <button
              className={cn(
                'mt-3 inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors',
                'bg-white/5 text-white/80 hover:bg-white/10 hover:text-white'
              )}
              onClick={(e) => {
                e.stopPropagation();
                handleAction();
              }}
            >
              {notification.notification_type === 'certificate_generated' && <Download className="h-3.5 w-3.5" />}
              {notification.notification_type === 'blockchain_anchored' && <ExternalLink className="h-3.5 w-3.5" />}
              {notification.notification_type === 'verification_failed' && <RotateCcw className="h-3.5 w-3.5" />}
              {(notification.notification_type === 'verification_completed' ||
                notification.notification_type === 'verification_review' ||
                notification.notification_type === 'batch_completed') && <Eye className="h-3.5 w-3.5" />}
              {notification.notification_type === 'verification_started' && <Clock className="h-3.5 w-3.5" />}

              {notification.notification_type === 'certificate_generated' && 'Download PDF'}
              {notification.notification_type === 'blockchain_anchored' && 'View on Sepolia'}
              {notification.notification_type === 'verification_failed' && 'Retry Verification'}
              {notification.notification_type === 'verification_completed' && 'View Result'}
              {notification.notification_type === 'verification_review' && 'Open Verification'}
              {notification.notification_type === 'batch_completed' && 'Open Batch Summary'}
              {notification.notification_type === 'verification_started' && 'View Status'}
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
