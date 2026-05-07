'use client';

import { useAppStore } from '@/store/useAppStore';
import { Sidebar } from '@/components/layout/sidebar';
import { useRealtimeNotifications } from '@/hooks/useRealtime';
import { cn } from '@/lib/utils';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { sidebarOpen } = useAppStore();

  // Initialize realtime notifications
  useRealtimeNotifications();

  return (
    <div className="min-h-screen bg-background">
      <Sidebar variant="admin" />
      <main
        className={cn(
          'transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]',
          sidebarOpen ? 'ml-[280px]' : 'ml-[80px]'
        )}
      >
        {children}
      </main>
    </div>
  );
}
