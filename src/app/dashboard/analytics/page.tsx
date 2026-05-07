'use client';

import { TopBar } from '@/components/layout/topbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, Legend, LineChart, Line } from 'recharts';

const revenueData: any[] = [];
const participantGrowth: any[] = [];
const programSuccess: any[] = [];
const paymentModes: any[] = [];
const collectionTrends: any[] = [];

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
