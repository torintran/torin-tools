# JWT Decoder

ID `jwt`. Đọc, ký và xác minh chữ ký JWT dạng JWS compact ba đoạn Base64URL. Giao diện tách trạng thái đọc dữ liệu, kết quả chữ ký và việc xác thực claim mà ứng dụng tiêu thụ token phải thực hiện. [RFC 7515 §3.1](https://www.rfc-editor.org/rfc/rfc7515.html#section-3.1) · [RFC 7519 §4](https://www.rfc-editor.org/rfc/rfc7519.html#section-4).

- Header và payload phải là JSON object. JWE, token không ký và các protected header mở rộng như `crit` hoặc `b64: false` nằm ngoài phạm vi ký và xác minh.
- Cho phép HS256/384/512, RS256/384/512, PS256/384/512 và ES256/384/512. Thuật toán đã chọn phải khớp header. HMAC dùng secret UTF-8 hoặc Base64URL. RSA/ECDSA nhận PKCS #8 PEM khi ký, SPKI PEM khi xác minh, hoặc JWK cùng loại khóa tương ứng. [RFC 7518 §3](https://www.rfc-editor.org/rfc/rfc7518.html#section-3).
- Khi ký HMAC, độ dài secret tối thiểu bằng độ dài đầu ra hàm băm. Chế độ xác minh tương thích hiện có thể xác minh một chữ ký dùng secret ngắn hơn và hiển thị cảnh báo. Ứng dụng tích hợp JWT cần chính sách khóa và xác thực claim riêng. [RFC 7518 §3.2](https://www.rfc-editor.org/rfc/rfc7518.html#section-3.2) · [RFC 8725 §3](https://www.rfc-editor.org/rfc/rfc8725.html#section-3).
- Token, khóa và kết quả ở bộ nhớ client. Ký và xác minh dùng `jose` với Web Crypto. Các trường thời gian được diễn giải để hiển thị, gồm `exp`, `nbf` và `iat`.

[Điểm vào](../../../src/tools/jwt/tool.ts) · [Đọc token](../../../src/tools/jwt/codec.ts) · [Ký và xác minh](../../../src/tools/jwt/signature.ts) · [Bản lưu nguồn](archive/2026-11-23-baseline.md).
