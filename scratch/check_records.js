const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function main() {
  console.log('Querying projects...');
  const { data: projects, error: pErr } = await supabase.from('projects').select('id, name, status');
  if (pErr) console.error('Projects query error:', pErr);
  else console.log('Projects:', projects);

  console.log('Querying research_records...');
  const { data: research, error: rErr } = await supabase.from('research_records').select('*');
  if (rErr) console.error('Research query error:', rErr);
  else console.log('Research records count:', research?.length, 'records:', research);

  console.log('Querying content_records...');
  const { data: content, error: cErr } = await supabase.from('content_records').select('*');
  if (cErr) console.error('Content query error:', cErr);
  else console.log('Content records count:', content?.length, 'records:', content);
}

main();
