import type { CheatSheet } from './type.ts';

const docs = 'https://docs.docker.com/reference/cli/docker/';

export const docker: CheatSheet = {
  id: 'docker',
  name: 'Docker',
  keywords: ['container', 'image', 'compose', 'registry', 'ghcr'],
  groups: [
    { title: ['Images and registry', 'Image và registry'], commands: [
      ['Build an image using the Dockerfile in this directory.', 'Build image từ Dockerfile trong thư mục hiện tại.', 'docker build -t my-app:1.0.0 .', docs + 'image/build/'],
      ['Give an existing image a tag for GHCR.', 'Gắn tag GHCR cho image đã build.', 'docker tag my-app:1.0.0 ghcr.io/my-org/my-app:1.0.0', docs + 'image/tag/'],
      ['Push a tagged image after signing in to the registry.', 'Đẩy image đã gắn tag sau khi đăng nhập registry.', 'docker push ghcr.io/my-org/my-app:1.0.0', docs + 'image/push/'],
      ['Pull a specific version from GHCR.', 'Tải một phiên bản cụ thể từ GHCR.', 'docker pull ghcr.io/my-org/my-app:1.0.0', docs + 'image/pull/'],
      ['List local images and their tags.', 'Xem các image và tag trên máy.', 'docker image ls', docs + 'image/ls/'],
    ] },
    { title: ['Run and troubleshoot', 'Chạy và kiểm tra lỗi'], commands: [
      ['Run a container in the background. Map local port 8080 to port 80 in the container.', 'Chạy container nền. Ánh xạ cổng 8080 trên máy vào cổng 80 trong container.', 'docker run -d --name my-app -p 127.0.0.1:8080:80 my-app:1.0.0', docs + 'container/run/'],
      ['List running and stopped containers.', 'Xem container đang chạy và đã dừng.', 'docker ps -a', docs + 'container/ls/'],
      ['Follow logs starting with the last 100 lines.', 'Xem 100 dòng log gần nhất và theo dõi log mới.', 'docker logs --tail 100 -f my-app', docs + 'container/logs/'],
      ['Inspect container configuration and state.', 'Xem cấu hình và trạng thái của container.', 'docker inspect my-app', docs + 'inspect/'],
      ['Open a shell in a running container that has sh.', 'Mở shell trong container đang chạy có sẵn sh.', 'docker exec -it my-app sh', docs + 'container/exec/'],
      ['Start services defined in your Compose file.', 'Chạy các dịch vụ khai báo trong tệp Compose.', 'docker compose up -d', docs + 'compose/up/'],
      ['List the status and ports of Compose services.', 'Xem trạng thái và cổng của dịch vụ Compose.', 'docker compose ps', docs + 'compose/ps/'],
    ] },
  ],
};
