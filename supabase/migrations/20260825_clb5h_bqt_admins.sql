create table if not exists public.clb5h_bqt_admins (
  id text primary key,
  role_title text not null,
  member_name text not null,
  description text not null default '',
  contact_url text not null default '',
  contact_label text not null default '',
  button_style text not null default 'primary' check (button_style in ('primary', 'secondary', 'success')),
  display_order integer not null default 0,
  is_active boolean not null default true,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists clb5h_bqt_admins_display_idx
  on public.clb5h_bqt_admins (is_active, display_order, updated_at desc);

alter table public.clb5h_bqt_admins enable row level security;

drop policy if exists "Anyone can read CLB 5H administrators" on public.clb5h_bqt_admins;
create policy "Anyone can read CLB 5H administrators"
  on public.clb5h_bqt_admins
  for select
  to anon, authenticated
  using (true);

insert into public.clb5h_bqt_admins
  (id, role_title, member_name, description, contact_url, contact_label, button_style, display_order)
values
  ('founder-tech', '👑 Admin Sáng Lập & Kỹ Thuật Phòng Học', 'Anh Trần Như Hiệp (CLB Đọc Sách)', 'Định hướng & Quản lý phòng học.', 'https://zalo.me/0816333393', '💬 Zalo: 0816333393', 'primary', 1),
  ('attendance', '📋 Quản Lý Điểm Danh', 'Bạn Lê Yến Nhi', 'Hỗ trợ thành viên & điểm danh.', '', 'Cập nhật Zalo sau', 'secondary', 2),
  ('attendance-finance', '📋 Quản Lý Điểm Danh & Tài Chính', 'Bạn Bùi Hải Yến', 'Phụ trách quỹ, hỗ trợ thành viên & điểm danh.', 'https://zalo.me/0983346399', '💬 Zalo: 0983346399 ☘️', 'success', 3)
on conflict (id) do nothing;
