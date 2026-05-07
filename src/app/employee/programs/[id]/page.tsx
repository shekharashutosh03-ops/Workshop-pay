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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Users, DollarSign, UserCheck, Pencil, CheckCircle2, MapPin } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import type { Program, Participant, Payment } from '@/types/database';
import { toast } from 'sonner';

export default function EmployeeProgramDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [program, setProgram] = useState<Program | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  // Add participant
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState({ full_name: '', email: '', phone: '' });

  // Pay dialog
  const [payOpen, setPayOpen] = useState(false);
  const [payMode, setPayMode] = useState<'add' | 'edit'>('add');
  const [selectedParticipant, setSelectedParticipant] = useState<Participant | null>(null);
  const [payForm, setPayForm] = useState({ amount: '', payment_mode: 'cash', transaction_id: '' });
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async () => {
    const supabase = createClient();
    const [pr, pa, py] = await Promise.all([
      supabase.from('programs').select('*').eq('id', id).single(),
      supabase.from('participants').select('*').eq('program_id', id).order('registration_date', { ascending: false }),
      supabase.from('payments').select('*').eq('program_id', id).order('payment_date', { ascending: false }),
    ]);
    setProgram(pr.data as Program);
    setParticipants((pa.data || []) as Participant[]);
    setPayments((py.data || []) as Payment[]);
    setLoading(false);
  }, [id]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const addParticipant = async () => {
    if (!form.full_name) return;
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from('participants').insert({ ...form, program_id: id, pending_amount: program?.program_fee || 0 });
    // Log activity
    await supabase.from('activity_logs').insert({
      user_id: user?.id,
      action: `Added participant "${form.full_name}" to program "${program?.program_name}"`,
      module: 'participants',
      metadata: { participant_name: form.full_name, program_name: program?.program_name },
    });
    toast.success('Participant added');
    setAddOpen(false);
    setForm({ full_name: '', email: '', phone: '' });
    fetchData();
  };

  const openPayDialog = (participant: Participant, mode: 'add' | 'edit') => {
    setSelectedParticipant(participant);
    setPayMode(mode);
    setPayForm({
      amount: mode === 'add' ? (participant.pending_amount > 0 ? String(participant.pending_amount) : '') : '',
      payment_mode: 'cash',
      transaction_id: '',
    });
    setPayOpen(true);
  };

  const recordPayment = async () => {
    if (!selectedParticipant || !payForm.amount) return;
    setSaving(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      await supabase.from('payments').insert({
        participant_id: selectedParticipant.id,
        program_id: id,
        amount: parseFloat(payForm.amount),
        payment_mode: payForm.payment_mode,
        payment_status: 'paid',
        transaction_id: payForm.transaction_id || null,
        created_by: user?.id,
      });
      // Log activity
      await supabase.from('activity_logs').insert({
        user_id: user?.id,
        action: `Recorded payment of ₹${payForm.amount} (${payForm.payment_mode}) for "${selectedParticipant.full_name}" in program "${program?.program_name}"`,
        module: 'payments',
        metadata: { participant_name: selectedParticipant.full_name, amount: payForm.amount, mode: payForm.payment_mode, program_name: program?.program_name },
      });
      toast.success('Payment recorded!');
      setPayOpen(false);
      fetchData();
    } catch {
      toast.error('Failed to record payment');
    } finally {
      setSaving(false);
    }
  };

  const updateAttendance = async (pid: string, status: string) => {
    const supabase = createClient();
    await supabase.from('participants').update({ attendance_status: status }).eq('id', pid);
    toast.success('Updated');
    fetchData();
  };

  if (loading) return <><TopBar title="Program" /><div className="p-6"><Skeleton className="h-64 rounded-xl" /></div></>;

  const totalRevenue = payments.filter(p => p.payment_status === 'paid').reduce((s, p) => s + Number(p.amount), 0);
  const totalPending = participants.reduce((s, p) => s + Number(p.pending_amount), 0);

  const paymentStatusColor = (status: string) => {
    if (status === 'paid') return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20';
    if (status === 'partial') return 'bg-amber-500/10 text-amber-600 border-amber-500/20';
    return 'bg-red-500/10 text-red-600 border-red-500/20';
  };

  return (
    <>
      <TopBar title={program?.program_name || ''} subtitle={program?.venue || ''} />
      <div className="p-6 space-y-6">

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="border-0 shadow-sm stat-card"><CardContent className="p-4 flex items-center gap-3"><div className="p-2 rounded-lg gradient-primary"><Users className="w-4 h-4 text-white" /></div><div><p className="text-xs text-muted-foreground">Participants</p><p className="font-bold">{participants.length}</p></div></CardContent></Card>
          <Card className="border-0 shadow-sm stat-card"><CardContent className="p-4 flex items-center gap-3"><div className="p-2 rounded-lg gradient-success"><CheckCircle2 className="w-4 h-4 text-white" /></div><div><p className="text-xs text-muted-foreground">Collected</p><p className="font-bold">₹{totalRevenue.toLocaleString()}</p></div></CardContent></Card>
          <Card className="border-0 shadow-sm stat-card"><CardContent className="p-4 flex items-center gap-3"><div className="p-2 rounded-lg gradient-warning"><DollarSign className="w-4 h-4 text-white" /></div><div><p className="text-xs text-muted-foreground">Pending</p><p className="font-bold">₹{totalPending.toLocaleString()}</p></div></CardContent></Card>
          <Card className="border-0 shadow-sm stat-card"><CardContent className="p-4 flex items-center gap-3"><div className="p-2 rounded-lg gradient-info"><MapPin className="w-4 h-4 text-white" /></div><div><p className="text-xs text-muted-foreground">Venue</p><p className="font-bold text-sm">{program?.venue || 'TBD'}</p></div></CardContent></Card>
        </div>

        {/* Participants + Payment Table */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold">Participants & Payments</h3>
            <Button className="gradient-primary text-white gap-2" onClick={() => setAddOpen(true)}>
              <Plus className="w-4 h-4" /> Add Participant
            </Button>
          </div>

          <Card className="border-0 shadow-sm">
            <CardContent className="p-0">
              {participants.length === 0 ? (
                <div className="py-16 text-center">
                  <UserCheck className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No participants yet.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Attendance</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Paid</TableHead>
                      <TableHead>Pending</TableHead>
                      <TableHead className="text-right">Payment Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {participants.map(p => (
                      <TableRow key={p.id} className="table-row-hover">
                        <TableCell className="font-medium">{p.full_name}</TableCell>
                        <TableCell className="text-muted-foreground text-sm">{p.email || '—'}</TableCell>
                        <TableCell>
                          <Select value={p.attendance_status} onValueChange={v => updateAttendance(p.id, v)}>
                            <SelectTrigger className="w-28 h-8 text-xs"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="present">Present</SelectItem>
                              <SelectItem value="absent">Absent</SelectItem>
                              <SelectItem value="late">Late</SelectItem>
                              <SelectItem value="excused">Excused</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={paymentStatusColor(p.payment_status)}>
                            {p.payment_status}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-semibold text-emerald-600">₹{Number(p.amount_paid).toLocaleString()}</TableCell>
                        <TableCell className="font-semibold text-destructive">₹{Number(p.pending_amount).toLocaleString()}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            {p.payment_status !== 'paid' && (
                              <Button
                                size="sm"
                                className="h-8 gap-1 gradient-primary text-white text-xs px-3"
                                onClick={() => openPayDialog(p, 'add')}
                              >
                                <DollarSign className="w-3 h-3" /> Pay
                              </Button>
                            )}
                            {p.amount_paid > 0 && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 gap-1 text-xs px-3"
                                onClick={() => openPayDialog(p, 'edit')}
                              >
                                <Pencil className="w-3 h-3" /> Add More
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Add Participant Dialog */}
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogContent>
            <DialogHeader><DialogTitle>Add Participant</DialogTitle></DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="space-y-2"><Label>Full Name *</Label><Input placeholder="John Doe" value={form.full_name} onChange={e => setForm({...form, full_name: e.target.value})} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Email</Label><Input value={form.email} onChange={e => setForm({...form, email: e.target.value})} /></div>
                <div className="space-y-2"><Label>Phone</Label><Input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} /></div>
              </div>
              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
                <Button className="gradient-primary text-white" onClick={addParticipant}>Add</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Record Payment Dialog */}
        <Dialog open={payOpen} onOpenChange={setPayOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{payMode === 'add' ? 'Record Payment' : 'Add Additional Payment'}</DialogTitle>
            </DialogHeader>
            {selectedParticipant && (
              <div className="space-y-4 mt-2">
                <div className="bg-muted/40 rounded-lg p-3 space-y-1 text-sm">
                  <p className="font-semibold">{selectedParticipant.full_name}</p>
                  <div className="flex flex-wrap gap-4 text-muted-foreground">
                    <span>Fee: <strong className="text-foreground">₹{Number(program?.program_fee || 0).toLocaleString()}</strong></span>
                    <span>Paid: <strong className="text-emerald-600">₹{Number(selectedParticipant.amount_paid).toLocaleString()}</strong></span>
                    <span>Pending: <strong className="text-destructive">₹{Number(selectedParticipant.pending_amount).toLocaleString()}</strong></span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Amount (₹) *</Label>
                    <Input type="number" placeholder={`e.g. ${selectedParticipant.pending_amount}`} value={payForm.amount} onChange={e => setPayForm({...payForm, amount: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label>Payment Mode</Label>
                    <Select value={payForm.payment_mode} onValueChange={v => setPayForm({...payForm, payment_mode: v})}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cash">Cash</SelectItem>
                        <SelectItem value="upi">UPI</SelectItem>
                        <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                        <SelectItem value="card">Card</SelectItem>
                        <SelectItem value="cheque">Cheque</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Transaction ID / Reference (Optional)</Label>
                  <Input placeholder="e.g. UPI ref, cheque no." value={payForm.transaction_id} onChange={e => setPayForm({...payForm, transaction_id: e.target.value})} />
                </div>
                <div className="flex justify-end gap-3 pt-2">
                  <Button variant="outline" onClick={() => setPayOpen(false)}>Cancel</Button>
                  <Button className="gradient-primary text-white" onClick={recordPayment} disabled={saving}>
                    {saving ? 'Saving...' : 'Record Payment'}
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

      </div>
    </>
  );
}
