# Kết quả xác minh Torin Tools

## Bản web Docker với Base64 và JWT mở rộng

Ngày 23/11/2026, container localhost cổng 4289 đạt trạng thái `healthy`. Build Docker đạt 17 bài kiểm thử logic/server. Cả 18 bài Playwright chạy trực tiếp trên container đều qua, gồm chuyển đổi file Base64 khi offline, khôi phục byte gốc, ký và kiểm tra chữ ký JWT offline, từ chối chữ ký sai và checksum Downloads. `npm audit` không báo lỗ hổng đã biết tại thời điểm kiểm tra. Các bài mở rộng được xác minh trên web Docker. Gói Windows hiện có giữ nguyên.

## 0.2.1

Ngày 23/11/2026, build Web và Windows x64 thành công. 12 bài logic/server và 14 bài Chromium đạt, trong đó có Base64URL, diễn giải field JWT, PWA offline và SHA-256 của các gói Downloads. Windows portable đã chạy với WebView2 trên máy hiện tại. Installer NSIS đã build. Các gói và checksum cục bộ nằm trong `artifacts/v0.2.1/`.

## 0.2.0

Kiểm tra ngày 23/11/2026 trên Windows x64. Backup và phiên bản cao hơn dùng dữ liệu giả lập.

| Phạm vi | Kết quả |
| --- | --- |
| TypeScript và Vite | Typecheck và build production thành công. JavaScript chính khoảng 74,23 kB gzip. View của từng công cụ nằm ở chunk riêng. |
| Kiểm thử logic và server | 10 bài qua. Kiểm tra danh sách route relay, HTTP no-store, header và cookie, lịch sử opt-in, số mục tối đa, UTF-8, JWT, phân trang, retry và ZIP. |
| Chromium | 14 bài qua ở desktop và viewport Pixel 7 sau khi stage gói Windows. Kiểm tra tìm kiếm, mở tool và reload offline, xóa lịch sử, nội dung lưu cục bộ, backup direct, lựa chọn gateway, yêu cầu cập nhật và checksum Downloads. |
| Windows portable | Build và chạy từ ZIP bằng WebView2 trên máy hiện tại. Smoke test qua Base64, native IPC route guard và trạng thái kiểm tra phiên bản khi chưa cấu hình URL. Vẫn bỏ qua hộp thoại lưu ZIP theo yêu cầu. |
| Windows NSIS | Đã build. Installer chưa ký và chưa chạy thử cài đặt. |
| Postman thật | Bản trước đã đọc được 401/403 khi thử CORS với key giả. Chưa thử backup tài khoản thật hoặc luồng relay với key thật. |
| Cập nhật Windows từ xa | Bản local chưa có TORIN_UPDATE_URL. Luồng đọc một manifest mới đã kiểm tra trên web với response giả lập. |
| npm | npm audit trả về 0 lỗ hổng đã biết tại thời điểm chạy. |
| Phạm vi khác | macOS và Linux dời sang đợt sau. Chưa cài PWA trên điện thoại thật hoặc chạy portable trên Windows sạch thiếu WebView2. |

## File bàn giao

artifacts/v0.2.0/ gồm web ZIP, Windows portable ZIP, Windows installer và SHA256SUMS.txt. Web ZIP chứa website tĩnh. Bản local trong dist/ đã nạp file desktop vào Downloads.

Chạy lại bằng npm test, npm run build và npm run test:browser. Đặt TORIN_CHECK_DOWNLOADS=1 sau khi đưa file thực vào dist/downloads/ để kiểm tra checksum qua HTTP. Script node scripts/smoke-windows.mjs <exe> kiểm tra Windows bằng profile WebView2 tạm.
