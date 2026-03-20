# 微信 openid 配置指南

## 为什么需要配置微信 openid？

当前系统使用「昵称」作为用户唯一标识，存在以下问题：
- 用户删除小程序后，设备ID会变化
- 用户忘记之前用的昵称
- 多个用户可能使用相同昵称

使用微信 openid 的好处：
- ✅ 跨设备登录，自动识别身份
- ✅ 无需手动输入昵称
- ✅ 永久稳定，不会丢失

## 配置步骤

### 第一步：获取微信小程序 AppID 和 AppSecret

1. 登录 [微信公众平台](https://mp.weixin.qq.com)
2. 进入「开发」→「开发管理」→「开发设置」
3. 复制 **AppID(小程序ID)** 和 **AppSecret(小程序密钥)**

### 第二步：在 Railway 设置环境变量

1. 打开 [Railway 项目](https://railway.app)
2. 进入 `tianba-kitchen` 项目
3. 点击「Variables」标签
4. 添加以下环境变量：

| 变量名 | 值 |
|--------|-----|
| `WECHAT_APPID` | 你的 AppID |
| `WECHAT_SECRET` | 你的 AppSecret |

5. 重新部署项目

### 第三步：验证配置

配置完成后，用户登录时：
1. 后端会自动调用微信 API 获取 openid
2. 用 openid 作为用户唯一标识
3. 无需手动输入昵称

## 后端代码已支持

后端 `auth.controller.ts` 已经实现了微信登录逻辑：

```typescript
// 获取微信 openid
let wechatOpenId = ''
if (code) {
  try {
    wechatOpenId = await this.getWechatOpenId(code)
    console.log('获取到微信openid:', wechatOpenId)
  } catch (err) {
    console.error('获取微信openid失败:', err)
  }
}

// 用户标识：优先使用微信openid，其次使用设备ID
const userIdentifier = wechatOpenId || deviceId || ''
```

## 注意事项

- AppSecret 是敏感信息，不要泄露
- 如果配置错误，系统会降级使用设备ID
- 配置后需要重新部署才能生效
