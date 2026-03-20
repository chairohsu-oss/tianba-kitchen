# 天霸私厨 - 完整构建镜像

# 阶段1: 构建前端
FROM node:20-alpine AS frontend-builder
WORKDIR /app

# 安装 pnpm
RUN npm install -g pnpm

# 复制依赖文件
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY server/package.json ./server/

# 安装所有依赖
RUN pnpm install --frozen-lockfile

# 复制前端源代码
COPY src ./src
COPY config ./config
COPY public ./public
COPY babel.config.js tsconfig.json ./

# 构建前端
RUN pnpm build:web

# 阶段2: 构建后端
FROM node:20-alpine AS server-builder
WORKDIR /app
COPY server/package.json server/pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install --frozen-lockfile
COPY server .
RUN pnpm build

# 阶段3: 生产镜像
FROM node:20-alpine
WORKDIR /app

# 安装 pnpm
RUN npm install -g pnpm

# 复制后端构建产物
COPY --from=server-builder /app/dist ./dist
COPY --from=server-builder /app/node_modules ./node_modules
COPY --from=server-builder /app/package.json ./

# 复制前端静态文件（从构建阶段）
COPY --from=frontend-builder /app/dist-web ./public

# 环境变量
ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

CMD ["node", "dist/main.js"]
