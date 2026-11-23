# UUIDs generator

ID `uuid`. Công cụ tạo UUID cục bộ theo các dạng đã chọn trong RFC 9562. Tài liệu này mô tả phạm vi của bản đang phát triển. [RFC 9562](https://www.rfc-editor.org/rfc/rfc9562.html).

- Giao diện hỗ trợ Nil, Max, v1, v3, v4, v5, v6 và v7. v2 và v8 nằm ngoài phạm vi. Nil và Max là giá trị đặc biệt, giống nhau ở mọi lần tạo. [RFC 9562 §5](https://www.rfc-editor.org/rfc/rfc9562.html#section-5).
- Mỗi lượt tạo tối đa 100 giá trị theo giới hạn của Torin. Với v3 và v5, người dùng nhập tên và chọn namespace có sẵn hoặc nhập một UUID namespace. Tên được chuyển thành UTF-8. Cùng namespace và tên sẽ cho cùng kết quả. [RFC 9562 §5.3, §5.5 và §6.5](https://www.rfc-editor.org/rfc/rfc9562.html#section-5.3).
- v1 và v6 dùng node ngẫu nhiên. v7 dùng thời gian Unix tính bằng mili giây và bộ đếm trong một lô. Trình tạo hiện tại không cung cấp cam kết tăng dần giữa các lượt gọi hoặc thiết bị. [RFC 9562 §5.7, §6.2 và §6.10](https://www.rfc-editor.org/rfc/rfc9562.html#section-5.7).
- MD5 và SHA-1 chỉ phục vụ khả năng tương thích của v3 và v5. UUID tạo ra là định danh. Tác vụ yêu cầu khóa, secret hoặc token bảo mật cần cơ chế phù hợp riêng. [RFC 9562 §8](https://www.rfc-editor.org/rfc/rfc9562.html#section-8).
- Tên, namespace và kết quả được xử lý cục bộ trong bộ nhớ. Khi lịch sử được bật, công cụ chỉ ghi action `generate`.

[Điểm vào](../../../src/tools/uuid/tool.ts) · [Logic](../../../src/tools/uuid/generate.ts) · [Kiểm thử](../../../tests/local.test.ts) · [Bản lưu nguồn đầu tiên](archive/2026-11-23-initial.md).
