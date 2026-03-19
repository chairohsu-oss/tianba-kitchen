import { Injectable, OnModuleInit } from '@nestjs/common'
import { getSupabaseClient } from '@/storage/database/supabase-client'
import type { User, VerificationCode } from '@/storage/database/shared/schema'

// 导出类型供其他模块使用
export type { User, VerificationCode }

// 用户等级枚举
export enum UserRole {
  HEAD_CHEF = 'head_chef',      // 厨师长 - 全部权限
  SOUS_CHEF = 'sous_chef',      // 领班 - 全部权限
  ORDER_CLERK = 'order_clerk',  // 点菜员 - 点菜、修改菜单、上传菜品
  GUEST = 'guest',              // 客人 - 无权限
}

// 权限枚举
export enum Permission {
  PLACE_ORDER = 'place_order',           // 下单
  MODIFY_ORDER = 'modify_order',         // 修改订单
  CONFIRM_ORDER = 'confirm_order',       // 确认订单
  UPLOAD_DISH = 'upload_dish',           // 上传菜品
  MANAGE_USERS = 'manage_users',         // 管理用户
}

// 角色权限映射
const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  [UserRole.HEAD_CHEF]: [
    Permission.PLACE_ORDER,
    Permission.MODIFY_ORDER,
    Permission.CONFIRM_ORDER,
    Permission.UPLOAD_DISH,
    Permission.MANAGE_USERS,
  ],
  [UserRole.SOUS_CHEF]: [
    Permission.PLACE_ORDER,
    Permission.MODIFY_ORDER,
    Permission.CONFIRM_ORDER,
    Permission.UPLOAD_DISH,
    Permission.MANAGE_USERS,
  ],
  [UserRole.ORDER_CLERK]: [
    Permission.PLACE_ORDER,
    Permission.MODIFY_ORDER,
    Permission.UPLOAD_DISH,
  ],
  [UserRole.GUEST]: [],
}

// 角色显示名称映射
export const ROLE_NAMES: Record<UserRole, string> = {
  [UserRole.HEAD_CHEF]: '厨师长',
  [UserRole.SOUS_CHEF]: '领班',
  [UserRole.ORDER_CLERK]: '点菜员',
  [UserRole.GUEST]: '客人',
}

@Injectable()
export class UserService implements OnModuleInit {
  private client = getSupabaseClient()

  /**
   * 转换用户数据格式（snake_case -> camelCase）
   */
  private transformUser(user: any): any {
    if (!user) return null
    return {
      id: user.id,
      wechatId: user.wechat_id,
      nickname: user.nickname,
      avatarUrl: user.avatar_url,
      role: user.role,
      verified: user.verified,
      verificationCode: user.verification_code,
      createdAt: user.created_at,
      updatedAt: user.updated_at,
    }
  }

  async onModuleInit() {
    // 检查数据库是否有用户，没有则初始化示例数据
    const { count } = await this.client
      .from('users')
      .select('*', { count: 'exact', head: true })

    if (count === 0) {
      console.log('初始化默认用户数据...')
      await this.initDefaultUsers()
    }

    // 检查验证码表
    const { count: codeCount } = await this.client
      .from('verification_codes')
      .select('*', { count: 'exact', head: true })

    if (codeCount === 0) {
      console.log('初始化默认验证码...')
      await this.initDefaultVerificationCodes()
    }
  }

  /**
   * 初始化默认用户
   */
  private async initDefaultUsers() {
    const defaultUsers = [
      {
        id: 'user-1',
        wechat_id: 'head_chef_wechat',
        nickname: '张大厨',
        avatar_url: 'https://picsum.photos/100?random=chef',
        role: 'head_chef',
        verified: true,
      },
      {
        id: 'user-2',
        wechat_id: 'sous_chef_wechat',
        nickname: '李领班',
        avatar_url: 'https://picsum.photos/100?random=sous',
        role: 'sous_chef',
        verified: true,
      },
      {
        id: 'user-3',
        wechat_id: 'order_clerk_wechat',
        nickname: '王下单',
        avatar_url: 'https://picsum.photos/100?random=clerk',
        role: 'order_clerk',
        verified: true,
      },
      {
        id: 'user-4',
        wechat_id: 'guest_wechat',
        nickname: '赵客人',
        avatar_url: 'https://picsum.photos/100?random=guest',
        role: 'guest',
        verified: true,
      },
      {
        id: 'default_user',
        wechat_id: 'default_wechat',
        nickname: '默认用户',
        avatar_url: 'https://picsum.photos/100?random=default',
        role: 'order_clerk',
        verified: true,
      },
    ]

    const { error } = await this.client
      .from('users')
      .insert(defaultUsers)

    if (error) {
      console.error('初始化默认用户失败:', error)
    } else {
      console.log('默认用户初始化完成')
    }
  }

