create table if not exists public.clb5h_events (
  id text primary key,
  title text not null,
  event_date text not null default '',
  month text not null default '',
  description text not null default '',
  status text not null default 'active' check (status in ('active', 'hidden', 'ended')),
  deleted_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists clb5h_events_visible_idx
  on public.clb5h_events (deleted_at, status, month, updated_at desc);

alter table public.clb5h_events enable row level security;

drop policy if exists "Anyone can read CLB 5H events" on public.clb5h_events;
create policy "Anyone can read CLB 5H events"
  on public.clb5h_events
  for select
  to anon, authenticated
  using (true);

insert into public.clb5h_events (id, title, event_date, month, description, status)
values (
  'ban-dong-hanh',
  'Sự kiện “Bạn đồng hành”',
  'Đang diễn ra',
  '2026-08',
  'Sự kiện Bạn đồng hành của CLB 5H Sáng.',
  'active'
)
on conflict (id) do nothing;

alter table public.clb5h_event_feedback
  drop constraint if exists clb5h_event_feedback_event_id_fkey;

alter table public.clb5h_event_feedback
  add constraint clb5h_event_feedback_event_id_fkey
  foreign key (event_id)
  references public.clb5h_events(id)
  on update cascade
  on delete restrict;
