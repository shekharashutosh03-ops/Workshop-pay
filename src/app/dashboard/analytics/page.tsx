// @ts-nocheck
'use client';

import { useEffect, useState } from 'react';
import { TopBar } from '@/components/layout/topbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import {
  GraduationCap, Users, DollarSign, TrendingUp,
  CheckCircle2, Clock, UserPlus, CreditCard, Activity
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

const COLORS = ['#7c3aed', '#06b6d4', '#10b981', '#f59e0b', '#ef4444'];

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalPrograms: 0,
    totalParticipants: 0,
    totalRevenue: 0,
    totalPending: 0,
    paidCount: 0,
    pendingCount: 0,
    partialCount: 0,
  });
  const [programData, setProgramData] = useState<any[]>([]);
  const [paymentModeData, setPaymentModeData] = useState<any[]>([]);
  const [activityLog, setActivityLog] = useState<any[]>([]);

  useEffect(() => {
    const fetchAll = async () => {
      const supabase = createClient();

      // Fetch core data in parallel
      const [progRes, partRes, payRes, actRes] = await Promise.all([
        supabase.from('programs').select('id, program_name, program_fee, status'),
        supabase.from('participants').select('id, payment_status, amount_paid, pending_amount, program_id'),
        supabase.from('payments').select('id, amount, payment_mode, payment_status, payment_date'),
        supabase.from('activity_logs')
          .select('id, action, module, metadata, created_at, user:profiles(full_name, role)')
          .order('created_at', { ascending: false })
          .limit(20),
      ]);

      const programs = progRes.data || [];
      const participants = partRes.data || [];
      const payments = payRes.data || [];
      const activities = actRes.data || [];

      // Summary stats
      const totalRevenue = payments
        .filter(p => p.payment_status === 'paid')
        .reduce((s, p) => s + Number(p.amount), 0);

      const totalPending = participants.reduce((s, p) => s + Number(p.pending_amount), 0);
      const paidCount = participants.filter(p => p.payment_status === 'paid').length;
      const pendingCount = participants.filter(p => p.payment_status === 'pending').length;
      const partialCount = participants.filter(p => p.payment_status === 'partial').length;

      setStats({
        totalPrograms: programs.length,
        totalParticipants: participants.length,
        totalRevenue,
        totalPending,
        paidCount,
        pendingCount,
        partialCount,
      });

      // Program-wise participant & revenue breakdown
      const programBreakdown = programs.map(prog => {
        const progParticipants = participants.filter(p => p.program_id === prog.id);
        const progRevenue = progParticipants.reduce((s, p) => s + Number(p.amount_paid), 0);
        return {
          name: prog.program_name.length > 15 ? prog.program_name.slice(0, 15) + '…' : prog.program_name,
          fullName: prog.program_name,
          participants: progParticipants.length,
          revenue: progRevenue,
          fee: Number(prog.program_fee),
        };
      });
      setProgramData(programBreakdown);

      // Payment mode breakdown
      const modeMap: Record<string, number> = {};
      for (const p of payments) {
        if (p.payment_status === 'paid') {
          modeMap[p.payment_mode] = (modeMap[p.payment_mode] || 0) + Number(p.amount);
        }
      }
      const modeData = Object.entries(modeMap).map(([name, value]) => ({ name, value }));
      setPaymentModeData(modeData);

      setActivityLog(activities);
      setLoading(false);
    };

    fetchAll();
  }, []);

  const formatCurrency = (val: number) => `₹${val.toLocaleString()}`;
  const formatTimeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  return (
    <>
      <TopBar title="Analytics" subtitle="Real-time overview of your programs & payments" />
      <div className="p-6 space-y-6">

        {/* Summary Cards */}
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1,2,3,4].map(i => <Skeleton key={i} className="h-28 rounded-xl" />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Total Programs', value: stats.totalPrograms, icon: GraduationCap, color: 'gradient-primary' },
              { label: 'Total Participants', value: stats.totalParticipants, icon: Users, color: 'gradient-info' },
              { label: 'Revenue Collected', value: formatCurrency(stats.totalRevenue), icon: CheckCircle2, color: 'gradient-success' },
              { label: 'Amount Pending', value: formatCurrency(stats.totalPending), icon: Clock, color: 'gradient-warning' },
            ].map(s => (
              <Card key={s.label} className="border-0 shadow-sm stat-card">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className={`p-2.5 rounded-xl ${s.color} shrink-0`}><s.icon className="w-5 h-5 text-white" /></div>
                  <div>
                    <p className="text-xs text-muted-foreground">{s.label}</p>
                    <p className="text-xl font-bold">{s.value}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Payment Status Overview */}
        {!loading && (
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: '✅ Fully Paid', count: stats.paidCount, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20', border: 'border-emerald-200' },
              { label: '⚠️ Partial', count: stats.partialCount, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/20', border: 'border-amber-200' },
              { label: '🔴 Pending', count: stats.pendingCount, color: 'text-red-600', bg: 'bg-red-50 dark:bg-red-900/20', border: 'border-red-200' },
            ].map(s => (
              <Card key={s.label} className={`border ${s.border} shadow-sm ${s.bg}`}>
                <CardContent className="p-4 text-center">
                  <p className={`text-3xl font-bold ${s.color}`}>{s.count}</p>
                  <p className="text-sm text-muted-foreground mt-1">{s.label}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Program Participants Bar */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2"><Users className="w-4 h-4 text-primary" /> Participants per Program</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? <Skeleton className="h-56 rounded-lg" /> : programData.length === 0 ? (
                <div className="h-56 flex items-center justify-center text-muted-foreground text-sm">No programs yet</div>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={programData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                    <Tooltip
                      formatter={(val: any, name: string) => [val, 'Participants']}
                      labelFormatter={(label: string, payload: any[]) => payload?.[0]?.payload?.fullName || label}
                      contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                    />
                    <Bar dataKey="participants" fill="#7c3aed" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Revenue per Program */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2"><DollarSign className="w-4 h-4 text-emerald-600" /> Revenue per Program (₹)</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? <Skeleton className="h-56 rounded-lg" /> : programData.length === 0 ? (
                <div className="h-56 flex items-center justify-center text-muted-foreground text-sm">No data yet</div>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={programData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `₹${v}`} />
                    <Tooltip
                      formatter={(val: any) => [`₹${Number(val).toLocaleString()}`, 'Collected']}
                      labelFormatter={(label: string, payload: any[]) => payload?.[0]?.payload?.fullName || label}
                      contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                    />
                    <Bar dataKey="revenue" fill="#10b981" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Payment Modes Pie + Activity Log */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Payment Modes */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2"><CreditCard className="w-4 h-4 text-primary" /> Payment Methods Used</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? <Skeleton className="h-56 rounded-lg" /> : paymentModeData.length === 0 ? (
                <div className="h-56 flex items-center justify-center text-muted-foreground text-sm">No payments recorded yet</div>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={paymentModeData} cx="50%" cy="50%" outerRadius={80} innerRadius={40} dataKey="value" paddingAngle={3}>
                      {paymentModeData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={(val: any) => [`₹${Number(val).toLocaleString()}`, 'Amount']} contentStyle={{ borderRadius: '10px', border: 'none' }} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Activity Log — WHO did WHAT */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2"><Activity className="w-4 h-4 text-primary" /> Recent Activity (Who did What)</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="space-y-3 p-4">{[1,2,3,4].map(i => <Skeleton key={i} className="h-12 rounded-lg" />)}</div>
              ) : activityLog.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground text-sm">No activity yet</div>
              ) : (
                <div className="divide-y max-h-72 overflow-y-auto">
                  {activityLog.map((log) => {
                    const name = (log.user as any)?.full_name || 'System';
                    const role = (log.user as any)?.role || '';
                    const initials = name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
                    return (
                      <div key={log.id} className="flex items-start gap-3 px-4 py-3">
                        <Avatar className="w-8 h-8 shrink-0">
                          <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">{initials}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-medium">{name}</span>
                            {role && <Badge variant="outline" className="text-xs h-4">{role}</Badge>}
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5 truncate">{log.action}</p>
                        </div>
                        <span className="text-xs text-muted-foreground shrink-0">{formatTimeAgo(log.created_at)}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

      </div>
    </>
  );
}
