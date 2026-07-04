const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function main() {
  console.log('Querying users and roles separately...');
  const { data: users, error: uErr } = await supabase.from('users').select('*');
  const { data: roles, error: rErr } = await supabase.from('roles').select('*');
  
  if (uErr) console.error('Users error:', uErr);
  if (rErr) console.error('Roles error:', rErr);

  if (users && roles) {
    const roleMap = {};
    roles.forEach(r => {
      roleMap[r.id] = r.name;
    });

    users.forEach(u => {
      const roleName = roleMap[u.role_id] || 'None';
      console.log(`User: ${u.full_name} (${u.email}) [ID: ${u.id}] - Role: ${roleName}`);
    });
  }
}

main();
