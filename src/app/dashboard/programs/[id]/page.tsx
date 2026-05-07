// @ts-nocheck
'use client';

import { useEffect, useState, useCallback, use } from 'react';
import { TopBar } from '@/components/layout/topbar';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, MapPin, Users, DollarSign, Plus, UserCheck, Pencil, CheckCircle2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import type { Program, Participant, Payment } from '@/types/database';
import { toast } from 'sonner';

export default function ProgramDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [program, setProgram] = useState<Program | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  // Add participant dialog
  const [addParticipantOpen, setAddParticipantOpen] = useState(false);
  const [formData, setFormData] = useState({ full_name: '', email: '', phone: '' });

  // Payment dialog (add or edit)
  const [payDialogOpen, setPayDialogOpen] = useState(false);
  const [payDialogMode, setPayDialogMode] = useState<'add' | 'edit'>('add');
  const [selectedParticipant, setSelectedParticipant] = useState<Participant | null>(null);
  const [payForm, setPayForm] = useState({ amount: '', payment_mode: 'cash', transaction_id: '' });
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async () => {
    const supabase = createClient();
    const [progRes, partRes, payRes] = await Promise.all([
      supabase.from('programs').select('*').eq('id', id).single(),
      supabase.from('participants').select('*').eq('program_id', id).order('registration_date', { ascending: false }),
      supabase.from('payments').select('*').eq('program_id', id).order('payment_date', { ascending: false }),
    ]);
    setProgram(progRes.data as Program);
    setParticipants((partRes.data || []) as Participant[]);
    setPayments((payRes.data || []) as Payment[]);
    setLoading(false);
  }, [id]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const addParticipant = async () => {
    if (!formData.full_name) return;
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from('participants').insert({
      ...formData, program_id: id,
      pending_amount: program?.program_fee || 0,
    });
    // Log activity
    await supabase.from('activity_logs').insert({
      user_id: user?.id,
      action: `Added participant "${formData.full_name}" to program "${program?.program_name}"`,
      module: 'participants',
      metadata: { participant_name: formData.full_name, program_id: id, program_name: program?.program_name },
    });
    toast.success('Participant added');
    setAddParticipantOpen(false);
    setFormData({ full_name: '', email: '', phone: '' });
    fetchData();
  };

  const openPayDialog = (participant: Participant, mode: 'add' | 'edit') => {
    setSelectedParticipant(participant);
    setPayDialogMode(mode);
    setPayForm({
      amount: mode === 'add' ? (participant.pending_amount > 0 ? String(participant.pending_amount) : '') : '',
      payment_mode: 'cash',
      transaction_id: '',
    });
    setPayDialogOpen(true);
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
      setPayDialogOpen(false);
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
    toast.success('Attendance updated');
    fetchData();
  };

  if (loading) return (<><TopBar title="Program Details" /><div className="p-6 space-y-4">{[1,2,3].map(i => <Skeleton key={i} className="h-32 rounded-xl" />)}</div></>);

  const totalRevenue = payments.filter(p => p.payment_status === 'paid').reduce((s, p) => s + Number(p.amount), 0);
  const totalPending = participants.reduce((s, p) => s + Number(p.pending_amount), 0);

  const paymentStatusColor = (status: string) => {
    if (status === 'paid') return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20';
    if (status === 'partial') return 'bg-amber-500/10 text-amber-600 border-amber-500/20';
    return 'bg-red-500/10 text-red-600 border-red-500/20';
  };

  return (
    <>
      <TopBar title={program?.program_name || 'Program Details'} subtitle={program?.description || ''} />
      <div className="p-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Participants', value: participants.length, icon: Users, color: 'gradient-primary' },
            { label: 'Revenue Collected', value: `₹${totalRevenue.toLocaleString()}`, icon: CheckCircle2, color: 'gradient-success' },
            { label: 'Amount Pending', value: `₹${totalPending.toLocaleString()}`, icon: DollarSign, color: 'gradient-warning' },
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

        {/* Program Info */}
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 flex flex-wrap gap-6 text-sm">
            <div className="flex items-center gap-2"><Calendar className="w-4 h-4 text-muted-foreground" />{new Date(program!.start_date).toLocaleDateString()} – {new Date(program!.end_date).toLocaleDateString()}</div>
            <div>Fee: <span className="font-semibold">₹{program!.program_fee.toLocaleString()}</span></div>
            <div>Max: <span className="font-semibold">{program!.max_participants}</span></div>
            <Badge variant="outline">{program!.status}</Badge>
          </CardContent>
        </Card>

        {/* Participants Table */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold">Participants & Payments</h3>
            <Button className="gradient-primary text-white gap-2" onClick={() => setAddParticipantOpen(true)}>
              <Plus className="w-4 h-4" /> Add Participant
            </Button>
          </div>

          <Card className="border-0 shadow-sm">
            <CardContent className="p-0">
              {participants.length === 0 ? (
                <div className="py-16 text-center">
                  <UserCheck className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No participants yet. Add one to get started.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Phone</TableHead>
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
                        <TableCell className="text-muted-foreground text-sm">{p.phone || '—'}</TableCell>
                        <TableCell>
                          <Select value={p.attendance_status} onValueChange={(v) => updateAttendance(p.id, v)}>
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
                        <TableCell className="font-semibold text-emerald-600">
                          ₹{Number(p.amount_paid).toLocaleString()}
                        </TableCell>
                        <TableCell className="font-semibold text-destructive">
                          ₹{Number(p.pending_amount).toLocaleString()}
                        </TableCell>
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
        <Dialog open={addParticipantOpen} onOpenChange={setAddParticipantOpen}>
          <DialogContent>
            <DialogHeader><DialogTitle>Add Participant</DialogTitle></DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="space-y-2"><Label>Full Name *</Label><Input placeholder="John Doe" value={formData.full_name} onChange={e => setFormData({...formData, full_name: e.target.value})} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Email</Label><Input type="email" placeholder="john@example.com" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} /></div>
                <div className="space-y-2"><Label>Phone</Label><Input placeholder="+91 9876543210" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} /></div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <Button variant="outline" onClick={() => setAddParticipantOpen(false)}>Cancel</Button>
                <Button className="gradient-primary text-white" onClick={addParticipant}>Add Participant</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Record / Edit Payment Dialog */}
        <Dialog open={payDialogOpen} onOpenChange={setPayDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {payDialogMode === 'add' ? 'Record Payment' : 'Add Additional Payment'}
              </DialogTitle>
            </DialogHeader>
            {selectedParticipant && (
              <div className="space-y-4 mt-2">
                {/* Participant Summary */}
                <div className="bg-muted/40 rounded-lg p-3 space-y-1 text-sm">
                  <p className="font-semibold">{selectedParticipant.full_name}</p>
                  <div className="flex gap-4 text-muted-foreground">
                    <span>Total Fee: <strong className="text-foreground">₹{Number(program?.program_fee || 0).toLocaleString()}</strong></span>
                    <span>Paid: <strong className="text-emerald-600">₹{Number(selectedParticipant.amount_paid).toLocaleString()}</strong></span>
                    <span>Pending: <strong className="text-destructive">₹{Number(selectedParticipant.pending_amount).toLocaleString()}</strong></span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Amount (₹) *</Label>
                    <Input
                      type="number"
                      placeholder={`e.g. ${selectedParticipant.pending_amount}`}
                      value={payForm.amount}
                      onChange={e => setPayForm({...payForm, amount: e.target.value})}
                    />
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
                  <Button variant="outline" onClick={() => setPayDialogOpen(false)}>Cancel</Button>
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
