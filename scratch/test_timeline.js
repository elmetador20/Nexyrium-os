const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function main() {
  const email = 'ahmedsharique250@gmail.com';
  const password = 'Sharique250@';

  console.log(`Logging in as ${email}...`);
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (authError) {
    console.error('Auth failed:', authError.message);
    return;
  }

  // Authenticated client
  const client = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      global: {
        headers: {
          Authorization: `Bearer ${authData.session.access_token}`
        }
      }
    }
  );

  console.log('Testing inserting into project_timeline...');
  const { data, error } = await client.from('project_timeline').insert([{
    id: `time-${Math.random()}`,
    project_id: 'proj-1',
    user_id: authData.user.id,
    event: 'Test Event',
    details: 'Testing timeline write permissions'
  }]);

  if (error) {
    console.error('project_timeline insert error:', error);
  } else {
    console.log('project_timeline insert success:', data);
  }
}

main();
