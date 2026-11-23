# Quy chuẩn phát triển công cụ Torin Tools

Áp dụng khi thêm công cụ hoặc thay đổi thuật toán, quy tắc đọc và ghi dữ liệu, hợp đồng API hay luồng dữ liệu. Với sửa giao diện thuần túy, áp dụng phần giao diện và ghi lại các kiểm tra liên quan trong mô tả thay đổi.

## 1. Chọn nguồn và phạm vi

| Loại chức năng | Nguồn chính | Điều phải ghi |
| --- | --- | --- |
| Tiêu chuẩn đã công bố | Tài liệu gốc của tổ chức ban hành, chẳng hạn RFC Editor, W3C, WHATWG hoặc NIST | Mã và phiên bản tài liệu, mục áp dụng, bản cập nhật hoặc errata đã kiểm tra, phần hỗ trợ và vector kiểm thử |
| Định dạng hoặc API của nhà cung cấp | Đặc tả, schema hay tài liệu chính thức của nhà cung cấp | Phiên bản API, trường dữ liệu, hành vi lỗi, quyền truy cập, giới hạn và chính sách tương thích |
| Tính năng custom của Torin | Đặc tả do Torin quản lý | Tên và phiên bản riêng, mục đích, input/output, giá trị mặc định, quy tắc lỗi, ví dụ và cách tương thích khi thay đổi |

