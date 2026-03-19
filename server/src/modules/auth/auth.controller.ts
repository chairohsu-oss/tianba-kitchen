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
  async login(@Body() body: { password: string; nickname?: string; avatarUrl?: string }) {
    const { password, nickname, avatarUrl } = body

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

    // 如果有昵称，更新用户信息
    let user: User | null = null
    if (nickname) {
      try {
        user = await this.userService.createOrUpdate({
          wechatId: `wechat_${Date.now()}`,
          nickname,
          avatarUrl,
        })
      } catch (err) {
        console.error('更新用户信息失败:', err)
      }
    } else {
      // 返回默认用户
      user = await this.userService.findOne('default_user')
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
