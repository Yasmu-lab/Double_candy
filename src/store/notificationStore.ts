import { useMemo } from 'react';
import { create } from 'zustand';
import { api, type NotificationDto } from '../lib/api';

interface NotificationState {
  notifications: NotificationDto[];
  loading: boolean;
  fetch: () => Promise<void>;
  markRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
  remove: (id: string) => Promise<void>;
}

export const useNotificationStore = create<NotificationState>()((set, get) => ({
  notifications: [],
  loading: false,

  fetch: async () => {
    set({ loading: true });
    try {
      const notifications = await api.getNotifications();
      set({ notifications, loading: false });
    } catch {
      set({ loading: false });
    }
  },

  markRead: async (id) => {
    const prev = get().notifications;
    set({ notifications: prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)) });
    try {
      await api.markNotificationRead(id);
    } catch {
      set({ notifications: prev });
    }
  },

  markAllRead: async () => {
    const prev = get().notifications;
    set({ notifications: prev.map((n) => ({ ...n, isRead: true })) });
    try {
      await api.markAllNotificationsRead();
    } catch {
      set({ notifications: prev });
    }
  },

  remove: async (id) => {
    const prev = get().notifications;
    set({ notifications: prev.filter((n) => n.id !== id) });
    try {
      await api.deleteNotification(id);
    } catch {
      set({ notifications: prev });
    }
  },
}));

export function useUnreadNotificationCount(): number {
  const notifications = useNotificationStore((s) => s.notifications);
  return useMemo(() => notifications.filter((n) => !n.isRead).length, [notifications]);
}
