import { Controller, Post, Get, Body, Headers, BadRequestException } from '@nestjs/common'
import { AuthService } from './auth.service'
import { UserService, User } from '../user/user.service'

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService
  ) {}

  /**
   * 登录验证
   */
  @Post('login')
  async login(@Body() body: { 
    password: string; 
    code?: string;
    deviceId?: string;
    nickname?: string; 
    avatarUrl?: string 
  }) {
    const { password, code, deviceId, nickname, avatarUrl } = body

    if (!password) {
      throw new BadRequestException('请输入密码')
    }

    // 验证密码
    const isValid = this.authService.validatePassword(password)

    if (!isValid) {
      return {
        code: 401,
        msg: '密码错误',
        data: null,
      }
    }

    // 生成访问令牌
    const token = this.authService.generateToken()

    // 获取微信 openid
    let wechatOpenId = ''
    if (code) {
      try {
        wechatOpenId = await this.getWechatOpenId(code)
        console.log('获取到微信openid:', wechatOpenId)
      } catch (err) {
        console.error('获取微信openid失败:', err)
        // 获取失败不影响登录，继续使用设备ID
      }
    }

    // 用户标识：优先使用微信openid，其次使用设备ID
    const userId = wechatOpenId || deviceId || ''
    
    // 如果有用户标识和昵称，创建或更新用户
    let user: User | null = null
    
    if (userId && nickname) {
      try {
        user = await this.userService.createOrUpdate({
          wechatId: userId,
          nickname,
          avatarUrl,
        })
        console.log('创建/更新用户成功:', user)
      } catch (err) {
        console.error('更新用户信息失败:', err)
      }
    } else if (userId) {
      // 只有用户ID，尝试查找已有用户
      try {
        user = await this.userService.findByWechatId(userId)
        console.log('查找到已有用户:', user)
      } catch (err) {
        console.error('查找用户失败:', err)
      }
    }
    
    // 如果没有用户信息，返回默认用户
    if (!user) {
      user = await this.userService.findOne('default_user')
      console.log('使用默认用户:', user)
    }

    return {
      code: 200,
      msg: 'success',
      data: {
        verified: true,
        token,
        user,
      },
    }
  }

  /**
   * 通过微信 code 获取 openid
   * 文档：https://developers.weixin.qq.com/miniprogram/dev/api-backend/open-api/login/auth.code2Session.html
   */
  private async getWechatOpenId(code: string): Promise<string> {
    // 从环境变量获取微信配置
    const appId = process.env.WECHAT_APPID || process.env.WX_APPID
    const appSecret = process.env.WECHAT_SECRET || process.env.WX_SECRET

    // 如果没有配置微信 AppID 和 Secret，返回空字符串
    if (!appId || !appSecret) {
      console.log('未配置微信 AppID 或 Secret，跳过 openid 获取')
      return ''
    }

    try {
      const url = `https://api.weixin.qq.com/sns/jscode2session?appid=${appId}&secret=${appSecret}&js_code=${code}&grant_type=authorization_code`
      
      const response = await fetch(url)
      const data = await response.json() as { openid?: string; errcode?: number; errmsg?: string }
      
      if (data.errcode && data.errcode !== 0) {
        console.error('微信登录失败:', data.errmsg)
        return ''
      }
      
      return data.openid || ''
    } catch (err) {
      console.error('调用微信API失败:', err)
      return ''
    }
  }

  /**
   * 检查登录状态
   */
  @Get('check')
  async check(@Headers() headers: Record<string, string>) {
    // 从 header 中获取令牌
    const token = headers['x-tianba-token'] || headers['authorization']?.replace('Bearer ', '')

    if (token && this.authService.validateToken(token)) {
      return {
        code: 200,
        msg: 'success',
        data: {
          verified: true,
        },
      }
    }

    return {
      code: 200,
      msg: 'success',
      data: {
        verified: false,
      },
    }
  }
}
