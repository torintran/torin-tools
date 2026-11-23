# CSR Generator

ID `csr`. Tạo yêu cầu ký chứng chỉ PKCS #10 và khóa riêng RSA trong trình duyệt hoặc WebView. [RFC 2986 §4](https://www.rfc-editor.org/rfc/rfc2986.html#section-4).

## Nhập thông tin

| Trường | Giá trị hỗ trợ |
| --- | --- |
| Common Name (CN) | Tên DNS bắt buộc, tối đa 64 ký tự. Ví dụ `tools.example.com` |
| Organization, Organizational Unit, Locality, State | Tùy chọn, tối đa 64 ký tự mỗi trường |
| Country code | Tùy chọn, nhận hai chữ cái ASCII và chuyển thành chữ hoa |
| Additional DNS names (SAN) | Tùy chọn, tối đa 100 tên bổ sung và 4.096 ký tự đầu vào. Phân cách bằng dấu phẩy hoặc khoảng trắng. Tool thêm CN vào SAN và loại tên trùng |
| **RSA key size / Độ dài khóa RSA** | Chọn **2048**, **3072** hoặc **4096 bit** ngay dưới SAN. Mặc định **2048 bit** khi mở tool hoặc bấm **Clear** |

Tên DNS dùng ASCII hoặc Punycode và cho phép wildcard ở nhãn đầu, ví dụ `*.example.com`. SAN kiểu IP nằm ngoài phạm vi. Lỗi tên DNS hoặc mã quốc gia được báo trước khi tạo khóa. [RFC 5280 §4.2.1.6](https://www.rfc-editor.org/rfc/rfc5280.html#section-4.2.1.6).

## Key size và file đầu ra

RSA có thể dùng nhiều độ dài mô-đun tùy triển khai. Torin giới hạn bộ tạo CSR ở ba cỡ trên. Các cỡ cũ như 512 và 1024 bit nằm dưới mức tối thiểu Torin chọn cho khóa mới. Các cỡ lớn như 8192 và 15360 bit nằm ngoài phạm vi của công cụ vì tốn thêm tài nguyên và khả năng chấp nhận còn tùy CA hoặc hệ thống đích.

NIST ước tính RSA 2048 bit tương đương 112 bit an toàn và RSA 3072 bit tương đương 128 bit. Chọn kích thước phù hợp với yêu cầu của CA. Cả ba cỡ đều dùng Web Crypto để tạo khóa mới và ký CSR bằng RSASSA-PKCS1-v1_5 với SHA-256. [NIST SP 800-57 Part 1 Rev. 5, Bảng 2](https://csrc.nist.gov/pubs/sp/800/57/pt1/r5/final).

| File | Dùng để làm gì |
| --- | --- |
| `request.csr` | Yêu cầu PKCS #10 dạng PEM chứa subject, khóa công khai, SAN và chữ ký. Gửi file này cho CA xin cấp chứng chỉ. |
| `private-key.pem` | Khóa riêng PKCS #8 dạng PEM không mã hóa. Giữ file bí mật để dùng cùng chứng chỉ CA cấp. |

Dữ liệu được xử lý trong bộ nhớ trên thiết bị. Web cần HTTPS hoặc localhost để tạo khóa. Bấm Clear, đổi đầu vào hoặc rời tool sẽ xóa kết quả khỏi giao diện. File đã tải xuống do hệ điều hành quản lý. [RFC 7468 §7](https://www.rfc-editor.org/rfc/rfc7468.html#section-7) · [§10](https://www.rfc-editor.org/rfc/rfc7468.html#section-10).

## Kiểm tra trước khi gửi CA

```sh
openssl req -in request.csr -noout -verify -text
```

Kiểm tra chữ ký CSR, dòng `Public-Key` đúng kích thước đã chọn và danh sách DNS SAN. Với K3s, tạo TLS Secret bằng chứng chỉ CA đã cấp và khóa riêng tương ứng.

[Giao diện và giá trị mặc định](../../../src/tools/csr/view.tsx) · [Logic tạo khóa](../../../src/tools/csr/generate.ts) · [Bản lưu ban đầu](archive/2026-11-23-initial.md) · [Bổ sung RSA 3072](archive/2026-11-23-rsa-3072.md).
