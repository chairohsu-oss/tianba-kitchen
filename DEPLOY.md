# 天霸私厨部署指南

## 部署方案概览

本指南提供三种部署方案，按推荐程度排序：

1. **Railway（推荐）** - 免费额度足够，一键部署
2. **阿里云/腾讯云** - 国内访问快，需要购买服务器
3. **Vercel + Supabase** - 完全免费，但国内访问可能较慢

---

## 方案一：Railway 部署（推荐）

Railway 提供免费的部署额度，适合小型应用。

### 步骤

1. **注册 Railway 账号**
   - 访问 https://railway.app
   - 使用 GitHub 账号登录

2. **创建新项目**
   ```bash
   # 点击 "New Project" → "Deploy from GitHub repo"
   # 选择你的仓库
   ```

3. **配置环境变量**
   在 Railway 控制台的 Variables 标签页添加：
   ```
   ARK_API_KEY=你的豆包API密钥
   ARK_ENDPOINT_ID=你的豆包端点ID
   ```

4. **部署**
   - Railway 会自动检测并构建
   - 部署完成后会获得一个域名，如：`xxx.railway.app`

5. **访问管理后台**
   - 地址：`https://xxx.railway.app/admin.html`
   - 密码：`tianbajia`

---

## 方案二：阿里云/腾讯云部署

适合需要国内快速访问的场景。

### 前置条件

- 一台云服务器（1核2G 即可，约 50-100 元/月）
- 已安装 Docker 和 Docker Compose

### 步骤

1. **购买云服务器**
   - 阿里云：https://www.aliyun.com/product/ecs
   - 腾讯云：https://cloud.tencent.com/product/cvm
   - 推荐配置：1核 CPU、2G 内存、40G 硬盘

2. **连接服务器并安装 Docker**
   ```bash
   # SSH 连接服务器
   ssh root@你的服务器IP

   # 安装 Docker
   curl -fsSL https://get.docker.com | bash
   
   # 安装 Docker Compose
   curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
   chmod +x /usr/local/bin/docker-compose
   ```

3. **上传项目代码**
   ```bash
   # 在本地打包项目
   tar -czvf tianba-kitchen.tar.gz .
   
   # 上传到服务器
   scp tianba-kitchen.tar.gz root@你的服务器IP:/root/
   
   # 在服务器解压
   ssh root@你的服务器IP
   mkdir -p /root/tianba-kitchen
   tar -xzvf /root/tianba-kitchen.tar.gz -C /root/tianba-kitchen
   cd /root/tianba-kitchen
   ```

4. **配置环境变量**
   ```bash
   # 创建环境变量文件
   cat > server/.env.local << 'EOF'
   ARK_API_KEY=你的豆包API密钥
   ARK_ENDPOINT_ID=你的豆包端点ID
   EOF
   ```

5. **构建前端并启动服务**
   ```bash
   # 安装 pnpm
   npm install -g pnpm
   
   # 安装依赖
   pnpm install
   
   # 构建前端
   pnpm build:web
   
   # 使用 Docker Compose 启动
   docker-compose up -d --build
   ```

6. **配置域名（可选）**
   - 购买域名（阿里云/腾讯云）
   - 添加 A 记录指向服务器 IP
   - 配置 Nginx 反向代理和 SSL 证书

7. **访问管理后台**
   - 地址：`http://你的服务器IP:3000/admin.html`
   - 或域名：`https://你的域名/admin.html`
   - 密码：`tianbajia`

---

## 方案三：Vercel + Supabase 部署

完全免费的方案，适合测试和小规模使用。

### 步骤

1. **部署后端到 Vercel**
   - 由于 Vercel 主要支持前端，后端需要改造为 Serverless 函数
   - 或使用 Vercel 的 Node.js 运行时

2. **配置 Supabase 数据库**
   - 你的项目已经配置了 Supabase，无需额外操作

---

## 环境变量说明

| 变量名 | 说明 | 必填 |
|--------|------|------|
| `ARK_API_KEY` | 豆包 API 密钥 | 是 |
| `ARK_ENDPOINT_ID` | 豆包端点 ID | 是 |
| `WECHAT_APPID` | 微信小程序 AppID | 否（小程序需配置） |
| `WECHAT_SECRET` | 微信小程序 Secret | 否（小程序需配置） |

---

## 常见问题

### 1. 如何修改管理密码？

修改 `server/src/modules/auth/auth.service.ts` 中的 `TIANBA_PASSWORD` 常量。

### 2. 如何配置微信小程序？

在微信小程序后台配置服务器域名：
- `request合法域名`：`https://你的域名`
- `uploadFile合法域名`：`https://你的域名`

然后在服务器配置环境变量：
```
WECHAT_APPID=你的小程序AppID
WECHAT_SECRET=你的小程序Secret
```

### 3. 如何备份数据？

由于使用 Supabase 数据库，数据已持久化在云端。如需额外备份：
- 登录 Supabase 控制台
- 进入项目 → Database → Backups
- 创建备份或导出 SQL

---

## 技术支持

如有问题，请查看：
1. 服务器日志：`docker logs tianba-kitchen`
2. Supabase 控制台检查数据库状态
3. 网络请求是否正常（浏览器开发者工具）
