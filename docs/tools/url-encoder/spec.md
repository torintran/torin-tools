# URL encoder

ID `url-encoder`. Công cụ mã hóa và giải mã chuỗi URL theo phần trăm trên máy. Tài liệu này mô tả phạm vi của bản đang phát triển.

- Ba phạm vi: **URL component** (`encodeURIComponent` / `decodeURIComponent`), **Full URI** (`encodeURI` / `decodeURI`), và **Form** (`application/x-www-form-urlencoded`: khoảng trắng thành `+` khi mã hóa, `+` thành khoảng trắng khi giải mã). [RFC 3986 §2.1](https://www.rfc-editor.org/rfc/rfc3986.html#section-2.1) · [ECMA-262 encodeURIComponent](https://tc39.es/ecma262/multipage/global-object.html#sec-encodeuricomponent-uricomponent) · [HTML form-urlencoded](https://url.spec.whatwg.org/#application-x-www-form-urlencoded).
- Mã hóa dùng UTF-8 qua API nền tảng. Giải mã báo lỗi khi chuỗi phần trăm hoặc cặp surrogate UTF-16 không hợp lệ (`URIError`).
- Chế độ Form là quy ước form HTML, không thay thế đầy đủ parser query. Không gửi chuỗi người dùng ra mạng và không mở URL đã nhập.
- Khi lịch sử được bật, chỉ ghi action `encode` hoặc `decode`.

[Điểm vào](../../../src/tools/url-encoder/tool.ts) · [Logic](../../../src/tools/url-encoder/codec.ts) · [Kiểm thử](../../../tests/local.test.ts) · [Bản lưu nguồn đầu tiên](archive/2026-11-23-initial.md).
