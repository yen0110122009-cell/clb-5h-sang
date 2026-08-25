update public.clb5h_events
set
  description = $$🎯 Nhiệm vụ hàng ngày: Cùng nhắc nhở nhau dậy sớm và vào học đúng giờ, theo dõi việc học của nhau và động viên khi đối phương nản.

🤝 Cơ chế: Thưởng cùng thưởng - Phạt cùng phạt.

📝 Cú pháp điểm danh mới: STT - [Tên đội].

📊 Cách tính điểm đội: (Điểm cá nhân A + Điểm cá nhân B) / 2.
• Cả hai cùng đi học: Điểm đội + 5 điểm thưởng.
• Một người đi học, một người vắng không phép: Điểm đội - 10 điểm phạt.
• Cả hai cùng vắng không phép: Điểm đội - 20 điểm phạt.
• Có người nghỉ có phép: tính theo quy định của Ban Quản trị.

🏆 Giải thưởng: “Cặp đôi có điểm cao nhất” và “Cặp đôi đột phá”.

❓ Hỗ trợ: Có thắc mắc xin liên hệ trực tiếp cho Lê Yến Nhi để được giải đáp.$$,
  updated_at = now()
where id = 'ban-dong-hanh';
