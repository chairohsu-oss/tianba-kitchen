# 🚀 阿里云 FC 详细部署步骤

## 📝 当前状态
✅ 已创建镜像仓库：`tianba-kitchen`
✅ 仓库地址：`crpi-muupe9p5oo5yd9hz.cn-shanghai.personal.cr.aliyuncs.com/tianba-kitchen/tianba-kitchen`

---

## 第一步：推送 Docker 镜像（本地终端操作）

### 1.1 登录 Docker
```bash
docker login --username=chairohsu0905 crpi-muupe9p5oo5yd9hz.cn-shanghai.personal.cr.aliyuncs.com
```

**密码说明**：
- 这是开通容器镜像服务时设置的**仓库密码**（不是阿里云登录密码）
- 如果忘记密码：
  1. 点击页面上的"访问凭证"
  2. 点击"重置密码"

### 1.2 使用脚本构建并推送（推荐）
```bash
# 在项目根目录执行
chmod +x build-and-push.sh
./build-and-push.sh
```

### 1.3 或手动执行
```bash
# 进入 server 目录
cd server

# 构建镜像
docker build -t crpi-muupe9p5oo5yd9hz.cn-shanghai.personal.cr.aliyuncs.com/tianba-kitchen/tianba-kitchen:latest .

# 推送镜像（需要5-10分钟）
docker push crpi-muupe9p5oo5yd9hz.cn-shanghai.personal.cr.aliyuncs.com/tianba-kitchen/tianba-kitchen:latest
```

**等待时间**：首次推送需要 5-10 分钟，请耐心等待。

---

## 第二步：创建函数计算服务（控制台操作）

### 2.1 进入函数计算控制台
1. 搜索框搜索"函数计算"
2. 点击进入"函数计算 FC"

### 2.2 创建服务和函数
1. 点击左侧菜单"服务及函数"
2. 点击"创建服务"
3. 填写：
   - 服务名称：`tianba-kitchen-service`
   - 描述：天霸私厨后端API服务
   - 其他保持默认
4. 点击"确定"

### 2.3 创建 Web 函数
1. 进入刚创建的服务
2. 点击"创建函数"
3. 选择 **"使用容器镜像"**
4. 填写基本配置：
   - 函数名称：`tianba-kitchen-api`
   - 镜像地址：选择 `tianba-kitchen/tianba-kitchen:latest`
   - 监听端口：`9000`

### 2.4 配置规格
- 内存规格：**512 MB**
- vCPU：**0.5 核**
- 执行超时时间：**60 秒**
- 单实例并发度：**10**

### 2.5 配置环境变量（重要！）

点击"环境变量"，添加以下变量：

```bash
SUPABASE_URL=你的Supabase项目URL
SUPABASE_ANON_KEY=你的Supabase密钥
COZE_API_KEY=你的Coze API密钥
NODE_ENV=production
PORT=9000
```

**获取方式**：
- `SUPABASE_URL`：Supabase 项目设置 → API → URL
- `SUPABASE_ANON_KEY`：Supabase 项目设置 → API → anon public
- `COZE_API_KEY`：Coze 平台 → API Key

### 2.6 配置触发器
1. 系统会自动创建 HTTP 触发器
2. 认证方式：**anonymous**（匿名访问）
3. 请求方式：勾选全部（GET、POST、PUT、DELETE、PATCH、HEAD、OPTIONS）

### 2.7 创建完成
点击"创建"，等待 1-2 分钟完成创建。

---

## 第三步：获取 API 地址

创建成功后，你会看到：

**公网访问地址**：
```
https://xxxxxx.cn-shanghai.fc.aliyuncs.com/2016-08-15/proxy/tianba-kitchen-service/tianba-kitchen-api/
```

复制这个地址，后面要用！

---

## 第四步：测试 API

在浏览器或终端测试：

```bash
# 测试健康检查
curl https://你的API地址/api/health

# 测试登录
curl -X POST https://你的API地址/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"password":"tianbajia"}'
```

---

## 第五步：更新前端配置

### 5.1 修改环境变量
编辑 `.env.production`：

```bash
PROJECT_DOMAIN=https://你的API地址
```

### 5.2 重新构建前端
```bash
pnpm build:web
```

### 5.3 部署前端
选择以下任一方式：
- **Vercel**（推荐）：免费、自动部署
- **阿里云 OSS**：国内访问快
- **GitHub Pages**：免费

---

## 💰 费用说明

### 免费额度（每月）
| 项目 | 免费额度 | 你的预估使用 |
|------|---------|-------------|
| 函数调用 | 100万次 | < 1000次 ✅ |
| 执行时间 | 40万 GB秒 | < 1000 GB秒 ✅ |
| 公网流量 | 1GB | < 100MB ✅ |
| 镜像存储 | 5GB | < 500MB ✅ |

**结论**：完全免费！🎉

---

## ❓ 常见问题

### Q1: Docker 推送失败？
**解决**：
1. 检查是否登录：`docker login`
2. 检查密码是否正确
3. 检查镜像地址是否正确

### Q2: 函数创建失败？
**解决**：
1. 确认镜像已成功推送
2. 检查镜像仓库是否为"私有"
3. 在函数计算中配置镜像访问权限

### Q3: API 调用失败？
**解决**：
1. 检查环境变量是否配置正确
2. 查看函数日志：函数详情 → 日志查询
3. 检查触发器是否创建成功

### Q4: 冷启动慢？
**解决**：
- 首次调用可能需要 1-3 秒
- 可以配置"预留实例"消除冷启动（需付费）
- 个人使用无需担心

---

## 📞 需要帮助？

如果遇到问题，请提供：
1. 错误信息截图
2. 当前操作步骤
3. 我会帮你快速解决！

---

## ✅ 完成检查清单

- [ ] Docker 登录成功
- [ ] 镜像构建成功
- [ ] 镜像推送成功
- [ ] 创建服务成功
- [ ] 创建函数成功
- [ ] 配置环境变量
- [ ] 获取 API 地址
- [ ] 测试 API 成功
- [ ] 更新前端配置
- [ ] 部署前端成功

全部完成后，你的 PWA 就能访问了！🎉
