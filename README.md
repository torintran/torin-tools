# Torin Tools

Bộ tiện ích developer, gồm Base64, URL encoder, Date-time converter, JSON formatter, JWT Decoder, UUIDs generator và Postman Backup. Torin Tools có mã ứng dụng, giao diện và icon được viết riêng. Hỗ trợ giao diện tiếng Anh và tiếng Việt.

[Lộ trình công cụ](docs/roadmap.md) · [Hồ sơ công cụ](docs/tools/README.md).

## Chạy web

Node.js 22 LTS và npm. Với mã nguồn hiện tại, không cần .env, Postman CLI hay API key để build và test.

```sh
npm ci
npm run dev
npm test
npm run build
npm run serve
```

Mở URL Vite khi phát triển hoặc http://localhost:4173 khi dùng bản build. Để triển khai, phục vụ `dist/` ở gốc origin HTTPS. Base64, JWT và lịch sử cục bộ dùng được offline sau khi service worker đã tải tài nguyên. Mục Downloads có hướng dẫn cài PWA và kiểm tra phiên bản.

```sh
npx playwright install chromium
npm run test:browser
```

Có thể đặt `PLAYWRIGHT_CHROMIUM_EXECUTABLE` thành đường dẫn Chrome cài sẵn. Các bài test dùng API giả lập.

### Chạy bản web bằng Docker

```sh
docker build -t torin-tools-web .
docker run -d --init --read-only --name torin-tools-web \
  -p 127.0.0.1:4289:4173 torin-tools-web
```

