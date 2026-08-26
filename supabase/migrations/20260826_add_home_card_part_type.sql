alter table public.clb5h_content_items
drop constraint if exists clb5h_content_items_item_type_check;

alter table public.clb5h_content_items
add constraint clb5h_content_items_item_type_check
check (item_type in ('text', 'faq', 'list', 'notice', 'home_card', 'home_card_part'));

-- Mục con dùng metadata.parentCardId để liên kết với khung cha.
-- Không thay đổi hoặc xóa bất kỳ bản ghi text/faq/home_card hiện có.
