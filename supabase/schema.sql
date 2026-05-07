-- ============================================================
-- WorkshopFlow Pro — Complete Database Schema
-- Run this in Supabase SQL Editor
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- TABLE: profiles
-- ============================================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL DEFAULT 'employee' CHECK (role IN ('admin', 'employee')),
  phone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLE: employees
-- ============================================================
CREATE TABLE IF NOT EXISTS employees (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  employee_code TEXT NOT NULL UNIQUE,
  designation TEXT NOT NULL DEFAULT 'Staff',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'on_leave')),
  joining_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLE: programs
-- ============================================================
CREATE TABLE IF NOT EXISTS programs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  program_name TEXT NOT NULL,
  description TEXT,
  venue TEXT,
  instructor_name TEXT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  max_participants INT NOT NULL DEFAULT 50,
  program_fee DECIMAL(10,2) NOT NULL DEFAULT 0,
  banner_image TEXT,
  status TEXT NOT NULL DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'active', 'completed', 'cancelled')),
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLE: participants
-- ============================================================
CREATE TABLE IF NOT EXISTS participants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  program_id UUID NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  attendance_status TEXT NOT NULL DEFAULT 'absent' CHECK (attendance_status IN ('present', 'absent', 'late', 'excused')),
  payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('paid', 'pending', 'partial', 'refunded')),
  amount_paid DECIMAL(10,2) NOT NULL DEFAULT 0,
  pending_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  registration_date TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLE: payments
-- ============================================================
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  participant_id UUID NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  program_id UUID NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  payment_mode TEXT NOT NULL DEFAULT 'cash' CHECK (payment_mode IN ('cash', 'upi', 'bank_transfer', 'card', 'cheque', 'other')),
  payment_status TEXT NOT NULL DEFAULT 'paid' CHECK (payment_status IN ('paid', 'pending', 'partial', 'refunded')),
  transaction_id TEXT,
  receipt_url TEXT,
  payment_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id)
);

-- ============================================================
-- TABLE: employee_programs (junction)
-- ============================================================
CREATE TABLE IF NOT EXISTS employee_programs (
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  program_id UUID NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
  PRIMARY KEY (employee_id, program_id)
);

-- ============================================================
-- TABLE: activity_logs
-- ============================================================
CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id),
  action TEXT NOT NULL,
  module TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLE: notifications
