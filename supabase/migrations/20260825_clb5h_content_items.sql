create table if not exists public.clb5h_content_items (
  id text primary key,
  section_id text not null,
  item_type text not null default 'text' check (item_type in ('text', 'faq', 'list', 'notice', 'home_card')),
  title text not null default '',
  body text not null default '',
  display_order integer not null default 0,
  is_active boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists clb5h_content_items_section_idx
  on public.clb5h_content_items (section_id, is_active, display_order, updated_at desc);

alter table public.clb5h_content_items enable row level security;

drop policy if exists "Anyone can read CLB 5H content" on public.clb5h_content_items;
create policy "Anyone can read CLB 5H content"
  on public.clb5h_content_items
  for select
  to anon, authenticated
  using (true);

insert into public.clb5h_content_items (id, section_id, item_type, title, body, display_order)
values
  ('faq-1', 'faq-bqt', 'faq', 'CLB có bắt buộc phải học đúng từ 5:00 sáng không?', 'Khung điểm danh kéo dài từ 3:00 đến 6:00 sáng. Bạn có thể vào học sớm hơn và nhận điểm thưởng tương ứng theo khung giờ.', 1),
  ('faq-2', 'faq-bqt', 'faq', 'Tiền đóng góp vắng không phép và phí duy trì dùng làm gì?', '100% tiền thu được dùng để duy trì phòng học trực tuyến không giới hạn, mua phần mềm quản lý và trích quỹ trao thưởng sự kiện cho các thành viên xuất sắc.', 2),
  ('faq-3', 'faq-bqt', 'faq', 'Tôi chưa có tài khoản ngân hàng hoặc gặp khó khăn tài chính thì sao?', 'Hãy chủ động nhắn tin riêng cho Admin. Ban Quản trị sẽ xem xét và hỗ trợ phương án phù hợp nhất, không để ai bị bỏ lại.', 3),
  ('faq-4', 'faq-bqt', 'faq', 'Nếu bận đột xuất ngay trong buổi sáng thì xử lý thế nào?', 'Hãy nhắn tin báo cho Quản lý ngay khi có thể. Sự chủ động trao đổi luôn được Ban Quản trị ghi nhận và hỗ trợ.', 4)
on conflict (id) do nothing;
