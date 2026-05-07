// @ts-nocheck
'use client';

import { useEffect, useState, useCallback, use } from 'react';
import { TopBar } from '@/components/layout/topbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, MapPin, Users, DollarSign, Plus, UserCheck } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import type { Program, Participant, Payment } from '@/types/database';
import { toast } from 'sonner';

export default function ProgramDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [program, setProgram] = useState<Program | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [addParticipantOpen, setAddParticipantOpen] = useState(false);
  const [addPaymentOpen, setAddPaymentOpen] = useState(false);
  const [formData, setFormData] = useState({ full_name: '', email: '', phone: '' });
  const [payForm, setPayForm] = useState({ participant_id: '', amount: '', payment_mode: 'cash', transaction_id: '' });

  const fetchData = useCallback(async () => {
    const supabase = createClient();
    const [progRes, partRes, payRes] = await Promise.all([
      supabase.from('programs').select('*').eq('id', id).single(),
      supabase.from('participants').select('*').eq('program_id', id).order('registration_date', { ascending: false }),
      supabase.from('payments').select('*, participant:participants(full_name)').eq('program_id', id).order('payment_date', { ascending: false }),
    ]);
    setProgram(progRes.data as Program);
    setParticipants((partRes.data || []) as Participant[]);
    setPayments((payRes.data || []) as unknown as Payment[]);
    setLoading(false);
  }, [id]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const addParticipant = async () => {
    if (!formData.full_name) return;
    const supabase = createClient();
    await supabase.from('participants').insert({
      ...formData, program_id: id,
      pending_amount: program?.program_fee || 0,
    });
    toast.success('Participant added');
    setAddParticipantOpen(false);
    setFormData({ full_name: '', email: '', phone: '' });
    fetchData();
  };

  const addPayment = async () => {
    if (!payForm.participant_id || !payForm.amount) return;
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from('payments').insert({
      participant_id: payForm.participant_id,
      program_id: id,
      amount: parseFloat(payForm.amount),
      payment_mode: payForm.payment_mode,
      payment_status: 'paid',
      transaction_id: payForm.transaction_id || null,
      created_by: user?.id,
    });
    toast.success('Payment recorded');
    setAddPaymentOpen(false);
    setPayForm({ participant_id: '', amount: '', payment_mode: 'cash', transaction_id: '' });
    fetchData();
  };

  const updateAttendance = async (pid: string, status: string) => {
    const supabase = createClient();
    await supabase.from('participants').update({ attendance_status: status }).eq('id', pid);
    toast.success('Attendance updated');
    fetchData();
  };

  if (loading) return (<><TopBar title="Program Details" /><div className="p-6 space-y-4">{[1,2,3].map(i => <Skeleton key={i} className="h-32 rounded-xl" />)}</div></>);

  const totalRevenue = payments.filter(p => p.payment_status === 'paid').reduce((s, p) => s + Number(p.amount), 0);
  const totalPending = participants.reduce((s, p) => s + Number(p.pending_amount), 0);

  return (
    <>
      <TopBar title={program?.program_name || 'Program Details'} subtitle={program?.description || ''} />
      <div className="p-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            { label: 'Participants', value: participants.length, icon: Users, color: 'gradient-primary' },
            { label: 'Revenue', value: `₹${totalRevenue.toLocaleString()}`, icon: DollarSign, color: 'gradient-success' },
            { label: 'Pending', value: `₹${totalPending.toLocaleString()}`, icon: DollarSign, color: 'gradient-warning' },
            { label: 'Venue', value: program?.venue || 'TBD', icon: MapPin, color: 'gradient-info' },
          ].map((s) => (
            <Card key={s.label} className="border-0 shadow-sm stat-card">
              <CardContent className="p-4 flex items-center gap-3">
                <div className={`p-2.5 rounded-xl ${s.color}`}><s.icon className="w-4 h-4 text-white" /></div>
                <div><p className="text-xs text-muted-foreground">{s.label}</p><p className="text-lg font-bold">{s.value}</p></div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Info */}
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 flex flex-wrap gap-6 text-sm">
            <div className="flex items-center gap-2"><Calendar className="w-4 h-4 text-muted-foreground" />{new Date(program!.start_date).toLocaleDateString()} - {new Date(program!.end_date).toLocaleDateString()}</div>
            <div>Fee: <span className="font-semibold">₹{program!.program_fee.toLocaleString()}</span></div>
            <div>Max: <span className="font-semibold">{program!.max_participants}</span></div>
            <Badge variant="outline">{program!.status}</Badge>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="participants">
          <TabsList><TabsTrigger value="participants">Participants</TabsTrigger><TabsTrigger value="payments">Payments</TabsTrigger></TabsList>

          <TabsContent value="participants" className="space-y-4">
            <div className="flex justify-end">
              <Button className="gradient-primary text-white gap-2" onClick={() => setAddParticipantOpen(true)}><Plus className="w-4 h-4" />Add Participant</Button>
            </div>
            <Card className="border-0 shadow-sm"><CardContent className="p-0">
              {participants.length === 0 ? (
                <div className="py-12 text-center"><UserCheck className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" /><p className="text-sm text-muted-foreground">No participants yet</p></div>
              ) : (
                <Table><TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Email</TableHead><TableHead>Phone</TableHead><TableHead>Attendance</TableHead><TableHead>Payment</TableHead><TableHead>Paid</TableHead><TableHead>Pending</TableHead><TableHead className="w-24"></TableHead></TableRow></TableHeader>
                  <TableBody>{participants.map(p => (
                    <TableRow key={p.id} className="table-row-hover">
                      <TableCell className="font-medium">{p.full_name}</TableCell>
                      <TableCell className="text-muted-foreground">{p.email}</TableCell>
                      <TableCell className="text-muted-foreground">{p.phone}</TableCell>
                      <TableCell>
                        <Select value={p.attendance_status} onValueChange={(v) => updateAttendance(p.id, v)}>
                          <SelectTrigger className="w-28 h-8"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="present">Present</SelectItem>
                            <SelectItem value="absent">Absent</SelectItem>
                            <SelectItem value="late">Late</SelectItem>
                            <SelectItem value="excused">Excused</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell><Badge variant="outline" className={p.payment_status === 'paid' ? 'bg-emerald-500/10 text-emerald-600' : p.payment_status === 'partial' ? 'bg-amber-500/10 text-amber-600' : 'bg-red-500/10 text-red-600'}>{p.payment_status}</Badge></TableCell>
                      <TableCell className="font-medium">₹{Number(p.amount_paid).toLocaleString()}</TableCell>
                      <TableCell className="text-destructive">₹{Number(p.pending_amount).toLocaleString()}</TableCell>
                      <TableCell>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="h-8 gap-1 px-2 text-xs" 
                          onClick={() => {
                            setPayForm({ ...payForm, participant_id: p.id, amount: p.pending_amount > 0 ? p.pending_amount.toString() : '' });
                            setAddPaymentOpen(true);
                          }}
                        >
                          <DollarSign className="w-3 h-3" /> Pay
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}</TableBody>
                </Table>
              )}
            </CardContent></Card>
          </TabsContent>

          <TabsContent value="payments" className="space-y-4">
            <div className="flex justify-end">
              <Button className="gradient-primary text-white gap-2" onClick={() => setAddPaymentOpen(true)}><Plus className="w-4 h-4" />Record Payment</Button>
            </div>
            <Card className="border-0 shadow-sm"><CardContent className="p-0">
              {payments.length === 0 ? (
                <div className="py-12 text-center"><DollarSign className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" /><p className="text-sm text-muted-foreground">No payments yet</p></div>
              ) : (
                <Table><TableHeader><TableRow><TableHead>Participant</TableHead><TableHead>Amount</TableHead><TableHead>Mode</TableHead><TableHead>Status</TableHead><TableHead>Transaction ID</TableHead><TableHead>Date</TableHead></TableRow></TableHeader>
                  <TableBody>{payments.map(p => (
                    <TableRow key={p.id} className="table-row-hover">
                      <TableCell className="font-medium">{(p.participant as unknown as { full_name: string })?.full_name}</TableCell>
                      <TableCell className="font-semibold">₹{Number(p.amount).toLocaleString()}</TableCell>
                      <TableCell><Badge variant="outline">{p.payment_mode}</Badge></TableCell>
                      <TableCell><Badge variant="outline" className="bg-emerald-500/10 text-emerald-600">{p.payment_status}</Badge></TableCell>
                      <TableCell className="text-muted-foreground font-mono text-xs">{p.transaction_id || '-'}</TableCell>
                      <TableCell className="text-muted-foreground">{new Date(p.payment_date).toLocaleDateString()}</TableCell>
                    </TableRow>
                  ))}</TableBody>
                </Table>
              )}
            </CardContent></Card>
          </TabsContent>
        </Tabs>

        {/* Add Participant Dialog */}
        <Dialog open={addParticipantOpen} onOpenChange={setAddParticipantOpen}>
          <DialogContent><DialogHeader><DialogTitle>Add Participant</DialogTitle></DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="space-y-2"><Label>Full Name</Label><Input value={formData.full_name} onChange={e => setFormData({...formData, full_name: e.target.value})} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Email</Label><Input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} /></div>
                <div className="space-y-2"><Label>Phone</Label><Input value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} /></div>
              </div>
              <div className="flex justify-end gap-3"><Button variant="outline" onClick={() => setAddParticipantOpen(false)}>Cancel</Button><Button className="gradient-primary text-white" onClick={addParticipant}>Add</Button></div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Add Payment Dialog */}
        <Dialog open={addPaymentOpen} onOpenChange={setAddPaymentOpen}>
          <DialogContent><DialogHeader><DialogTitle>Record Payment</DialogTitle></DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="space-y-2"><Label>Participant</Label>
                <Select value={payForm.participant_id} onValueChange={v => setPayForm({...payForm, participant_id: v})}>
                  <SelectTrigger><SelectValue placeholder="Select participant" /></SelectTrigger>
                  <SelectContent>{participants.map(p => <SelectItem key={p.id} value={p.id}>{p.full_name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Amount (₹)</Label><Input type="number" value={payForm.amount} onChange={e => setPayForm({...payForm, amount: e.target.value})} /></div>
                <div className="space-y-2"><Label>Mode</Label>
                  <Select value={payForm.payment_mode} onValueChange={v => setPayForm({...payForm, payment_mode: v})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">Cash</SelectItem><SelectItem value="upi">UPI</SelectItem><SelectItem value="bank_transfer">Bank Transfer</SelectItem><SelectItem value="card">Card</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2"><Label>Transaction ID</Label><Input value={payForm.transaction_id} onChange={e => setPayForm({...payForm, transaction_id: e.target.value})} /></div>
              <div className="flex justify-end gap-3"><Button variant="outline" onClick={() => setAddPaymentOpen(false)}>Cancel</Button><Button className="gradient-primary text-white" onClick={addPayment}>Record</Button></div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
}
