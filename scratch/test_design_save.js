const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function main() {
  const email = 'nexyriumtechnologies@gmail.com';
  const password = 'Sharique250@';

  console.log(`Logging in as ${email}...`);
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (authError) {
    console.error('Login failed:', authError.message);
    return;
  }

  const user = authData.user;
  console.log(`Login successful! User ID: ${user.id}`);

  const projectId = 'proj-1';
  const updates = {
    canva_link: 'https://canva.com/design/test-link',
    brand_kit: {
      logo: 'https://example.com/logo.png',
      fonts: 'Outfit, Inter',
      colors: ['#000000', '#FFFFFF'],
      icons: 'Feather Icons',
      illustrations: 'Minimal'
    },
    pdf_export_url: 'https://example.com/test.pdf',
    pptx_export_url: 'https://example.com/test.pptx'
  };

  console.log('Testing design_records upsert...');
  
  // 1. Check if design record already exists
  const { data: existing, error: findError } = await supabase
    .from('design_records')
    .select('id')
    .eq('project_id', projectId)
    .maybeSingle();

  if (findError) {
    console.error('Find Error:', findError);
  }
  console.log('Existing Record:', existing);

  const recordId = existing?.id || `des-rec-${Math.floor(Math.random() * 100000)}`;
  console.log('Using recordId:', recordId);

  // 2. Perform the upsert
  const { data: upsertData, error: upsertError } = await supabase
    .from('design_records')
    .upsert({
      id: recordId,
      project_id: projectId,
      ...updates,
      updated_at: new Date().toISOString()
    }, { onConflict: 'project_id' })
    .select();

  if (upsertError) {
    console.error('Upsert Error:', upsertError);
  } else {
    console.log('Upsert successful!', upsertData);
  }

  // 3. Test deliverables upsert
  console.log('Testing deliverables upsert...');
  const delId = `del-pdf-${projectId}`;
  const { data: delData, error: delError } = await supabase
    .from('deliverables')
    .upsert({
      id: delId,
      project_id: projectId,
      name: 'Pitch Deck Presentation (PDF)',
      status: 'Submitted',
      version: 'v1.0',
      owner_id: user.id, // designer id
      approval_status: 'PENDING',
      file_url: updates.pdf_export_url
    }, { onConflict: 'id' })
    .select();

  if (delError) {
    console.error('Deliverable Upsert Error:', delError);
  } else {
    console.log('Deliverable Upsert successful!', delData);
  }
}

main();
