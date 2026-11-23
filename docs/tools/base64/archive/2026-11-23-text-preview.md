# Xem trước kết quả tệp Base64

Ngày đối chiếu 2026-11-23. Quy tắc xem trước do Torin quy định và dùng kết quả Blob sau chuyển đổi.

- Web Worker chỉ giải mã để xem trước khi kết quả dài từ 1 đến 65.536 byte. `TextDecoder` dùng UTF-8 ở chế độ báo lỗi và giữ BOM trong giá trị sao chép. UTF-8 sai hoặc chuỗi chứa ký tự điều khiển C0/C1 hay DEL, ngoại trừ tab, CR và LF, được cung cấp qua tải tệp. [WHATWG Encoding Standard §7.2](https://encoding.spec.whatwg.org/#interface-textdecoder).
- Trình duyệt hiển thị chuỗi bằng textarea chỉ đọc. Nút sao chép gọi Clipboard API khi người dùng bấm. Link tải xuống trỏ đến Blob gốc. [W3C Clipboard API §7.3.4](https://www.w3.org/TR/clipboard-apis/#dom-clipboard-writetext).
- Bằng chứng kiểm tra nằm trong bài Base64 offline của `tests/browser/app.spec.ts`, gồm kết quả Base64, UTF-8 và byte nhị phân.
