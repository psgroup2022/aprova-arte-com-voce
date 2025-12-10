import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigration() {
  try {
    console.log('Ensuring mirapauta columns exist in pautas table...');

    // Check if mirapauta_id column exists
    const { data, error } = await supabase
      .from('pautas')
      .select('*')
      .limit(1);

    if (error && error.message?.includes('mirapauta_id')) {
      console.log('Column mirapauta_id does not exist. Running schema update...');
      // The column doesn't exist, so we need to add it
      // This would require direct database access or RPC function
      console.error('Manual migration needed - please run the SQL migration in Supabase dashboard');
      console.error('Migration file: supabase/migrations/20251209235959-ensure-mirapauta-columns.sql');
      process.exit(1);
    }

    console.log('✅ Columns check complete');
    process.exit(0);
  } catch (error) {
    console.error('Error during migration check:', error);
    process.exit(1);
  }
}

runMigration();
