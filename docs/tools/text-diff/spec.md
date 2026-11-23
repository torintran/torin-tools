# Text diff

ID `text-diff`. So sánh hai văn bản theo dòng. Dán bản gốc và bản đã sửa, rồi chọn **So sánh**. Kết quả mặc định đặt hai bản song song với số dòng riêng. **Gộp dòng** hiển thị phần xóa và thêm theo thứ tự trong một cột, phù hợp khi màn hình hẹp.

Dòng thêm có dấu +, dòng xóa có dấu −, dòng giữ nguyên hiển thị cùng ngữ cảnh. Phần tổng kết đếm số dòng thêm và xóa. Một cụm dòng thay đổi được căn theo thứ tự trong cụm, với ô trống khi hai bên lệch số dòng. Giữ khoảng trắng và đánh dấu dòng thay đổi thiếu xuống dòng cuối. CRLF được quy về LF để so sánh.

Giới hạn mỗi đầu vào 32.000 ký tự và 2.000 dòng. Thuật toán dừng ở giới hạn 2.000 bước chỉnh sửa hoặc thời hạn tính 250 ms. Văn bản xử lý trong phiên hiện tại tại thiết bị.

[Hồ sơ nguồn ban đầu](archive/2026-11-23-initial.md) · [Bản ghi bố cục kết quả](archive/2026-11-23-result-layouts.md) · [Giao diện](../../../src/tools/text-diff/view.tsx).
