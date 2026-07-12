import { createContext, useContext, useState, useEffect, useCallback, useRef, type ReactNode } from 'react';
import type { Notification, NotificationFilter, NotificationListResponse } from '../types';
import {
  fetchNotifications,
  fetchUnreadCount,
  markNotificationRead,
  markAllNotificationsRead,
  clearReadNotifications,
} from '../lib/api';

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  isActionLoading: boolean;
  filter: NotificationFilter;
  setFilter: (filter: NotificationFilter) => void;
  refresh: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  clearRead: () => Promise<void>;
  hasMore: boolean;
  loadMore: () => Promise<void>;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [filter, setFilter] = useState<NotificationFilter>('all');
  const [hasMore, setHasMore] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const offsetRef = useRef(0);

  const loadNotifications = useCallback(async (reset = false) => {
    try {
      setIsLoading(true);
      const currentOffset = reset ? 0 : offsetRef.current;
      const data = await fetchNotifications(30, currentOffset, filter);

      if (reset) {
        setNotifications(data.notifications);
        offsetRef.current = 30;
      } else {
        // Merge notifications by ID to prevent duplicates
        setNotifications((prev) => {
          const existingIds = new Set(prev.map((n) => n.id));
          const newNotifications = data.notifications.filter((n) => !existingIds.has(n.id));
          return [...prev, ...newNotifications];
        });
        offsetRef.current = currentOffset + 30;
      }
      setHasMore(data.has_more);
    } catch (error) {
      console.error('Failed to load notifications:', error);
    } finally {
      setIsLoading(false);
    }
  }, [filter]);

  const loadUnreadCount = useCallback(async () => {
    try {
      const data = await fetchUnreadCount();
      setUnreadCount(data.count);
    } catch (error) {
      console.error('Failed to load unread count:', error);
    }
  }, []);

  const refresh = useCallback(async () => {
    await Promise.all([loadNotifications(true), loadUnreadCount()]);
  }, [loadNotifications, loadUnreadCount]);

  const markAsRead = useCallback(async (id: string) => {
    // Optimistic update
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));

    try {
      await markNotificationRead(id);
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
      // Rollback on error
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: false } : n))
      );
      setUnreadCount((prev) => prev + 1);
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    if (isActionLoading) return;

    // Optimistic update
    setIsActionLoading(true);
    const previousNotifications = notifications;
    const previousUnreadCount = unreadCount;

    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setUnreadCount(0);

    try {
      await markAllNotificationsRead();
    } catch (error) {
      console.error('Failed to mark all as read:', error);
      // Rollback on error
      setNotifications(previousNotifications);
      setUnreadCount(previousUnreadCount);
    } finally {
      setIsActionLoading(false);
    }
  }, [isActionLoading, notifications, unreadCount]);

  const clearRead = useCallback(async () => {
    if (isActionLoading) return;

    setIsActionLoading(true);
    const previousNotifications = notifications;

    // Optimistic update - keep only unread
    setNotifications((prev) => prev.filter((n) => !n.is_read));

    try {
      await clearReadNotifications();
      await loadUnreadCount();
    } catch (error) {
      console.error('Failed to clear read notifications:', error);
      // Rollback on error
      setNotifications(previousNotifications);
    } finally {
      setIsActionLoading(false);
    }
  }, [isActionLoading, notifications, loadUnreadCount]);

  const loadMore = useCallback(async () => {
    if (!hasMore || isLoading || isActionLoading) return;
    await loadNotifications(false);
  }, [hasMore, isLoading, isActionLoading, loadNotifications]);

  // Initial load
  useEffect(() => {
    refresh();
  }, [refresh]);

  // Reload when filter changes
  useEffect(() => {
    offsetRef.current = 0;
    loadNotifications(true);
  }, [filter]);

  // Auto-refresh unread count every 30 seconds when drawer is open
  useEffect(() => {
    if (!isOpen) return;

    const interval = setInterval(() => {
      loadUnreadCount();
    }, 30000);

    return () => clearInterval(interval);
  }, [isOpen, loadUnreadCount]);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        isLoading,
        isActionLoading,
        filter,
        setFilter,
        refresh,
        markAsRead,
        markAllAsRead,
        clearRead,
        hasMore,
        loadMore,
        isOpen,
        setIsOpen,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
}
