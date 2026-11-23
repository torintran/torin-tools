import type { CheatSheet } from './type.ts';

const docs = 'https://kubernetes.io/docs/reference/kubectl/generated/';

export const kubernetes: CheatSheet = {
  id: 'kubernetes',
  name: 'Kubernetes',
  keywords: ['k8s', 'k3s', 'kubectl', 'pod', 'deployment', 'namespace', 'ghcr'],
  groups: [
    { title: ['Cluster and diagnostics', 'Cluster và kiểm tra lỗi'], commands: [
      ['Check which cluster context your commands will use.', 'Kiểm tra context cluster mà kubectl đang dùng.', 'kubectl config current-context', docs + 'kubectl_config/kubectl_config_current-context/'],
      ['List available contexts before switching.', 'Xem các context có sẵn trước khi chuyển.', 'kubectl config get-contexts', docs + 'kubectl_config/kubectl_config_get-contexts/'],
      ['Switch the current context for later commands.', 'Đổi context hiện hành cho các lệnh tiếp theo.', 'kubectl config use-context my-cluster', docs + 'kubectl_config/kubectl_config_use-context/'],
      ['List namespaces in the current cluster.', 'Xem namespace trong cluster hiện tại.', 'kubectl get namespaces', docs + 'kubectl_get/'],
      ['List pods in the apps namespace with node and IP details.', 'Xem pod trong namespace apps, kèm node và địa chỉ IP.', 'kubectl -n apps get pods -o wide', docs + 'kubectl_get/'],
      ['Inspect a pod, including its conditions and recent events.', 'Xem trạng thái chi tiết và sự kiện gần đây của một pod.', 'kubectl -n apps describe pod my-pod', docs + 'kubectl_describe/'],
      ['Read recent logs from a named container.', 'Đọc log gần nhất của container được chỉ định.', 'kubectl -n apps logs my-pod -c my-app --tail=100', docs + 'kubectl_logs/'],
      ['Run the bundled kubectl on your K3s server.', 'Dùng kubectl đi kèm ngay trên máy chủ K3s.', 'sudo k3s kubectl -n apps get pods', 'https://docs.k3s.io/cli'],
    ] },
    { title: ['Deploy and verify', 'Triển khai và xác minh'], commands: [
      ['Preview the manifest on the server before applying it.', 'Kiểm tra manifest trên máy chủ trước khi áp dụng.', 'kubectl -n apps apply --dry-run=server -f deployment.yaml', docs + 'kubectl_apply/'],
      ['Create or update resources from the manifest.', 'Tạo hoặc cập nhật tài nguyên từ manifest.', 'kubectl -n apps apply -f deployment.yaml', docs + 'kubectl_apply/'],
      ['Update a Deployment to a specific GHCR tag. Replace the namespace, Deployment, container name, and image with your values.', 'Đổi image của Deployment sang một tag GHCR cụ thể. Thay namespace, Deployment, tên container và image theo cấu hình của bạn.', 'kubectl -n apps set image deployment/my-app my-app=ghcr.io/my-org/my-app:1.0.0', docs + 'kubectl_set/kubectl_set_image/'],
      ['Watch the Deployment until the rollout finishes.', 'Theo dõi Deployment đến khi rollout hoàn tất.', 'kubectl -n apps rollout status deployment/my-app --timeout=120s', docs + 'kubectl_rollout/kubectl_rollout_status/'],
    ] },
  ],
};
