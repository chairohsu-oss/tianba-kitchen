# 天霸私厨后端
FROM node:20-alpine AS server-builder
WORKDIR /app
COPY server/package.json server/pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install --frozen-lockfile
COPY server .
RUN pnpm build

# 生产镜像
FROM node:20-alpine
WORKDIR /app

# 安装 pnpm
RUN npm install -g pnpm

# 复制后端构建产物
COPY --from=server-builder /app/dist ./dist
COPY --from=server-builder /app/node_modules ./node_modules
COPY --from=server-builder /app/package.json ./

# 复制前端静态文件（需要先构建前端）
COPY dist-web ./public

# 环境变量
ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

CMD ["node", "dist/main.js"]
