'use client';

import { useEffect, useState } from 'react';
import { TopBar } from '@/components/layout/topbar';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { UserCheck } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import type { Participant } from '@/types/database';

export default function EmployeeParticipantsPage() {
  const [participants, setParticipants] = useState<Participant[]>([]);
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
        const { data } = await supabase.from('participants').select('*, program:programs(program_name)').in('program_id', ids);
        setParticipants((data || []) as unknown as Participant[]);
      }
      setLoading(false);
    };
    fetch();
  }, []);

  return (
    <>
      <TopBar title="Participants" subtitle="Participants in your assigned programs" />
      <div className="p-6">
        {loading ? <div className="space-y-4">{[1,2,3].map(i => <Skeleton key={i} className="h-14 rounded-lg" />)}</div> : participants.length === 0 ? (
          <Card className="border-0 shadow-sm"><CardContent className="py-16 text-center"><UserCheck className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" /><h3 className="font-semibold">No participants</h3></CardContent></Card>
        ) : (
          <Card className="border-0 shadow-sm"><CardContent className="p-0">
            <Table><TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Program</TableHead><TableHead>Email</TableHead><TableHead>Attendance</TableHead><TableHead>Payment</TableHead><TableHead>Paid</TableHead><TableHead>Pending</TableHead></TableRow></TableHeader>
              <TableBody>{participants.map(p => (
                <TableRow key={p.id} className="table-row-hover">
                  <TableCell className="font-medium">{p.full_name}</TableCell>
                  <TableCell><Badge variant="outline">{(p.program as unknown as {program_name:string})?.program_name}</Badge></TableCell>
                  <TableCell className="text-muted-foreground">{p.email || '-'}</TableCell>
                  <TableCell><Badge variant="outline" className={p.attendance_status === 'present' ? 'bg-emerald-500/10 text-emerald-600' : ''}>{p.attendance_status}</Badge></TableCell>
                  <TableCell><Badge variant="outline" className={p.payment_status === 'paid' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-red-500/10 text-red-600'}>{p.payment_status}</Badge></TableCell>
                  <TableCell className="text-emerald-600">₹{Number(p.amount_paid).toLocaleString()}</TableCell>
                  <TableCell className="text-destructive">₹{Number(p.pending_amount).toLocaleString()}</TableCell>
                </TableRow>
              ))}</TableBody>
            </Table>
          </CardContent></Card>
        )}
      </div>
    </>
  );
}
