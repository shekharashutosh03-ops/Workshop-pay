import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, full_name } = body;

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    // See if user is already in auth.users
    const { data: users, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    
    let userId = null;
    let userEmail = email;

    if (!listError && users?.users) {
      const existingAuthUser = users.users.find(u => u.email === email);
      if (existingAuthUser) {
        userId = existingAuthUser.id;
        console.log('[SETUP] User already exists in auth.users, updating password...');
        await supabaseAdmin.auth.admin.updateUserById(userId, { password });
      }
    }

    if (!userId) {
      // Create auth user
      console.log('[SETUP] Creating new user...');
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          full_name: full_name || 'Admin',
          role: 'admin',
        },
      });

      if (authError) {
        console.error('[SETUP] Auth error:', authError);
        return NextResponse.json({ error: authError.message }, { status: 400 });
      }
      userId = authData.user.id;
    }

    console.log('[SETUP] Upserting profile for:', userId);
    const { error: upsertError } = await supabaseAdmin
      .from('profiles')
      .upsert({
        id: userId,
        full_name: full_name || 'Admin',
        email: email,
        role: 'admin',
      }, { onConflict: 'id' });

    if (upsertError) {
      console.error('[SETUP] Profile upsert error:', upsertError);
      return NextResponse.json({ error: 'Failed to create profile: ' + upsertError.message }, { status: 400 });
    }

    // Ensure they have an employee record too (admins are also employees in this system)
    const { error: empError } = await supabaseAdmin
      .from('employees')
      .upsert({
        profile_id: userId,
        employee_code: 'ADM001',
        designation: 'System Administrator',
        status: 'active'
      }, { onConflict: 'profile_id' });
      
    if (empError) {
      console.log('[SETUP] Note: employee record creation failed, but profile succeeded', empError);
    }

    return NextResponse.json({
      success: true,
      message: 'Admin account created successfully!',
    }, { status: 201 });

  } catch (error) {
    console.error('[SETUP] Error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ needsSetup: true });
}
