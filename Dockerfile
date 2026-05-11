FROM node:20-slim

WORKDIR /app

RUN npm install -g pnpm@10

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml tsconfig.json tsconfig.base.json ./

COPY artifacts/api-server/package.json ./artifacts/api-server/
COPY lib/api-zod/package.json ./lib/api-zod/
COPY lib/db/package.json ./lib/db/
COPY lib/api-client-react/package.json ./lib/api-client-react/
COPY lib/api-spec/package.json ./lib/api-spec/

RUN pnpm install --no-frozen-lockfile

COPY . .

RUN pnpm --filter @workspace/api-server run build

EXPOSE 8080

CMD ["node", "--enable-source-maps", "artifacts/api-server/dist/index.mjs"]
