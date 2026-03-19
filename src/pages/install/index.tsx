import { View, Text, Image } from '@tarojs/components'
import { useState, useEffect } from 'react'
import Taro from '@tarojs/taro'
import { Share2, Plus } from 'lucide-react-taro'
import type { FC } from 'react'
import './index.css'

const InstallPage: FC = () => {
  const [showGuide, setShowGuide] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)
  const isH5 = Taro.getEnv() !== Taro.ENV_TYPE.WEAPP

  useEffect(() => {
    if (!isH5) {
      Taro.redirectTo({ url: '/pages/login/index' })
      return
    }

    // 检测是否已经是PWA模式
    const isInStandaloneMode = window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true
    setIsStandalone(isInStandaloneMode)

    if (isInStandaloneMode) {
      Taro.redirectTo({ url: '/pages/login/index' })
    }
  }, [isH5])

  if (isStandalone) return null

  // 直接使用（不安装）
  const handleUseNow = () => {
    Taro.redirectTo({ url: '/pages/login/index' })
  }

  return (
    <View className="install-page">
      {/* 顶部品牌区域 */}
      <View className="brand-area">
        <View className="app-icon">
          <Image 
            src="/icons/icon-192.png" 
            className="w-full h-full"
            mode="aspectFit"
          />
        </View>
        <Text className="app-name">天霸私厨</Text>
        <Text className="app-slogan">家庭智慧烹饪助手</Text>
      </View>

      {!showGuide ? (
        /* 首屏：两个按钮 */
        <View className="action-area">
          <View className="install-btn" onClick={() => setShowGuide(true)}>
            <View className="btn-icon">
              <Plus size={24} color="#fff" />
            </View>
            <View className="btn-text">
              <Text className="btn-title">添加到主屏幕</Text>
              <Text className="btn-desc">获得原生App体验</Text>
            </View>
          </View>

          <View className="use-btn" onClick={handleUseNow}>
            <Text className="use-btn-text">直接在浏览器中使用</Text>
          </View>

          <Text className="hint-text">
            推荐安装到主屏幕，体验更流畅
          </Text>
        </View>
      ) : (
        /* 安装指引 */
        <View className="guide-area">
          <View className="guide-card">
            <View className="guide-step">
              <View className="step-num">1</View>
              <View className="step-content">
                <Text className="step-title">点击分享按钮</Text>
                <Text className="step-desc">在Safari底部找到</Text>
                <View className="step-icon">
                  <Share2 size={24} color="#007AFF" style={{ transform: 'rotate(90deg)' }} />
                </View>
              </View>
            </View>

            <View className="guide-step">
              <View className="step-num">2</View>
              <View className="step-content">
                <Text className="step-title">选择「添加到主屏幕」</Text>
                <Text className="step-desc">在弹出菜单中找到</Text>
              </View>
            </View>

            <View className="guide-step">
              <View className="step-num">3</View>
              <View className="step-content">
                <Text className="step-title">点击「添加」</Text>
                <Text className="step-desc">图标会出现在主屏幕</Text>
              </View>
            </View>
          </View>

          <View className="guide-btns">
            <View className="done-btn" onClick={handleUseNow}>
              <Text className="done-btn-text">完成安装，开始使用</Text>
            </View>
            <View className="back-btn" onClick={() => setShowGuide(false)}>
              <Text className="back-btn-text">返回</Text>
            </View>
          </View>
        </View>
      )}
    </View>
  )
}

export default InstallPage
