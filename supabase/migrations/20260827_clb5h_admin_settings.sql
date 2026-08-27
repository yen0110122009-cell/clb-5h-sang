create table if not exists public.clb5h_admin_settings (
  id text primary key check (id = 'primary'),
  code_hash text not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.clb5h_admin_settings enable row level security;
revoke all on table public.clb5h_admin_settings from anon, authenticated;
grant all on table public.clb5h_admin_settings to service_role;

insert into public.clb5h_admin_settings (id, code_hash)
values ('primary', 'f6e0a1e2ac41945a9aa7ff8a8aaa0cebc12a3bcc981a929ad5cf810a090e11ae')
on conflict (id) do nothing;
