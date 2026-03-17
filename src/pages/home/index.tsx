import { View, Text, Image, ScrollView, Input } from '@tarojs/components'
import { useState, useEffect } from 'react'
import Taro from '@tarojs/taro'
import { Mic, Keyboard, Search, ChefHat, X, Loader } from 'lucide-react-taro'
import { Network } from '@/network'
import type { FC } from 'react'
import './index.css'

// 菜品推荐类型
interface DishRecommend {
  id: string
  name: string
  type: 'meat' | 'vegetable' | 'soup'
  image: string
  description: string
}

// 推荐结果类型
interface RecommendResult {
  meat: DishRecommend[]
  vegetable: DishRecommend[]
  soup: DishRecommend[]
}

// 已选择的菜品
interface SelectedDishes {
  meat: DishRecommend | null
  vegetable: DishRecommend | null
  soup: DishRecommend | null
}

// 制作方式类型
interface CookingMethod {
  name: string
  image: string
  ingredients: string[]
  steps: string[]
  tips: string
  sourceUrl?: string
}

const HomePage: FC = () => {
  const [inputMode, setInputMode] = useState<'voice' | 'keyboard'>('voice')
  const [textInput, setTextInput] = useState('')
  const [isRecording, setIsRecording] = useState(false)
  const [recorderManager, setRecorderManager] = useState<Taro.RecorderManager | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [recommendResult, setRecommendResult] = useState<RecommendResult | null>(null)
  const [selectedDishes, setSelectedDishes] = useState<SelectedDishes>({
    meat: null,
    vegetable: null,
    soup: null
  })
  const [showCookingDetail, setShowCookingDetail] = useState(false)
  const [cookingMethods, setCookingMethods] = useState<CookingMethod[]>([])
  const [loadingCooking, setLoadingCooking] = useState(false)

  const isWeapp = Taro.getEnv() === Taro.ENV_TYPE.WEAPP

  // 初始化录音管理器
  useEffect(() => {
    if (isWeapp) {
      const manager = Taro.getRecorderManager()
      manager.onStart(() => {
        setIsRecording(true)
      })
      manager.onStop((res) => {
        setIsRecording(false)
        // 处理录音结果
        handleVoiceInput(res.tempFilePath)
      })
      manager.onError((err) => {
        console.error('录音错误', err)
        Taro.showToast({ title: '录音失败', icon: 'none' })
        setIsRecording(false)
      })
      setRecorderManager(manager)
    }
  }, [isWeapp])

  // 处理语音输入
  const handleVoiceInput = async (audioPath: string) => {
    setIsLoading(true)
    try {
      // 读取音频文件
      const fileSystemManager = Taro.getFileSystemManager()
      const arrayBuffer = fileSystemManager.readFileSync(audioPath)
      const base64 = Taro.arrayBufferToBase64(arrayBuffer as ArrayBuffer)

      // 调用语音识别接口
      const asrResult = await Network.request({
        url: '/api/voice/recognize',
        method: 'POST',
        data: { audioData: base64 }
      })

      const recognizedText = (asrResult as any).data?.text || ''
      setTextInput(recognizedText)

      // 获取推荐
      if (recognizedText) {
        await getRecommendations(recognizedText)
      }
    } catch (error) {
      console.error('语音识别失败', error)
      Taro.showToast({ title: '语音识别失败，请使用键盘输入', icon: 'none' })
    } finally {
      setIsLoading(false)
    }
  }

  // 开始录音
  const startRecording = () => {
    if (!isWeapp) {
      Taro.showToast({ title: 'H5端暂不支持录音，请使用键盘输入', icon: 'none' })
      return
    }
    recorderManager?.start({
      format: 'wav',
      sampleRate: 16000,
      numberOfChannels: 1
    })
  }

  // 停止录音
  const stopRecording = () => {
    recorderManager?.stop()
  }

  // 获取AI推荐
  const getRecommendations = async (ingredients: string) => {
    setIsLoading(true)
    try {
      const result = await Network.request({
        url: '/api/ai/recommend',
        method: 'POST',
        data: { ingredients }
      })
      setRecommendResult((result as any).data)
      setSelectedDishes({ meat: null, vegetable: null, soup: null })
    } catch (error) {
      console.error('获取推荐失败', error)
      Taro.showToast({ title: '获取推荐失败', icon: 'none' })
    } finally {
      setIsLoading(false)
    }
  }

  // 选择菜品
  const selectDish = (type: 'meat' | 'vegetable' | 'soup', dish: DishRecommend) => {
    setSelectedDishes(prev => ({
      ...prev,
      [type]: prev[type]?.id === dish.id ? null : dish
    }))
  }

  // 确认选择，获取制作方式
  const confirmSelection = async () => {
    const { meat, vegetable, soup } = selectedDishes
    if (!meat || !vegetable || !soup) {
      Taro.showToast({ title: '请选择完整的三道菜', icon: 'none' })
      return
    }

    setLoadingCooking(true)
    try {
      const result = await Network.request({
        url: '/api/ai/cooking-methods',
        method: 'POST',
        data: {
          dishes: [meat.name, vegetable.name, soup.name]
        }
      })
      setCookingMethods((result as any).data)
      setShowCookingDetail(true)
    } catch (error) {
      console.error('获取制作方式失败', error)
      Taro.showToast({ title: '获取制作方式失败', icon: 'none' })
    } finally {
      setLoadingCooking(false)
    }
  }

  // 重新开始
  const resetAll = () => {
    setTextInput('')
    setRecommendResult(null)
    setSelectedDishes({ meat: null, vegetable: null, soup: null })
    setShowCookingDetail(false)
    setCookingMethods([])
  }

  const typeNames = {
    meat: '荤菜',
    vegetable: '素菜',
    soup: '汤品'
  }

  const typeColors = {
    meat: 'bg-orange-500',
    vegetable: 'bg-green-500',
    soup: 'bg-blue-500'
  }

  return (
    <View className="flex flex-col min-h-screen bg-gray-50">
      {/* 顶部输入区域 */}
      <View className="bg-white p-4 shadow-sm">
        <Text className="block text-lg font-semibold text-gray-800 mb-3">
          告诉我你今天有什么食材
        </Text>

        {/* 输入模式切换 */}
        <View className="flex flex-row gap-2 mb-3">
          <View
            className={`flex-row items-center px-3 py-2 rounded-full ${inputMode === 'voice' ? 'bg-orange-50 border border-orange-200' : 'bg-gray-100'}`}
            onClick={() => setInputMode('voice')}
          >
            <Mic size={16} color={inputMode === 'voice' ? '#FF6B35' : '#6B7280'} />
            <Text className={`ml-1 text-sm ${inputMode === 'voice' ? 'text-orange-500' : 'text-gray-500'}`}>
              语音输入
            </Text>
          </View>
          <View
            className={`flex-row items-center px-3 py-2 rounded-full ${inputMode === 'keyboard' ? 'bg-orange-50 border border-orange-200' : 'bg-gray-100'}`}
            onClick={() => setInputMode('keyboard')}
          >
            <Keyboard size={16} color={inputMode === 'keyboard' ? '#FF6B35' : '#6B7280'} />
            <Text className={`ml-1 text-sm ${inputMode === 'keyboard' ? 'text-orange-500' : 'text-gray-500'}`}>
              键盘输入
            </Text>
          </View>
        </View>

        {/* 输入区域 */}
        {inputMode === 'voice' ? (
          <View className="flex flex-col items-center py-6">
            {isWeapp ? (
              <>
                <View
                  className={`w-20 h-20 rounded-full flex items-center justify-center ${isRecording ? 'bg-orange-500' : 'bg-orange-100'}`}
                  onTouchStart={startRecording}
                  onTouchEnd={stopRecording}
                >
                  <Mic size={32} color={isRecording ? '#fff' : '#FF6B35'} />
                </View>
                <Text className="block text-sm text-gray-500 mt-3">
                  {isRecording ? '正在录音，松开结束...' : '按住说话'}
                </Text>
              </>
            ) : (
              <View className="flex flex-col items-center py-4 bg-gray-50 rounded-xl w-full">
                <Text className="block text-gray-500 text-center">
                  语音功能仅在小程序中可用{'\n'}请使用键盘输入
                </Text>
              </View>
            )}
          </View>
        ) : (
          <View className="flex flex-row gap-2">
            <View className="flex-1 bg-gray-50 rounded-xl px-4 py-3 border border-gray-100">
              <Input
                className="w-full bg-transparent text-base"
                placeholder="例如：有土豆、西红柿、鸡蛋、排骨..."
                value={textInput}
                onInput={(e) => setTextInput(e.detail.value)}
              />
            </View>
            <View
              className="bg-orange-500 rounded-xl px-4 flex items-center justify-center"
              onClick={() => textInput && getRecommendations(textInput)}
            >
              <Search size={20} color="#fff" />
            </View>
          </View>
        )}
      </View>

      {/* 加载状态 */}
      {isLoading && (
        <View className="flex flex-col items-center justify-center py-16">
          <Loader size={32} color="#FF6B35" className="animate-spin" />
          <Text className="block text-gray-500 mt-3">正在分析食材并生成推荐...</Text>
        </View>
      )}

      {/* 推荐结果 */}
      {!isLoading && recommendResult && !showCookingDetail && (
        <ScrollView scrollY className="flex-1 p-4">
          <Text className="block text-lg font-semibold text-gray-800 mb-4">
            为您推荐今日菜单
          </Text>

          {(['meat', 'vegetable', 'soup'] as const).map(type => (
            <View key={type} className="mb-6">
              <View className="flex flex-row items-center mb-3">
                <View className={`w-1 h-5 rounded-full ${typeColors[type]} mr-2`} />
                <Text className="block font-medium text-gray-700">{typeNames[type]}</Text>
              </View>
              <View className="flex flex-row gap-3">
                {recommendResult[type].map(dish => (
                  <View
                    key={dish.id}
                    className={`flex-1 bg-white rounded-xl overflow-hidden shadow-sm border-2 ${selectedDishes[type]?.id === dish.id ? 'border-orange-500' : 'border-transparent'}`}
                    onClick={() => selectDish(type, dish)}
                  >
                    <Image
                      className="w-full h-24"
                      src={dish.image}
                      mode="aspectFill"
                    />
                    <View className="p-2">
                      <Text className="block text-sm font-medium text-gray-800 truncate">
                        {dish.name}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          ))}

          {/* 确认按钮 */}
          <View className="flex flex-row gap-3 mt-4">
            <View
              className="flex-1 bg-white border border-gray-200 rounded-full py-3 flex items-center justify-center"
              onClick={resetAll}
            >
              <Text className="text-gray-600 font-medium">重新选择</Text>
            </View>
            <View
              className={`flex-1 bg-orange-500 rounded-full py-3 flex items-center justify-center ${loadingCooking ? 'opacity-50' : ''}`}
              onClick={loadingCooking ? undefined : confirmSelection}
            >
              {loadingCooking ? (
                <View className="flex flex-row items-center">
                  <Loader size={16} color="#fff" className="animate-spin" />
                  <Text className="text-white font-medium ml-2">加载中...</Text>
                </View>
              ) : (
                <Text className="text-white font-medium">查看做法</Text>
              )}
            </View>
          </View>
        </ScrollView>
      )}

      {/* 制作方式详情 */}
      {showCookingDetail && cookingMethods.length > 0 && (
        <ScrollView scrollY className="flex-1 p-4">
          <View className="flex flex-row items-center justify-between mb-4">
            <Text className="block text-lg font-semibold text-gray-800">
              制作方式
            </Text>
            <View onClick={resetAll}>
              <X size={20} color="#6B7280" />
            </View>
          </View>

          {cookingMethods.map((method, index) => (
            <View key={index} className="bg-white rounded-2xl p-4 shadow-sm mb-4">
              <View className="flex flex-row items-center mb-3">
                <ChefHat size={20} color="#FF6B35" />
                <Text className="block text-lg font-semibold text-gray-800 ml-2">
                  {method.name}
                </Text>
              </View>

              {method.image && (
                <Image
                  className="w-full h-40 rounded-xl mb-3"
                  src={method.image}
                  mode="aspectFill"
                />
              )}

              <View className="mb-3">
                <Text className="block text-sm font-medium text-gray-700 mb-1">食材</Text>
                <Text className="block text-sm text-gray-600">{method.ingredients.join('、')}</Text>
              </View>

              <View className="mb-3">
                <Text className="block text-sm font-medium text-gray-700 mb-1">步骤</Text>
                {method.steps.map((step, i) => (
                  <Text key={i} className="block text-sm text-gray-600 mb-1">
                    {i + 1}. {step}
                  </Text>
                ))}
              </View>

              {method.tips && (
                <View className="bg-orange-50 rounded-lg p-3">
                  <Text className="block text-sm text-orange-600">💡 小贴士：{method.tips}</Text>
                </View>
              )}
            </View>
          ))}
        </ScrollView>
      )}

      {/* 空状态 */}
      {!isLoading && !recommendResult && (
        <View className="flex flex-col items-center justify-center flex-1 py-16">
          <Text className="block text-5xl mb-4">🍳</Text>
          <Text className="block text-gray-500 text-center mb-2">
            告诉我你的食材{'\n'}我来推荐今日菜单
          </Text>
          <Text className="block text-sm text-gray-400">
            语音或键盘输入均可
          </Text>
        </View>
      )}
    </View>
  )
}

export default HomePage
