# MAC address lookup

ID `mac-address-lookup`. Tra cứu tổ chức đăng ký địa chỉ MAC EUI-48 hoặc tiền tố OUI 24 bit. Nhận 12 chữ số hex liền, cặp phân cách bằng dấu hai chấm hoặc gạch ngang, và dạng Cisco có dấu chấm. Tiền tố 6 chữ số chấp nhận dạng liền hoặc theo cặp. Địa chỉ nhóm và địa chỉ quản lý cục bộ hiện trạng thái riêng.

Tool điền sẵn địa chỉ ví dụ để hiển thị kết quả khi mở. Khi người dùng nhập hoặc dán địa chỉ hợp lệ, tool tự tra cứu sau một khoảng chờ ngắn. Nút Dùng ví dụ khôi phục đầu vào mẫu. Có thể sao chép tên tổ chức đăng ký khi tìm thấy.

Với địa chỉ đầy đủ, tra tiền tố dài nhất theo thứ tự MA-S 36 bit, MA-M 28 bit và MA-L 24 bit. Với OUI 6 chữ số, chỉ tra MA-L. Kết quả là tổ chức đăng ký. Ứng dụng web tải bộ dữ liệu cố định từ cùng origin khi cần tra cứu và PWA giữ bản đó để dùng offline. Địa chỉ nhập không được gửi đi.

[Hồ sơ nguồn ban đầu](archive/2026-11-23-initial.md) · [Tra cứu tự động](archive/2026-11-23-live-lookup.md) · [Giao diện](../../../src/tools/mac-address-lookup/view.tsx).
