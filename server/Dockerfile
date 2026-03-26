# 使用 Node.js 官方镜像
FROM node:18-alpine

# 设置工作目录
WORKDIR /app

# 安装依赖
COPY package*.json ./
RUN npm install --production

# 复制源代码
COPY . .

# 构建应用
RUN npm run build

# 暴露端口（FC 会使用 9000 端口）
EXPOSE 9000

# 设置环境变量
ENV NODE_ENV=production
ENV PORT=9000

# 启动应用
CMD ["node", "dist/main.js"]
