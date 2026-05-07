const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing SUPABASE variables in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function clearDemoData() {
  console.log("Starting to clear demo data...");

  // Since there are foreign key constraints, we clear in reverse order or just delete all
  // The service role key bypasses RLS
  
  const tables = ['activity_logs', 'notifications', 'payments', 'participants', 'programs', 'employees'];
  
  for (const table of tables) {
    console.log(`Clearing ${table}...`);
    // Delete all rows where id is not null (which is all rows)
    const { error } = await supabase.from(table).delete().neq('id', '00000000-0000-0000-0000-000000000000');
    
    if (error) {
      console.error(`Error clearing ${table}:`, error);
    } else {
      console.log(`Successfully cleared ${table}`);
    }
  }

  console.log("Demo data cleared successfully!");
}

clearDemoData();
