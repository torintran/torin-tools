# Commit attribution

When Codex creates a commit on behalf of Torin Tran, use Torin Tran as the Git author and add the following commit trailer:

```
Co-authored-by: Codex <codex@openai.com>
```

# Thêm hoặc sửa công cụ

Áp dụng [quy chuẩn phát triển công cụ](docs/tool-development.md) khi thêm tool hoặc thay đổi thuật toán, định dạng, API hay luồng dữ liệu của tool. Đặt mã trong `src/tools/<id>/`, đặc tả trong `docs/tools/<id>/spec.md` và bản ghi tham chiếu theo ngày trong `docs/tools/<id>/archive/`. Cập nhật mã, tài liệu và bằng chứng kiểm tra trong cùng thay đổi. Dùng Mantine, Lucide và hệ thống dịch hiện có.
