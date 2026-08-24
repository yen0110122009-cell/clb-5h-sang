create table if not exists public.clb5h_event_feedback (
  id uuid primary key default gen_random_uuid(),
  event_id text not null,
  member text not null,
  feedback_text text,
  image_url text,
  image_public_id text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists clb5h_event_feedback_event_idx
  on public.clb5h_event_feedback (event_id, created_at desc);

alter table public.clb5h_event_feedback enable row level security;

drop policy if exists "Anyone can read CLB 5H event feedback" on public.clb5h_event_feedback;
create policy "Anyone can read CLB 5H event feedback"
  on public.clb5h_event_feedback
  for select
  to anon, authenticated
  using (true);

-- Ghi, sửa và xóa được thực hiện bởi Edge Function clb5h-feedback.
-- Không mở policy insert/update/delete cho anon hoặc authenticated.
