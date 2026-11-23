# Lộ trình công cụ Torin Tools

Cập nhật 23/11/2026. Đây là backlog nội bộ của Torin: công cụ đã có và ứng viên sẽ xét theo nhu cầu. Danh sách không phải KPI bắt buộc và có thể rút/đổi thứ tự bất kỳ lúc nào.

## Đã có

| Công cụ | Module | Ghi chú ngắn |
| --- | --- | --- |
| Base64 (văn bản + file) | [base64](../src/tools/base64/) | Chuẩn / URL-safe, charset, MIME wrap |
| URL encoder | [url-encoder](../src/tools/url-encoder/) | Component, full URI, form-urlencoded |
| Date-time converter | [date-time-converter](../src/tools/date-time-converter/) | ISO / RFC / Unix / Mongo / Excel |
| JSON formatter | [json-formatter](../src/tools/json-formatter/) | Format/minify; tùy chọn JSONC (comment + trailing comma) |
| JWT | [jwt](../src/tools/jwt/) | Đọc, ký và xác minh chữ ký |
| UUIDs generator | [uuid](../src/tools/uuid/) | RFC 9562: NIL, Max, v1, v3–v7 |
| Postman Backup | [postman](../src/tools/postman/) | Tiện ích riêng Torin |

[Hồ sơ công cụ](tools/README.md) · [Quyền riêng tư](privacy.md) · [Quy chuẩn phát triển](tool-development.md).

## Tiêu chí khi thêm tool

- Đặc tả và archive nguồn theo [tool-development.md](tool-development.md).
- Xử lý tại client mặc định; lịch sử opt-in chỉ ghi mã thao tác và thời điểm.
- Có ca hợp lệ, ca lỗi/biên và kiểm tra UI web; desktop khi liên quan file/clipboard/quyền.
- Thư viện, font, từ điển và dataset bên thứ ba phải kiểm tra giấy phép trước khi đưa vào repo.

## Ưu tiên gần

Ứng viên đợt gần: hash/HMAC, ULID, integer/roman/case/text↔binary/unicode, HTML entities, URL parser, Basic Auth, slugify, JSON diff, JSON tree viewer, text statistics/diff, ETA/percentage, temperature, random port, crontab, chmod, regex tester.

## Ưu tiên sau

Định dạng YAML/TOML/XML/SQL/Markdown, mạng (IPv4/IPv6/MAC), QR, MIME/HTTP status, màu, emoji, lorem, và các tool cần cô lập hoặc quyền (OTP, RSA, bcrypt, BIP39, PDF signature, camera, HTML preview, math evaluator).

Postman Backup không thay cho các mục backlog còn lại. Favorites, phím tắt và i18n mở rộng theo dõi riêng ở cấp ứng dụng.
