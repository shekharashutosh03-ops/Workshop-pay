'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { TopBar } from '@/components/layout/topbar';
import { Bell, BellOff, Check, CheckCheck, Trash2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { createClient } from '@/lib/supabase/client';
import { useAppStore } from '@/store/useAppStore';
import type { Notification } from '@/types/database';
import { toast } from 'sonner';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAppStore();

  const fetchData = useCallback(async () => {
    if (!user) return;
    const supabase = createClient();
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .or(`user_id.eq.${user.id},user_id.is.null`)
      .order('created_at', { ascending: false });
    setNotifications((data || []) as Notification[]);
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const markAsRead = async (id: string) => {
    const supabase = createClient();
    await supabase.from('notifications').update({ is_read: true }).eq('id', id);
    fetchData();
  };

  const markAllRead = async () => {
    if (!user) return;
    const supabase = createClient();
    await supabase.from('notifications').update({ is_read: true }).or(`user_id.eq.${user.id},user_id.is.null`).eq('is_read', false);
    toast.success('All marked as read');
    fetchData();
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <>
      <TopBar title="Notifications" subtitle={`${unreadCount} unread notifications`} />
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <Badge variant="secondary" className="gap-1"><Bell className="w-3.5 h-3.5" />{unreadCount} unread</Badge>
          {unreadCount > 0 && (
            <Button variant="outline" size="sm" onClick={markAllRead} className="gap-2"><CheckCheck className="w-4 h-4" />Mark all read</Button>
          )}
        </div>

        <div className="space-y-3">
          {loading ? (
            [1,2,3,4].map(i => <Skeleton key={i} className="h-20 rounded-xl" />)
          ) : notifications.length === 0 ? (
            <Card className="border-0 shadow-sm"><CardContent className="py-16 text-center">
              <BellOff className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
              <h3 className="text-lg font-semibold">No notifications</h3>
              <p className="text-sm text-muted-foreground">You&apos;re all caught up!</p>
            </CardContent></Card>
          ) : (
            notifications.map((n, i) => (
              <motion.div key={n.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <Card className={`border-0 shadow-sm stat-card ${!n.is_read ? 'ring-1 ring-primary/20 bg-primary/[0.02]' : ''}`}>
                  <CardContent className="p-4 flex items-start gap-4">
                    <div className={`mt-1 w-2 h-2 rounded-full shrink-0 ${n.is_read ? 'bg-muted' : 'bg-primary pulse-glow'}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-sm font-medium">{n.title}</p>
                          <p className="text-sm text-muted-foreground mt-0.5">{n.message}</p>
                        </div>
                        <span className="text-xs text-muted-foreground shrink-0">
                          {new Date(n.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                    {!n.is_read && (
                      <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => markAsRead(n.id)}>
                        <Check className="w-4 h-4" />
                      </Button>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </>
  );
}
