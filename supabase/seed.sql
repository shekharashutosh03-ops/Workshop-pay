-- ============================================================
-- WorkshopFlow Pro — Seed Data
-- Run this AFTER schema.sql and AFTER creating an admin user
-- ============================================================

-- NOTE: Replace 'YOUR_ADMIN_USER_ID' with the actual UUID of your admin user
-- You can find this in the Supabase Auth dashboard after creating the admin

-- Sample Programs
INSERT INTO programs (program_name, description, venue, instructor_name, start_date, end_date, max_participants, program_fee, status) VALUES
('Advanced React Workshop', 'Deep dive into React 19 features, Server Components, and performance optimization', 'Tech Hub Auditorium', 'Dr. Sarah Johnson', '2026-06-01', '2026-06-05', 30, 15000, 'upcoming'),
('Node.js Bootcamp', 'Complete backend development with Node.js, Express, and PostgreSQL', 'Innovation Center', 'Prof. Mike Chen', '2026-05-15', '2026-05-25', 40, 12000, 'active'),
('Python ML Masterclass', 'Machine Learning fundamentals with hands-on projects', 'AI Research Lab', 'Dr. Priya Sharma', '2026-07-01', '2026-07-15', 25, 25000, 'upcoming'),
('UI/UX Design Sprint', 'Modern design principles, Figma workflows, and design systems', 'Creative Studio', 'Alex Rivera', '2026-04-01', '2026-04-10', 20, 8000, 'completed'),
('Cloud DevOps Intensive', 'AWS, Docker, Kubernetes, and CI/CD pipelines', 'Cloud Campus', 'James Wilson', '2026-05-20', '2026-06-20', 35, 20000, 'active'),
('Data Analytics Fundamentals', 'SQL, Python, Tableau and data visualization', 'Data Center', 'Emily Zhang', '2026-03-01', '2026-03-15', 45, 10000, 'completed'),
('Cybersecurity Essentials', 'Network security, ethical hacking, and threat detection', 'Security Lab', 'Chris Anderson', '2026-08-01', '2026-08-14', 20, 18000, 'upcoming'),
('Mobile App Development', 'React Native cross-platform mobile development', 'Mobile Lab', 'Raj Patel', '2026-06-15', '2026-06-30', 30, 16000, 'upcoming');

-- Sample Participants (for completed/active programs - use actual program IDs after insertion)
-- You'll need to get program IDs from the database after running the above inserts

-- Sample Notifications
INSERT INTO notifications (title, message) VALUES
('Welcome to WorkshopFlow Pro', 'Your enterprise workshop management platform is ready!'),
('System Update', 'New analytics features have been deployed.'),
('Tip', 'Use keyboard shortcut Ctrl+K for global search.');
