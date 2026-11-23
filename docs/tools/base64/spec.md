# Base64

ID `base64`. Chuyển đổi văn bản hoặc tệp giữa dữ liệu gốc và Base64. Bảng chữ cái chuẩn dùng padding khi cần. Chế độ URL-safe dùng `-` và `_`, với đầu ra bỏ padding theo quy ước của Torin. [RFC 4648 §3–5](https://www.rfc-editor.org/rfc/rfc4648.html#section-3).

- Chế độ **Text** chuyển chữ thành byte theo bộ ký tự được chọn, mặc định UTF-8. Khi giải mã có tùy chọn tự nhận diện theo quy tắc trong mã. Live mode chỉ áp dụng cho văn bản.
- Chế độ **File** nhận tệp tối đa 100 MiB, xử lý trong Web Worker. Chuyển đổi một khối giữ nguyên byte của tệp gốc qua chu trình encode/decode. Tùy chọn xử lý từng dòng có thể giữ hoặc chuẩn hóa dấu xuống dòng.
- MIME wrap chia đầu ra thành dòng 76 ký tự, mặc định CRLF. Tùy chọn LF là lựa chọn đầu ra của Torin. Chế độ tự nhận bảng chữ cái, chấp nhận khoảng trắng và padding thiếu khi hợp lệ, cùng việc trích phần dữ liệu từ `data:…;base64,…` là hành vi tương thích của trình giải mã. [RFC 2045 §6.8](https://www.rfc-editor.org/rfc/rfc2045.html#section-6.8) · [RFC 2397 §2–3](https://www.rfc-editor.org/rfc/rfc2397.html#section-2).
- Dữ liệu và kết quả xử lý cục bộ trong bộ nhớ. Copy và tải tệp chạy khi người dùng chọn. Base64 là mã hóa biểu diễn có thể đảo ngược.

[Điểm vào](../../../src/tools/base64/tool.ts) · [Chuyển đổi](../../../src/tools/base64/convert.ts) · [Bản lưu nguồn](archive/2026-11-23-baseline.md).
