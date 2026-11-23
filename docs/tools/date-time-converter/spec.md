# Date-time converter

ID `date-time-converter`. Công cụ chuyển đổi giá trị thời điểm cục bộ giữa nhiều biểu diễn phổ biến. Tài liệu này mô tả phạm vi của bản đang phát triển.

- Giao diện: một ô nhập + chọn định dạng đầu vào; kết quả live theo từng dòng kèm nút copy. Mở tool với timestamp mili giây hiện tại.
- Định dạng hỗ trợ: JS locale, ISO 8601 (offset máy), ISO 9075 (local `YYYY-MM-DD HH:mm:ss`), RFC 3339 (cùng profile offset), RFC 7231 / UTC (`Date#toUTCString`), Unix giây, Unix mili giây, Mongo ObjectId (4 byte thời gian + 16 byte 0 khi tạo), Excel serial (epoch 1899-12-30). [RFC 3339 §5.6](https://www.rfc-editor.org/rfc/rfc3339.html#section-5.6) · [RFC 7231 §7.1.1.1](https://www.rfc-editor.org/rfc/rfc7231.html#section-7.1.1.1) · [ECMA-262 Date](https://tc39.es/ecma262/multipage/numbers-and-dates.html#sec-date-objects).
- ISO 8601 / RFC 3339 trên UI dùng offset local của thiết bị để khớp luồng thao tác tiện ích. Unix / RFC 7231 / UTC là tuyệt đối theo UTC. Mongo ObjectId tạo ra chỉ mang timestamp; phần còn lại cố định `0` và không phải ObjectId ngẫu nhiên đầy đủ.
- Không gửi giá trị người dùng ra mạng.

[Điểm vào](../../../src/tools/date-time-converter/tool.ts) · [Logic](../../../src/tools/date-time-converter/convert.ts) · [Kiểm thử](../../../tests/local.test.ts) · [Bản lưu nguồn đầu tiên](archive/2026-11-23-initial.md).
