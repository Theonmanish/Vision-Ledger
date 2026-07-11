import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
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
  filter: NotificationFilter;
  setFilter: (filter: NotificationFilter) => void;
  refresh: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  clearRead: () => Promise<void>;
  hasMore: boolean;
  loadMore: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<NotificationFilter>('all');
  const [hasMore, setHasMore] = useState(false);
  const [offset, setOffset] = useState(0);

  const loadNotifications = useCallback(async (reset = false) => {
    try {
      setIsLoading(true);
      const currentOffset = reset ? 0 : offset;
      const data = await fetchNotifications(30, currentOffset, filter);

      if (reset) {
        setNotifications(data.notifications);
        setOffset(30);
      } else {
        setNotifications((prev) => [...prev, ...data.notifications]);
        setOffset(currentOffset + 30);
      }
      setHasMore(data.has_more);
    } catch (error) {
      console.error('Failed to load notifications:', error);
    } finally {
      setIsLoading(false);
    }
  }, [filter, offset]);

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
    try {
      await markNotificationRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      await markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  }, []);

  const clearRead = useCallback(async () => {
    try {
      await clearReadNotifications();
      setNotifications((prev) => prev.filter((n) => !n.is_read));
      await loadUnreadCount();
    } catch (error) {
      console.error('Failed to clear read notifications:', error);
    }
  }, [loadUnreadCount]);

  const loadMore = useCallback(async () => {
    if (!hasMore || isLoading) return;
    await loadNotifications(false);
  }, [hasMore, isLoading, loadNotifications]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Reload when filter changes
  useEffect(() => {
    loadNotifications(true);
  }, [filter]);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        isLoading,
        filter,
        setFilter,
        refresh,
        markAsRead,
        markAllAsRead,
        clearRead,
        hasMore,
        loadMore,
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
