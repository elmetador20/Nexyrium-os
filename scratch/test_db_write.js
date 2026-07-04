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
  console.log('Auth successful. User ID:', authData.user.id);

  // Set the authorization header on the client just to be absolutely sure
  const client = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      auth: {
        persistSession: false
      },
      global: {
        headers: {
          Authorization: `Bearer ${authData.session.access_token}`
        }
      }
    }
  );

  console.log('Querying projects...');
  const { data: projects, error: pErr } = await client.from('projects').select('*');
  if (pErr) {
    console.error('Projects select error:', pErr);
  } else {
    console.log('Found', projects.length, 'projects.');
    if (projects.length > 0) {
      console.log('Project 1 ID:', projects[0].id, 'Name:', projects[0].name, 'Status:', projects[0].status);
      const projectId = projects[0].id;

      console.log('Querying research_records for this project...');
      const { data: resRec, error: resErr } = await client
        .from('research_records')
        .select('*')
        .eq('project_id', projectId);
      if (resErr) {
        console.error('Research record select error:', resErr);
      } else {
        console.log('Research record found:', resRec);
      }

      console.log('Testing writing research record...');
      const recordId = resRec[0]?.id || `test-res-${Math.floor(Math.random() * 100000)}`;
      const { data: upsertData, error: upsertErr } = await client
        .from('research_records')
        .upsert({
          id: recordId,
          project_id: projectId,
          industry: 'Test Industry ' + Date.now(),
          updated_at: new Date().toISOString()
        }, { onConflict: 'project_id' })
        .select();

      if (upsertErr) {
        console.error('Research record upsert error:', upsertErr);
      } else {
        console.log('Research record upsert success:', upsertData);
      }
    }
  }
}

main();
