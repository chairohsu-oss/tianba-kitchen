import { View, Text, Image } from '@tarojs/components'
import { useState, useEffect } from 'react'
import Taro from '@tarojs/taro'
import { Share, Plus, ChevronRight } from 'lucide-react-taro'
import type { FC } from 'react'
import './index.css'

const InstallPage: FC = () => {
  const [isIOS, setIsIOS] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)
  const [step, setStep] = useState(1)
  const isH5 = Taro.getEnv() !== Taro.ENV_TYPE.WEAPP

  useEffect(() => {
    // 仅在H5端执行检测
    if (!isH5) {
      // 小程序端直接跳转到登录页
      Taro.redirectTo({ url: '/pages/login/index' })
      return
    }

    // 检测是否是iOS设备
    const ua = navigator.userAgent.toLowerCase()
    const isIOSDevice = /iphone|ipad|ipod/.test(ua)
    setIsIOS(isIOSDevice)

    // 检测是否已经是standalone模式
    const isInStandaloneMode = window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true
    setIsStandalone(isInStandaloneMode)

    // 如果已经是PWA模式，跳转到首页
    if (isInStandaloneMode) {
      Taro.redirectTo({ url: '/pages/home/index' })
    }
  }, [isH5])

  // 如果已经是standalone模式，不显示此页面
  if (isStandalone) {
    return null
  }

  const handleStart = () => {
    if (isIOS) {
      setStep(2)
    } else {
      // 非iOS设备直接跳转
      Taro.redirectTo({ url: '/pages/home/index' })
    }
  }

  const handleContinue = () => {
    Taro.redirectTo({ url: '/pages/home/index' })
  }

  return (
    <View className="flex flex-col h-screen bg-white">
      {/* 顶部装饰 */}
      <View 
        className="h-64 flex items-center justify-center"
        style={{
          background: 'linear-gradient(135deg, #F97316 0%, #EA580C 100%)'
        }}
      >
        <View className="flex flex-col items-center">
          <View 
            className="w-24 h-24 rounded-3xl flex items-center justify-center mb-4"
            style={{
              backgroundColor: 'white',
              boxShadow: '0 10px 40px rgba(0,0,0,0.2)'
            }}
          >
            <Image 
              src="/icons/icon-192.png" 
              className="w-20 h-20"
              mode="aspectFit"
            />
          </View>
          <Text className="text-white text-2xl font-bold">天霸私厨</Text>
          <Text className="text-white/80 text-sm mt-1">家庭智慧烹饪助手</Text>
        </View>
      </View>

      {/* 内容区域 */}
      <View className="flex-1 px-6 py-8 flex flex-col">
        {step === 1 ? (
          <>
            <Text className="text-xl font-bold text-gray-800 text-center mb-2">
              欢迎使用天霸私厨
            </Text>
            <Text className="text-gray-500 text-center mb-8">
              AI智能推荐菜品，轻松管理家庭菜单
            </Text>

            {/* 功能列表 */}
            <View className="space-y-4 mb-8">
              <View className="flex items-center gap-3 p-4 bg-orange-50 rounded-xl">
                <Text className="text-2xl">🍳</Text>
                <View className="flex-1">
                  <Text className="text-gray-800 font-medium">好帮手</Text>
                  <Text className="text-gray-500 text-sm">AI智能推荐，语音点菜</Text>
                </View>
              </View>
              <View className="flex items-center gap-3 p-4 bg-blue-50 rounded-xl">
                <Text className="text-2xl">📚</Text>
                <View className="flex-1">
                  <Text className="text-gray-800 font-medium">菜品库</Text>
                  <Text className="text-gray-500 text-sm">家庭菜品轻松管理</Text>
                </View>
              </View>
              <View className="flex items-center gap-3 p-4 bg-green-50 rounded-xl">
                <Text className="text-2xl">📝</Text>
                <View className="flex-1">
                  <Text className="text-gray-800 font-medium">美味记录</Text>
                  <Text className="text-gray-500 text-sm">记录每一次美味时刻</Text>
                </View>
              </View>
            </View>

            {/* 开始按钮 */}
            <View className="mt-auto">
              <View
                className="py-4 rounded-full flex items-center justify-center"
                style={{
                  background: 'linear-gradient(135deg, #F97316 0%, #EA580C 100%)'
                }}
                onClick={handleStart}
              >
                <Text className="text-white font-bold text-lg">开始使用</Text>
              </View>
              <Text className="text-gray-400 text-xs text-center mt-3">
                点击后将引导您安装应用到主屏幕
              </Text>
            </View>
          </>
        ) : (
          <>
            {/* 安装指引 */}
            <Text className="text-xl font-bold text-gray-800 text-center mb-2">
              添加到主屏幕
            </Text>
            <Text className="text-gray-500 text-center mb-8">
              获得原生App体验，随时访问
            </Text>

            {/* 步骤说明 */}
            <View className="space-y-4 mb-8">
              <View className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                <View className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center">
                  <Share size={20} color="#fff" style={{ transform: 'rotate(90deg)' }} />
                </View>
                <View className="flex-1">
                  <Text className="text-gray-800 font-medium">第一步：点击分享按钮</Text>
                  <Text className="text-gray-500 text-sm">在Safari底部工具栏找到分享图标</Text>
                </View>
                <ChevronRight size={20} color="#9CA3AF" />
              </View>

              <View className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                <View className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center">
                  <Plus size={20} color="#fff" />
                </View>
                <View className="flex-1">
                  <Text className="text-gray-800 font-medium">第二步：选择「添加到主屏幕」</Text>
                  <Text className="text-gray-500 text-sm">在弹出的菜单中找到此选项</Text>
                </View>
                <ChevronRight size={20} color="#9CA3AF" />
              </View>

              <View className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                <View className="w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center">
                  <Text className="text-white font-bold">✓</Text>
                </View>
                <View className="flex-1">
                  <Text className="text-gray-800 font-medium">第三步：点击「添加」</Text>
                  <Text className="text-gray-500 text-sm">应用图标将出现在主屏幕上</Text>
                </View>
                <ChevronRight size={20} color="#9CA3AF" />
              </View>
            </View>

            {/* 模拟演示 */}
            <View className="flex justify-center mb-8">
              <View 
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-full"
                style={{ animation: 'bounce 2s infinite' }}
              >
                <Share size={18} color="#3B82F6" style={{ transform: 'rotate(90deg)' }} />
                <Text className="text-gray-600 text-sm">点击这里 ↑</Text>
              </View>
            </View>

            {/* 继续按钮 */}
            <View className="mt-auto">
              <View
                className="py-4 rounded-full flex items-center justify-center bg-gray-800"
                onClick={handleContinue}
              >
                <Text className="text-white font-bold text-lg">我已经添加了，继续</Text>
              </View>
              <Text className="text-gray-400 text-xs text-center mt-3">
                添加后从主屏幕打开效果最佳
              </Text>
            </View>
          </>
        )}
      </View>

      {/* 底部安全区域 */}
      <View style={{ height: '20px' }} />
    </View>
  )
}

export default InstallPage
