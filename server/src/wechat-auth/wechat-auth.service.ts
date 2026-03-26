import { Injectable } from '@nestjs/common'
import { createClient } from '@supabase/supabase-js'

interface WechatUserInfo {
  openid: string
  nickname: string
  headimgurl: string
  unionid?: string
}

interface UserRecord {
  id: string
  nickname: string
  avatar_url: string
  role: string
  wechat_openid?: string
  created_at: string
}

@Injectable()
export class WechatAuthService {
  private supabase: any

  constructor() {
    const supabaseUrl = process.env.SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_ANON_KEY
    
    if (supabaseUrl && supabaseKey) {
      this.supabase = createClient(supabaseUrl, supabaseKey)
    }
  }

  // 生成微信登录二维码
  async generateQRCode() {
    // 这里需要使用微信开放平台的扫码登录
    // 由于我们使用的是公众号，暂时返回提示信息
    return {
      code: 200,
      data: {
        qrCodeUrl: 'https://via.placeholder.com/200?text=WeChat+Login',
        message: '请在微信中打开此页面进行登录'
      },
      msg: '获取成功'
    }
  }

  // 处理微信授权回调
  async handleAuthCallback(code: string) {
    try {
      // 1. 使用 code 换取 access_token
      const tokenResult = await this.getAccessToken(code)
      
      if (!tokenResult.access_token) {
        return {
          code: 400,
          msg: '获取访问令牌失败'
        }
      }

      // 2. 获取用户信息
      const userInfo = await this.getUserInfo(
        tokenResult.access_token,
        tokenResult.openid
      )

      // 3. 检查是否已绑定用户
      let user = await this.findUserByOpenid(userInfo.openid)

      if (!user) {
        // 创建新用户
        user = await this.createUser(userInfo)
      }

      return {
        code: 200,
        data: {
          user: {
            id: user.id,
            nickname: user.nickname,
            avatar_url: user.avatar_url,
            role: user.role,
            wechat_openid: user.wechat_openid
          },
          token: this.generateToken(user)
        },
        msg: '登录成功'
      }
    } catch (error) {
      console.error('微信授权失败:', error)
      return {
        code: 500,
        msg: '微信授权失败'
      }
    }
  }

  // 检查绑定状态
  async checkBindStatus(openid: string) {
    const user = await this.findUserByOpenid(openid)
    
    return {
      code: 200,
      data: {
        isBound: !!user,
        user: user ? {
          id: user.id,
          nickname: user.nickname,
          avatar_url: user.avatar_url,
          role: user.role
        } : null
      },
      msg: '查询成功'
    }
  }

  // 使用 code 换取 access_token
  private async getAccessToken(code: string) {
    const appId = process.env.WECHAT_APP_ID || 'wx1d3d1fb21d038dc7'
    const appSecret = process.env.WECHAT_APP_SECRET
    
    if (!appSecret) {
      throw new Error('未配置微信 AppSecret')
    }

    const url = `https://api.weixin.qq.com/sns/oauth2/access_token?appid=${appId}&secret=${appSecret}&code=${code}&grant_type=authorization_code`
    
    const response = await fetch(url)
    const result = await response.json()
    
    return result
  }

  // 获取用户信息
  private async getUserInfo(accessToken: string, openid: string): Promise<WechatUserInfo> {
    const url = `https://api.weixin.qq.com/sns/userinfo?access_token=${accessToken}&openid=${openid}&lang=zh_CN`
    
    const response = await fetch(url)
    const result = await response.json()
    
    return {
      openid: result.openid,
      nickname: result.nickname,
      headimgurl: result.headimgurl,
      unionid: result.unionid
    }
  }

  // 根据 openid 查找用户
  private async findUserByOpenid(openid: string): Promise<UserRecord | null> {
    if (!this.supabase) {
      return null
    }

    const { data, error } = await this.supabase
      .from('tianba_users')
      .select('*')
      .eq('wechat_openid', openid)
      .single()

    if (error || !data) {
      return null
    }

    return data
  }

  // 创建新用户
  private async createUser(userInfo: WechatUserInfo): Promise<UserRecord> {
    const { data, error } = await this.supabase
      .from('tianba_users')
      .insert({
        nickname: userInfo.nickname || '微信用户',
        avatar_url: userInfo.headimgurl || '',
        role: 'guest',
        wechat_openid: userInfo.openid,
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      throw new Error('创建用户失败')
    }

    return data
  }

  // 生成 token（简化版，实际应使用 JWT）
  private generateToken(user: UserRecord): string {
    return Buffer.from(JSON.stringify({
      userId: user.id,
      openid: user.wechat_openid,
      exp: Date.now() + 7 * 24 * 60 * 60 * 1000 // 7天过期
    })).toString('base64')
  }
}
