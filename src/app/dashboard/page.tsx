'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { TopBar } from '@/components/layout/topbar';
import {
  GraduationCap,
  Users,
  DollarSign,
  Clock,
  UserCheck,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  Calendar,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { createClient } from '@/lib/supabase/client';
import type { DashboardStats, ActivityLog } from '@/types/database';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend,
} from 'recharts';

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

const CHART_COLORS = ['#7c3aed', '#06b6d4', '#f59e0b', '#ef4444', '#10b981', '#8b5cf6'];

// Empty arrays for when DB is empty
const mockRevenueData: any[] = [];
const mockProgramDistribution: any[] = [];
const mockPaymentTrends: any[] = [];

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentActivity, setRecentActivity] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const supabase = createClient();

        const [programsRes, participantsRes, paymentsRes, employeesRes, activityRes] = await Promise.all([
          supabase.from('programs').select('id, status', { count: 'exact' }),
          supabase.from('participants').select('id', { count: 'exact' }),
          supabase.from('payments').select('amount, payment_status'),
          supabase.from('employees').select('id', { count: 'exact' }).eq('status', 'active'),
          supabase
            .from('activity_logs')
            .select('*, profile:profiles(full_name, avatar_url)')
            .order('created_at', { ascending: false })
            .limit(8),
        ]);

        const totalRevenue = (paymentsRes.data || [])
          .filter((p) => p.payment_status === 'paid' || p.payment_status === 'partial')
          .reduce((sum, p) => sum + Number(p.amount), 0);

        const pendingPayments = (paymentsRes.data || [])
          .filter((p) => p.payment_status === 'pending')
          .reduce((sum, p) => sum + Number(p.amount), 0);

        setStats({
          totalPrograms: programsRes.count || 0,
          totalParticipants: participantsRes.count || 0,
          totalRevenue,
          pendingPayments,
          activeEmployees: employeesRes.count || 0,
          monthlyGrowth: 12.5,
        });

        setRecentActivity((activityRes.data || []) as unknown as ActivityLog[]);
      } catch (error) {
        console.error('Dashboard fetch error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const statCards = [
    {
      title: 'Total Programs',
      value: stats?.totalPrograms || 0,
      change: '+12%',
      trend: 'up' as const,
      icon: GraduationCap,
      gradient: 'gradient-primary',
      color: 'text-violet-500',
    },
    {
      title: 'Total Participants',
      value: stats?.totalParticipants || 0,
      change: '+8%',
      trend: 'up' as const,
      icon: Users,
      gradient: 'gradient-info',
      color: 'text-cyan-500',
    },
    {
      title: 'Total Revenue',
      value: `₹${(stats?.totalRevenue || 0).toLocaleString()}`,
      change: '+23%',
      trend: 'up' as const,
      icon: DollarSign,
      gradient: 'gradient-success',
      color: 'text-emerald-500',
    },
    {
      title: 'Pending Payments',
      value: `₹${(stats?.pendingPayments || 0).toLocaleString()}`,
      change: '-5%',
      trend: 'down' as const,
      icon: Clock,
      gradient: 'gradient-warning',
      color: 'text-amber-500',
    },
    {
      title: 'Active Employees',
      value: stats?.activeEmployees || 0,
      change: '+3%',
      trend: 'up' as const,
      icon: UserCheck,
      gradient: 'gradient-primary',
      color: 'text-violet-500',
    },
    {
      title: 'Monthly Growth',
      value: `${stats?.monthlyGrowth || 0}%`,
      change: '+2.1%',
      trend: 'up' as const,
      icon: TrendingUp,
      gradient: 'gradient-success',
      color: 'text-emerald-500',
    },
  ];

  if (loading) {
    return (
      <>
        <TopBar title="Dashboard" subtitle="Welcome back!" />
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-36 rounded-xl" />
            ))}
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
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          {statCards.map((card) => {
            const Icon = card.icon;
            return (
              <motion.div key={card.title} variants={itemVariants}>
                <Card className="stat-card border-0 shadow-sm hover:shadow-lg">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <p className="text-sm text-muted-foreground font-medium">{card.title}</p>
                        <p className="text-3xl font-bold tracking-tight">{card.value}</p>
                        <div className="flex items-center gap-1">
                          {card.trend === 'up' ? (
                            <ArrowUpRight className="w-3.5 h-3.5 text-emerald-500" />
                          ) : (
                            <ArrowDownRight className="w-3.5 h-3.5 text-red-500" />
                          )}
                          <span
                            className={`text-xs font-medium ${
                              card.trend === 'up' ? 'text-emerald-500' : 'text-red-500'
                            }`}
                          >
                            {card.change}
                          </span>
                          <span className="text-xs text-muted-foreground">vs last month</span>
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
          {/* Revenue Chart */}
          <motion.div variants={itemVariants} initial="hidden" animate="show">
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-semibold">Revenue Overview</CardTitle>
                  <Badge variant="secondary" className="text-xs">Last 6 months</Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <ResponsiveContainer width="100%" height={280}>
                  <AreaChart data={mockRevenueData}>
                    <defs>
                      <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis dataKey="month" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip
                      contentStyle={{
                        borderRadius: '12px',
                        border: 'none',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      stroke="#7c3aed"
                      strokeWidth={2}
                      fill="url(#revenueGradient)"
                    />
                    <Area
                      type="monotone"
                      dataKey="target"
                      stroke="#06b6d4"
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      fill="none"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </motion.div>

          {/* Program Distribution */}
          <motion.div variants={itemVariants} initial="hidden" animate="show">
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-semibold">Program Distribution</CardTitle>
                  <Badge variant="secondary" className="text-xs">All time</Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie
                      data={mockProgramDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={70}
                      outerRadius={110}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {mockProgramDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Payment Trends & Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Payment Trends */}
          <motion.div variants={itemVariants} initial="hidden" animate="show" className="lg:col-span-2">
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold">Payment Trends</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={mockPaymentTrends}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis dataKey="month" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip
                      contentStyle={{
                        borderRadius: '12px',
                        border: 'none',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                      }}
                    />
                    <Legend />
                    <Bar dataKey="paid" fill="#10b981" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="pending" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="partial" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
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
              <CardContent className="space-y-4">
                {recentActivity.length > 0 ? (
                  recentActivity.slice(0, 6).map((activity) => (
                    <div key={activity.id} className="flex items-start gap-3">
                      <Avatar className="w-8 h-8 mt-0.5">
                        <AvatarFallback className="bg-primary/10 text-primary text-[10px] font-semibold">
                          {(activity.profile?.full_name || 'U').charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm truncate">{activity.action}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(activity.created_at).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                      <Badge variant="outline" className="text-[10px] shrink-0">
                        {activity.module}
                      </Badge>
                    </div>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <Calendar className="w-10 h-10 text-muted-foreground/30 mb-3" />
                    <p className="text-sm text-muted-foreground">No recent activity</p>
                    <p className="text-xs text-muted-foreground/60 mt-1">
                      Actions will appear here
                    </p>
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
