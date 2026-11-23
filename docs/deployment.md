# Deployment

## Web and PWA

Use Node.js 22 and npm.

```sh
npm ci
npm run build
npm run serve
```

The Node server binds to localhost on port 4173 by default. Set `PORT` and `LISTEN_HOST` as needed. For a static deployment, serve `dist/` from an HTTPS origin and apply the headers in [Privacy and data flow](privacy.md). Open the Downloads page for PWA installation guidance and update checks.

With Docker, run `docker compose up --build -d` from the repository root. The Compose stack binds the web service to `127.0.0.1:4289`. The Docker image checks health through `/version.json`.

## Optional Postman gateway

Direct browser requests are the default. If the browser blocks them, deploy the gateway on the same origin as the web app and select **Self-hosted gateway** in Postman Backup. Set `POSTMAN_GATEWAY_ENABLED=1` and `POSTMAN_GATEWAY_ORIGIN` to the public HTTPS origin before starting the server. In Compose, set them in the service's environment block. Configure the reverse proxy to disable access logging and caching for `/api/postman/*`. [Postman Backup specification](tools/postman/spec.md) · [Privacy and data flow](privacy.md).

## Windows x64

Install the [Tauri prerequisites](https://v2.tauri.app/start/prerequisites/) for Windows, including Rust MSVC and Microsoft C++ Build Tools.

```sh
npm ci
npm run tauri -- build --target x86_64-pc-windows-msvc --bundles nsis -- --locked
```

Output is under `src-tauri/target/x86_64-pc-windows-msvc/release/`. The NSIS installer is under `bundle/nsis/`; the portable executable needs WebView2. The [CI workflow](../.github/workflows/verify-and-package.yml) builds both Windows packages and the web ZIP.

To host packages in the app's Downloads page, place them under `dist/downloads/` after the web build and run `node scripts/checksums.mjs dist/downloads --portal`. For Docker, mount that directory and its generated `downloads.json` read-only as shown in [docker-compose.yml](../docker-compose.yml).

The web app reads the same-origin `version.json`. A Windows build can read a fixed HTTPS URL when `UPDATE_MANIFEST_URL` is set at build time. These checks report update availability. Installation starts when the user downloads and opens the package.
