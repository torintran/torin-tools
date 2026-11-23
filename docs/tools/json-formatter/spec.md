# JSON formatter

ID `json-formatter`. Công cụ định dạng hoặc rút gọn JSON trên máy. Tài liệu này mô tả phạm vi của bản đang phát triển.

- Hai chế độ: **Format** (`JSON.stringify` với thụt lề 2 / 4 khoảng trắng hoặc tab) và **Minify** (`JSON.stringify` không khoảng trắng). Parse bằng `JSON.parse`. [ECMA-262 `JSON.parse`](https://tc39.es/ecma262/multipage/structured-data.html#sec-json.parse) · [`JSON.stringify`](https://tc39.es/ecma262/multipage/structured-data.html#sec-json.stringify).
- Tùy chọn **JSONC** (tắt mặc định): trước khi parse, bỏ comment `//` và `/* */` ngoài chuỗi, rồi bỏ trailing comma trước `}` hoặc `]`. Đầu ra luôn là JSON nghiêm. Không phải JSON5 (không hỗ trợ bare key, single quote, hex, `Infinity`).
- Số tuân theo kiểu Number của ECMAScript; giá trị ngoài khoảng số nguyên an toàn có thể mất độ chính xác khi round-trip. Chuỗi rỗng hoặc JSON không hợp lệ (kể cả JSONC sau khi strip) báo lỗi.
- Không gửi nội dung người dùng ra mạng. Khi lịch sử được bật, chỉ ghi action `format` hoặc `minify`.

[Điểm vào](../../../src/tools/json-formatter/tool.ts) · [Logic](../../../src/tools/json-formatter/format.ts) · [Kiểm thử](../../../tests/local.test.ts) · [Bản lưu nguồn đầu tiên](archive/2026-11-23-initial.md) · [JSONC](archive/2026-11-23-jsonc.md).
