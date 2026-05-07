import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  try {
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Try to query the profiles table to see if it exists
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .limit(1);

    if (error) {
      return NextResponse.json({ 
        tablesExist: false, 
        error: error.message,
        code: error.code,
        hint: "The database tables haven't been created yet. You need to run the SQL schema in Supabase."
      });
    }

    return NextResponse.json({ tablesExist: true, data });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
