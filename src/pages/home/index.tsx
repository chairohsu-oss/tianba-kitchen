import { View, Text, Image, ScrollView, Input } from '@tarojs/components'
import { useState, useEffect, useRef } from 'react'
import Taro from '@tarojs/taro'
import { Mic, Keyboard, ChefHat, X, Loader, Send, Sparkles } from 'lucide-react-taro'
import { Network } from '@/network'
import type { FC } from 'react'
import './index.css'

// 消息类型
interface Message {
  id: string
  type: 'user' | 'ai'
  content: string
  timestamp: number
}

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
  const recorderManagerRef = useRef<Taro.RecorderManager | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [recommendResult, setRecommendResult] = useState<RecommendResult | null>(null)
  const [selectedDishes, setSelectedDishes] = useState<SelectedDishes>({
    meat: null,
    vegetable: null,
    soup: null
  })
  const [showCookingDetail, setShowCookingDetail] = useState(false)
  const [cookingMethods, setCookingMethods] = useState<CookingMethod[]>([])
  const [loadingCooking, setLoadingCooking] = useState(false)

  const scrollViewRef = useRef<string>('')

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
        handleVoiceInput(res.tempFilePath)
      })
      manager.onError((err) => {
        console.error('录音错误', err)
        Taro.showToast({ title: '录音失败', icon: 'none' })
        setIsRecording(false)
      })
      recorderManagerRef.current = manager
    }
  }, [isWeapp])

  // 添加消息
  const addMessage = (type: 'user' | 'ai', content: string) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      type,
      content,
      timestamp: Date.now()
    }
    setMessages(prev => [...prev, newMessage])
    scrollViewRef.current = `msg-${newMessage.id}`
  }

  // 处理语音输入
  const handleVoiceInput = async (audioPath: string) => {
    setIsLoading(true)
    try {
      const fileSystemManager = Taro.getFileSystemManager()
      const arrayBuffer = fileSystemManager.readFileSync(audioPath)
      const base64 = Taro.arrayBufferToBase64(arrayBuffer as ArrayBuffer)

      const asrResult = await Network.request({
        url: '/api/voice/recognize',
        method: 'POST',
        data: { audioData: base64 }
      })

      const recognizedText = (asrResult as any).data?.text || ''
      if (recognizedText) {
        setTextInput(recognizedText)
        addMessage('user', recognizedText)
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
    recorderManagerRef.current?.start({
      format: 'wav',
      sampleRate: 16000,
      numberOfChannels: 1
    })
  }

  // 停止录音
  const stopRecording = () => {
    recorderManagerRef.current?.stop()
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
      addMessage('ai', `根据您的食材"${ingredients}"，为您推荐以下搭配：`)
    } catch (error) {
      console.error('获取推荐失败', error)
      addMessage('ai', '抱歉，获取推荐失败，请稍后再试。')
    } finally {
      setIsLoading(false)
    }
  }

  // 发送文本消息
  const sendMessage = () => {
    if (!textInput.trim()) return
    addMessage('user', textInput)
    getRecommendations(textInput)
    setTextInput('')
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
      addMessage('ai', `已为您生成「${meat.name}」「${vegetable.name}」「${soup.name}」的详细做法`)
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
    setMessages([])
  }

  const typeNames = {
    meat: '荤菜',
    vegetable: '素菜',
    soup: '汤品'
  }

  const typeColors = {
    meat: 'bg-indigo-500',
    vegetable: 'bg-emerald-500',
    soup: 'bg-blue-500'
  }

  return (
    <View className="flex flex-col h-screen bg-gray-50">
      {/* 消息区域 */}
      <ScrollView 
        scrollY 
        className="flex-1 px-4 py-4"
        scrollIntoView={scrollViewRef.current}
        scrollWithAnimation
      >
        {/* 欢迎消息 */}
        {messages.length === 0 && (
          <View className="flex flex-col items-center justify-center py-12">
            <View className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center mb-4">
              <Sparkles size={32} color="#6366F1" />
            </View>
            <Text className="block text-lg font-semibold text-gray-800 mb-2">
              天霸家厨房
            </Text>
            <Text className="block text-sm text-gray-500 text-center">
              告诉我您今天有什么食材{'\n'}我来为您推荐今日菜单
            </Text>
          </View>
        )}

        {/* 消息列表 */}
        {messages.map(msg => (
          <View key={msg.id} id={`msg-${msg.id}`} className="mb-4">
            {msg.type === 'user' ? (
              <View className="flex flex-row justify-end">
                <View className="bg-indigo-500 rounded-2xl rounded-br-sm px-4 py-3 max-w-[80%]">
                  <Text className="text-white text-sm leading-relaxed">{msg.content}</Text>
                </View>
              </View>
            ) : (
              <View className="flex flex-row justify-start">
                <View className="bg-white rounded-2xl rounded-bl-sm px-4 py-3 max-w-[85%] shadow-sm">
                  <Text className="text-gray-800 text-sm leading-relaxed">{msg.content}</Text>
                </View>
              </View>
            )}
          </View>
        ))}

        {/* 加载状态 */}
        {isLoading && (
          <View className="flex flex-row justify-start mb-4">
            <View className="bg-white rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
              <View className="flex flex-row items-center">
                <Loader size={16} color="#6366F1" className="animate-spin" />
                <Text className="text-gray-500 text-sm ml-2">正在思考...</Text>
              </View>
            </View>
          </View>
        )}

        {/* 推荐结果 */}
        {!isLoading && recommendResult && !showCookingDetail && (
          <View className="bg-white rounded-2xl p-4 shadow-sm mb-4">
            {(['meat', 'vegetable', 'soup'] as const).map(type => (
              <View key={type} className="mb-4 last:mb-0">
                <View className="flex flex-row items-center mb-2">
                  <View className={`w-1.5 h-4 rounded-full ${typeColors[type]} mr-2`} />
                  <Text className="block text-sm font-medium text-gray-700">{typeNames[type]}</Text>
                </View>
                <View className="flex flex-row gap-2">
                  {recommendResult[type].map(dish => (
                    <View
                      key={dish.id}
                      className={`flex-1 rounded-xl overflow-hidden border-2 ${selectedDishes[type]?.id === dish.id ? 'border-indigo-500' : 'border-transparent'}`}
                      onClick={() => selectDish(type, dish)}
                    >
                      <Image
                        className="w-full h-20"
                        src={dish.image}
                        mode="aspectFill"
                      />
                      <View className="bg-white p-2">
                        <Text className="block text-xs font-medium text-gray-800 truncate text-center">
                          {dish.name}
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            ))}

            {/* 确认按钮 */}
            <View className="flex flex-row gap-3 mt-4 pt-4 border-t border-gray-100">
              <View
                className="flex-1 bg-gray-100 rounded-full py-2.5 flex items-center justify-center"
                onClick={resetAll}
              >
                <Text className="text-gray-600 text-sm font-medium">重新选择</Text>
              </View>
              <View
                className={`flex-1 bg-indigo-500 rounded-full py-2.5 flex items-center justify-center ${loadingCooking ? 'opacity-50' : ''}`}
                onClick={loadingCooking ? undefined : confirmSelection}
              >
                {loadingCooking ? (
                  <View className="flex flex-row items-center">
                    <Loader size={14} color="#fff" className="animate-spin" />
                    <Text className="text-white text-sm font-medium ml-1">加载中...</Text>
                  </View>
                ) : (
                  <Text className="text-white text-sm font-medium">查看做法</Text>
                )}
              </View>
            </View>
          </View>
        )}

        {/* 制作方式详情 */}
        {showCookingDetail && cookingMethods.length > 0 && (
          <View className="mb-4">
            <View className="flex flex-row items-center justify-between mb-3">
              <Text className="block text-base font-semibold text-gray-800">
                详细做法
              </Text>
              <View onClick={resetAll} className="p-1">
                <X size={18} color="#9CA3AF" />
              </View>
            </View>

            {cookingMethods.map((method, index) => (
              <View key={index} className="bg-white rounded-2xl p-4 shadow-sm mb-3">
                <View className="flex flex-row items-center mb-3">
                  <ChefHat size={18} color="#6366F1" />
                  <Text className="block text-base font-semibold text-gray-800 ml-2">
                    {method.name}
                  </Text>
                </View>

                {method.image && (
                  <Image
                    className="w-full h-36 rounded-xl mb-3"
                    src={method.image}
                    mode="aspectFill"
                  />
                )}

                <View className="mb-3">
                  <Text className="block text-xs font-medium text-gray-700 mb-1">食材</Text>
                  <Text className="block text-xs text-gray-600">{method.ingredients.join('、')}</Text>
                </View>

                <View className="mb-3">
                  <Text className="block text-xs font-medium text-gray-700 mb-1">步骤</Text>
                  {method.steps.map((step, i) => (
                    <Text key={i} className="block text-xs text-gray-600 mb-1">
                      {i + 1}. {step}
                    </Text>
                  ))}
                </View>

                {method.tips && (
                  <View className="bg-indigo-50 rounded-lg p-2">
                    <Text className="block text-xs text-indigo-600">💡 {method.tips}</Text>
                  </View>
                )}
              </View>
            ))}
          </View>
        )}

        {/* 底部占位 */}
        <View className="h-20" />
      </ScrollView>

      {/* 底部输入框 - 豆包风格 */}
      <View 
        className="fixed left-0 right-0 bg-white border-t border-gray-100 px-3 py-2"
        style={{ bottom: 50 }}
      >
        <View className="flex flex-row items-center gap-2">
          {/* 左侧：语音按钮 / 发送按钮 */}
          {inputMode === 'voice' ? (
            <View
              className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${isRecording ? 'bg-indigo-500' : 'bg-indigo-50'}`}
              onTouchStart={startRecording}
              onTouchEnd={stopRecording}
            >
              <Mic size={20} color={isRecording ? '#fff' : '#6366F1'} />
            </View>
          ) : (
            <View
              className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${textInput.trim() ? 'bg-indigo-500' : 'bg-gray-100'}`}
              onClick={textInput.trim() ? sendMessage : undefined}
            >
              <Send size={18} color={textInput.trim() ? '#fff' : '#9CA3AF'} />
            </View>
          )}

          {/* 中间：输入区域 */}
          {inputMode === 'voice' ? (
            <View
              className="flex-1 bg-gray-50 rounded-full px-4 py-2.5 min-h-[40px] flex items-center justify-center"
              onTouchStart={startRecording}
              onTouchEnd={stopRecording}
            >
              <Text className={`text-sm ${isRecording ? 'text-indigo-500 font-medium' : 'text-gray-400'}`}>
                {isRecording ? '松开发送，上滑取消' : '按住 说话'}
              </Text>
            </View>
          ) : (
            <View className="flex-1 bg-gray-50 rounded-full px-4 py-0 min-h-[40px] flex items-center">
              <Input
                className="w-full text-sm"
                placeholder="告诉我您有什么食材..."
                value={textInput}
                onInput={(e) => setTextInput(e.detail.value)}
                onConfirm={sendMessage}
                confirmType="send"
              />
            </View>
          )}

          {/* 右侧：模式切换按钮 */}
          <View
            className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0"
            onClick={() => setInputMode(inputMode === 'voice' ? 'keyboard' : 'voice')}
          >
            {inputMode === 'voice' ? (
              <Keyboard size={18} color="#6B7280" />
            ) : (
              <Mic size={18} color="#6B7280" />
            )}
          </View>
        </View>

        {/* H5提示 */}
        {!isWeapp && inputMode === 'voice' && (
          <Text className="block text-xs text-gray-400 text-center mt-1">
            H5端不支持录音，请切换键盘输入
          </Text>
        )}
      </View>
    </View>
  )
}

export default HomePage
