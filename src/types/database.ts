// ============================================================
// WorkshopFlow Pro — Database Types
// ============================================================

export type UserRole = 'admin' | 'employee';

export type ProgramStatus = 'upcoming' | 'active' | 'completed' | 'cancelled';
export type EmployeeStatus = 'active' | 'inactive' | 'on_leave';
export type PaymentStatus = 'paid' | 'pending' | 'partial' | 'refunded';
export type PaymentMode = 'cash' | 'upi' | 'bank_transfer' | 'card' | 'cheque' | 'other';
export type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused';

// ---- Profiles ----
export interface Profile {
  id: string;
  full_name: string;
  email: string;
  role: UserRole;
  phone: string | null;
  avatar_url: string | null;
  created_at: string;
}

// ---- Employees ----
export interface Employee {
  id: string;
  profile_id: string;
  employee_code: string;
  designation: string;
  status: EmployeeStatus;
  joining_date: string;
  created_at: string;
  // Joined
  profile?: Profile;
  assigned_programs?: Program[];
}

// ---- Programs ----
export interface Program {
  id: string;
  program_name: string;
  description: string | null;
  venue: string | null;
  instructor_name: string | null;
  start_date: string;
  end_date: string;
  max_participants: number;
  program_fee: number;
  banner_image: string | null;
  status: ProgramStatus;
  created_by: string | null;
  created_at: string;
  // Joined
  participants?: Participant[];
  assigned_employees?: Employee[];
  _count?: {
    participants: number;
    payments: number;
  };
}

// ---- Participants ----
export interface Participant {
  id: string;
  program_id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  attendance_status: AttendanceStatus;
  payment_status: PaymentStatus;
  amount_paid: number;
  pending_amount: number;
  registration_date: string;
  // Joined
  program?: Program;
  payments?: Payment[];
}

// ---- Payments ----
export interface Payment {
  id: string;
  participant_id: string;
  program_id: string;
  amount: number;
  payment_mode: PaymentMode;
  payment_status: PaymentStatus;
  transaction_id: string | null;
  receipt_url: string | null;
  payment_date: string;
  created_by: string | null;
  // Joined
  participant?: Participant;
  program?: Program;
}

// ---- Employee Programs (junction) ----
export interface EmployeeProgram {
  employee_id: string;
  program_id: string;
}

// ---- Activity Logs ----
export interface ActivityLog {
  id: string;
  user_id: string | null;
  action: string;
  module: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
  // Joined
  profile?: Profile;
}

// ---- Notifications ----
export interface Notification {
  id: string;
  title: string;
  message: string;
  user_id: string | null;
  is_read: boolean;
  created_at: string;
}

// ---- Form Types ----
export interface CreateEmployeeForm {
  full_name: string;
  email: string;
  password: string;
  phone: string;
  designation: string;
  joining_date: string;
}

export interface CreateProgramForm {
  program_name: string;
  description: string;
  venue: string;
  instructor_name: string;
  start_date: string;
  end_date: string;
  max_participants: number;
  program_fee: number;
  status: ProgramStatus;
  assigned_employees: string[];
}

export interface CreateParticipantForm {
  full_name: string;
  email: string;
  phone: string;
  program_id: string;
}

export interface CreatePaymentForm {
  participant_id: string;
  program_id: string;
  amount: number;
  payment_mode: PaymentMode;
  payment_status: PaymentStatus;
  transaction_id: string;
}

// ---- Analytics Types ----
export interface DashboardStats {
  totalPrograms: number;
  totalParticipants: number;
  totalRevenue: number;
  pendingPayments: number;
  activeEmployees: number;
  monthlyGrowth: number;
}

export interface RevenueData {
  month: string;
  revenue: number;
  target: number;
}

export interface ProgramGrowthData {
  month: string;
  programs: number;
  participants: number;
}

export interface PaymentTrendData {
  month: string;
  paid: number;
  pending: number;
  partial: number;
}
