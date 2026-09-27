create table if not exists public.automation_events (
  id uuid primary key default gen_random_uuid(),
  rule_id text not null,
  event_type text not null,
  severity text not null check (severity in ('low', 'medium', 'high', 'critical')),
  title text not null,
  description text not null,
  entity_type text not null check (entity_type in ('project', 'task', 'employee', 'department')),
  entity_id text not null,
  project_id text,
  task_id text,
  user_id uuid,
  department text,
  event_key text not null unique,
  status text not null default 'ACTIVE' check (status in ('ACTIVE', 'ACKNOWLEDGED', 'RESOLVED', 'DISMISSED')),
  metadata jsonb not null default '{}'::jsonb,
  detected_at timestamptz not null,
  first_detected_at timestamptz not null default now(),
  last_detected_at timestamptz not null default now(),
  acknowledged_at timestamptz,
  acknowledged_by uuid,
  dismissed_at timestamptz,
  dismissed_by uuid,
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists automation_events_status_last_detected_idx on public.automation_events(status, last_detected_at desc);
create index if not exists automation_events_project_idx on public.automation_events(project_id);

alter table public.automation_events enable row level security;

create policy "Active users can read automation events"
  on public.automation_events for select to authenticated
  using (exists (
    select 1 from public.users join public.roles on roles.id = users.role_id
    where users.id = auth.uid() and users.status = 'ACTIVE'
      and roles.name in ('SUPER_ADMIN', 'CEO', 'OPERATIONS_MANAGER', 'PROJECT_MANAGER')
  ));

create policy "Active users can manage automation events"
  on public.automation_events for all to authenticated
  using (exists (
    select 1 from public.users join public.roles on roles.id = users.role_id
    where users.id = auth.uid() and users.status = 'ACTIVE'
      and roles.name in ('SUPER_ADMIN', 'CEO', 'OPERATIONS_MANAGER', 'PROJECT_MANAGER')
  ))
  with check (exists (
    select 1 from public.users join public.roles on roles.id = users.role_id
    where users.id = auth.uid() and users.status = 'ACTIVE'
      and roles.name in ('SUPER_ADMIN', 'CEO', 'OPERATIONS_MANAGER', 'PROJECT_MANAGER')
  ));
