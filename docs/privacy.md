# Quyền riêng tư và luồng dữ liệu

| Dữ liệu | Xử lý | Lưu trữ |
| --- | --- | --- |
| Base64, tệp, JWT, khóa và kết quả | Xử lý cục bộ trong bộ nhớ của trình duyệt hoặc WebView. File Base64 chạy trong Web Worker. Ký và xác minh JWT dùng Web Crypto với khóa người dùng nhập. | Torin không lưu dữ liệu này. Copy ghi vào clipboard hệ điều hành và Download tạo file khi người dùng chọn. |
| Lịch sử | Người dùng bật **Save activity on this device** trong History. | Browser hoặc WebView giữ tối đa 50 mục gồm ID công cụ, action ID cố định và thời điểm. Mặc định tắt. **Clear history** xóa các mục. Tắt lịch sử xóa cả các mục lẫn tùy chọn. |
| Ngôn ngữ giao diện | Người dùng chọn EN hoặc VI trên sidebar. Lần đầu theo `navigator.language` mà không ghi storage. | Chỉ khi người dùng đổi ngôn ngữ, Torin ghi `torin.locale.v1` vào localStorage. |
| API key và workspace Postman | Direct gửi thẳng tới Postman qua HTTPS. Relay tự host đọc key và workspace trong RAM để chuyển tiếp khi người dùng chọn gateway. | Torin không lưu các trường này vào lịch sử, cơ sở dữ liệu, cookie hay cache. Gateway không ghi request, response hoặc header vào log. |
| JSON và ZIP backup | Dữ liệu trả về từ Postman đi qua kết nối đã chọn. Client tạo ZIP trong Worker. | ZIP chỉ thành file khi người dùng chọn Download hoặc Save. ZIP chưa mã hóa và có thể chứa thông tin bí mật. |
| Kiểm tra phiên bản | Một GET công khai tới `version.json`. Client so sánh phiên bản tại chỗ. | Không có lịch sử kiểm tra phiên bản trên Torin. |
| Tài nguyên app | Máy chủ phục vụ file tĩnh. | Service worker chỉ cache danh sách tài nguyên đã biết tại build. Tệp backup, yêu cầu gateway và manifest cập nhật nằm ngoài danh sách đó. |

Base64 là biểu diễn có thể đảo ngược. Giải mã JWT chỉ đọc header và payload. Nút Verify kiểm tra chữ ký bằng khóa đã nhập. Ứng dụng sử dụng token vẫn cần tự kiểm tra các claim. HTTPS bảo vệ dữ liệu khi truyền đến Postman hoặc gateway. Torin không mã hóa một ZIP mà người dùng đã tải xuống.

Torin không có tài khoản, analytics, database hay upload file. Khi gateway được bật, máy chủ vẫn phải nhìn thấy thông tin cần thiết để gửi request tới Postman. Khi bật gateway sau reverse proxy, tắt access log và caching cho `/api/postman/*` ở từng lớp.
Host hoặc CDN có thể thấy IP và các thông tin HTTP cơ bản nếu hạ tầng ghi nhận chúng. Để giữ cam kết triển khai, cấu hình HTTPS, tắt log thông tin request ở lớp host và dùng origin dành riêng cho Torin.

Server đi kèm gửi `Referrer-Policy: no-referrer`, `X-Content-Type-Options: nosniff` và Content Security Policy giới hạn script, stylesheet, worker, fetch và form. Nếu chỉ chép các file web lên nền tảng khác, thêm các header tương đương. Ví dụ CSP cho host tĩnh:

```text
Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self'; worker-src 'self'; connect-src 'self' https://api.postman.com; object-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'none'
Referrer-Policy: no-referrer
X-Content-Type-Options: nosniff
```

Torin quản lý cách app giữ dữ liệu. Clipboard, trình duyệt, hệ điều hành, Postman và hạ tầng triển khai có chính sách riêng.

[Tài liệu CORS của trình duyệt](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CORS) · [localStorage](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage) · [CSP connect-src](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy/connect-src).
