'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { TopBar } from '@/components/layout/topbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { GraduationCap, Users, DollarSign, Calendar, MapPin } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import type { Program } from '@/types/database';
import Link from 'next/link';

export default function EmployeeDashboard() {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ programs: 0, participants: 0, revenue: 0 });

  useEffect(() => {
    const fetchData = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get employee record
      const { data: emp } = await supabase.from('employees').select('id').eq('profile_id', user.id).single();
      if (!emp) { setLoading(false); return; }

      // Get assigned programs
      const { data: assignments } = await supabase.from('employee_programs').select('program_id').eq('employee_id', emp.id);
      const programIds = (assignments || []).map(a => a.program_id);

      if (programIds.length > 0) {
        const { data: progs } = await supabase.from('programs').select('*').in('id', programIds);
        setPrograms((progs || []) as Program[]);

        let totalParticipants = 0;
        let totalRevenue = 0;
        for (const pid of programIds) {
          const { count } = await supabase.from('participants').select('id', { count: 'exact' }).eq('program_id', pid);
          totalParticipants += count || 0;
          const { data: pays } = await supabase.from('payments').select('amount').eq('program_id', pid).eq('payment_status', 'paid');
          totalRevenue += (pays || []).reduce((s, p) => s + Number(p.amount), 0);
        }
        setStats({ programs: programIds.length, participants: totalParticipants, revenue: totalRevenue });
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  if (loading) return (<><TopBar title="My Dashboard" /><div className="p-6 space-y-4">{[1,2,3].map(i => <Skeleton key={i} className="h-32 rounded-xl" />)}</div></>);

  return (
    <>
      <TopBar title="Employee Dashboard" subtitle="Your assigned programs overview" />
      <div className="p-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { label: 'Assigned Programs', value: stats.programs, icon: GraduationCap, gradient: 'gradient-primary' },
            { label: 'Total Participants', value: stats.participants, icon: Users, gradient: 'gradient-info' },
            { label: 'Revenue Collected', value: `₹${stats.revenue.toLocaleString()}`, icon: DollarSign, gradient: 'gradient-success' },
          ].map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
              <Card className="border-0 shadow-sm stat-card">
                <CardContent className="p-5 flex items-center gap-4">
                  <div className={`p-3 rounded-xl ${s.gradient}`}><s.icon className="w-5 h-5 text-white" /></div>
                  <div><p className="text-sm text-muted-foreground">{s.label}</p><p className="text-2xl font-bold">{s.value}</p></div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Programs */}
        <div>
          <h3 className="text-lg font-semibold mb-4">My Programs</h3>
          {programs.length === 0 ? (
            <Card className="border-0 shadow-sm"><CardContent className="py-12 text-center">
              <GraduationCap className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
              <h4 className="font-semibold">No programs assigned</h4>
              <p className="text-sm text-muted-foreground">Contact your admin to get assigned to programs</p>
            </CardContent></Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {programs.map((p, i) => (
                <motion.div key={p.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
                  <Link href={`/employee/programs/${p.id}`}>
                    <Card className="border-0 shadow-sm stat-card h-full cursor-pointer">
                      <CardHeader className="pb-2">
                        <div className="flex items-start justify-between">
                          <CardTitle className="text-base">{p.program_name}</CardTitle>
                          <Badge variant="outline" className={p.status === 'active' ? 'bg-emerald-500/10 text-emerald-600' : ''}>{p.status}</Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-2 text-sm text-muted-foreground">
                        {p.venue && <div className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" />{p.venue}</div>}
                        <div className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" />{new Date(p.start_date).toLocaleDateString()} - {new Date(p.end_date).toLocaleDateString()}</div>
                        <div className="flex items-center gap-1.5"><DollarSign className="w-3.5 h-3.5" />₹{p.program_fee.toLocaleString()}</div>
                      </CardContent>
                    </Card>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
