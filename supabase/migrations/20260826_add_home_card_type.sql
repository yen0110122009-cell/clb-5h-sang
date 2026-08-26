alter table public.clb5h_content_items
drop constraint if exists clb5h_content_items_item_type_check;

alter table public.clb5h_content_items
add constraint clb5h_content_items_item_type_check
check (item_type in ('text', 'faq', 'list', 'notice', 'home_card'));

create index if not exists clb5h_content_items_home_cards_idx
on public.clb5h_content_items (section_id, item_type, is_active, display_order);

-- Khung Trang Chủ dùng item_type = 'home_card' và lưu màu sắc trong metadata:
-- {"icon":"💡","backgroundColor":"#FFF8E1","borderColor":"#F59E0B","textColor":"#212529"}

update public.clb5h_content_items
set updated_at = now()
where item_type = 'home_card';

-- Migration này không mở quyền ghi ẩn danh; thao tác ghi vẫn đi qua Edge Function kiểm tra mã quản lý.
