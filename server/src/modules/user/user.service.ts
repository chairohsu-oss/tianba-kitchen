import { Injectable } from '@nestjs/common'

// 用户等级枚举
export enum UserRole {
  HEAD_CHEF = 'head_chef',      // 厨师长 - 全部权限
  SOUS_CHEF = 'sous_chef',      // 领班 - 全部权限
  ORDER_CLERK = 'order_clerk',  // 下单员 - 下单、修改订单、上传菜品
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

// 用户接口
export interface User {
  id: string
  wechatId: string
  nickname: string
  avatarUrl: string
  role: UserRole
  verified: boolean           // 是否已验证
  verificationCode?: string   // 使用的验证码
  createdAt: Date
  updatedAt: Date
}

// 验证码接口
export interface VerificationCode {
  code: string
  description: string         // 验证码描述（如"家庭成员A"）
  usedBy?: string            // 使用者用户ID
  usedAt?: Date              // 使用时间
  createdAt: Date
  createdBy: string          // 创建者用户ID
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
  [UserRole.ORDER_CLERK]: '下单员',
  [UserRole.GUEST]: '客人',
}

// 内存存储（生产环境应使用数据库）
const users: Map<string, User> = new Map()
const verificationCodes: Map<string, VerificationCode> = new Map()

@Injectable()
export class UserService {
  constructor() {
    this.initDefaultUsers()
  }

