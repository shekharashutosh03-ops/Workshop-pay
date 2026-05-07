// @ts-nocheck
'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { TopBar } from '@/components/layout/topbar';
import { Search, Filter, UserCheck, Plus } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { createClient } from '@/lib/supabase/client';
import type { Participant } from '@/types/database';

const payStatusCfg: Record<string, string> = {
  paid: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
  pending: 'bg-red-500/10 text-red-600 border-red-500/20',
  partial: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
  refunded: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
};

export default function ParticipantsPage() {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [payFilter, setPayFilter] = useState('all');

  const fetchData = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from('participants')
      .select('*, program:programs(program_name, program_fee)')
      .order('registration_date', { ascending: false });
    setParticipants((data || []) as unknown as Participant[]);
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filtered = participants.filter((p) => {
    const ms = p.full_name.toLowerCase().includes(search.toLowerCase()) || p.email?.toLowerCase().includes(search.toLowerCase());
    const mp = payFilter === 'all' || p.payment_status === payFilter;
    return ms && mp;
  });

  return (
    <>
      <TopBar title="Participant Management" subtitle="Manage all program participants" />
      <div className="p-6 space-y-6">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search participants..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <Select value={payFilter} onValueChange={setPayFilter}>
              <SelectTrigger className="w-36"><Filter className="w-4 h-4 mr-2" /><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="partial">Partial</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-0">
            {loading ? (
              <div className="p-6 space-y-4">{[1,2,3,4].map(i => <Skeleton key={i} className="h-14 rounded-lg" />)}</div>
            ) : filtered.length === 0 ? (
              <div className="py-16 text-center">
                <UserCheck className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                <h3 className="text-lg font-semibold">No participants found</h3>
                <p className="text-sm text-muted-foreground">Add participants from program pages</p>
              </div>
            ) : (
              <Table>
                <TableHeader><TableRow>
                  <TableHead>Name</TableHead><TableHead>Program</TableHead><TableHead>Email</TableHead><TableHead>Phone</TableHead><TableHead>Attendance</TableHead><TableHead>Payment</TableHead><TableHead>Paid</TableHead><TableHead>Pending</TableHead><TableHead>Registered</TableHead>
                </TableRow></TableHeader>
                <TableBody>{filtered.map((p, i) => (
                  <motion.tr key={p.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }} className="table-row-hover">
                    <TableCell className="font-medium">{p.full_name}</TableCell>
                    <TableCell><Badge variant="outline">{(p.program as unknown as { program_name: string })?.program_name}</Badge></TableCell>
                    <TableCell className="text-muted-foreground">{p.email || '-'}</TableCell>
                    <TableCell className="text-muted-foreground">{p.phone || '-'}</TableCell>
                    <TableCell><Badge variant="outline" className={p.attendance_status === 'present' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-muted text-muted-foreground'}>{p.attendance_status}</Badge></TableCell>
                    <TableCell><Badge variant="outline" className={payStatusCfg[p.payment_status]}>{p.payment_status}</Badge></TableCell>
                    <TableCell className="font-medium text-emerald-600">₹{Number(p.amount_paid).toLocaleString()}</TableCell>
                    <TableCell className="font-medium text-destructive">₹{Number(p.pending_amount).toLocaleString()}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">{new Date(p.registration_date).toLocaleDateString()}</TableCell>
                  </motion.tr>
                ))}</TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
