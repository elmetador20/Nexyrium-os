const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function checkSeeded() {
  const { data: projects, error: errP } = await supabase.from('projects').select('id, name, status');
  if (errP) {
    console.error('Error projects:', errP.message);
  } else {
    console.log('Successfully fetched projects. Count:', projects.length);
    console.log('Projects in DB:', projects);
  }

  const { data: tasks, error: errT } = await supabase.from('tasks').select('id, name, assigned_user_id');
  if (errT) {
    console.error('Error tasks:', errT.message);
  } else {
    console.log('Successfully fetched tasks. Count:', tasks.length);
    console.log('Tasks in DB:', tasks);
  }
}

checkSeeded();
