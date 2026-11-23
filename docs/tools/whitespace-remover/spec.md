# Whitespace remover

ID `whitespace-remover`. Công cụ Torin xóa mọi ký tự khoảng trắng khỏi chuỗi trên máy.

- Đầu vào: văn bản Unicode. Đầu ra: cùng chuỗi sau khi bỏ toàn bộ ký tự khớp `\s` trong ECMAScript (WhiteSpace và LineTerminator), gồm space, tab, CR/LF, NBSP và các khoảng trắng liên quan. [ECMA-262 WhiteSpace](https://tc39.es/ecma262/multipage/ecmascript-language-lexical-grammar.html#sec-white-space) · [Line Terminators](https://tc39.es/ecma262/multipage/ecmascript-language-lexical-grammar.html#sec-line-terminators).
- Không thu gọn thành một khoảng trắng; mọi match bị xóa. Không gửi chuỗi người dùng ra mạng.
- Giao diện hỗ trợ chuyển đổi khi gõ và sao chép kết quả.

[Điểm vào](../../../src/tools/whitespace-remover/tool.ts) · [Logic](../../../src/tools/whitespace-remover/strip.ts) · [Kiểm thử](../../../tests/local.test.ts) · [Bản lưu nguồn đầu tiên](archive/2026-11-23-initial.md).
