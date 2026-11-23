# Deploy Torin Tools trên K3s

`web.yaml` chạy một replica, dùng Service nội bộ và tắt Postman gateway. App không cần PVC hay database. K3s pull image từ GHCR cho `linux/amd64` hoặc `linux/arm64`.

## 1. Pull và chạy trên K3s

GitHub Actions phát hành cùng một image dưới tag phiên bản (ví dụ `v0.3.0`) và `latest`. Chạy lại workflow cho tag cũ cũng sẽ chuyển `latest` về phiên bản đó. Để build tag đã có từ trước, mở **Actions → Publish container image → Run workflow** và nhập tag. Sau lần publish đầu tiên, đặt visibility của package thành **Public** trong GitHub Packages để K3s pull mà không cần đăng nhập. Kiểm tra image bằng `docker buildx imagetools inspect ghcr.io/torintran/torin-tools:v0.3.0`.

Chép `web.yaml` lên home server hoặc chạy từ thư mục repo đã clone:

```sh
sudo k3s kubectl apply -f deploy/k3s/web.yaml
sudo k3s kubectl -n torin-tools rollout status deployment/torin-tools --timeout=120s
sudo k3s kubectl -n torin-tools get pods
```

Nếu thấy `ImagePullBackOff`, xem Events bằng `sudo k3s kubectl -n torin-tools describe pods` và kiểm tra tag, visibility của package cùng kết nối tới GHCR.

## 2. Mở thử qua localhost

Trên home server:

```sh
sudo k3s kubectl -n torin-tools port-forward svc/torin-tools 4289:80
```

Trên máy cá nhân, mở một terminal khác:

```sh
ssh -N -L 4289:127.0.0.1:4289 user@home-server
```

Mở [localhost:4289](http://localhost:4289/) và kiểm tra [version.json](http://localhost:4289/version.json).

## 3. Dùng tên miền trong LAN

Kiểm tra `sudo k3s kubectl get ingressclass`. Nếu dùng Traefik, sửa cả hai chỗ `tools.home.arpa` trong `ingress.example.yaml`, rồi trỏ DNS nội bộ về IP LAN mà Traefik đang lắng nghe. Cấp chứng chỉ TLS khớp hostname và được thiết bị tin cậy. Ví dụ với chứng chỉ đã có:

```sh
sudo k3s kubectl -n torin-tools create secret tls torin-tools-tls --cert=fullchain.pem --key=privkey.pem
sudo k3s kubectl apply -f ~/ingress.example.yaml
sudo k3s kubectl -n torin-tools get ingress
```

Mở `https://tools.home.arpa` hoặc hostname đã chọn. HTTPS giúp PWA và Web Crypto hoạt động ngoài localhost. Giữ cổng router ở chế độ nội bộ nếu chỉ dùng trong LAN.

## Cập nhật

Sau khi Actions publish image mới, khởi động lại Deployment để Pod pull `latest`. Pod đang chạy sẽ tiếp tục dùng image hiện tại cho đến khi được thay thế.

```sh
sudo k3s kubectl -n torin-tools rollout restart deployment/torin-tools
sudo k3s kubectl -n torin-tools rollout status deployment/torin-tools
```

Để rollback về một bản cụ thể, đặt image của Deployment về tag phiên bản tương ứng. Apply lại `web.yaml` để quay về `latest`. Xem [Deployment](../../docs/deployment.md) nếu cần bật gateway Postman hoặc phục vụ gói Windows.
