'use client';

import { TopBar } from '@/components/layout/topbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, Legend, LineChart, Line } from 'recharts';

const revenueData = [
  { month: 'Jan', revenue: 12400, target: 15000 },
  { month: 'Feb', revenue: 18200, target: 16000 },
  { month: 'Mar', revenue: 15800, target: 17000 },
  { month: 'Apr', revenue: 22400, target: 18000 },
  { month: 'May', revenue: 28600, target: 20000 },
  { month: 'Jun', revenue: 24200, target: 22000 },
  { month: 'Jul', revenue: 31200, target: 24000 },
  { month: 'Aug', revenue: 27800, target: 26000 },
];

const participantGrowth = [
  { month: 'Jan', newParticipants: 45, returning: 12 },
  { month: 'Feb', newParticipants: 62, returning: 18 },
  { month: 'Mar', newParticipants: 54, returning: 24 },
  { month: 'Apr', newParticipants: 78, returning: 30 },
  { month: 'May', newParticipants: 92, returning: 35 },
  { month: 'Jun', newParticipants: 85, returning: 42 },
  { month: 'Jul', newParticipants: 110, returning: 48 },
  { month: 'Aug', newParticipants: 98, returning: 55 },
];

const programSuccess = [
  { name: 'React Workshop', completion: 95, satisfaction: 4.8, revenue: 45000 },
  { name: 'Node.js Bootcamp', completion: 88, satisfaction: 4.5, revenue: 38000 },
  { name: 'Python ML Course', completion: 92, satisfaction: 4.7, revenue: 52000 },
  { name: 'UI/UX Design', completion: 85, satisfaction: 4.3, revenue: 28000 },
  { name: 'Cloud DevOps', completion: 90, satisfaction: 4.6, revenue: 42000 },
];

const paymentModes = [
  { name: 'UPI', value: 45, color: '#7c3aed' },
  { name: 'Card', value: 25, color: '#06b6d4' },
  { name: 'Bank Transfer', value: 18, color: '#10b981' },
  { name: 'Cash', value: 12, color: '#f59e0b' },
];

const collectionTrends = [
  { month: 'Jan', collected: 42000, pending: 8000 },
  { month: 'Feb', collected: 55000, pending: 12000 },
  { month: 'Mar', collected: 48000, pending: 9000 },
  { month: 'Apr', collected: 68000, pending: 15000 },
  { month: 'May', collected: 82000, pending: 11000 },
  { month: 'Jun', collected: 75000, pending: 8000 },
];

export default function AnalyticsPage() {
  return (
    <>
      <TopBar title="Analytics" subtitle="Comprehensive insights & metrics" />
      <div className="p-6 space-y-6">
        {/* Revenue & Growth */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2"><div className="flex items-center justify-between"><CardTitle className="text-base">Revenue Trend</CardTitle><Badge variant="secondary" className="text-xs">8 months</Badge></div></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={revenueData}>
                  <defs>
                    <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#7c3aed" stopOpacity={0.3} /><stop offset="95%" stopColor="#7c3aed" stopOpacity={0} /></linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" /><XAxis dataKey="month" className="text-xs" /><YAxis className="text-xs" />
                  <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
                  <Area type="monotone" dataKey="revenue" stroke="#7c3aed" strokeWidth={2} fill="url(#revGrad)" />
                  <Area type="monotone" dataKey="target" stroke="#06b6d4" strokeWidth={2} strokeDasharray="5 5" fill="none" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2"><div className="flex items-center justify-between"><CardTitle className="text-base">Participant Growth</CardTitle><Badge variant="secondary" className="text-xs">8 months</Badge></div></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={participantGrowth}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" /><XAxis dataKey="month" className="text-xs" /><YAxis className="text-xs" />
                  <Tooltip contentStyle={{ borderRadius: '12px', border: 'none' }} /><Legend />
                  <Bar dataKey="newParticipants" name="New" fill="#7c3aed" radius={[4,4,0,0]} />
                  <Bar dataKey="returning" name="Returning" fill="#06b6d4" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Collection & Payment Modes */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="border-0 shadow-sm lg:col-span-2">
            <CardHeader className="pb-2"><CardTitle className="text-base">Collection Trends</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={collectionTrends}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" /><XAxis dataKey="month" className="text-xs" /><YAxis className="text-xs" />
                  <Tooltip contentStyle={{ borderRadius: '12px', border: 'none' }} /><Legend />
                  <Line type="monotone" dataKey="collected" stroke="#10b981" strokeWidth={2} dot={{ r: 4 }} />
                  <Line type="monotone" dataKey="pending" stroke="#ef4444" strokeWidth={2} dot={{ r: 4 }} strokeDasharray="5 5" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2"><CardTitle className="text-base">Payment Modes</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie data={paymentModes} cx="50%" cy="50%" innerRadius={60} outerRadius={95} paddingAngle={4} dataKey="value">
                    {paymentModes.map((e, i) => <Cell key={i} fill={e.color} />)}
                  </Pie>
                  <Tooltip /><Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Program Performance */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2"><CardTitle className="text-base">Program Performance</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={programSuccess} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" /><XAxis type="number" className="text-xs" /><YAxis dataKey="name" type="category" className="text-xs" width={120} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none' }} /><Legend />
                <Bar dataKey="completion" name="Completion %" fill="#7c3aed" radius={[0,4,4,0]} />
                <Bar dataKey="satisfaction" name="Satisfaction" fill="#10b981" radius={[0,4,4,0]} hide />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
