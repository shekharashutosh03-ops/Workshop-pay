import { NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    // Verify the requester is an admin
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { full_name, email, password, phone, designation, joining_date, program_ids } = body;

    // Use service role to create auth user
    const serviceClient = await createServiceRoleClient();

    const { data: authData, error: authError } = await serviceClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name,
        role: 'employee',
      },
    });

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 400 });
    }

    // Ensure profile exists (upsert handles both cases: if trigger worked or if trigger is missing)
    const { error: profileError } = await serviceClient
      .from('profiles')
      .upsert({
        id: authData.user.id,
        full_name,
        email,
        role: 'employee',
        phone: phone || null,
      });

    if (profileError) {
      return NextResponse.json({ error: 'Failed to create profile: ' + profileError.message }, { status: 400 });
    }

    // Generate employee code
    const { count } = await serviceClient
      .from('employees')
      .select('id', { count: 'exact' });

    const employeeCode = `EMP${String((count || 0) + 1).padStart(4, '0')}`;

    // Create employee record
    const { data: employee, error: empError } = await serviceClient
      .from('employees')
      .insert({
        profile_id: authData.user.id,
        employee_code: employeeCode,
        designation: designation || 'Staff',
        joining_date: joining_date || new Date().toISOString().split('T')[0],
        status: 'active',
      })
      .select()
      .single();

    if (empError) {
      return NextResponse.json({ error: empError.message }, { status: 400 });
    }

    // Automatically assign ALL active programs to this new employee
    const { data: allPrograms } = await serviceClient.from('programs').select('id').in('status', ['upcoming', 'active']);
    if (allPrograms && allPrograms.length > 0) {
      const assignments = allPrograms.map((prog: { id: string }) => ({
        employee_id: employee.id,
        program_id: prog.id
      }));
      await serviceClient.from('employee_programs').insert(assignments);
    }

    // Log activity
    await serviceClient.from('activity_logs').insert({
      user_id: user.id,
      action: `Created employee: ${full_name}`,
      module: 'employees',
      metadata: { employee_id: employee.id, email },
    });

    // Create notification
    await serviceClient.from('notifications').insert({
      title: 'New Employee Created',
      message: `${full_name} has been added as ${designation}`,
      user_id: null, // Broadcast to all
    });

    return NextResponse.json({ employee, user: authData.user }, { status: 201 });
  } catch (error) {
    console.error('Employee creation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const employeeId = searchParams.get('id');

    if (!employeeId) {
      return NextResponse.json({ error: 'Employee ID required' }, { status: 400 });
    }

    // Get employee's profile_id
    const { data: employee } = await supabase
      .from('employees')
      .select('profile_id')
      .eq('id', employeeId)
      .single();

    if (!employee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }

    // Delete auth user (cascades to profile and employee)
    const serviceClient = await createServiceRoleClient();
    await serviceClient.auth.admin.deleteUser(employee.profile_id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Employee deletion error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
