'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { TopBar } from '@/components/layout/topbar';
import {
  GraduationCap, Users, DollarSign, Clock,
  UserCheck, TrendingUp, ArrowUpRight, ArrowDownRight,
  Activity, Calendar,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { createClient } from '@/lib/supabase/client';
import type { DashboardStats, ActivityLog } from '@/types/database';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts';

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};
const CHART_COLORS = ['#7c3aed', '#06b6d4', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6'];

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentActivity, setRecentActivity] = useState<ActivityLog[]>([]);
  const [programChartData, setProgramChartData] = useState<any[]>([]);
  const [programDistribution, setProgramDistribution] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const supabase = createClient();

        const [programsRes, participantsRes, paymentsRes, employeesRes, activityRes] = await Promise.all([
          supabase.from('programs').select('id, program_name, status, program_fee'),
          supabase.from('participants').select('id, payment_status, amount_paid, pending_amount, program_id'),
          supabase.from('payments').select('amount, payment_status, payment_date'),
          supabase.from('employees').select('id', { count: 'exact' }).eq('status', 'active'),
          supabase.from('activity_logs')
            .select('*, profile:profiles(full_name, avatar_url)')
            .order('created_at', { ascending: false })
            .limit(8),
        ]);

        const programs = programsRes.data || [];
        const participants = participantsRes.data || [];
        const payments = paymentsRes.data || [];

        const totalRevenue = payments
          .filter(p => p.payment_status === 'paid')
          .reduce((sum, p) => sum + Number(p.amount), 0);

        const pendingPayments = participants
          .reduce((sum, p) => sum + Number(p.pending_amount), 0);

        setStats({
          totalPrograms: programs.length,
          totalParticipants: participants.length,
          totalRevenue,
          pendingPayments,
          activeEmployees: employeesRes.count || 0,
          monthlyGrowth: 0,
        });

        setRecentActivity((activityRes.data || []) as unknown as ActivityLog[]);

        // Build per-program chart data
        const progData = programs.map(prog => {
          const progParts = participants.filter(p => p.program_id === prog.id);
          const collected = progParts.reduce((s, p) => s + Number(p.amount_paid), 0);
          const pending = progParts.reduce((s, p) => s + Number(p.pending_amount), 0);
          return {
            name: prog.program_name.length > 14 ? prog.program_name.slice(0, 14) + '…' : prog.program_name,
            fullName: prog.program_name,
            participants: progParts.length,
            collected,
            pending,
          };
        });
        setProgramChartData(progData);

        // Program status distribution pie
        const statusMap: Record<string, number> = {};
        for (const p of programs) { statusMap[p.status] = (statusMap[p.status] || 0) + 1; }
        const distData = Object.entries(statusMap).map(([name, value]) => ({ name, value }));
        setProgramDistribution(distData);

      } catch (error) {
        console.error('Dashboard fetch error:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  const statCards = [
    { title: 'Total Programs',     value: stats?.totalPrograms || 0,                          icon: GraduationCap, gradient: 'gradient-primary',  trend: 'up'   as const },
    { title: 'Total Participants', value: stats?.totalParticipants || 0,                       icon: Users,         gradient: 'gradient-info',     trend: 'up'   as const },
    { title: 'Revenue Collected',  value: `₹${(stats?.totalRevenue || 0).toLocaleString()}`,  icon: DollarSign,    gradient: 'gradient-success',  trend: 'up'   as const },
    { title: 'Amount Pending',     value: `₹${(stats?.pendingPayments || 0).toLocaleString()}`,icon: Clock,        gradient: 'gradient-warning',  trend: 'down' as const },
    { title: 'Active Employees',   value: stats?.activeEmployees || 0,                         icon: UserCheck,     gradient: 'gradient-primary',  trend: 'up'   as const },
    { title: 'Paid Participants',  value: programChartData.reduce((s, p) => s + p.participants, 0), icon: TrendingUp, gradient: 'gradient-success', trend: 'up' as const },
  ];

  const formatCurrency = (v: any) => `₹${Number(v).toLocaleString()}`;

  if (loading) {
    return (
      <>
        <TopBar title="Dashboard" subtitle="Welcome back!" />
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1,2,3,4,5,6].map(i => <Skeleton key={i} className="h-36 rounded-xl" />)}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Skeleton className="h-80 rounded-xl" />
            <Skeleton className="h-80 rounded-xl" />
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <TopBar title="Dashboard" subtitle="Overview of your workspace" />
      <div className="p-6 space-y-6">

        {/* Stat Cards */}
        <motion.div variants={containerVariants} initial="hidden" animate="show" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {statCards.map(card => {
            const Icon = card.icon;
            return (
              <motion.div key={card.title} variants={itemVariants}>
                <Card className="stat-card border-0 shadow-sm hover:shadow-lg">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground font-medium">{card.title}</p>
                        <p className="text-3xl font-bold tracking-tight">{card.value}</p>
                        <div className="flex items-center gap-1">
                          {card.trend === 'up'
                            ? <ArrowUpRight className="w-3.5 h-3.5 text-emerald-500" />
                            : <ArrowDownRight className="w-3.5 h-3.5 text-red-500" />}
                          <span className={`text-xs font-medium ${card.trend === 'up' ? 'text-emerald-500' : 'text-red-500'}`}>
                            Live
                          </span>
                          <span className="text-xs text-muted-foreground">from database</span>
                        </div>
                      </div>
                      <div className={`p-3 rounded-xl ${card.gradient}`}>
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Collected vs Pending per program */}
          <motion.div variants={itemVariants} initial="hidden" animate="show">
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-semibold">Payment Status per Program</CardTitle>
                  <Badge variant="secondary" className="text-xs">Live</Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                {programChartData.length === 0 ? (
                  <div className="h-64 flex flex-col items-center justify-center text-muted-foreground">
                    <GraduationCap className="w-10 h-10 opacity-20 mb-2" />
                    <p className="text-sm">No programs yet — create one to see data</p>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={programChartData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `₹${v}`} />
                      <Tooltip
                        formatter={(val: any, name: any) => [formatCurrency(val), name === 'collected' ? 'Collected' : 'Pending']}
                        labelFormatter={(label, payload) => payload?.[0]?.payload?.fullName || label}
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                      />
                      <Legend formatter={v => v === 'collected' ? 'Collected' : 'Pending'} />
                      <Bar dataKey="collected" fill="#10b981" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="pending"   fill="#f59e0b" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Program Status Pie */}
          <motion.div variants={itemVariants} initial="hidden" animate="show">
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-semibold">Program Status Distribution</CardTitle>
                  <Badge variant="secondary" className="text-xs">Live</Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                {programDistribution.length === 0 ? (
                  <div className="h-64 flex flex-col items-center justify-center text-muted-foreground">
                    <Users className="w-10 h-10 opacity-20 mb-2" />
                    <p className="text-sm">No programs yet</p>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={280}>
                    <PieChart>
                      <Pie data={programDistribution} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={4} dataKey="value">
                        {programDistribution.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                      </Pie>
                      <Tooltip contentStyle={{ borderRadius: '12px', border: 'none' }} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Participants per Program + Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Participant count per program bar chart */}
          <motion.div variants={itemVariants} initial="hidden" animate="show" className="lg:col-span-2">
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold">Participants per Program</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                {programChartData.length === 0 ? (
                  <div className="h-64 flex flex-col items-center justify-center text-muted-foreground">
                    <Users className="w-10 h-10 opacity-20 mb-2" />
                    <p className="text-sm">Add participants to a program to see data</p>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={programChartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                      <Tooltip
                        formatter={(val: any) => [val, 'Participants']}
                        labelFormatter={(label, payload) => payload?.[0]?.payload?.fullName || label}
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                      />
                      <Bar dataKey="participants" fill="#7c3aed" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Recent Activity */}
          <motion.div variants={itemVariants} initial="hidden" animate="show">
            <Card className="border-0 shadow-sm h-full">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-semibold">Recent Activity</CardTitle>
                  <Activity className="w-4 h-4 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent className="space-y-4 overflow-y-auto max-h-72">
                {recentActivity.length > 0 ? (
                  recentActivity.slice(0, 8).map(activity => (
                    <div key={activity.id} className="flex items-start gap-3">
                      <Avatar className="w-8 h-8 mt-0.5 shrink-0">
                        <AvatarFallback className="bg-primary/10 text-primary text-[10px] font-semibold">
                          {(activity.profile?.full_name || 'U').charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate">{activity.profile?.full_name || 'Unknown'}</p>
                        <p className="text-xs text-muted-foreground truncate">{activity.action}</p>
                        <p className="text-[10px] text-muted-foreground/60 mt-0.5">
                          {new Date(activity.created_at).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      <Badge variant="outline" className="text-[10px] shrink-0">{activity.module}</Badge>
                    </div>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <Calendar className="w-10 h-10 text-muted-foreground/30 mb-3" />
                    <p className="text-sm text-muted-foreground">No activity yet</p>
                    <p className="text-xs text-muted-foreground/60 mt-1">Actions will appear here</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>

      </div>
    </>
  );
}
