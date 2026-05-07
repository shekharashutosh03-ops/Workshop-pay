'use client';

import { useEffect, useState } from 'react';
import { TopBar } from '@/components/layout/topbar';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CreditCard } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import type { Payment } from '@/types/database';

export default function EmployeePaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
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
        const { data } = await supabase.from('payments').select('*, participant:participants(full_name), program:programs(program_name)').in('program_id', ids).order('payment_date', { ascending: false });
        setPayments((data || []) as unknown as Payment[]);
      }
      setLoading(false);
    };
    fetch();
  }, []);

  return (
    <>
      <TopBar title="Payments" subtitle="Payments for your assigned programs" />
      <div className="p-6">
        {loading ? <div className="space-y-4">{[1,2,3].map(i => <Skeleton key={i} className="h-14 rounded-lg" />)}</div> : payments.length === 0 ? (
          <Card className="border-0 shadow-sm"><CardContent className="py-16 text-center"><CreditCard className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" /><h3 className="font-semibold">No payments</h3></CardContent></Card>
        ) : (
          <Card className="border-0 shadow-sm"><CardContent className="p-0">
            <Table><TableHeader><TableRow><TableHead>Participant</TableHead><TableHead>Program</TableHead><TableHead>Amount</TableHead><TableHead>Mode</TableHead><TableHead>Status</TableHead><TableHead>Date</TableHead></TableRow></TableHeader>
              <TableBody>{payments.map(p => (
                <TableRow key={p.id} className="table-row-hover">
                  <TableCell className="font-medium">{(p.participant as unknown as {full_name:string})?.full_name}</TableCell>
                  <TableCell><Badge variant="outline">{(p.program as unknown as {program_name:string})?.program_name}</Badge></TableCell>
                  <TableCell className="font-semibold">₹{Number(p.amount).toLocaleString()}</TableCell>
                  <TableCell><Badge variant="outline" className="capitalize">{p.payment_mode}</Badge></TableCell>
                  <TableCell><Badge variant="outline" className="bg-emerald-500/10 text-emerald-600">{p.payment_status}</Badge></TableCell>
                  <TableCell className="text-muted-foreground">{new Date(p.payment_date).toLocaleDateString()}</TableCell>
                </TableRow>
              ))}</TableBody>
            </Table>
          </CardContent></Card>
        )}
      </div>
    </>
  );
}
