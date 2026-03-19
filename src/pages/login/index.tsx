import { View, Text, Input, Button, Image } from '@tarojs/components'
import { useState, useEffect } from 'react'
import Taro from '@tarojs/taro'
import { Lock, ChefHat, Eye, EyeOff, Camera, Loader } from 'lucide-react-taro'
import { Network } from '@/network'
import type { FC } from 'react'
import './index.css'

// 默认头像（微信默认灰色头像）
const DEFAULT_AVATAR = 'https://mmbiz.qpic.cn/mmbiz/icTdbqWNOwNRna42FI242Lcia07jQodd2FJGIYQfG0LAJGFxM4FbnQP6yfMxBgJ0F3YRqJCJ1aPAK2dQagdusBZg/0'

// 生成UUID
const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0
    const v = c === 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}

// 获取或创建设备ID
const getOrCreateDeviceId = () => {
  let deviceId = Taro.getStorageSync('tianba_device_id')
  if (!deviceId) {
    deviceId = `device_${generateUUID()}`
    Taro.setStorageSync('tianba_device_id', deviceId)
  }
  return deviceId
}

// 检查是否是临时头像路径（需要上传）
const isTempAvatar = (url: string): boolean => {
  if (!url) return false
  // 微信小程序临时路径
  if (url.startsWith('wxfile://')) return true
  if (url.startsWith('http://tmp/')) return true
  if (url.startsWith('https://tmp/')) return true
  // 微信临时头像（thirdwx.qlogo.cn 的临时头像也会过期）
  if (url.includes('thirdwx.qlogo.cn') && url.includes('/132')) return true
  return false
}

// 上传头像到对象存储
const uploadAvatar = async (tempFilePath: string): Promise<string> => {
  console.log('开始上传头像到对象存储:', tempFilePath)
  
  try {
    const result = await Network.uploadFile({
      url: '/api/upload/image',
      filePath: tempFilePath,
      name: 'file'
    })
    
    console.log('上传结果:', result)
    
    // 解析响应
    const responseData = typeof (result as any).data === 'string' 
      ? JSON.parse((result as any).data) 
      : (result as any).data
    
    const uploadedUrl = responseData?.data?.url
    
    if (uploadedUrl) {
      console.log('头像上传成功:', uploadedUrl)
      return uploadedUrl
    } else {
      throw new Error('上传响应中没有URL')
    }
  } catch (error) {
    console.error('上传头像失败:', error)
    throw error
  }
}

const LoginPage: FC = () => {
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [nickname, setNickname] = useState('')
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
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
  const handleChooseAvatar = async (e: any) => {
    const { avatarUrl: chosenAvatar } = e.detail
    if (!chosenAvatar) return
    
    // 先显示临时头像
    setAvatarUrl(chosenAvatar)
    
    // 检查是否需要上传
    if (isTempAvatar(chosenAvatar)) {
      setUploadingAvatar(true)
      try {
        // 上传到对象存储
        const uploadedUrl = await uploadAvatar(chosenAvatar)
        setAvatarUrl(uploadedUrl)
        Taro.showToast({ title: '头像已保存', icon: 'success', duration: 1500 })
      } catch (err) {
        console.error('上传头像失败:', err)
        // 上传失败，清除临时头像，显示默认头像
        setAvatarUrl('')
        Taro.showModal({
          title: '头像上传失败',
          content: '将使用默认头像，您可以在登录后重新设置',
          showCancel: false,
          confirmText: '知道了'
        })
      } finally {
        setUploadingAvatar(false)
      }
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

    // 如果正在上传头像，等待完成
    if (uploadingAvatar) {
      Taro.showToast({ title: '头像上传中，请稍候', icon: 'none' })
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

      // 获取设备ID（用于在没有微信openid时标识用户）
      const deviceId = getOrCreateDeviceId()
      console.log('设备ID:', deviceId)
      
      // 检查头像是否是有效的永久URL（不是临时路径）
      const validAvatarUrl = avatarUrl && !isTempAvatar(avatarUrl) ? avatarUrl : undefined
      console.log('登录参数 - 昵称:', nickname.trim() || undefined, '头像:', validAvatarUrl)

      const result = await Network.request({
        url: '/api/auth/login',
        method: 'POST',
        data: { 
          password: password.trim(),
          code: wechatCode || undefined,
          deviceId: deviceId,
          nickname: nickname.trim() || undefined,
          avatarUrl: validAvatarUrl
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
          <View className="user-info-section">
            {/* 头像选择 */}
            <View className="avatar-container">
              <Button
                className="p-0 m-0 bg-transparent border-0"
                style={{ background: 'transparent', border: 'none', padding: 0, margin: 0, width: '96px', height: '96px' }}
                openType="chooseAvatar"
                onChooseAvatar={handleChooseAvatar}
              >
                <View className="avatar-wrapper">
                  <Image
                    className="avatar-image"
                    src={avatarUrl || DEFAULT_AVATAR}
                    mode="aspectFill"
                  />
                  {/* 上传中遮罩 */}
                  {uploadingAvatar && (
                    <View 
                      className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center"
                      style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
                    >
                      <Loader size={24} color="#fff" className="animate-spin" />
                    </View>
                  )}
                  {/* 编辑图标 */}
                  {!uploadingAvatar && (
                    <View className="avatar-edit-icon">
                      <Camera size={16} color="#fff" />
                    </View>
                  )}
                </View>
              </Button>
            </View>
            
            {/* 昵称输入 */}
            <View className="nickname-container">
              <Text className="nickname-label">昵称</Text>
              <Input
                className="nickname-input"
                type="nickname"
                placeholder="请输入您的昵称"
                value={nickname}
                onInput={handleNicknameInput}
                maxlength={20}
              />
            </View>
            
            <Text className="user-hint">
              设置头像和昵称后，将展示在美味记录中
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
