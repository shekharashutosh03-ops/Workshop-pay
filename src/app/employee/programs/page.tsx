'use client';

import { useEffect, useState } from 'react';
import { TopBar } from '@/components/layout/topbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { GraduationCap, Calendar, MapPin, DollarSign } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import type { Program } from '@/types/database';
import Link from 'next/link';

export default function EmployeeProgramsPage() {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: emp } = await supabase.from('employees').select('id').eq('profile_id', user.id).single();
      if (!emp) { setLoading(false); return; }
      const { data: assignments } = await supabase.from('employee_programs').select('program_id').eq('employee_id', emp.id);
      const ids = (assignments || []).map(a => a.program_id);
      if (ids.length > 0) {
        const { data } = await supabase.from('programs').select('*').in('id', ids).order('start_date', { ascending: false });
        setPrograms((data || []) as Program[]);
      }
      setLoading(false);
    };
    fetch();
  }, []);

  return (
    <>
      <TopBar title="My Programs" subtitle="Programs assigned to you" />
      <div className="p-6">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{[1,2,3].map(i => <Skeleton key={i} className="h-48 rounded-xl" />)}</div>
        ) : programs.length === 0 ? (
          <Card className="border-0 shadow-sm"><CardContent className="py-16 text-center">
            <GraduationCap className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
            <h3 className="font-semibold text-lg">No programs assigned</h3>
          </CardContent></Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {programs.map(p => (
              <Link key={p.id} href={`/employee/programs/${p.id}`}>
                <Card className="border-0 shadow-sm stat-card h-full">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between"><CardTitle className="text-base">{p.program_name}</CardTitle>
                      <Badge variant="outline">{p.status}</Badge></div>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm text-muted-foreground">
                    {p.description && <p className="line-clamp-2">{p.description}</p>}
                    {p.venue && <div className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" />{p.venue}</div>}
                    <div className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" />{new Date(p.start_date).toLocaleDateString()} - {new Date(p.end_date).toLocaleDateString()}</div>
                    <div className="flex items-center gap-1.5"><DollarSign className="w-3.5 h-3.5" />₹{p.program_fee.toLocaleString()}</div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