Mở [Torin Tools trên localhost](http://127.0.0.1:4289/). Image build chạy kiểm thử logic và kiểm tra kiểu. Container chạy bằng tài khoản thường, có health check trên `/version.json`. Gateway tắt mặc định. Để bật khi self-host, truyền `-e TORIN_GATEWAY=1 -e TORIN_ORIGIN=https://tools.example.com` và cấu hình reverse proxy HTTPS theo phần Postman Backup.

Để chạy Playwright vào container đang chạy, đặt `TORIN_TEST_URL=http://127.0.0.1:4289` và chạy `npx playwright test`. Image mặc định dùng catalog tải xuống rỗng. Để cổng Downloads hiển thị gói có sẵn, bind-mount đọc-only thư mục gói vào `/app/dist/downloads` và manifest tương ứng vào `/app/dist/downloads.json`.

## Tại sao dùng stack này

| Lựa chọn | Lý do và đánh đổi |
| --- | --- |
| TypeScript, React, Vite | Tái sử dụng giao diện và logic giữa PWA, Chromium, WebKit và desktop. So với JavaScript thuần, TypeScript kiểm tra kiểu ở build time và vẫn chạy dưới dạng JavaScript. React thuận tiện cho trạng thái tiến độ và lỗi. |
| TypeScript trên Node | Phục vụ file tĩnh và bật relay Postman khi cần. Browser và gateway chia sẻ bộ kiểm tra đường dẫn upstream. |
| Rust + Tauri v2 | Rust phù hợp với HTTP native, giới hạn tài nguyên và ghi ZIP qua hộp thoại hệ điều hành. Tauri dùng WebView hệ thống. So với Electron, cách này bỏ chi phí đóng gói Chromium riêng và đòi hỏi test nhiều WebView hơn. |
| Web Worker cho ZIP | JSON, nén ZIP và phần điều phối backup chạy ngoài luồng giao diện. Dùng WASM cho toàn bộ ứng dụng sẽ thêm một lớp tích hợp và trình duyệt vẫn áp dụng CORS. |

[Kiến trúc module](docs/design.md) · [Quy chuẩn thêm công cụ và lưu nguồn](docs/tool-development.md) · [Luồng dữ liệu, kiểm tra quyền riêng tư và cấu hình triển khai](docs/privacy.md).

## Base64 và JWT

- **Base64** có chế độ Text và File, Base64 chuẩn hoặc URL-safe, xử lý từng dòng, ngắt dòng MIME 76 ký tự, LF/CRLF và live mode. Text hỗ trợ UTF-8, UTF-16, ASCII và một số bộ ký tự cũ như Windows-1258. File tối đa 100 MiB, chạy trong Web Worker và giữ nguyên byte khi chuyển đổi một khối không đổi dấu xuống dòng. [Luồng tham chiếu Base64Decode](https://www.base64decode.org/) · [Base64Encode](https://www.base64encode.org/).
- **JWT** giải mã header và payload khi dán, hiển thị claim và thời gian UTC, ký JWT và xác minh chữ ký bằng khóa do người dùng nhập. Hỗ trợ HS, RS, PS và ES với SHA-256/384/512. HMAC nhận secret dạng UTF-8 hoặc Base64URL. RSA và ECDSA nhận PKCS #8 PEM khi ký, SPKI PEM khi xác minh, hoặc JWK tương ứng. Việc xác minh chữ ký tách biệt khỏi kiểm tra claim như hạn dùng, issuer và audience. Trình duyệt cần Web Crypto trong ngữ cảnh HTTPS hoặc localhost. [Luồng tham chiếu JWT.io](https://www.jwt.io/) · [Thư viện jose](https://github.com/panva/jose).

## Postman Backup

Nhập workspace UUID hoặc URL Overview của Postman và API key. Web dùng **Direct to Postman** mặc định và Windows luôn gọi Postman trực tiếp. Nếu browser chặn CORS, chạy gateway tự host và chọn **Self-hosted gateway**. Gateway tắt mặc định và chỉ xử lý dữ liệu trong RAM khi được chọn.

Để dùng cả web và gateway trên cùng một site, chạy `npm ci`, `npm run build` rồi cấu hình `TORIN_GATEWAY=1` và `TORIN_ORIGIN=https://tools.example.com` trước khi chạy `npm run serve`. Đặt reverse proxy HTTPS phục vụ file tĩnh và các đường dẫn gateway trên cùng origin. Tắt ghi access log và cache cho `/api/postman/*` tại proxy. Mặc định Node lắng nghe localhost cổng 4173, có thể thay đổi bằng `PORT` và `TORIN_LISTEN`.

Ví dụ chạy thử trên máy local bằng PowerShell.

```powershell
$env:TORIN_GATEWAY = '1'
$env:TORIN_ORIGIN = 'http://localhost:4173'
npm run serve
```

Backup đọc workspace metadata, trang danh sách collections, chi tiết collections, danh sách và chi tiết environments, cùng globals. ZIP gồm thư mục `collections/` và `environments/` với các tệp theo ID, cùng `globals.json`, `workspace.json` và `manifest.json`. JSON collection và environment dùng cấu trúc chi tiết API và được tách ra để import. ZIP có thể chứa credential. Ứng dụng tạo ZIP sau khi tất cả phần yêu cầu hoàn tất và không lưu key, token hoặc backup vào bộ nhớ lưu trữ của trình duyệt.

Postman API quyết định nội dung được export. Local-only values, Vault secrets, monitors, mocks, flows, API definitions, workspace roles và lịch sử phiên bản nằm ngoài phạm vi backup. MVP giữ ZIP trong RAM, giới hạn phản hồi 16 MiB mỗi request và tổng JSON 64 MiB. Tối đa bốn request chi tiết song song, timeout 25 giây mỗi request, tối đa hai lần retry 429. Nếu Retry-After vượt 60 giây, ứng dụng dừng request và báo thử lại sau.

[Xác thực và rate limits](https://learning.postman.com/api-docs/api-reference/) · [Collections](https://learning.postman.com/api-docs/api-reference/collections/get-collections) · [Environments](https://learning.postman.com/api-docs/api-reference/environments/get-environments) · [Globals](https://learning.postman.com/api-docs/api-reference/workspaces/get-workspace-global-variables).

## Kiểm tra phiên bản

Trong **Downloads**, chọn **Check for updates**. Web đọc `version.json` cùng origin. Bản Windows dùng URL HTTPS cố định tại thời điểm build nếu đặt biến `TORIN_UPDATE_URL=https://tools.example.com/version.json`. Client tự so sánh với phiên bản đang chạy. Không gửi phiên bản đang cài, API key, lịch sử, định danh thiết bị hay dữ liệu công cụ trong yêu cầu. Luồng này chỉ thông báo phiên bản. Người dùng tải file mới từ Downloads.

## Desktop và Downloads

Cài [Tauri prerequisites](https://v2.tauri.app/start/prerequisites/) theo hệ điều hành, sau đó chạy:

```sh
npm ci
npm run tauri -- dev
```

| Mục tiêu | Lệnh build trên runner tương ứng | Ghi chú |
| --- | --- | --- |
| Windows x64 | `npm run tauri -- build --target x86_64-pc-windows-msvc --bundles nsis` | Build cần Rust MSVC và Microsoft C++ Build Tools. Installer NSIS bootstraps WebView2 nếu thiếu. Bản ZIP portable chứa executable có thể chạy sau khi giải nén và cần WebView2 có sẵn. |
Bản build Windows nằm dưới `src-tauri/target/x86_64-pc-windows-msvc/release/`. [Workflow CI](.github/workflows/verify-and-package.yml) build web, installer Windows và Windows portable ZIP. Mỗi job tạo checksum SHA-256 và lưu kết quả trong GitHub Actions artifacts. Workflow không publish release.

Linux AppImage và macOS DMG cho Apple Silicon và Intel được dời sang đợt sau. Khi đó cần xác minh WebKitGTK trên Linux và chuẩn bị signing/notarization cho macOS.

Để đưa file lên mục Downloads trên bản web do bạn host, tự giải nén các CI artifacts, kiểm tra checksum, chép **các package desktop cần phân phối** vào `dist/downloads/`, rồi chạy `node scripts/checksums.mjs dist/downloads --portal`. Công cụ tạo manifest từ các file thật. Build Vite mới ghi lại `dist/`, vì vậy chạy bước này sau build. [Tình trạng xác minh](docs/verification.md).

[Windows installer và WebView2](https://v2.tauri.app/distribute/windows-installer/) · [PWA installation](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Making_PWAs_installable).

## Giấy phép

Torin Tools do Torin Tran phát triển với sự hỗ trợ của Codex. Bản quyền mã nguồn Torin Tools thuộc Torin Tran và được cấp phép theo Apache-2.0. Các thư viện đi kèm áp dụng giấy phép tương ứng.

[LICENSE](LICENSE) · [NOTICE](NOTICE).