  /**
   * 初始化默认验证码
   */
  private async initDefaultVerificationCodes() {
    const defaultCodes = [
      {
        code: 'TIANBA2024',
        description: '家庭成员验证码',
        created_by: 'user-1',
      },
      {
        code: 'FAMILY2024',
        description: '亲友验证码',
        created_by: 'user-1',
      },
    ]

    const { error } = await this.client
      .from('verification_codes')
      .insert(defaultCodes)

    if (error) {
      console.error('初始化默认验证码失败:', error)
    } else {
      console.log('默认验证码初始化完成')
    }
  }

  /**
   * 获取所有用户
   */
  async findAll(): Promise<User[]> {
    const { data, error } = await this.client
      .from('users')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('查询用户失败:', error)
      return []
    }

    return (data || []).map(user => this.transformUser(user))
  }

  /**
   * 根据ID获取用户
   */
  async findOne(id: string): Promise<User | null> {
    const { data, error } = await this.client
      .from('users')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      return null
    }

    return this.transformUser(data)
  }

  /**
   * 根据微信ID获取用户
   */
  async findByWechatId(wechatId: string): Promise<User | null> {
    const { data, error } = await this.client
      .from('users')
      .select('*')
      .eq('wechat_id', wechatId)
      .single()

    if (error) {
      return null
    }

    return this.transformUser(data)
  }

  /**
   * 检查是否是临时头像路径（不应保存到数据库）
   */
  private isTempAvatar(url: string): boolean {
    if (!url) return true
    // 微信小程序临时路径
    if (url.startsWith('wxfile://')) return true
    if (url.startsWith('http://tmp/')) return true
    if (url.startsWith('https://tmp/')) return true
    // 微信临时头像（thirdwx.qlogo.cn 的 132 尺寸头像是临时的）
    if (url.includes('thirdwx.qlogo.cn') && url.includes('/132')) return true
    return false
  }

  /**
   * 创建或更新用户
   */
  async createOrUpdate(data: {
    wechatId: string
    nickname: string
    avatarUrl?: string
  }): Promise<User> {
    // 检查头像是否是临时路径
    const validAvatarUrl = data.avatarUrl && !this.isTempAvatar(data.avatarUrl) 
      ? data.avatarUrl 
      : undefined
    
    // 查找是否已存在
    let user = await this.findByWechatId(data.wechatId)
    const userAny = user as any
    
    if (user) {
      // 更新用户信息
      const { data: updated, error } = await this.client
        .from('users')
        .update({
          nickname: data.nickname,
          // 只有有效的头像URL才更新，否则保留原来的
          avatar_url: validAvatarUrl || userAny.avatarUrl,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id)
        .select()
        .single()

      if (error) {
        console.error('更新用户失败:', error)
        return user
      }
      return this.transformUser(updated)
    } else {
      // 创建新用户，默认为客人，密码验证通过即视为已验证
      // 使用默认头像，如果有有效头像URL则使用
      const defaultAvatar = 'https://mmbiz.qpic.cn/mmbiz/icTdbqWNOwNRna42FI242Lcia07jQodd2FJGIYQfG0LAJGFxM4FbnQP6yfMxBgJ0F3YRqJCJ1aPAK2dQagdusBZg/0'
      
      const { data: newUser, error } = await this.client
        .from('users')
        .insert({
          wechat_id: data.wechatId,
          nickname: data.nickname,
          avatar_url: validAvatarUrl || defaultAvatar,
          role: 'guest',
          verified: true,  // 密码验证通过，直接设为已验证
        })
        .select()
        .single()

      if (error) {
        console.error('创建用户失败:', error)
        throw new Error('创建用户失败')
      }
      return this.transformUser(newUser)
    }
  }

  /**
   * 验证用户
   */
  async verifyUser(userId: string, code: string): Promise<{ success: boolean; message: string; user?: User }> {
    const user = await this.findOne(userId)
    if (!user) {
      return { success: false, message: '用户不存在' }
    }

    if (user.verified) {
      return { success: true, message: '用户已验证', user }
    }

    // 查询验证码
    const { data: verificationCode, error: vcError } = await this.client
      .from('verification_codes')
      .select('*')
      .eq('code', code)
      .single()

    if (vcError || !verificationCode) {
      return { success: false, message: '验证码无效' }
    }

    if (verificationCode.used_by && verificationCode.used_by !== userId) {
      return { success: false, message: '验证码已被使用' }
    }

    // 验证成功，更新用户
    const { data: updatedUser, error: updateError } = await this.client
      .from('users')
      .update({
        verified: true,
        verification_code: code,
        role: 'order_clerk',
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)
      .select()
      .single()

    if (updateError) {
      return { success: false, message: '验证失败' }
    }

    // 标记验证码已使用
    await this.client
      .from('verification_codes')
      .update({
        used_by: userId,
        used_at: new Date().toISOString(),
      })
      .eq('code', code)

    return { success: true, message: '验证成功', user: this.transformUser(updatedUser) }
  }

  /**
   * 检查用户是否已验证
   */
  async isVerified(userId: string): Promise<boolean> {
    const user = await this.findOne(userId)
    return user?.verified ?? false
  }

  /**
   * 创建验证码（管理员操作）
   */
  async createVerificationCode(code: string, description: string, createdBy: string): Promise<VerificationCode> {
    const { data, error } = await this.client
      .from('verification_codes')
      .insert({
        code,
        description,
        created_by: createdBy,
      })
      .select()
      .single()

    if (error) {
      console.error('创建验证码失败:', error)
      throw new Error('创建验证码失败')
    }

    return data
  }

  /**
   * 获取所有验证码
   */
  async getAllVerificationCodes(): Promise<VerificationCode[]> {
    const { data, error } = await this.client
      .from('verification_codes')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('查询验证码失败:', error)
      return []
    }

    return data || []
  }

  /**
   * 删除验证码
   */
  async deleteVerificationCode(code: string): Promise<boolean> {
    const { error } = await this.client
      .from('verification_codes')
      .delete()
      .eq('code', code)

    return !error
  }

  /**
   * 验证用户（管理员操作）
   */
  async verifyUserById(userId: string): Promise<User | null> {
    const user = await this.findOne(userId)
    if (!user) return null

    const { data, error } = await this.client
      .from('users')
      .update({
        verified: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)
      .select()
      .single()

    if (error) {
      console.error('验证用户失败:', error)
      return null
    }

    return this.transformUser(data)
  }

  /**
   * 重置用户验证状态（管理员操作）
   */
  async resetUserVerification(userId: string): Promise<User | null> {
    const user = await this.findOne(userId)
    if (!user) return null

    const userAny = user as any
    // 释放验证码
    if (userAny.verification_code) {
      await this.client
        .from('verification_codes')
        .update({
          used_by: null,
          used_at: null,
        })
        .eq('code', userAny.verification_code)
    }

    // 重置用户状态
    const { data, error } = await this.client
      .from('users')
      .update({
        verified: false,
        verification_code: null,
        role: 'guest',
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)
      .select()
      .single()

    if (error) {
      return null
    }

    return this.transformUser(data)
  }

  /**
   * 删除用户
   */
  async deleteUser(userId: string): Promise<boolean> {
    // 不允许删除默认用户
    if (userId === 'default_user') {
      return false
    }

    const { error } = await this.client
      .from('users')
      .delete()
      .eq('id', userId)

    return !error
  }

  /**
   * 更新用户等级
   */
  async updateRole(id: string, role: UserRole): Promise<User | null> {
    const { data, error } = await this.client
      .from('users')
      .update({
        role,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return null
    }

    return this.transformUser(data)
  }

  /**
   * 获取用户权限列表
   */
  async getPermissions(id: string): Promise<Permission[]> {
    const user = await this.findOne(id)
    if (!user) return []
    
    return ROLE_PERMISSIONS[user.role as UserRole] || []
  }

  /**
   * 检查用户是否有某个权限
   */
  async hasPermission(id: string, permission: Permission): Promise<boolean> {
    const permissions = await this.getPermissions(id)
    return permissions.includes(permission)
  }
}
