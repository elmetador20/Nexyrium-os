const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function checkUser() {
  const userId = '05a11b44-c967-4248-abec-664dc0295902'; // Your actual user ID

  console.log(`Checking public.users table for ID: ${userId}...`);
  
  // 1. Check for specific user ID
  const { data: userRow, error: userError } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  if (userError) {
    console.error('Error fetching user:', userError.message);
  } else {
    console.log('User row found:', userRow);
  }

  // 2. Check all rows in users table to see what is in there
  console.log('Fetching all rows from public.users table...');
  const { data: allUsers, error: allUsersError } = await supabase
    .from('users')
    .select('id, email, status, role_id');

  if (allUsersError) {
    console.error('Error fetching all users:', allUsersError.message);
  } else {
    console.log(`Total users in public.users: ${allUsers ? allUsers.length : 0}`);
    console.log('All users:', allUsers);
  }

  // 3. Check roles table
  console.log('Fetching all rows from public.roles table...');
  const { data: allRoles, error: rolesError } = await supabase
    .from('roles')
    .select('id, name');

  if (rolesError) {
    console.error('Error fetching roles:', rolesError.message);
  } else {
    console.log('All roles in DB:', allRoles);
  }
}

checkUser();
