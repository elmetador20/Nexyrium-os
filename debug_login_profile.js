const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function testLoginAndGetProfile() {
  const email = 'ahmedsharique250@gmail.com';
  const password = 'Sharique250@';

  console.log(`Attempting to login as ${email}...`);
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (authError) {
    console.error('Auth Error:', authError.message);
    return;
  }

  const userId = authData.user.id;
  console.log(`Auth successful! User ID: ${userId}`);

  // Query public.users using the authenticated client
  console.log('Querying public.users table directly...');
  const { data: profile, error: dbError } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  if (dbError) {
    console.error('Database Query Error:', dbError.message);
  } else {
    console.log('Profile Row in Database:', profile);
  }
}

testLoginAndGetProfile();
