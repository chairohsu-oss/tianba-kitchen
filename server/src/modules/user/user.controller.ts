import { Controller, Get, Post, Put, Body, Param } from '@nestjs/common'
import { UserService, UserRole, User } from './user.service'

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  /**
   * 获取当前用户信息（通过微信ID）
   */
  @Get('me')
  async getCurrentUser() {
    // 模拟获取当前用户（实际应从请求头或session获取）
    const user = await this.userService.findByWechatId('default_user')
    return {
      code: 200,
      msg: 'success',
      data: user,
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