-- ============================================================
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  user_id UUID REFERENCES profiles(id),
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_employees_profile_id ON employees(profile_id);
CREATE INDEX IF NOT EXISTS idx_participants_program_id ON participants(program_id);
CREATE INDEX IF NOT EXISTS idx_payments_participant_id ON payments(participant_id);
CREATE INDEX IF NOT EXISTS idx_payments_program_id ON payments(program_id);
CREATE INDEX IF NOT EXISTS idx_employee_programs_employee ON employee_programs(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_programs_program ON employee_programs(program_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id, is_read) WHERE is_read = FALSE;

-- ============================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Helper function to get current user's role
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $$
  SELECT role FROM profiles WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Helper function to check if employee is assigned to a program
CREATE OR REPLACE FUNCTION is_assigned_to_program(prog_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM employee_programs ep
    JOIN employees e ON e.id = ep.employee_id
    WHERE ep.program_id = prog_id AND e.profile_id = auth.uid()
  );
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- ---- PROFILES POLICIES ----
CREATE POLICY "Admins can do everything with profiles"
  ON profiles FOR ALL
  USING (get_user_role() = 'admin');

CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  USING (id = auth.uid());

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- ---- EMPLOYEES POLICIES ----
CREATE POLICY "Admins can do everything with employees"
  ON employees FOR ALL
  USING (get_user_role() = 'admin');

CREATE POLICY "Employees can view their own record"
  ON employees FOR SELECT
  USING (profile_id = auth.uid());

-- ---- PROGRAMS POLICIES ----
CREATE POLICY "Admins can do everything with programs"
  ON programs FOR ALL
  USING (get_user_role() = 'admin');

CREATE POLICY "Employees can view assigned programs"
  ON programs FOR SELECT
  USING (is_assigned_to_program(id));

-- ---- PARTICIPANTS POLICIES ----
CREATE POLICY "Admins can do everything with participants"
  ON participants FOR ALL
  USING (get_user_role() = 'admin');

CREATE POLICY "Employees can view participants of assigned programs"
  ON participants FOR SELECT
  USING (is_assigned_to_program(program_id));

CREATE POLICY "Employees can insert participants to assigned programs"
  ON participants FOR INSERT
  WITH CHECK (is_assigned_to_program(program_id));

CREATE POLICY "Employees can update participants of assigned programs"
  ON participants FOR UPDATE
  USING (is_assigned_to_program(program_id));

-- ---- PAYMENTS POLICIES ----
CREATE POLICY "Admins can do everything with payments"
  ON payments FOR ALL
  USING (get_user_role() = 'admin');

CREATE POLICY "Employees can view payments of assigned programs"
  ON payments FOR SELECT
  USING (is_assigned_to_program(program_id));

CREATE POLICY "Employees can insert payments to assigned programs"
  ON payments FOR INSERT
  WITH CHECK (is_assigned_to_program(program_id));

CREATE POLICY "Employees can update payments of assigned programs"
  ON payments FOR UPDATE
  USING (is_assigned_to_program(program_id));

-- ---- EMPLOYEE_PROGRAMS POLICIES ----
CREATE POLICY "Admins can do everything with employee_programs"
  ON employee_programs FOR ALL
  USING (get_user_role() = 'admin');

CREATE POLICY "Employees can view their own assignments"
  ON employee_programs FOR SELECT
  USING (employee_id IN (SELECT id FROM employees WHERE profile_id = auth.uid()));

-- ---- ACTIVITY_LOGS POLICIES ----
CREATE POLICY "Admins can do everything with activity_logs"
  ON activity_logs FOR ALL
  USING (get_user_role() = 'admin');

CREATE POLICY "Users can view their own activity"
  ON activity_logs FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Anyone can insert activity logs"
  ON activity_logs FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- ---- NOTIFICATIONS POLICIES ----
CREATE POLICY "Admins can do everything with notifications"
  ON notifications FOR ALL
  USING (get_user_role() = 'admin');

CREATE POLICY "Users can view their own notifications"
  ON notifications FOR SELECT
  USING (user_id = auth.uid() OR user_id IS NULL);

CREATE POLICY "Users can update their own notifications"
  ON notifications FOR UPDATE
  USING (user_id = auth.uid());

-- ============================================================
-- TRIGGERS
-- ============================================================

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, full_name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'employee')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Auto-calculate pending amount for participants
CREATE OR REPLACE FUNCTION update_participant_payment()
RETURNS TRIGGER AS $$
DECLARE
  total_paid DECIMAL(10,2);
  fee DECIMAL(10,2);
BEGIN
  -- Get total payments for this participant
  SELECT COALESCE(SUM(amount), 0) INTO total_paid
  FROM payments
  WHERE participant_id = NEW.participant_id AND payment_status IN ('paid', 'partial');

  -- Get program fee
  SELECT program_fee INTO fee
  FROM programs
  WHERE id = NEW.program_id;

  -- Update participant
  UPDATE participants
  SET
    amount_paid = total_paid,
    pending_amount = GREATEST(fee - total_paid, 0),
    payment_status = CASE
      WHEN total_paid >= fee THEN 'paid'
      WHEN total_paid > 0 THEN 'partial'
      ELSE 'pending'
    END
  WHERE id = NEW.participant_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_payment_change
  AFTER INSERT OR UPDATE ON payments
  FOR EACH ROW EXECUTE FUNCTION update_participant_payment();

-- ============================================================
-- STORAGE BUCKETS
-- ============================================================
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true) ON CONFLICT DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('banners', 'banners', true) ON CONFLICT DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('receipts', 'receipts', false) ON CONFLICT DO NOTHING;

-- Storage policies
CREATE POLICY "Avatars are publicly accessible" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "Authenticated users can upload avatars" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.uid() IS NOT NULL);
CREATE POLICY "Banners are publicly accessible" ON storage.objects FOR SELECT USING (bucket_id = 'banners');
CREATE POLICY "Admins can upload banners" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'banners' AND auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can view receipts" ON storage.objects FOR SELECT USING (bucket_id = 'receipts' AND auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can upload receipts" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'receipts' AND auth.uid() IS NOT NULL);

-- ============================================================
-- SEED DATA (Optional - for development)
-- ============================================================
-- Run the seed.sql file separately for sample data
