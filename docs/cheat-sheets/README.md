# Cheat Sheets

Tra cứu lệnh theo công việc trong Torin Tools. Mỗi ví dụ có mô tả Anh/Việt, nút sao chép và tài liệu chính thức.

- [Docker](docker/spec.md)
- [Kubernetes và K3s](kubernetes/spec.md)
- [Git & GitHub CLI](git-github/spec.md)

[Quy chuẩn thêm và sửa Cheat Sheets](../cheat-sheet-development.md).

## Xác minh bản đầu

Ngày 2026-11-23, `npm run build` thành công, `npm test` đạt 27 bài và 6 lượt kiểm tra liên quan trên Chrome desktop/mobile đều đạt. Bài kiểm tra Cheat Sheets xác minh điều hướng, tìm lệnh, sao chép, đổi ngôn ngữ và đọc offline. Cả 34 URL tài liệu riêng biệt trong giao diện trả về HTTP 200. Các lệnh mẫu được đối chiếu theo tài liệu, chưa chạy trên registry, cluster hoặc repository từ xa.
