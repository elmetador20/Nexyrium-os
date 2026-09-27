-- Durable state for user-approved AI write actions.  Apply through the
-- project's normal Supabase migration workflow before enabling the endpoint.
create table if not exists public.ai_agent_actions (
  action_id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  action_type text not null check (action_type = 'create_task'),
  payload jsonb not null,
  status text not null default 'PENDING' check (status in ('PENDING', 'PROCESSING', 'SUCCEEDED', 'FAILED', 'CANCELLED')),
  task_id text,
  failure_reason text,
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  executed_at timestamptz
);

create index if not exists ai_agent_actions_user_id_idx on public.ai_agent_actions(user_id);

alter table public.ai_agent_actions enable row level security;

-- The application uses the authenticated user's Supabase session. These
-- policies keep proposals private while allowing the server routes to create
-- and transition only the caller's own actions.
create policy "Users can read their AI actions"
  on public.ai_agent_actions for select
  using (auth.uid() = user_id);

create policy "Users can create their AI actions"
  on public.ai_agent_actions for insert
  with check (auth.uid() = user_id);

create policy "Users can update their pending AI actions"
  on public.ai_agent_actions for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
