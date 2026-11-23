ARG NODE_VERSION=26.13.1
FROM node:${NODE_VERSION}-bookworm-slim AS build

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm test && npm run build \
    && npm exec -- vite build --ssr server/server.ts --outDir dist-server \
    && mkdir -p dist/downloads \
    && cp LICENSE NOTICE dist/

FROM node:${NODE_VERSION}-bookworm-slim AS runtime

WORKDIR /app
ENV NODE_ENV=production \
    PORT=4173 \
    LISTEN_HOST=0.0.0.0

COPY --from=build /app/dist/ ./dist/
COPY --from=build /app/dist-server/server.js ./server.mjs

USER node
EXPOSE 4173
HEALTHCHECK --interval=15s --timeout=3s --start-period=5s \
    CMD ["node", "-e", "fetch('http://127.0.0.1:' + process.env.PORT + '/version.json').then(response => process.exit(response.ok ? 0 : 1), () => process.exit(1))"]
CMD ["node", "server.mjs"]
