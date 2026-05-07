import { createClient } from '@/lib/supabase/client';
import type {
  Employee,
  Program,
  Participant,
  Payment,
  ActivityLog,
  Notification,
  CreateEmployeeForm,
  CreateProgramForm,
  CreateParticipantForm,
  CreatePaymentForm,
  DashboardStats,
} from '@/types/database';

const supabase = createClient();

// ============================================================
// Dashboard / Analytics
// ============================================================
export const dashboardService = {
  async getStats(): Promise<DashboardStats> {
    const [programs, participants, payments, employees] = await Promise.all([
      supabase.from('programs').select('id', { count: 'exact' }),
      supabase.from('participants').select('id', { count: 'exact' }),
      supabase.from('payments').select('amount, payment_status'),
      supabase.from('employees').select('id', { count: 'exact' }).eq('status', 'active'),
    ]);

    const totalRevenue = (payments.data || [])
      .filter((p) => p.payment_status === 'paid' || p.payment_status === 'partial')
      .reduce((sum, p) => sum + Number(p.amount), 0);

    const pendingPayments = (payments.data || [])
      .filter((p) => p.payment_status === 'pending')
      .reduce((sum, p) => sum + Number(p.amount), 0);

    return {
      totalPrograms: programs.count || 0,
      totalParticipants: participants.count || 0,
      totalRevenue,
      pendingPayments,
      activeEmployees: employees.count || 0,
      monthlyGrowth: 12.5, // Calculate from historical data
    };
  },

  async getRevenueData() {
    const { data } = await supabase
      .from('payments')
      .select('amount, payment_date, payment_status')
      .in('payment_status', ['paid', 'partial'])
      .order('payment_date', { ascending: true });

    if (!data) return [];

    const grouped = data.reduce((acc: Record<string, number>, p) => {
      const month = new Date(p.payment_date).toLocaleDateString('en-US', {
        month: 'short',
        year: '2-digit',
      });
      acc[month] = (acc[month] || 0) + Number(p.amount);
      return acc;
    }, {});

    return Object.entries(grouped).map(([month, revenue]) => ({
      month,
      revenue,
      target: revenue * 1.2,
    }));
  },

  async getRecentActivity(): Promise<ActivityLog[]> {
    const { data } = await supabase
      .from('activity_logs')
      .select('*, profile:profiles(full_name, avatar_url)')
      .order('created_at', { ascending: false })
      .limit(10);
    return (data || []) as unknown as ActivityLog[];
  },

  async getProgramGrowth() {
    const { data: programs } = await supabase
      .from('programs')
      .select('created_at')
      .order('created_at', { ascending: true });

    const { data: participants } = await supabase
      .from('participants')
      .select('registration_date')
      .order('registration_date', { ascending: true });

    const months: Record<string, { programs: number; participants: number }> = {};

    (programs || []).forEach((p) => {
      const month = new Date(p.created_at).toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      if (!months[month]) months[month] = { programs: 0, participants: 0 };
      months[month].programs++;
    });

    (participants || []).forEach((p) => {
      const month = new Date(p.registration_date).toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      if (!months[month]) months[month] = { programs: 0, participants: 0 };
      months[month].participants++;
    });

    return Object.entries(months).map(([month, data]) => ({
      month,
      ...data,
    }));
  },
};

// ============================================================
// Employees
// ============================================================
export const employeeService = {
  async getAll(): Promise<Employee[]> {
    const { data, error } = await supabase
      .from('employees')
      .select('*, profile:profiles(*)')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []) as unknown as Employee[];
  },

  async getById(id: string): Promise<Employee> {
    const { data, error } = await supabase
      .from('employees')
      .select('*, profile:profiles(*)')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data as unknown as Employee;
  },

  async create(form: CreateEmployeeForm) {
    // This calls the API route which uses the service role to create the auth user
    const response = await fetch('/api/employees', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to create employee');
    }
    return response.json();
  },

  async update(id: string, updates: Partial<Employee>) {
    const { data, error } = await supabase
      .from('employees')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async delete(id: string) {
    const { error } = await supabase.from('employees').delete().eq('id', id);
    if (error) throw error;
  },

  async getAssignedPrograms(employeeId: string): Promise<Program[]> {
    const { data, error } = await supabase
      .from('employee_programs')
      .select('program:programs(*)')
      .eq('employee_id', employeeId);
    if (error) throw error;
    return (data || []).map((d: unknown) => (d as { program: Program }).program);
  },
};

