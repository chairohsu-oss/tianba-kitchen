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
  createdAt: Date
  updatedAt: Date
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
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'user-2',
        wechatId: 'sous_chef_wechat',
        nickname: '李领班',
        avatarUrl: 'https://picsum.photos/100?random=sous',
        role: UserRole.SOUS_CHEF,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'user-3',
        wechatId: 'order_clerk_wechat',
        nickname: '王下单',
        avatarUrl: 'https://picsum.photos/100?random=clerk',
        role: UserRole.ORDER_CLERK,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'user-4',
        wechatId: 'guest_wechat',
        nickname: '赵客人',
        avatarUrl: 'https://picsum.photos/100?random=guest',
        role: UserRole.GUEST,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'default_user',
        wechatId: 'default_wechat',
        nickname: '默认用户',
        avatarUrl: 'https://picsum.photos/100?random=default',
        role: UserRole.ORDER_CLERK,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]

    defaultUsers.forEach(user => {
      users.set(user.id, user)
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
      // 创建新用户，默认为客人
      user = {
        id: `user-${Date.now()}`,
        wechatId: data.wechatId,
        nickname: data.nickname,
        avatarUrl: data.avatarUrl || 'https://picsum.photos/100?random=new',
        role: UserRole.GUEST,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      users.set(user.id, user)
    }
    
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
