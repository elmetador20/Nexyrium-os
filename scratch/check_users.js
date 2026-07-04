const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function main() {
  const { data: roles } = await supabase.from('roles').select('*');
  const { data: users, error } = await supabase.from('users').select('*');

  if (error) {
    console.error('Error fetching users:', error);
  } else {
    console.log('--- ROLES IN DATABASE ---');
    roles?.forEach(r => {
      console.log(`Role ID: ${r.id} | Name: ${r.name}`);
    });
    console.log('\n--- USERS IN DATABASE ---');
    users.forEach(u => {
      const roleName = roles?.find(r => r.id === u.role_id)?.name || 'UNKNOWN';
      console.log(`ID: ${u.id} | Email: ${u.email} | Name: ${u.full_name} | Role: ${roleName} | Status: ${u.status}`);
    });
  }
}

main();
