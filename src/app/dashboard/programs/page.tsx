// @ts-nocheck
'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { TopBar } from '@/components/layout/topbar';
import { Plus, Search, Filter, MoreHorizontal, Edit, Trash2, Eye, MapPin, Calendar, Users, DollarSign, GraduationCap, X } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { createClient } from '@/lib/supabase/client';
import type { Program } from '@/types/database';
import { toast } from 'sonner';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';

const programSchema = z.object({
  program_name: z.string().min(2),
  description: z.string().optional(),
  venue: z.string().optional(),
  instructor_name: z.string().optional(),
  start_date: z.string().min(1),
  end_date: z.string().min(1),
  max_participants: z.coerce.number().min(1),
  program_fee: z.coerce.number().min(0),
  status: z.string().default('upcoming'),
  participants: z.array(
    z.object({
      full_name: z.string().min(2, "Required"),
      email: z.string().optional(),
      phone: z.string().optional(),
    })
  ).optional().default([]),
});
type ProgramForm = z.infer<typeof programSchema>;

const statusCfg: Record<string, { color: string; label: string }> = {
  upcoming: { color: 'bg-blue-500/10 text-blue-600 border-blue-500/20', label: 'Upcoming' },
  active: { color: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20', label: 'Active' },
  completed: { color: 'bg-violet-500/10 text-violet-600 border-violet-500/20', label: 'Completed' },
  cancelled: { color: 'bg-red-500/10 text-red-600 border-red-500/20', label: 'Cancelled' },
};

export default function ProgramsPage() {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [counts, setCounts] = useState<Record<string, number>>({});

  const { register, handleSubmit, reset, control, formState: { errors } } = useForm<ProgramForm>({
    resolver: zodResolver(programSchema),
    defaultValues: { max_participants: 50, program_fee: 0, status: 'upcoming', participants: [] },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "participants"
  });

  const fetchData = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase.from('programs').select('*').order('created_at', { ascending: false });
    setPrograms((data || []) as Program[]);
    const c: Record<string, number> = {};
    for (const p of data || []) {
      const { count } = await supabase.from('participants').select('id', { count: 'exact' }).eq('program_id', p.id);
      c[p.id] = count || 0;
    }
    setCounts(c);
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filtered = programs.filter((p) => {
    const ms = p.program_name.toLowerCase().includes(search.toLowerCase());
    const mst = statusFilter === 'all' || p.status === statusFilter;
    return ms && mst;
  });

  const onCreate = async (data: ProgramForm) => {
    setCreating(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      const { participants, ...programData } = data;
      
      // 1. Create the Program
      const { data: newProgram, error: progError } = await supabase
        .from('programs')
        .insert({ ...programData, created_by: user?.id })
        .select()
        .single();
        
      if (progError) throw progError;

      // 1.5 Automatically assign ALL employees to this new program
      const { data: allEmployees } = await supabase.from('employees').select('id');
      if (allEmployees && allEmployees.length > 0) {
        const assignments = allEmployees.map(emp => ({
          employee_id: emp.id,
          program_id: newProgram.id
        }));
        await supabase.from('employee_programs').insert(assignments);
      }
      
      // 2. Add the initial participants (if any)
      if (participants && participants.length > 0) {
        const participantsToInsert = participants.map(p => ({
          ...p,
          program_id: newProgram.id,
          attendance_status: 'absent',
          payment_status: 'pending',
          amount_paid: 0,
          pending_amount: programData.program_fee
        }));
        
        const { error: partError } = await supabase.from('participants').insert(participantsToInsert);
        if (partError) throw partError;
      }
      
      toast.success('Program created with participants!');
      setDialogOpen(false); reset(); fetchData();
    } catch (e: any) { 
      toast.error('Failed to create: ' + (e.message || 'Unknown error')); 
    }
    finally { setCreating(false); }
  };

  const onDelete = async () => {
    if (!deleteId) return;
    const supabase = createClient();
    await supabase.from('programs').delete().eq('id', deleteId);
    toast.success('Deleted'); setDeleteId(null); fetchData();
  };

  return (
    <>
      <TopBar title="Program Management" subtitle="Manage workshops and programs" />
      <div className="p-6 space-y-6">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search programs..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-36"><Filter className="w-4 h-4 mr-2" /><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="upcoming">Upcoming</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gradient-primary text-white gap-2"><Plus className="w-4 h-4" />Create Program</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader><DialogTitle>Create Program</DialogTitle><DialogDescription>Add a new workshop and its participants.</DialogDescription></DialogHeader>
              <form onSubmit={handleSubmit(onCreate)} className="space-y-4 mt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2 md:col-span-2"><Label>Name</Label><Input {...register('program_name')} />{errors.program_name && <p className="text-xs text-destructive">Required</p>}</div>
                  <div className="space-y-2 md:col-span-2"><Label>Description</Label><Textarea rows={2} {...register('description')} /></div>
                  <div className="space-y-2"><Label>Venue</Label><Input {...register('venue')} /></div>
                  <div className="space-y-2"><Label>Instructor</Label><Input {...register('instructor_name')} /></div>
                  <div className="space-y-2"><Label>Start</Label><Input type="date" {...register('start_date')} /></div>
                  <div className="space-y-2"><Label>End</Label><Input type="date" {...register('end_date')} /></div>
                  <div className="space-y-2"><Label>Max Participants</Label><Input type="number" {...register('max_participants')} /></div>
                  <div className="space-y-2"><Label>Fee (₹)</Label><Input type="number" step="0.01" {...register('program_fee')} /></div>
                </div>

                <div className="pt-4 border-t mt-6">
                  <div className="flex items-center justify-between mb-3">
                    <Label className="text-base font-semibold">Initial Participants (Optional)</Label>
                    <Button type="button" variant="outline" size="sm" onClick={() => append({ full_name: '', email: '', phone: '' })}>
                      <Plus className="w-4 h-4 mr-1" /> Add Participant
                    </Button>
                  </div>
                  {fields.length === 0 && (
                    <p className="text-sm text-muted-foreground italic mb-2">No participants added yet. You can add them later.</p>
                  )}
                  <div className="space-y-3">
                    {fields.map((field, index) => (
                      <div key={field.id} className="flex gap-2 items-start bg-muted/30 p-2 rounded-md">
                        <div className="flex-1 space-y-1">
                           <Input placeholder="Full Name *" {...register(`participants.${index}.full_name` as const)} className="h-9 text-sm" />
                           {errors.participants?.[index]?.full_name && <p className="text-xs text-destructive">Name is required</p>}
                        </div>
                        <div className="flex-1 space-y-1">
                           <Input placeholder="Email" {...register(`participants.${index}.email` as const)} className="h-9 text-sm" />
                        </div>
                        <div className="flex-1 space-y-1">
                           <Input placeholder="Phone" {...register(`participants.${index}.phone` as const)} className="h-9 text-sm" />
                        </div>
                        <Button type="button" variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-destructive shrink-0" onClick={() => remove(index)}>
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3 justify-end pt-4 border-t mt-4">
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                  <Button type="submit" className="gradient-primary text-white px-6" disabled={creating}>{creating ? 'Creating...' : 'Create Program'}</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-0">
            {loading ? (
              <div className="space-y-4 p-6">{[1,2,3].map(i => <Skeleton key={i} className="h-16 w-full rounded-lg" />)}</div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16">
                <GraduationCap className="w-12 h-12 text-muted-foreground/30 mb-3" />
                <h3 className="text-lg font-semibold">No programs found</h3>
                <p className="text-sm text-muted-foreground mb-4">Create your first program</p>
                <Button className="gradient-primary text-white" onClick={() => setDialogOpen(true)}><Plus className="w-4 h-4 mr-2" />Create</Button>
              </div>
            ) : (
              <Table>
                <TableHeader><TableRow className="hover:bg-transparent">
                  <TableHead>Program</TableHead><TableHead>Venue</TableHead><TableHead>Dates</TableHead><TableHead>Participants</TableHead><TableHead>Fee</TableHead><TableHead>Status</TableHead><TableHead className="w-12"></TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {filtered.map((p, i) => (
                    <motion.tr key={p.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }} className="table-row-hover group">
                      <TableCell>
                        <Link href={`/dashboard/programs/${p.id}`} className="text-sm font-medium hover:text-primary">{p.program_name}</Link>
                        {p.instructor_name && <p className="text-xs text-muted-foreground">by {p.instructor_name}</p>}
                      </TableCell>
                      <TableCell>{p.venue && <span className="flex items-center gap-1 text-sm text-muted-foreground"><MapPin className="w-3.5 h-3.5" />{p.venue}</span>}</TableCell>
                      <TableCell><span className="flex items-center gap-1 text-sm text-muted-foreground"><Calendar className="w-3.5 h-3.5" />{new Date(p.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {new Date(p.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span></TableCell>
                      <TableCell><span className="flex items-center gap-1 text-sm"><Users className="w-3.5 h-3.5 text-muted-foreground" />{counts[p.id] || 0}/{p.max_participants}</span></TableCell>
                      <TableCell><span className="flex items-center gap-1 text-sm font-medium"><DollarSign className="w-3.5 h-3.5 text-muted-foreground" />₹{p.program_fee.toLocaleString()}</span></TableCell>
                      <TableCell><Badge variant="outline" className={statusCfg[p.status]?.color}>{statusCfg[p.status]?.label}</Badge></TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground h-8 w-8 opacity-0 group-hover:opacity-100"><MoreHorizontal className="w-4 h-4" /></DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild><Link href={`/dashboard/programs/${p.id}`}><Eye className="w-4 h-4 mr-2" />View</Link></DropdownMenuItem>
                            <DropdownMenuItem><Edit className="w-4 h-4 mr-2" />Edit</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive" onClick={() => setDeleteId(p.id)}><Trash2 className="w-4 h-4 mr-2" />Delete</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </motion.tr>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader><AlertDialogTitle>Delete Program</AlertDialogTitle><AlertDialogDescription>This will permanently delete the program.</AlertDialogDescription></AlertDialogHeader>
            <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={onDelete} className="bg-destructive text-destructive-foreground">Delete</AlertDialogAction></AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </>
  );
}
