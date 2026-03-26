# 阿里云函数计算 FC 部署指南

## 准备工作

### 1. 注册阿里云账号
- 访问：https://www.aliyun.com/
- 完成实名认证

### 2. 开通函数计算服务
- 控制台搜索"函数计算"
- 点击"立即开通"
- 选择"按量付费"（免费额度足够使用）

### 3. 开通容器镜像服务
- 控制台搜索"容器镜像服务"
- 开通"容器镜像服务"
- 创建命名空间：`tianba-kitchen`
- 创建镜像仓库：`api`

### 4. 安装部署工具
```bash
# 安装 Serverless Devs 工具
npm install -g @serverless-devs/s

# 配置阿里云密钥
s config add
# 输入 AccessKey ID 和 AccessKey Secret
# 获取方式：阿里云控制台 -> 右上角头像 -> AccessKey 管理
```

## 部署步骤

### 方式一：使用容器镜像部署（推荐）

#### 1. 构建并推送镜像
```bash
# 登录阿里云镜像仓库
docker login --username=你的阿里云账号 registry.cn-hangzhou.aliyuncs.com

# 构建 Docker 镜像
cd server
docker build -t registry.cn-hangzhou.aliyuncs.com/tianba-kitchen/api:latest .

# 推送镜像
docker push registry.cn-hangzhou.aliyuncs.com/tianba-kitchen/api:latest
```

#### 2. 配置环境变量
创建 `.env.fc` 文件：
```bash
SUPABASE_URL=你的Supabase项目URL
SUPABASE_ANON_KEY=你的Supabase密钥
COZE_API_KEY=你的Coze API密钥
WECHAT_APP_ID=你的微信AppID（可选）
WECHAT_APP_SECRET=你的微信AppSecret（可选）
```

#### 3. 部署到 FC
```bash
# 部署
s deploy

# 查看部署信息
s info
```

#### 4. 获取 API 地址
部署成功后，会输出访问地址，类似：
```
https://xxxxxx.cn-hangzhou.fc.aliyuncs.com/2016-08-15/proxy/tianba-kitchen-service/tianba-kitchen-api/
```

### 方式二：使用代码包部署（更快）

#### 1. 修改 s.yaml
```yaml
function:
  runtime: nodejs18
  handler: dist/main.handler
  codeUri: ./
```

#### 2. 部署
```bash
s deploy
```

## 配置前端

### 1. 更新环境变量
修改 `.env.production`：
```bash
# 替换为你的 FC 访问地址
PROJECT_DOMAIN=https://xxxxxx.cn-hangzhou.fc.aliyuncs.com/2016-08-15/proxy/tianba-kitchen-service/tianba-kitchen-api
```

### 2. 重新构建前端
```bash
pnpm build:web
```

### 3. 部署前端
可以选择：
- Vercel（推荐）
- 阿里云 OSS + CDN
- GitHub Pages

## 自定义域名（可选）

### 1. 在阿里云配置域名解析
- 控制台 -> 域名 -> 解析设置
- 添加 CNAME 记录，指向 FC 生成的域名

### 2. 在 FC 配置自定义域名
```bash
s deploy custom-domain
```

## 费用说明

### 免费额度（每月）
- 调用次数：100万次
- 执行时间：40万 CU（约 40万秒）
- 流量：1GB（公网）
- 存储：5GB（日志）

### 超出费用
- 调用次数：0.0133元/万次
- 执行时间：0.00003167元/CU秒
- 公网流量：0.5元/GB

**预估**：个人/家庭使用完全免费！

## 常见问题

### 1. 冷启动问题
- 首次调用可能需要 1-3 秒启动容器
- 可配置"预留实例"消除冷启动（需付费）

### 2. 镜像推送失败
- 确认已登录：`docker login`
- 确认镜像仓库地址正确

### 3. 部署失败
- 检查 AccessKey 权限
- 查看日志：`s logs`

## 监控与日志

```bash
# 查看函数日志
s logs

# 查看函数指标
s metrics
```

## 更多资源

- [阿里云函数计算文档](https://help.aliyun.com/product/50980.html)
- [Serverless Devs 文档](https://www.serverless-devs.com/)
- [容器镜像服务文档](https://help.aliyun.com/product/60716.html)