  /**
   * 初始化默认用户
   */
  private initDefaultUsers() {
    const defaultUsers: User[] = [
      {
        id: 'user-1',
        wechatId: 'head_chef_wechat',
        nickname: '张大厨',
        avatarUrl: 'https://picsum.photos/100?random=chef',
        role: UserRole.HEAD_CHEF,
        verified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'user-2',
        wechatId: 'sous_chef_wechat',
        nickname: '李领班',
        avatarUrl: 'https://picsum.photos/100?random=sous',
        role: UserRole.SOUS_CHEF,
        verified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'user-3',
        wechatId: 'order_clerk_wechat',
        nickname: '王下单',
        avatarUrl: 'https://picsum.photos/100?random=clerk',
        role: UserRole.ORDER_CLERK,
        verified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'user-4',
        wechatId: 'guest_wechat',
        nickname: '赵客人',
        avatarUrl: 'https://picsum.photos/100?random=guest',
        role: UserRole.GUEST,
        verified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'default_user',
        wechatId: 'default_wechat',
        nickname: '默认用户',
        avatarUrl: 'https://picsum.photos/100?random=default',
        role: UserRole.ORDER_CLERK,
        verified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]

    defaultUsers.forEach(user => {
      users.set(user.id, user)
    })

    // 初始化默认验证码
    this.initDefaultVerificationCodes()
  }

  /**
   * 初始化默认验证码
   */
  private initDefaultVerificationCodes() {
    const defaultCodes: VerificationCode[] = [
      {
        code: 'TIANBA2024',
        description: '家庭成员验证码',
        createdAt: new Date(),
        createdBy: 'user-1',
      },
      {
        code: 'FAMILY2024',
        description: '亲友验证码',
        createdAt: new Date(),
        createdBy: 'user-1',
      },
    ]

    defaultCodes.forEach(vc => {
      verificationCodes.set(vc.code, vc)
    })
  }

  /**
   * 获取所有用户
   */
  async findAll(): Promise<User[]> {
    return Array.from(users.values())
  }

  /**
   * 根据ID获取用户
   */
  async findOne(id: string): Promise<User | null> {
    return users.get(id) || null
  }

  /**
   * 根据微信ID获取用户
   */
  async findByWechatId(wechatId: string): Promise<User | null> {
    return Array.from(users.values()).find(u => u.wechatId === wechatId) || null
  }

  /**
   * 创建或更新用户
   */
  async createOrUpdate(data: {
    wechatId: string
    nickname: string
    avatarUrl?: string
  }): Promise<User> {
    // 查找是否已存在
    let user = await this.findByWechatId(data.wechatId)
    
    if (user) {
      // 更新用户信息
      user = {
        ...user,
        nickname: data.nickname,
        avatarUrl: data.avatarUrl || user.avatarUrl,
        updatedAt: new Date(),
      }
      users.set(user.id, user)
    } else {
      // 创建新用户，默认为客人，未验证
      user = {
        id: `user-${Date.now()}`,
        wechatId: data.wechatId,
        nickname: data.nickname,
        avatarUrl: data.avatarUrl || 'https://picsum.photos/100?random=new',
        role: UserRole.GUEST,
        verified: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      users.set(user.id, user)
    }
    
    return user
  }

  /**
   * 验证用户
   */
  async verifyUser(userId: string, code: string): Promise<{ success: boolean; message: string; user?: User }> {
    const user = users.get(userId)
    if (!user) {
      return { success: false, message: '用户不存在' }
    }

    if (user.verified) {
      return { success: true, message: '用户已验证', user }
    }

    const verificationCode = verificationCodes.get(code)
    if (!verificationCode) {
      return { success: false, message: '验证码无效' }
    }

    if (verificationCode.usedBy && verificationCode.usedBy !== userId) {
      return { success: false, message: '验证码已被使用' }
    }

    // 验证成功
    user.verified = true
    user.verificationCode = code
    user.role = UserRole.ORDER_CLERK  // 验证后默认为下单员
    user.updatedAt = new Date()
    users.set(userId, user)

    // 标记验证码已使用
    verificationCode.usedBy = userId
    verificationCode.usedAt = new Date()
    verificationCodes.set(code, verificationCode)

    return { success: true, message: '验证成功', user }
  }

  /**
   * 检查用户是否已验证
   */
  async isVerified(userId: string): Promise<boolean> {
    const user = users.get(userId)
    return user?.verified ?? false
  }

  /**
   * 创建验证码（管理员操作）
   */
  async createVerificationCode(code: string, description: string, createdBy: string): Promise<VerificationCode> {
    const vc: VerificationCode = {
      code,
      description,
      createdAt: new Date(),
      createdBy,
    }
    verificationCodes.set(code, vc)
    return vc
  }

  /**
   * 获取所有验证码
   */
  async getAllVerificationCodes(): Promise<VerificationCode[]> {
    return Array.from(verificationCodes.values())
  }

  /**
   * 删除验证码
   */
  async deleteVerificationCode(code: string): Promise<boolean> {
    return verificationCodes.delete(code)
  }

  /**
   * 重置用户验证状态（管理员操作）
   */
  async resetUserVerification(userId: string): Promise<User | null> {
    const user = users.get(userId)
    if (!user) return null

    // 释放验证码
    if (user.verificationCode) {
      const vc = verificationCodes.get(user.verificationCode)
      if (vc) {
        vc.usedBy = undefined
        vc.usedAt = undefined
        verificationCodes.set(user.verificationCode, vc)
      }
    }

    user.verified = false
    user.verificationCode = undefined
    user.role = UserRole.GUEST
    user.updatedAt = new Date()
    users.set(userId, user)
    
    return user
  }

  /**
   * 更新用户等级
   */
  async updateRole(id: string, role: UserRole): Promise<User | null> {
    const user = users.get(id)
    if (!user) return null
    
    user.role = role
    user.updatedAt = new Date()
    users.set(id, user)
    
    return user
  }

  /**
   * 获取用户权限列表
   */
  async getPermissions(id: string): Promise<Permission[]> {
    const user = users.get(id)
    if (!user) return []
    
    return ROLE_PERMISSIONS[user.role] || []
  }

  /**
   * 检查用户是否有某个权限
   */
  async hasPermission(id: string, permission: Permission): Promise<boolean> {
    const permissions = await this.getPermissions(id)
    return permissions.includes(permission)
  }
}