// ============================================================
// Programs
// ============================================================
export const programService = {
  async getAll(): Promise<Program[]> {
    const { data, error } = await supabase
      .from('programs')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []) as Program[];
  },

  async getById(id: string): Promise<Program> {
    const { data, error } = await supabase
      .from('programs')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data as Program;
  },

  async create(form: CreateProgramForm) {
    const { assigned_employees, ...programData } = form;
    const { data: { user } } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from('programs')
      .insert({ ...programData, created_by: user?.id })
      .select()
      .single();
    if (error) throw error;

    // Assign employees
    if (assigned_employees.length > 0) {
      const assignments = assigned_employees.map((empId) => ({
        employee_id: empId,
        program_id: data.id,
      }));
      await supabase.from('employee_programs').insert(assignments);
    }

    // Log activity
    await activityService.log('Created program', 'programs', { program_name: form.program_name });

    return data as Program;
  },

  async update(id: string, updates: Partial<CreateProgramForm>) {
    const { assigned_employees, ...programData } = updates;

    const { data, error } = await supabase
      .from('programs')
      .update(programData)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;

    if (assigned_employees) {
      await supabase.from('employee_programs').delete().eq('program_id', id);
      if (assigned_employees.length > 0) {
        const assignments = assigned_employees.map((empId) => ({
          employee_id: empId,
          program_id: id,
        }));
        await supabase.from('employee_programs').insert(assignments);
      }
    }

    return data as Program;
  },

  async delete(id: string) {
    const { error } = await supabase.from('programs').delete().eq('id', id);
    if (error) throw error;
  },

  async getAssignedEmployees(programId: string): Promise<Employee[]> {
    const { data, error } = await supabase
      .from('employee_programs')
      .select('employee:employees(*, profile:profiles(*))')
      .eq('program_id', programId);
    if (error) throw error;
    return (data || []).map((d: unknown) => (d as { employee: Employee }).employee);
  },

  async uploadBanner(file: File): Promise<string> {
    const fileName = `${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from('banners').upload(fileName, file);
    if (error) throw error;
    const { data } = supabase.storage.from('banners').getPublicUrl(fileName);
    return data.publicUrl;
  },
};

// ============================================================
// Participants
// ============================================================
export const participantService = {
  async getAll(programId?: string): Promise<Participant[]> {
    let query = supabase
      .from('participants')
      .select('*, program:programs(program_name, program_fee)')
      .order('registration_date', { ascending: false });

    if (programId) {
      query = query.eq('program_id', programId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data || []) as unknown as Participant[];
  },

  async getById(id: string): Promise<Participant> {
    const { data, error } = await supabase
      .from('participants')
      .select('*, program:programs(*), payments(*)')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data as unknown as Participant;
  },

  async create(form: CreateParticipantForm) {
    // Get program fee to set pending amount
    const { data: program } = await supabase
      .from('programs')
      .select('program_fee')
      .eq('id', form.program_id)
      .single();

    const { data, error } = await supabase
      .from('participants')
      .insert({
        ...form,
        pending_amount: program?.program_fee || 0,
        payment_status: 'pending',
        attendance_status: 'absent',
      })
      .select()
      .single();
    if (error) throw error;

    await activityService.log('Added participant', 'participants', { name: form.full_name });
    return data as Participant;
  },

  async update(id: string, updates: Partial<Participant>) {
    const { data, error } = await supabase
      .from('participants')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data as Participant;
  },

  async delete(id: string) {
    const { error } = await supabase.from('participants').delete().eq('id', id);
    if (error) throw error;
  },

  async updateAttendance(id: string, status: string) {
    return this.update(id, { attendance_status: status } as Partial<Participant>);
  },
};

// ============================================================
// Payments
// ============================================================
export const paymentService = {
  async getAll(programId?: string): Promise<Payment[]> {
    let query = supabase
      .from('payments')
      .select('*, participant:participants(full_name, email), program:programs(program_name)')
      .order('payment_date', { ascending: false });

    if (programId) {
      query = query.eq('program_id', programId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data || []) as unknown as Payment[];
  },

  async create(form: CreatePaymentForm) {
    const { data: { user } } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from('payments')
      .insert({ ...form, created_by: user?.id })
      .select()
      .single();
    if (error) throw error;

    await activityService.log('Recorded payment', 'payments', {
      amount: form.amount,
      mode: form.payment_mode,
    });

    return data as Payment;
  },

  async uploadReceipt(file: File): Promise<string> {
    const fileName = `${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from('receipts').upload(fileName, file);
    if (error) throw error;
    const { data } = supabase.storage.from('receipts').getPublicUrl(fileName);
    return data.publicUrl;
  },

  async getPaymentsByParticipant(participantId: string): Promise<Payment[]> {
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .eq('participant_id', participantId)
      .order('payment_date', { ascending: false });
    if (error) throw error;
    return (data || []) as Payment[];
  },
};

// ============================================================
// Activity Logs
// ============================================================
export const activityService = {
  async log(action: string, module: string, metadata?: Record<string, unknown>) {
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from('activity_logs').insert({
      user_id: user?.id,
      action,
      module,
      metadata,
    });
  },

  async getAll(limit = 50): Promise<ActivityLog[]> {
    const { data, error } = await supabase
      .from('activity_logs')
      .select('*, profile:profiles(full_name, avatar_url)')
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) throw error;
    return (data || []) as unknown as ActivityLog[];
  },
};

// ============================================================
// Notifications
// ============================================================
export const notificationService = {
  async create(title: string, message: string, userId?: string) {
    const { error } = await supabase.from('notifications').insert({
      title,
      message,
      user_id: userId || null,
    });
    if (error) throw error;
  },

  async markAsRead(id: string) {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', id);
    if (error) throw error;
  },

  async markAllAsRead() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', user.id)
      .eq('is_read', false);
    if (error) throw error;
  },

  async getUnread(): Promise<Notification[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .or(`user_id.eq.${user.id},user_id.is.null`)
      .eq('is_read', false)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []) as Notification[];
  },
};

// ============================================================
// Profile
// ============================================================
export const profileService = {
  async update(updates: Partial<{ full_name: string; phone: string; avatar_url: string }>) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async uploadAvatar(file: File): Promise<string> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const fileName = `${user.id}-${Date.now()}`;
    const { error } = await supabase.storage.from('avatars').upload(fileName, file, { upsert: true });
    if (error) throw error;
    const { data } = supabase.storage.from('avatars').getPublicUrl(fileName);
    return data.publicUrl;
  },
};
