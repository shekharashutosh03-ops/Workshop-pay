// @ts-nocheck
'use client';

import { useEffect, useState, useCallback, use } from 'react';
import { TopBar } from '@/components/layout/topbar';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Users, DollarSign } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import type { Program, Participant, Payment } from '@/types/database';
import { toast } from 'sonner';

export default function EmployeeProgramDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [program, setProgram] = useState<Program | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [payOpen, setPayOpen] = useState(false);
  const [form, setForm] = useState({ full_name: '', email: '', phone: '' });
  const [payForm, setPayForm] = useState({ participant_id: '', amount: '', payment_mode: 'cash', transaction_id: '' });

  const fetchData = useCallback(async () => {
    const supabase = createClient();
    const [pr, pa, py] = await Promise.all([
      supabase.from('programs').select('*').eq('id', id).single(),
      supabase.from('participants').select('*').eq('program_id', id),
      supabase.from('payments').select('*, participant:participants(full_name)').eq('program_id', id),
    ]);
    setProgram(pr.data as Program);
    setParticipants((pa.data || []) as Participant[]);
    setPayments((py.data || []) as unknown as Payment[]);
    setLoading(false);
  }, [id]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const addParticipant = async () => {
    if (!form.full_name) return;
    const supabase = createClient();
    await supabase.from('participants').insert({ ...form, program_id: id, pending_amount: program?.program_fee || 0 });
    toast.success('Participant added');
    setAddOpen(false); setForm({ full_name: '', email: '', phone: '' }); fetchData();
  };

  const addPayment = async () => {
    if (!payForm.participant_id || !payForm.amount) return;
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from('payments').insert({
      participant_id: payForm.participant_id, program_id: id,
      amount: parseFloat(payForm.amount), payment_mode: payForm.payment_mode,
      payment_status: 'paid', transaction_id: payForm.transaction_id || null, created_by: user?.id,
    });
    toast.success('Payment recorded');
    setPayOpen(false); setPayForm({ participant_id: '', amount: '', payment_mode: 'cash', transaction_id: '' }); fetchData();
  };

  const updateAttendance = async (pid: string, status: string) => {
    const supabase = createClient();
    await supabase.from('participants').update({ attendance_status: status }).eq('id', pid);
    toast.success('Updated'); fetchData();
  };

  if (loading) return <><TopBar title="Program" /><div className="p-6"><Skeleton className="h-64 rounded-xl" /></div></>;

  return (
    <>
      <TopBar title={program?.program_name || ''} subtitle={program?.venue || ''} />
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="border-0 shadow-sm"><CardContent className="p-4 flex items-center gap-3"><div className="p-2 rounded-lg gradient-primary"><Users className="w-4 h-4 text-white" /></div><div><p className="text-xs text-muted-foreground">Participants</p><p className="font-bold">{participants.length}</p></div></CardContent></Card>
          <Card className="border-0 shadow-sm"><CardContent className="p-4 flex items-center gap-3"><div className="p-2 rounded-lg gradient-success"><DollarSign className="w-4 h-4 text-white" /></div><div><p className="text-xs text-muted-foreground">Revenue</p><p className="font-bold">₹{payments.filter(p=>p.payment_status==='paid').reduce((s,p)=>s+Number(p.amount),0).toLocaleString()}</p></div></CardContent></Card>
        </div>

        <Tabs defaultValue="participants">
          <TabsList><TabsTrigger value="participants">Participants</TabsTrigger><TabsTrigger value="payments">Payments</TabsTrigger></TabsList>
          <TabsContent value="participants" className="space-y-4">
            <Button className="gradient-primary text-white gap-2" onClick={() => setAddOpen(true)}><Plus className="w-4 h-4" />Add</Button>
            <Card className="border-0 shadow-sm"><CardContent className="p-0">
              <Table><TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Email</TableHead><TableHead>Attendance</TableHead><TableHead>Payment</TableHead><TableHead>Paid</TableHead><TableHead>Pending</TableHead><TableHead className="w-24"></TableHead></TableRow></TableHeader>
                <TableBody>{participants.map(p => (
                  <TableRow key={p.id} className="table-row-hover">
                    <TableCell className="font-medium">{p.full_name}</TableCell>
                    <TableCell className="text-muted-foreground">{p.email}</TableCell>
                    <TableCell>
                      <Select value={p.attendance_status} onValueChange={v => updateAttendance(p.id, v)}>
                        <SelectTrigger className="w-28 h-8"><SelectValue /></SelectTrigger>
                        <SelectContent><SelectItem value="present">Present</SelectItem><SelectItem value="absent">Absent</SelectItem><SelectItem value="late">Late</SelectItem></SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell><Badge variant="outline" className={p.payment_status === 'paid' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-red-500/10 text-red-600'}>{p.payment_status}</Badge></TableCell>
                    <TableCell>₹{Number(p.amount_paid).toLocaleString()}</TableCell>
                    <TableCell className="text-destructive">₹{Number(p.pending_amount).toLocaleString()}</TableCell>
                    <TableCell>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="h-8 gap-1 px-2 text-xs" 
                        onClick={() => {
                          setPayForm({ ...payForm, participant_id: p.id, amount: p.pending_amount > 0 ? p.pending_amount.toString() : '' });
                          setPayOpen(true);
                        }}
                      >
                        <DollarSign className="w-3 h-3" /> Pay
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}</TableBody>
              </Table>
            </CardContent></Card>
          </TabsContent>
          <TabsContent value="payments" className="space-y-4">
            <Button className="gradient-primary text-white gap-2" onClick={() => setPayOpen(true)}><Plus className="w-4 h-4" />Record Payment</Button>
            <Card className="border-0 shadow-sm"><CardContent className="p-0">
              <Table><TableHeader><TableRow><TableHead>Participant</TableHead><TableHead>Amount</TableHead><TableHead>Mode</TableHead><TableHead>Date</TableHead></TableRow></TableHeader>
                <TableBody>{payments.map(p => (
                  <TableRow key={p.id}><TableCell>{(p.participant as unknown as {full_name:string})?.full_name}</TableCell><TableCell className="font-semibold">₹{Number(p.amount).toLocaleString()}</TableCell><TableCell><Badge variant="outline">{p.payment_mode}</Badge></TableCell><TableCell className="text-muted-foreground">{new Date(p.payment_date).toLocaleDateString()}</TableCell></TableRow>
                ))}</TableBody>
              </Table>
            </CardContent></Card>
          </TabsContent>
        </Tabs>

        <Dialog open={addOpen} onOpenChange={setAddOpen}><DialogContent><DialogHeader><DialogTitle>Add Participant</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="space-y-2"><Label>Name</Label><Input value={form.full_name} onChange={e => setForm({...form, full_name: e.target.value})} /></div>
            <div className="grid grid-cols-2 gap-4"><div className="space-y-2"><Label>Email</Label><Input value={form.email} onChange={e => setForm({...form, email: e.target.value})} /></div><div className="space-y-2"><Label>Phone</Label><Input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} /></div></div>
            <div className="flex justify-end gap-3"><Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button><Button className="gradient-primary text-white" onClick={addParticipant}>Add</Button></div>
          </div>
        </DialogContent></Dialog>

        <Dialog open={payOpen} onOpenChange={setPayOpen}><DialogContent><DialogHeader><DialogTitle>Record Payment</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="space-y-2"><Label>Participant</Label><Select value={payForm.participant_id} onValueChange={v => setPayForm({...payForm, participant_id: v})}><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger><SelectContent>{participants.map(p => <SelectItem key={p.id} value={p.id}>{p.full_name}</SelectItem>)}</SelectContent></Select></div>
            <div className="grid grid-cols-2 gap-4"><div className="space-y-2"><Label>Amount</Label><Input type="number" value={payForm.amount} onChange={e => setPayForm({...payForm, amount: e.target.value})} /></div>
            <div className="space-y-2"><Label>Mode</Label><Select value={payForm.payment_mode} onValueChange={v => setPayForm({...payForm, payment_mode: v})}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="cash">Cash</SelectItem><SelectItem value="upi">UPI</SelectItem><SelectItem value="card">Card</SelectItem></SelectContent></Select></div></div>
            <div className="flex justify-end gap-3"><Button variant="outline" onClick={() => setPayOpen(false)}>Cancel</Button><Button className="gradient-primary text-white" onClick={addPayment}>Record</Button></div>
          </div>
        </DialogContent></Dialog>
      </div>
    </>
  );
}
