# Postman Backup

ID `postman`. Sao lưu dữ liệu workspace mà Postman API cho phép đọc. Input gồm UUID workspace hoặc URL Overview hợp lệ và API key. Postman yêu cầu xác thực bằng `X-API-Key` qua HTTPS. [Postman API Reference](https://learning.postman.com/api-docs/api-reference/#authentication).

- Các GET được giới hạn vào metadata workspace, danh sách và chi tiết collection, danh sách và chi tiết environment, cùng workspace globals. Collection được phân trang theo `workspace`, `limit` và `offset`. Retry cho lỗi giới hạn tần suất có giới hạn. [Collections](https://learning.postman.com/api-docs/api-reference/collections/get-collections) · [Environments](https://learning.postman.com/api-docs/api-reference/environments/get-environments) · [Globals](https://learning.postman.com/api-docs/api-reference/workspaces/get-workspace-global-variables).
- ZIP của Torin có `manifest.json` với `formatVersion: 1`, `workspace.json`, `globals.json` và các mục collection/environment theo nhóm. Giới hạn dữ liệu chưa nén là 64 MiB. Nếu thao tác lỗi một phần hoặc bị hủy, tool không xuất ZIP. ZIP có thể chứa dữ liệu nhạy cảm mà tài khoản có quyền đọc.
- Web gọi Postman trực tiếp mặc định. Người dùng có thể chọn gateway cùng origin khi nơi triển khai đã bật. Windows gọi Postman qua Tauri. Client tạo ZIP trong bộ nhớ và người dùng chọn lúc lưu. Giá trị chỉ có ở thiết bị và Vault secrets nằm ngoài phạm vi.

[Điểm vào](../../../src/tools/postman/tool.ts) · [Quy tắc tuyến API](../../../src/tools/postman/routes.ts) · [Đóng gói ZIP](../../../src/tools/postman/backup.ts) · [Luồng dữ liệu](../../privacy.md) · [Bản lưu nguồn](archive/2026-11-23-baseline.md).
