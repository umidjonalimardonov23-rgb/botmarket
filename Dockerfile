FROM node:22-slim
WORKDIR /app

# Install pnpm
RUN npm install -g pnpm@10

# Copy full monorepo
COPY . .

# Install all dependencies (including devDeps for build)
RUN pnpm install --frozen-lockfile

# Build mini-app (static frontend)
# BASE_PATH=/ means served from root, PORT is dummy (only needed by vite config)
ENV BASE_PATH=/
ENV PORT=3000
RUN pnpm --filter @workspace/mini-app run build

# Build API server
ENV NODE_ENV=production
RUN pnpm --filter @workspace/api-server run build

# Copy mini-app static output next to API server dist
RUN cp -r artifacts/mini-app/dist/public artifacts/api-server/dist/public

# Runtime
ENV PORT=8080
EXPOSE 8080

CMD ["node", "--enable-source-maps", "artifacts/api-server/dist/index.mjs"]