Một tool có thể có nhiều phần thuộc các loại khác nhau. Ví dụ, Base64 dùng bảng chữ cái trong RFC 4648, còn cách tùy chọn xử lý từng dòng cần mô tả riêng. Luồng thao tác UI có thể tham khảo các tiện ích phổ biến, nhưng nguồn quy phạm cho thuật toán vẫn là đặc tả gốc. [RFC 4648 §4–5](https://www.rfc-editor.org/rfc/rfc4648.html#section-4).

## 2. Triển khai thuật toán và định dạng

- Thực hiện đúng các yêu cầu bắt buộc trong phạm vi đã công bố. Ghi lý do khi chọn một phương án trong các tùy chọn của chuẩn. Khi tool chỉ hỗ trợ một phần, liệt kê rõ các phiên bản, chế độ hoặc tham số có mặt và giới hạn tương ứng.
- Giữ đúng quy tắc về byte, bộ ký tự, thứ tự byte, padding, chuẩn hóa, giới hạn, mặc định và lỗi theo đặc tả. Khả năng đọc dữ liệu ngoài chuẩn cần có chế độ tương thích riêng, với nhãn và quy tắc rõ ràng. Nếu một hành vi làm đầu ra lệch chuẩn, ghi nó là phần mở rộng Torin.
- Với mật mã, dùng API nền tảng hoặc thư viện đã được rà soát. Giới hạn thuật toán và tham số được chấp nhận. Một thuật toán cũ mà chuẩn yêu cầu để tương thích chỉ được dùng trong đúng chức năng đó. Ghi lý do, giới hạn, vector và kết quả rà soát nếu cần giữ một triển khai tương thích tự viết. Dùng bộ sinh ngẫu nhiên an toàn khi chuẩn hoặc mục đích bảo mật yêu cầu.
- Tách các thao tác có ý nghĩa bảo mật khác nhau. Chẳng hạn giao diện JWT cần phân biệt đọc nội dung, kiểm tra chữ ký và kiểm tra claim ứng dụng. [RFC 7515](https://www.rfc-editor.org/rfc/rfc7515.html) · [RFC 7519](https://www.rfc-editor.org/rfc/rfc7519.html) · [RFC 8725 §3](https://www.rfc-editor.org/rfc/rfc8725.html#section-3).
- Với custom, định nghĩa hành vi trước khi viết code. Chọn tên người dùng có thể phân biệt với chuẩn đang tồn tại. Khi đầu ra được hệ thống khác tiêu thụ, dùng phiên bản riêng và mô tả cách đọc dữ liệu của phiên bản trước.

## 3. Cấu trúc thư mục

```text
src/tools/<id>/
  tool.ts                     # ToolDefinition và hàm tải view
  view.tsx                    # Điểm vào giao diện, export mặc định
  <logic>.ts                  # Parser, codec, thuật toán hoặc tích hợp
  <tên>.tsx                   # Thành phần riêng khi view cần tách
  <tên>-worker.ts             # Worker khi xử lý nặng có thể chặn giao diện
docs/tools/<id>/
  spec.md                     # Đặc tả và phạm vi hiện hành
  archive/
    YYYY-MM-DD-<change>.md     # Nguồn và bằng chứng ở thời điểm thay đổi
```

- Dùng ID chữ thường, bắt đầu bằng chữ cái, có thể chứa chữ số và dấu gạch ngang. ID phải duy nhất và ổn định vì được dùng trong URL. Giữ `tool.ts` và `view.tsx` ở cấp đầu của tool để cơ chế đăng ký và tải riêng hoạt động.
- Đặt nghiệp vụ trong module của tool, tách khỏi React. Chỉ đưa mã vào `src/shared/` khi nhiều tool thực sự dùng cùng hành vi. Tận dụng bộ kiểm thử trong `tests/` và `tests/browser/`.
- Dùng theme Mantine và icon Lucide hiện có. Đặt chuỗi giao diện và tên action ở `src/i18n/messages/` cho các locale được hỗ trợ. Kiểm tra nhãn, bàn phím, trạng thái lỗi và màn hình nhỏ.
- Với công cụ nhận tệp làm đầu vào, hỗ trợ kéo thả cùng nút chọn tệp. Áp dụng chung quy tắc kiểm tra và giới hạn cho cả hai cách nhập.
- Với kết quả dạng văn bản phù hợp để hiển thị, ưu tiên xem trước chỉ đọc và sao chép theo thao tác người dùng. Giữ nút tải cho kết quả dạng tệp và giới hạn kích thước xem trước theo công cụ.
- Xử lý tại client mặc định. Giữ input, tệp, token và kết quả ngoài storage, log, analytics và cache. Tool có kết nối ngoài phải mô tả đích, trường được gửi, lý do và quyền cần thiết. Xem [quyền riêng tư và luồng dữ liệu](privacy.md).

## 4. Lưu nguồn ở thời điểm thêm hoặc sửa tool

1. Tạo `spec.md` và hồ sơ `archive/YYYY-MM-DD-<change>.md` trong cùng thay đổi với tool. Dùng [mẫu hồ sơ](tools/TEMPLATE.md).
2. Mỗi nguồn ghi tên tài liệu, tổ chức phát hành, revision hoặc ngày phát hành, điều khoản áp dụng, URL chính thức đến mục tương ứng, ngày truy cập và hành vi được dẫn chứng. Nếu nguồn có URL revision cố định, lưu URL đó cùng URL chính thức. Với trang thay đổi tại chỗ, ghi lại nội dung cần đối chiếu bằng tóm tắt hoặc trích đoạn được phép và lưu thông tin phiên bản nếu nguồn có cung cấp.
3. Ánh xạ các yêu cầu quan trọng từ nguồn đến module hoặc test. Lưu định danh vector, đầu vào, đầu ra kỳ vọng hoặc vị trí của fixture để người sau có thể đối chiếu. Dùng dữ liệu công khai hoặc dữ liệu giả lập, kèm nguồn và giấy phép khi cần.
4. Chỉ đưa bản sao tài liệu gốc vào repo nếu có quyền phân phối và việc lưu bản sao thực sự cần thiết. Khi lưu file, ghi nguồn, phiên bản, giấy phép và SHA-256 của file. Bản ghi Markdown vẫn là điểm tra cứu chính.
5. Giữ các mốc đã lưu. Khi đổi chuẩn, thuật toán, hợp đồng API hay chính sách tương thích, tạo bản ghi mới liên kết mốc trước rồi cập nhật `spec.md`.

## 5. Kiểm tra trước khi hợp nhất

- Có đặc tả và bản lưu nguồn cho thay đổi, với phạm vi hỗ trợ khớp giao diện.
- Dùng vector công bố cho thuật toán chuẩn nếu có. Nếu nguồn không có vector phù hợp, đối chiếu với một triển khai độc lập hoặc dữ liệu kỳ vọng tính độc lập. Kiểm tra cả đầu vào sai và ranh giới liên quan. Tool custom dùng các ví dụ đầu vào và đầu ra đã định nghĩa trong đặc tả.
- Xác minh luồng bình thường trên những nền tảng bị ảnh hưởng. Kiểm tra offline cho tool xử lý cục bộ và các lỗi tích hợp cần thiết cho tool có kết nối ngoài. Ghi lệnh hoặc cách kiểm tra, kết quả thực tế và phần còn chưa xác minh. Giữ trạng thái chưa xác minh rõ ràng khi chưa chạy một kiểm tra.
