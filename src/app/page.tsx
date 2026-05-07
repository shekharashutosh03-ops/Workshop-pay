import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export default async function Home() {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (profile?.role === 'admin') {
        redirect('/dashboard');
      } else {
        redirect('/employee/dashboard');
      }
    }

    // Check if setup is needed (no admin exists)
    const { data: admins } = await supabase
      .from('profiles')
      .select('id')
      .eq('role', 'admin')
      .limit(1);

    if (!admins || admins.length === 0) {
      redirect('/setup');
    }

    redirect('/login');
  } catch (error) {
    // If tables don't exist yet, redirect to setup
    redirect('/setup');
  }
}
