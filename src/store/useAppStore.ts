import { create } from 'zustand';
import type { Profile, Notification } from '@/types/database';

interface AppState {
  // User
  user: Profile | null;
  setUser: (user: Profile | null) => void;

  // Sidebar
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;

  // Theme
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
  toggleTheme: () => void;

  // Notifications
  notifications: Notification[];
  setNotifications: (notifications: Notification[]) => void;
  addNotification: (notification: Notification) => void;
  markAsRead: (id: string) => void;
  unreadCount: () => number;

  // Global Search
  searchOpen: boolean;
  setSearchOpen: (open: boolean) => void;

  // Loading
  globalLoading: boolean;
  setGlobalLoading: (loading: boolean) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  // User
  user: null,
  setUser: (user) => set({ user }),

  // Sidebar
  sidebarOpen: true,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),

  // Theme
  theme: 'dark',
  setTheme: (theme) => {
    set({ theme });
    if (typeof document !== 'undefined') {
      document.documentElement.classList.toggle('dark', theme === 'dark');
      localStorage.setItem('theme', theme);
    }
  },
  toggleTheme: () => {
    const newTheme = get().theme === 'dark' ? 'light' : 'dark';
    get().setTheme(newTheme);
  },

  // Notifications
  notifications: [],
  setNotifications: (notifications) => set({ notifications }),
  addNotification: (notification) =>
    set((state) => ({ notifications: [notification, ...state.notifications] })),
  markAsRead: (id) =>
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, is_read: true } : n
      ),
    })),
  unreadCount: () => get().notifications.filter((n) => !n.is_read).length,

  // Global Search
  searchOpen: false,
  setSearchOpen: (open) => set({ searchOpen: open }),

  // Loading
  globalLoading: false,
  setGlobalLoading: (loading) => set({ globalLoading: loading }),
}));
