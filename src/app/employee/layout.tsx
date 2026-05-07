'use client';

import { useAppStore } from '@/store/useAppStore';
import { Sidebar } from '@/components/layout/sidebar';
import { useRealtimeNotifications } from '@/hooks/useRealtime';
import { cn } from '@/lib/utils';

export default function EmployeeLayout({ children }: { children: React.ReactNode }) {
  const { sidebarOpen } = useAppStore();
  useRealtimeNotifications();

  return (
    <div className="min-h-screen bg-background">
      <Sidebar variant="employee" />
      <main className={cn('transition-all duration-300', sidebarOpen ? 'ml-[280px]' : 'ml-[80px]')}>
        {children}
      </main>
    </div>
  );
}
