import { Controller, Get, Post, Put, Body, Param } from '@nestjs/common'
import { UserService, UserRole, User } from './user.service'

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  /**
   * 获取当前用户信息（模拟已登录用户）
   * 实际生产环境应从请求头或session获取微信openid
   */
  @Get('me')
  async getCurrentUser() {
    // 模拟返回默认用户（实际应从微信登录获取）
    // 默认返回一个下单员角色的用户，方便测试
    const user = await this.userService.findOne('default_user')
    return {
      code: 200,
      msg: 'success',
      data: user,
    }
  }

  /**
   * 微信登录/注册
   * 前端调用 Taro.login() 获取 code，然后调用此接口
   */
  @Post('login')
  async login(@Body() body: { code?: string; nickname?: string; avatarUrl?: string }) {
    // 实际生产环境：使用 code 调用微信API换取 openid
    // 这里模拟登录流程：
    // 1. 如果传了昵称和头像，创建或更新用户
    // 2. 否则返回默认用户
    
    if (body.nickname) {
      // 有昵称，创建或更新用户
      const wechatId = body.code || `wechat_${Date.now()}`
      const user = await this.userService.createOrUpdate({
        wechatId,
        nickname: body.nickname,
        avatarUrl: body.avatarUrl,
      })
      return {
        code: 200,
        msg: 'success',
        data: user,
      }
    }
    
    // 无昵称，返回默认用户（模拟已登录状态）
    const user = await this.userService.findOne('default_user')
    return {
      code: 200,
      msg: 'success',
      data: user,
    }
  }

  /**
   * 更新当前用户信息（头像、昵称）
   */
  @Post('me/update')
  async updateCurrentUser(@Body() body: { nickname?: string; avatarUrl?: string }) {
    const user = await this.userService.findOne('default_user')
    if (!user) {
      return {
        code: 404,
        msg: '用户不存在',
        data: null,
      }
    }
    
    const updatedUser = await this.userService.createOrUpdate({
      wechatId: user.wechatId,
      nickname: body.nickname || user.nickname,
      avatarUrl: body.avatarUrl || user.avatarUrl,
    })
    
    return {
      code: 200,
      msg: 'success',
      data: updatedUser,
    }
  }

  /**
   * 获取所有用户列表
   */
  @Get()
  async findAll() {
    const users = await this.userService.findAll()
    return {
      code: 200,
      msg: 'success',
      data: users,
    }
  }

  /**
   * 根据ID获取用户
   */
  @Get(':id')
  async findOne(@Param('id') id: string) {
    const user = await this.userService.findOne(id)
    if (!user) {
      return {
        code: 404,
        msg: '用户不存在',
        data: null,
      }
    }
    return {
      code: 200,
      msg: 'success',
      data: user,
    }
  }

  /**
   * 创建或更新用户（微信登录后调用）
   */
  @Post()
  async createOrUpdate(@Body() body: {
    wechatId: string
    nickname: string
    avatarUrl?: string
  }) {
    const user = await this.userService.createOrUpdate(body)
    return {
      code: 200,
      msg: 'success',
      data: user,
    }
  }

  /**
   * 更新用户等级（管理员操作）
   */
  @Put(':id/role')
  async updateRole(
    @Param('id') id: string,
    @Body() body: { role: UserRole }
  ) {
    const user = await this.userService.updateRole(id, body.role)
    if (!user) {
      return {
        code: 404,
        msg: '用户不存在',
        data: null,
      }
    }
    return {
      code: 200,
      msg: 'success',
      data: user,
    }
  }

  /**
   * 检查用户权限
   */
  @Get(':id/permissions')
  async getPermissions(@Param('id') id: string) {
    const permissions = await this.userService.getPermissions(id)
    return {
      code: 200,
      msg: 'success',
      data: permissions,
    }
  }
}
