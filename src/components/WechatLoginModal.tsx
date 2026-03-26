import { View, Text, Image, Button } from '@tarojs/components'
import { useState, useEffect } from 'react'
import Taro from '@tarojs/taro'
import { X, Loader, Smartphone } from 'lucide-react-taro'
import { Network } from '@/network'
import type { FC } from 'react'
import './WechatLoginModal.css'

interface WechatLoginModalProps {
  visible: boolean
  onClose: () => void
  onSuccess: (user: any) => void
}

const WechatLoginModal: FC<WechatLoginModalProps> = ({ visible, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false)
  const [qrCodeUrl, setQrCodeUrl] = useState('')
  const [isWechat, setIsWechat] = useState(false)

  useEffect(() => {
    // 检测是否在微信环境
    const ua = navigator.userAgent.toLowerCase()
    const isWechatEnv = ua.includes('micromessenger')
    setIsWechat(isWechatEnv)
    
    if (visible && !isWechatEnv) {
      // 非微信环境，获取二维码
      fetchQRCode()
    }
  }, [visible])

  // 获取微信登录二维码
  const fetchQRCode = async () => {
    setLoading(true)
    try {
      const result = await Network.request({
        url: '/api/auth/wechat/qrcode'
      })
      
      if ((result as any).data?.code === 200) {
        setQrCodeUrl((result as any).data?.data?.qrCodeUrl)
      }
    } catch (err) {
      console.error('获取二维码失败:', err)
    } finally {
      setLoading(false)
    }
  }

  // 微信内授权登录
  const handleWechatAuth = () => {
    // 获取当前页面地址作为回调
    const redirectUri = encodeURIComponent(window.location.href)
    const appId = 'wx1d3d1fb21d038dc7'
    
    // 微信网页授权地址
    const authUrl = `https://open.weixin.qq.com/connect/oauth2/authorize?appid=${appId}&redirect_uri=${redirectUri}&response_type=code&scope=snsapi_userinfo&state=login#wechat_redirect`
    
    // 跳转到微信授权页面
    window.location.href = authUrl
  }

  // 处理授权回调
  useEffect(() => {
    const url = new URL(window.location.href)
    const code = url.searchParams.get('code')
    const state = url.searchParams.get('state')
    
    if (code && state === 'login') {
      // 有授权码，调用后端完成登录
      handleAuthCallback(code)
    }
  }, [])

  const handleAuthCallback = async (code: string) => {
    setLoading(true)
    try {
      const result = await Network.request({
        url: '/api/auth/wechat/callback',
        method: 'POST',
        data: { code }
      })
      
      if ((result as any).data?.code === 200) {
        const userData = (result as any).data?.data?.user
        const token = (result as any).data?.data?.token
        
        // 保存用户信息
        Taro.setStorageSync('tianba_user', JSON.stringify(userData))
        Taro.setStorageSync('tianba_token', token)
        Taro.setStorageSync('tianba_wechat_bound', 'true')
        
        // 清除 URL 中的 code 参数
        const url = new URL(window.location.href)
        url.searchParams.delete('code')
        url.searchParams.delete('state')
        window.history.replaceState({}, '', url.toString())
        
        Taro.showToast({ title: '登录成功', icon: 'success' })
        onSuccess(userData)
      }
    } catch (err) {
      console.error('微信登录失败:', err)
      Taro.showToast({ title: '登录失败，请重试', icon: 'none' })
    } finally {
      setLoading(false)
    }
  }

  if (!visible) return null

  return (
    <View className="wechat-modal-overlay" onClick={onClose}>
      <View className="wechat-modal-content" onClick={(e) => e.stopPropagation()}>
        <View className="wechat-modal-header">
          <Text className="wechat-modal-title">微信登录</Text>
          <View className="wechat-modal-close" onClick={onClose}>
            <X size={20} color="#666" />
          </View>
        </View>
        
        <View className="wechat-modal-body">
          {loading ? (
            <View className="wechat-loading">
              <Loader size={32} color="#F97316" className="animate-spin" />
              <Text className="wechat-loading-text">正在加载...</Text>
            </View>
          ) : isWechat ? (
            // 微信内环境：显示授权按钮
            <View className="wechat-auth-container">
              <Smartphone size={64} color="#07C160" />
              <Text className="wechat-auth-title">微信快捷登录</Text>
              <Text className="wechat-auth-desc">点击按钮授权登录，绑定微信账号</Text>
              <Button className="wechat-auth-button" onClick={handleWechatAuth}>
                <Text className="wechat-auth-button-text">微信授权登录</Text>
              </Button>
            </View>
          ) : (
            // 非微信环境：显示二维码
            <View className="wechat-qrcode-container">
              {qrCodeUrl ? (
                <>
                  <Image 
                    className="wechat-qrcode"
                    src={qrCodeUrl}
                    mode="aspectFit"
                  />
                  <Text className="wechat-qrcode-hint">请使用微信扫码登录</Text>
                </>
              ) : (
                <Text className="wechat-qrcode-error">二维码加载失败</Text>
              )}
              <View className="wechat-divider">
                <View className="wechat-divider-line" />
                <Text className="wechat-divider-text">或</Text>
                <View className="wechat-divider-line" />
              </View>
              <Button className="wechat-phone-button" onClick={handleWechatAuth}>
                <Text className="wechat-phone-button-text">在微信中打开</Text>
              </Button>
            </View>
          )}
        </View>
      </View>
    </View>
  )
}

export default WechatLoginModal
