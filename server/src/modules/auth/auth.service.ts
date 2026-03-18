import { Injectable } from '@nestjs/common'

// 天霸私厨访问密码
const TIANBA_PASSWORD = 'tianbajia'

@Injectable()
export class AuthService {
  /**
   * 验证密码
   */
  validatePassword(password: string): boolean {
    return password === TIANBA_PASSWORD
  }

  /**
   * 生成简单的访问令牌
   */
  generateToken(): string {
    // 生成一个简单的令牌，基于时间戳和随机数
    const timestamp = Date.now()
    const random = Math.random().toString(36).substring(2, 15)
    return `tianba_${timestamp}_${random}`
  }

  /**
   * 验证令牌是否有效
   */
  validateToken(token: string): boolean {
    if (!token || !token.startsWith('tianba_')) {
      return false
    }
    
    // 简单验证：令牌格式正确即可
    const parts = token.split('_')
    if (parts.length !== 3) {
      return false
    }
    
    return true
  }
}
