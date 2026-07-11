import { motion, AnimatePresence } from 'motion/react';
import { X, CheckCheck, Trash2, Bell, FileCheck, FileText, Link2, AlertCircle, Layers } from 'lucide-react';
import { useNotifications } from '../../contexts/NotificationContext';
import NotificationCard from './NotificationCard';
import type { NotificationFilter } from '../../types';
import { cn } from '../../lib/utils';

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
}

const FILTERS: { value: NotificationFilter; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { value: 'all', label: 'All', icon: Bell },
  { value: 'verification', label: 'Verification', icon: FileCheck },
  { value: 'certificates', label: 'Certificates', icon: FileText },
  { value: 'blockchain', label: 'Blockchain', icon: Link2 },
  { value: 'errors', label: 'Errors', icon: AlertCircle },
  { value: 'bulk', label: 'Bulk', icon: Layers },
];

export default function NotificationCenter({ isOpen, onClose }: NotificationCenterProps) {
  const {
    notifications,
    unreadCount,
    isLoading,
    filter,
    setFilter,
    markAsRead,
    markAllAsRead,
    clearRead,
    hasMore,
    loadMore,
  } = useNotifications();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 z-50 h-full w-full max-w-md border-l border-white/10 bg-[#0a0a0a]/95 backdrop-blur-2xl shadow-2xl"
          >
            <div className="flex h-full flex-col">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
                <div className="flex items-center gap-3">
                  <Bell className="h-5 w-5 text-white/60" />
                  <h2 className="text-lg font-semibold text-white">Notifications</h2>
                  {unreadCount > 0 && (
                    <span className="rounded-full bg-[#3B82F6] px-2 py-0.5 text-xs font-medium text-white">
                      {unreadCount}
                    </span>
                  )}
                </div>
                <button
                  onClick={onClose}
                  className="rounded-lg p-2 text-white/60 transition-colors hover:bg-white/5 hover:text-white"
                  aria-label="Close notifications"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Top Actions */}
              <div className="flex gap-2 border-b border-white/10 px-6 py-3">
                <button
                  onClick={markAllAsRead}
                  disabled={unreadCount === 0}
                  className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-white/70 transition-colors hover:bg-white/5 hover:text-white disabled:opacity-40"
                >
                  <CheckCheck className="h-3.5 w-3.5" />
                  Mark All as Read
                </button>
                <button
                  onClick={clearRead}
                  className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-white/70 transition-colors hover:bg-white/5 hover:text-white"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Clear Read
                </button>
              </div>

              {/* Filters */}
              <div className="flex gap-2 overflow-x-auto border-b border-white/10 px-6 py-3 scrollbar-hide">
                {FILTERS.map((f) => {
                  const Icon = f.icon;
                  return (
                    <button
                      key={f.value}
                      onClick={() => setFilter(f.value)}
                      className={cn(
                        'flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors',
                        filter === f.value
                          ? 'bg-white/10 text-white'
                          : 'text-white/60 hover:bg-white/5 hover:text-white'
                      )}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      {f.label}
                    </button>
                  );
                })}
              </div>

              {/* Notification List */}
              <div className="flex-1 overflow-y-auto px-6 py-4">
                {isLoading && notifications.length === 0 ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/20 border-t-white/60" />
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Bell className="mb-4 h-16 w-16 text-white/20" />
                    <p className="text-sm font-medium text-white/60">No notifications yet</p>
                    <p className="mt-1 text-xs text-white/40">
                      We'll notify you when something important happens.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {notifications.map((notification) => (
                      <NotificationCard
                        key={notification.id}
                        notification={notification}
                        onMarkRead={markAsRead}
                      />
                    ))}

                    {/* Load More */}
                    {hasMore && (
                      <button
                        onClick={loadMore}
                        disabled={isLoading}
                        className="w-full rounded-lg border border-white/10 bg-white/5 py-3 text-sm font-medium text-white/70 transition-colors hover:bg-white/10 disabled:opacity-40"
                      >
                        {isLoading ? 'Loading...' : 'Load More'}
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
