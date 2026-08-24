create table if not exists public.clb5h_diary_entries (
  id uuid primary key default gen_random_uuid(),
  diary_date date not null,
  image_path text not null,
  public_id text,
  caption text,
  author text not null default 'Ban Quản trị CLB 5H Sáng',
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.clb5h_diary_entries
  add column if not exists public_id text;

create index if not exists clb5h_diary_entries_date_created_idx
  on public.clb5h_diary_entries (diary_date desc, created_at desc);

alter table public.clb5h_diary_entries enable row level security;

drop policy if exists "Anyone can read CLB 5H diary" on public.clb5h_diary_entries;
create policy "Anyone can read CLB 5H diary"
  on public.clb5h_diary_entries
  for select
  to anon, authenticated
  using (true);

-- Thao tác ghi được thực hiện bởi Edge Function clb5h-diary với service role.
-- Không tạo policy insert/update/delete cho anon hoặc authenticated.
