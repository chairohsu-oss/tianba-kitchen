import { View, Text, Input } from '@tarojs/components'
import { useState, useEffect } from 'react'
import Taro from '@tarojs/taro'
import { Lock, ChefHat, Eye, EyeOff } from 'lucide-react-taro'
import { Network } from '@/network'
import type { FC } from 'react'
import './index.css'

// 缓存版本号 - 修改此值可强制清除旧缓存
const CACHE_VERSION = '2026-03-21-v4'

const LoginPage: FC = () => {
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // 检查是否已经登录
  useEffect(() => {
    checkLoginStatus()
  }, [])

  const checkLoginStatus = async () => {
    try {
      // 检查缓存版本，如果版本不匹配则清除所有缓存
      const cachedVersion = Taro.getStorageSync('tianba_cache_version')
      if (cachedVersion !== CACHE_VERSION) {
        console.log('缓存版本不匹配，清除旧缓存...')
        Taro.clearStorageSync()
        Taro.setStorageSync('tianba_cache_version', CACHE_VERSION)
        console.log('缓存已清除，新版本:', CACHE_VERSION)
      }
      
      // 从本地存储获取登录状态
      const isLoggedIn = Taro.getStorageSync('tianba_logged_in')
      const loginTime = Taro.getStorageSync('tianba_login_time')
      
      // 如果已登录且在有效期内（30天），直接跳转首页
      if (isLoggedIn && loginTime) {
        const now = Date.now()
        const loginTimestamp = parseInt(loginTime)
        const thirtyDays = 30 * 24 * 60 * 60 * 1000
        
        if (now - loginTimestamp < thirtyDays) {
          Taro.switchTab({ url: '/pages/home/index' })
          return
        }
      }
      
      // 检查后端验证状态
      const result = await Network.request({
        url: '/api/auth/check'
      })
      
      if ((result as any).data?.data?.verified) {
        // 后端已验证，保存本地状态并跳转
        Taro.setStorageSync('tianba_logged_in', 'true')
        Taro.setStorageSync('tianba_login_time', Date.now().toString())
        Taro.switchTab({ url: '/pages/home/index' })
      }
    } catch (err) {
      // 未验证，显示登录页面
      console.log('用户未验证，显示登录页面')
    }
  }

  const handleLogin = async () => {
    if (!password.trim()) {
      setError('请输入密码')
      return
    }

    setLoading(true)
    setError('')

    try {
      const result = await Network.request({
        url: '/api/auth/login',
        method: 'POST',
        data: { 
          password: password.trim()
        }
      })

      console.log('登录接口返回:', JSON.stringify((result as any).data))

      if ((result as any).data?.code === 200) {
        // 登录成功，保存状态
        const token = (result as any).data?.data?.token
        const userData = (result as any).data?.data?.user
        
        Taro.setStorageSync('tianba_logged_in', 'true')
        Taro.setStorageSync('tianba_login_time', Date.now().toString())
        if (token) {
          Taro.setStorageSync('tianba_token', token)
        }
        if (userData) {
          Taro.setStorageSync('tianba_user', JSON.stringify(userData))
        }
        
        Taro.showToast({ title: '欢迎来到天霸私厨', icon: 'success' })
        
        // 跳转到首页
        setTimeout(() => {
          Taro.switchTab({ url: '/pages/home/index' })
        }, 500)
      } else {
        const errorMsg = (result as any).data?.msg || '密码错误，请重试'
        setError(errorMsg)
      }
    } catch (err: any) {
      console.error('登录失败:', err)
      const errMsg = err?.errMsg || err?.message || '网络请求失败，请检查网络连接'
      setError(errMsg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <View className="login-page">
      {/* 顶部装饰 */}
      <View className="login-header">
        <View className="logo-container">
          <ChefHat size={64} color="#F97316" />
        </View>
        <Text className="app-title">天霸私厨</Text>
        <Text className="app-subtitle">家庭智慧烹饪助手</Text>
      </View>

      {/* 登录表单 */}
      <View className="login-form">
        <View className="form-title">请输入访问密码</View>
        
        <View className="input-container">
          <Lock size={20} color="#9CA3AF" className="input-icon" />
          <Input
            className="password-input"
            password={!showPassword}
            placeholder="请输入密码"
            value={password}
            onInput={(e) => {
              setPassword(e.detail.value)
              setError('')
            }}
            onConfirm={handleLogin}
          />
          <View 
            className="eye-icon"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? (
              <EyeOff size={20} color="#9CA3AF" />
            ) : (
              <Eye size={20} color="#9CA3AF" />
            )}
          </View>
        </View>

        {error && (
          <Text className="error-text">{error}</Text>
        )}

        <View 
          className={`login-button ${loading ? 'disabled' : ''}`}
          onClick={loading ? undefined : handleLogin}
        >
          <Text className="login-button-text">
            {loading ? '验证中...' : '进入私厨'}
          </Text>
        </View>

        <Text className="hint-text">
          登录后可浏览菜品，点菜需要微信授权
        </Text>
      </View>

      {/* 底部装饰 */}
      <View className="login-footer">
        <Text className="footer-text">天霸家 · 专属美味</Text>
      </View>
    </View>
  )
}

export default LoginPage
