# Quy chuẩn phát triển Cheat Sheets

Áp dụng khi thêm trang hoặc sửa câu lệnh, cờ, ví dụ hay điều kiện sử dụng. Cheat Sheets là tài liệu tra cứu tích hợp, đọc được offline sau khi app đã tải tài nguyên.

## Cấu trúc

- `src/cheat-sheets/<id>.ts` chứa nhóm lệnh, mô tả Anh/Việt, ví dụ và URL của từng lệnh. Dùng ID chữ thường với dấu gạch nối. Đăng ký trang trong `src/cheat-sheets/index.ts` để điều hướng và tìm nhanh dùng cùng dữ liệu.
- `docs/cheat-sheets/<id>/spec.md` ghi phạm vi, CLI, nhóm nội dung, điều kiện sử dụng và vị trí mã.
- `docs/cheat-sheets/<id>/archive/YYYY-MM-DD-<change>.md` lưu nguồn tại thời điểm thêm hoặc sửa nội dung. Ghi tên tài liệu, nhà xuất bản, mục hoặc trang lệnh, URL, ngày đối chiếu và phiên bản nếu nguồn công bố. Liên kết bản ghi mới từ đặc tả và giữ các bản ghi cũ.
- Ghi nhật ký xác minh trong bản ghi hoặc phần mô tả thay đổi, gồm kết quả thực tế và phần chưa kiểm tra. Xem [danh mục hiện hành](cheat-sheets/README.md).

## Viết và đối chiếu

1. Nhóm lệnh theo công việc. Mỗi mục có một câu giải thích khi nào dùng, một ví dụ có thể sao chép và một link trực tiếp đến tài liệu chính thức. Tự viết mô tả và ví dụ.
2. Kiểm tra cú pháp, cờ, mặc định và phiên bản hỗ trợ bằng tài liệu của dự án hoặc nhà cung cấp. Ghi điều kiện cần như Dockerfile, context, namespace hoặc quyền registry ngay cạnh lệnh nếu ảnh hưởng kết quả.
3. Dùng tên minh họa nhất quán. Chọn ví dụ an toàn để thử, ưu tiên lệnh quan sát hoặc dry run trước khi áp dụng thay đổi. Với lệnh thay đổi trạng thái, nói rõ đối tượng bị tác động. Dùng dữ liệu giả lập cho tất cả ví dụ.
4. Dùng Mantine, Lucide, mô tả Anh/Việt và nút sao chép hiện có. Chỉ sao chép khi người dùng bấm. Trang cung cấp văn bản và liên kết tham khảo, còn người dùng chạy lệnh trong terminal của họ.
5. Kiểm tra từ danh mục và tìm nhanh, URL mở trực tiếp, sao chép nguyên văn, nguồn và giao diện desktop/mobile. Kiểm tra offline khi thay đổi cách đóng gói. Khi thực thi ví dụ để đối chiếu, dùng môi trường thử nghiệm và ghi kết quả vào bằng chứng.
