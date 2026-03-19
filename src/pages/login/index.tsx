import { View, Text, Input, Button, Image } from '@tarojs/components'
import { useState, useEffect } from 'react'
import Taro from '@tarojs/taro'
import { Lock, ChefHat, Eye, EyeOff, Camera } from 'lucide-react-taro'
import { Network } from '@/network'
import type { FC } from 'react'
import './index.css'

// 默认头像
const DEFAULT_AVATAR = 'https://picsum.photos/100?random=default'

const LoginPage: FC = () => {
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [nickname, setNickname] = useState('')
  const isWeapp = Taro.getEnv() === Taro.ENV_TYPE.WEAPP

  // 检查是否已经登录
  useEffect(() => {
    checkLoginStatus()
  }, [])

  const checkLoginStatus = async () => {
    try {
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

  // 选择头像回调（新版API）
  const handleChooseAvatar = (e: any) => {
    const { avatarUrl: chosenAvatar } = e.detail
    if (chosenAvatar) {
      setAvatarUrl(chosenAvatar)
    }
  }

  // 昵称输入回调（新版API）
  const handleNicknameInput = (e: any) => {
    setNickname(e.detail.value)
  }

  const handleLogin = async () => {
    if (!password.trim()) {
      setError('请输入密码')
      return
    }

    setLoading(true)
    setError('')

    try {
      // 小程序端：获取微信登录 code
      let wechatCode = ''
      if (isWeapp) {
        try {
          const loginResult = await Taro.login()
          wechatCode = loginResult.code
          console.log('微信登录code:', wechatCode)
        } catch (loginErr) {
          console.error('微信登录失败:', loginErr)
        }
      }

      const result = await Network.request({
        url: '/api/auth/login',
        method: 'POST',
        data: { 
          password: password.trim(),
          code: wechatCode || undefined,
          nickname: nickname.trim() || undefined,
          avatarUrl: avatarUrl || undefined
        }
      })

      if ((result as any).data?.code === 200) {
        // 登录成功，保存状态和令牌
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
        setError('密码错误，请重试')
      }
    } catch (err) {
      console.error('登录失败:', err)
      setError('登录失败，请重试')
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
        
        {/* 小程序端：用户信息填写区域 */}
        {isWeapp && (
          <View className="mb-4">
            {/* 头像选择 */}
            <View className="flex flex-row items-center justify-center mb-3">
              <Button
                className="p-0 m-0 bg-transparent border-0"
                style={{ background: 'transparent', border: 'none', padding: 0, margin: 0 }}
                openType="chooseAvatar"
                onChooseAvatar={handleChooseAvatar}
              >
                <View className="relative">
                  <Image
                    className="w-20 h-20 rounded-full"
                    src={avatarUrl || DEFAULT_AVATAR}
                    mode="aspectFill"
                  />
                  {/* 编辑图标 */}
                  <View 
                    className="absolute bottom-0 right-0 w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center"
                    style={{ borderWidth: 2, borderColor: '#fff' }}
                  >
                    <Camera size={12} color="#fff" />
                  </View>
                </View>
              </Button>
            </View>
            
            {/* 昵称输入 */}
            <View 
              className="flex flex-row items-center justify-center gap-2 p-3 bg-gray-50 rounded-xl mx-2"
            >
              <Text className="text-sm text-gray-500">昵称：</Text>
              <Input
                className="flex-1 text-sm"
                type="nickname"
                placeholder="请输入昵称"
                value={nickname}
                onInput={handleNicknameInput}
                maxlength={20}
              />
            </View>
            
            <Text className="text-xs text-gray-400 text-center mt-2">
              可选：设置头像和昵称后，将展示在美味记录中
            </Text>
          </View>
        )}
        
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
          首次登录后，系统将记住您的身份
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
