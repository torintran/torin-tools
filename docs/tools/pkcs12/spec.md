# P12 sang PEM

ID `pkcs12`. Nhận một tệp PKCS #12 phiên bản 3 (`.p12` hoặc `.pfx`) qua kéo thả hoặc nút chọn tệp. Tệp tối đa 4 MiB. Nhập mật khẩu xuất của tệp, tối đa 1.024 ký tự. Để trống thì công cụ thử cách biểu diễn mật khẩu rỗng. `friendlyName` là nhãn tùy chọn trong tệp, không phải thông tin đăng nhập. [RFC 7292 §4 và Phụ lục B](https://www.rfc-editor.org/rfc/rfc7292.html#section-4).

## Kết quả

- Mỗi chứng chỉ X.509 được xuất thành `CERTIFICATE` PEM. Khi có nhiều chứng chỉ, có thêm bộ PEM theo thứ tự trong tệp. Bộ này giữ tất cả chứng chỉ có trong container, kể cả chứng chỉ chưa được xếp thành chuỗi tin cậy.
- Mỗi khóa riêng được xuất thành PKCS #8 `PRIVATE KEY` PEM không mã hóa. Preview, sao chép và tải xuống chỉ xuất hiện sau khi bấm hiện khóa. `friendlyName` được hiển thị nếu có.
- Kết quả PEM tối đa 64 KiB có preview chỉ đọc và nút sao chép. Mọi kết quả đều có nút tải. Đầu ra PEM gồm Base64 của từng mục DER cùng dòng đánh dấu, khác với Base64 của toàn bộ tệp P12.

## Tương thích và xử lý dữ liệu

- Dùng Forge 1.4.4 để xác minh MAC và mở SafeBag. Đã đối chiếu bản xuất PBES2 AES/MAC SHA-256 và bản xuất cũ dùng PBE 3DES hoặc RC2-40/MAC SHA-1. Các thuật toán cũ chỉ dùng để đọc dữ liệu. Chứng chỉ RSA và EC đã được đối chiếu độc lập. Tệp thiếu MAC, MAC PBMAC1, chế độ bảo vệ bằng khóa công khai hoặc hai mật khẩu riêng nằm ngoài phạm vi.
- Web Worker xử lý tệp và mật khẩu trong bộ nhớ thiết bị. Có thể hủy thao tác hoặc chờ giới hạn 15 giây. Không gửi dữ liệu qua mạng. Công cụ không ghi tệp, mật khẩu hay kết quả vào bộ nhớ lưu trữ của app. Dữ liệu trên clipboard và tệp đã tải do hệ điều hành quản lý.
- Lỗi phân biệt mật khẩu/MAC, định dạng, giới hạn và thời gian xử lý. Công cụ kiểm tra tính toàn vẹn của container. Việc xác minh thời hạn và độ tin cậy của chứng chỉ thuộc hệ thống đích.

[Trình trích xuất](../../../src/tools/pkcs12/extract.ts) · [Giao diện](../../../src/tools/pkcs12/view.tsx) · [Hồ sơ nguồn](archive/2026-11-27-initial.md) · [RFC 7468 §5 và §10](https://www.rfc-editor.org/rfc/rfc7468.html).
