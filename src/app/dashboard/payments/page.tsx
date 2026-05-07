// @ts-nocheck
'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { TopBar } from '@/components/layout/topbar';
import { Search, Filter, CreditCard, DollarSign, TrendingUp, Clock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { createClient } from '@/lib/supabase/client';
import type { Payment } from '@/types/database';

const statusCfg: Record<string, string> = {
  paid: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
  pending: 'bg-red-500/10 text-red-600 border-red-500/20',
  partial: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
  refunded: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
};

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [modeFilter, setModeFilter] = useState('all');

  const fetchData = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from('payments')
      .select('*, participant:participants(full_name, email), program:programs(program_name)')
      .order('payment_date', { ascending: false });
    setPayments((data || []) as unknown as Payment[]);
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filtered = payments.filter((p) => {
    const pName = (p.participant as unknown as { full_name: string })?.full_name || '';
    const ms = pName.toLowerCase().includes(search.toLowerCase()) || p.transaction_id?.toLowerCase().includes(search.toLowerCase());
    const mst = statusFilter === 'all' || p.payment_status === statusFilter;
    const mm = modeFilter === 'all' || p.payment_mode === modeFilter;
    return ms && mst && mm;
  });

  const totalPaid = payments.filter(p => p.payment_status === 'paid').reduce((s, p) => s + Number(p.amount), 0);
  const totalPending = payments.filter(p => p.payment_status === 'pending').reduce((s, p) => s + Number(p.amount), 0);

  return (
    <>
      <TopBar title="Payment Tracking" subtitle="Track all payment transactions" />
      <div className="p-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            { label: 'Total Collected', value: `₹${totalPaid.toLocaleString()}`, icon: DollarSign, gradient: 'gradient-success' },
            { label: 'Pending Amount', value: `₹${totalPending.toLocaleString()}`, icon: Clock, gradient: 'gradient-warning' },
            { label: 'Total Transactions', value: payments.length, icon: CreditCard, gradient: 'gradient-primary' },
            { label: 'Avg. Payment', value: `₹${payments.length ? Math.round(totalPaid / payments.length).toLocaleString() : 0}`, icon: TrendingUp, gradient: 'gradient-info' },
          ].map(s => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <Card className="border-0 shadow-sm stat-card"><CardContent className="p-4 flex items-center gap-3">
                <div className={`p-2.5 rounded-xl ${s.gradient}`}><s.icon className="w-4 h-4 text-white" /></div>
                <div><p className="text-xs text-muted-foreground">{s.label}</p><p className="text-xl font-bold">{s.value}</p></div>
              </CardContent></Card>
            </motion.div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          <div className="relative flex-1 sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search payments..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-32"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="partial">Partial</SelectItem>
            </SelectContent>
          </Select>
          <Select value={modeFilter} onValueChange={setModeFilter}>
            <SelectTrigger className="w-36"><SelectValue placeholder="Mode" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Modes</SelectItem>
              <SelectItem value="cash">Cash</SelectItem>
              <SelectItem value="upi">UPI</SelectItem>
              <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
              <SelectItem value="card">Card</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Card className="border-0 shadow-sm"><CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-4">{[1,2,3,4].map(i => <Skeleton key={i} className="h-14 rounded-lg" />)}</div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center"><CreditCard className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" /><h3 className="text-lg font-semibold">No payments found</h3></div>
          ) : (
            <Table>
              <TableHeader><TableRow>
                <TableHead>Participant</TableHead><TableHead>Program</TableHead><TableHead>Amount</TableHead><TableHead>Mode</TableHead><TableHead>Status</TableHead><TableHead>Transaction ID</TableHead><TableHead>Date</TableHead>
              </TableRow></TableHeader>
              <TableBody>{filtered.map((p, i) => (
                <motion.tr key={p.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }} className="table-row-hover">
                  <TableCell className="font-medium">{(p.participant as unknown as { full_name: string })?.full_name}</TableCell>
                  <TableCell><Badge variant="outline">{(p.program as unknown as { program_name: string })?.program_name}</Badge></TableCell>
                  <TableCell className="font-semibold">₹{Number(p.amount).toLocaleString()}</TableCell>
                  <TableCell><Badge variant="outline" className="capitalize">{p.payment_mode.replace('_', ' ')}</Badge></TableCell>
                  <TableCell><Badge variant="outline" className={statusCfg[p.payment_status]}>{p.payment_status}</Badge></TableCell>
                  <TableCell className="text-muted-foreground font-mono text-xs">{p.transaction_id || '-'}</TableCell>
                  <TableCell className="text-muted-foreground">{new Date(p.payment_date).toLocaleDateString()}</TableCell>
                </motion.tr>
              ))}</TableBody>
            </Table>
          )}
        </CardContent></Card>
      </div>
    </>
  );
}
