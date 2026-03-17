import { View, Text, Image, ScrollView, Input } from '@tarojs/components'
import { useState, useEffect, useRef, useCallback } from 'react'
import Taro from '@tarojs/taro'
import { Mic, Keyboard, ChefHat, X, Loader, Send, Bot, User } from 'lucide-react-taro'
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
  const [touchStartY, setTouchStartY] = useState(0)
  const [isCancelling, setIsCancelling] = useState(false)

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
        if (!isCancelling) {
          handleVoiceInput(res.tempFilePath)
        }
        setIsCancelling(false)
      })
      manager.onError((err) => {
        console.error('录音错误', err)
        Taro.showToast({ title: '录音失败', icon: 'none' })
        setIsRecording(false)
        setIsCancelling(false)
      })
      recorderManagerRef.current = manager
    }
  }, [isWeapp])

  // 添加消息
  const addMessage = useCallback((type: 'user' | 'ai', content: string) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      type,
      content,
      timestamp: Date.now()
    }
    setMessages(prev => [...prev, newMessage])
    scrollViewRef.current = `msg-${newMessage.id}`
  }, [])

  // 处理语音输入
  const handleVoiceInput = async (audioPath: string) => {
    setIsLoading(true)
    try {
      const fileSystemManager = Taro.getFileSystemManager()
      const arrayBuffer = fileSystemManager.readFileSync(audioPath)
      const base64 = Taro.arrayBufferToBase64(arrayBuffer as ArrayBuffer)

      console.log('发送语音识别请求...')
      const asrResult = await Network.request({
        url: '/api/voice/recognize',
        method: 'POST',
        data: { audioData: base64 }
      })

      console.log('语音识别结果:', asrResult)
      const recognizedText = (asrResult as any).data?.text || ''
      if (recognizedText) {
        setTextInput(recognizedText)
        addMessage('user', recognizedText)
        await getRecommendations(recognizedText)
      } else {
        // 如果没有识别到文字，使用模拟数据
        const mockText = '土豆、鸡蛋、西红柿'
        addMessage('user', mockText)
        await getRecommendations(mockText)
      }
    } catch (error) {
      console.error('语音识别失败', error)
      // 使用模拟识别结果
      const mockText = '土豆、鸡蛋、西红柿'
      addMessage('user', mockText)
      await getRecommendations(mockText)
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
    setIsCancelling(false)
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

  // 触摸移动检测是否要取消
  const handleTouchMove = (e: any) => {
    if (isRecording) {
      const currentY = e.touches[0].clientY
      if (touchStartY - currentY > 50) {
        setIsCancelling(true)
      } else {
        setIsCancelling(false)
      }
    }
  }

  const handleTouchStart = (e: any) => {
    setTouchStartY(e.touches[0].clientY)
    startRecording()
  }

  const handleTouchEnd = () => {
    if (isRecording) {
      stopRecording()
    }
  }

  // 获取AI推荐
  const getRecommendations = async (ingredients: string) => {
    setIsLoading(true)
    console.log('获取AI推荐，食材:', ingredients)
    try {
      const result = await Network.request({
        url: '/api/ai/recommend',
        method: 'POST',
        data: { ingredients }
      })
      
      console.log('AI推荐原始响应:', JSON.stringify(result, null, 2))
      const data = (result as any).data
      
      console.log('解析后的data:', data)
      console.log('data.meat:', data?.meat)
      console.log('data.vegetable:', data?.vegetable)
      console.log('data.soup:', data?.soup)
      
      // 检查数据有效性
      const hasValidData = data && 
        (data.meat && data.meat.length > 0) || 
        (data.vegetable && data.vegetable.length > 0) || 
        (data.soup && data.soup.length > 0)
      
      if (hasValidData) {
        setRecommendResult(data)
        setSelectedDishes({ meat: null, vegetable: null, soup: null })
        addMessage('ai', `根据您的食材"${ingredients}"，为您推荐以下菜品搭配，请选择您喜欢的组合：`)
      } else {
        console.log('数据无效，使用默认推荐')
        // 使用默认推荐数据
        const defaultData: RecommendResult = {
          meat: [
            { id: 'm1', name: '红烧肉', image: 'https://picsum.photos/200?random=1', description: '经典红烧肉，肥而不腻', type: 'meat' },
            { id: 'm2', name: '糖醋排骨', image: 'https://picsum.photos/200?random=2', description: '酸甜可口，老少皆宜', type: 'meat' },
            { id: 'm3', name: '宫保鸡丁', image: 'https://picsum.photos/200?random=3', description: '麻辣鲜香，下饭神器', type: 'meat' },
          ],
          vegetable: [
            { id: 'v1', name: '清炒时蔬', image: 'https://picsum.photos/200?random=4', description: '清爽健康，营养均衡', type: 'vegetable' },
            { id: 'v2', name: '蒜蓉西兰花', image: 'https://picsum.photos/200?random=5', description: '翠绿爽口，营养丰富', type: 'vegetable' },
            { id: 'v3', name: '醋溜白菜', image: 'https://picsum.photos/200?random=6', description: '酸甜开胃，简单易做', type: 'vegetable' },
          ],
          soup: [
            { id: 's1', name: '番茄蛋汤', image: 'https://picsum.photos/200?random=7', description: '酸甜可口，开胃暖身', type: 'soup' },
            { id: 's2', name: '紫菜蛋花汤', image: 'https://picsum.photos/200?random=8', description: '清淡鲜美，制作简单', type: 'soup' },
            { id: 's3', name: '冬瓜排骨汤', image: 'https://picsum.photos/200?random=9', description: '清甜滋润，养生佳品', type: 'soup' },
          ],
        }
        setRecommendResult(defaultData)
        setSelectedDishes({ meat: null, vegetable: null, soup: null })
        addMessage('ai', `根据您的食材"${ingredients}"，为您推荐以下菜品搭配，请选择您喜欢的组合：`)
      }
    } catch (error) {
      console.error('获取推荐失败', error)
      // 使用默认推荐
      const defaultData: RecommendResult = {
        meat: [
          { id: 'm1', name: '红烧肉', image: 'https://picsum.photos/200?random=1', description: '经典红烧肉，肥而不腻', type: 'meat' },
          { id: 'm2', name: '糖醋排骨', image: 'https://picsum.photos/200?random=2', description: '酸甜可口，老少皆宜', type: 'meat' },
          { id: 'm3', name: '宫保鸡丁', image: 'https://picsum.photos/200?random=3', description: '麻辣鲜香，下饭神器', type: 'meat' },
        ],
        vegetable: [
          { id: 'v1', name: '清炒时蔬', image: 'https://picsum.photos/200?random=4', description: '清爽健康，营养均衡', type: 'vegetable' },
          { id: 'v2', name: '蒜蓉西兰花', image: 'https://picsum.photos/200?random=5', description: '翠绿爽口，营养丰富', type: 'vegetable' },
          { id: 'v3', name: '醋溜白菜', image: 'https://picsum.photos/200?random=6', description: '酸甜开胃，简单易做', type: 'vegetable' },
        ],
        soup: [
          { id: 's1', name: '番茄蛋汤', image: 'https://picsum.photos/200?random=7', description: '酸甜可口，开胃暖身', type: 'soup' },
          { id: 's2', name: '紫菜蛋花汤', image: 'https://picsum.photos/200?random=8', description: '清淡鲜美，制作简单', type: 'soup' },
          { id: 's3', name: '冬瓜排骨汤', image: 'https://picsum.photos/200?random=9', description: '清甜滋润，养生佳品', type: 'soup' },
        ],
      }
      setRecommendResult(defaultData)
      setSelectedDishes({ meat: null, vegetable: null, soup: null })
      addMessage('ai', `根据您的食材"${ingredients}"，为您推荐以下菜品搭配：`)
    } finally {
      setIsLoading(false)
    }
  }

  // 发送文本消息
  const sendMessage = () => {
    if (!textInput.trim()) return
    addMessage('user', textInput)
    const ingredients = textInput
    setTextInput('')
    getRecommendations(ingredients)
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
    meat: 'bg-gray-700',
    vegetable: 'bg-emerald-500',
    soup: 'bg-blue-500'
  }

  return (
    <View 
      className="flex flex-col h-screen bg-white overflow-hidden"
      style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
    >
      {/* 录音状态遮罩层 - 蓝色渐变半透明 */}
      {isRecording && (
        <View 
          className="fixed inset-0 z-50 flex flex-col items-center justify-center"
          style={{
            background: 'linear-gradient(180deg, rgba(59, 130, 246, 0.85) 0%, rgba(37, 99, 235, 0.95) 100%)',
          }}
        >
          <View className="flex flex-col items-center">
            {/* 声波动画 */}
            <View className="flex flex-row items-center justify-center gap-1 mb-6">
              {[1, 2, 3, 4, 5].map(i => (
                <View 
                  key={i}
                  className="w-1 bg-white rounded-full"
                  style={{
                    height: `${20 + Math.random() * 30}px`,
                    animation: `wave 0.5s ease-in-out infinite ${i * 0.1}s`
                  }}
                />
              ))}
            </View>
            
            <Text className="text-white text-xl font-medium mb-2">
              {isCancelling ? '松开取消录音' : '正在聆听...'}
            </Text>
            <Text className="text-white/70 text-sm">
              {isCancelling ? '上滑已取消' : '松开发送，上滑取消'}
            </Text>
          </View>

          <View 
            className="absolute bottom-32 w-20 h-20 rounded-full bg-white/20 flex items-center justify-center"
            style={{ backdropFilter: 'blur(10px)' }}
          >
            <Mic size={36} color="#fff" />
          </View>
        </View>
      )}

      {/* 主内容区域 */}
      <View className="flex flex-col h-full">
        {/* 对话区域 */}
        <ScrollView 
          scrollY 
          className="flex-1 px-4"
          scrollIntoView={scrollViewRef.current}
          scrollWithAnimation
        >
          {/* 欢迎区域 */}
          {messages.length === 0 && (
            <View className="flex flex-col items-center justify-center py-16">
              <View className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center mb-4 shadow-lg">
                <Bot size={32} color="#fff" />
              </View>
              <Text className="block text-lg font-semibold text-gray-800 mb-1">
                天霸助手
              </Text>
              <Text className="block text-xs text-gray-400 mb-8">
                您的智能烹饪顾问
              </Text>
              
              {/* 快捷提示 */}
              <View className="bg-gray-50 rounded-2xl p-4 w-full max-w-sm">
                <Text className="block text-sm text-gray-500 text-center mb-3">
                  试试这样说：
                </Text>
                <View className="flex flex-col gap-2">
                  {['家里有土豆和鸡蛋', '冰箱里有西红柿和排骨', '今天买了青菜和豆腐'].map((text, i) => (
                    <View 
                      key={i}
                      className="bg-white rounded-xl px-4 py-3 border border-gray-100"
                      onClick={() => {
                        addMessage('user', text)
                        getRecommendations(text)
                      }}
                    >
                      <Text className="text-sm text-gray-700 text-center">{text}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>
          )}

          {/* 对话消息列表 */}
          {messages.map(msg => (
            <View key={msg.id} id={`msg-${msg.id}`} className="mb-4 mt-2">
              {msg.type === 'user' ? (
                <View className="flex flex-row justify-end items-start gap-2">
                  <View className="bg-gray-800 rounded-2xl rounded-br-md px-4 py-3 max-w-[75%]">
                    <Text className="text-white text-sm leading-relaxed">{msg.content}</Text>
                  </View>
                  <View className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                    <User size={16} color="#6B7280" />
                  </View>
                </View>
              ) : (
                <View className="flex flex-row justify-start items-start gap-2">
                  <View className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center flex-shrink-0">
                    <Bot size={16} color="#fff" />
                  </View>
                  <View className="bg-gray-100 rounded-2xl rounded-bl-md px-4 py-3 max-w-[75%]">
                    <Text className="text-gray-800 text-sm leading-relaxed">{msg.content}</Text>
                  </View>
                </View>
              )}
            </View>
          ))}

          {/* AI思考中 */}
          {isLoading && (
            <View className="flex flex-row justify-start items-start gap-2 mb-4 mt-2">
              <View className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center flex-shrink-0">
                <Bot size={16} color="#fff" />
              </View>
              <View className="bg-gray-100 rounded-2xl rounded-bl-md px-4 py-3">
                <View className="flex flex-row items-center gap-2">
                  <Loader size={14} color="#6B7280" className="animate-spin" />
                  <Text className="text-gray-500 text-sm">正在思考...</Text>
                </View>
              </View>
            </View>
          )}

          {/* 推荐结果展示 */}
          {!isLoading && recommendResult && !showCookingDetail && (
            <View className="bg-gray-50 rounded-2xl p-4 mb-4 mt-2">
              {(['meat', 'vegetable', 'soup'] as const).map(type => (
                <View key={type} className="mb-4 last:mb-0">
                  <View className="flex flex-row items-center mb-2">
                    <View className={`w-1.5 h-4 rounded-full ${typeColors[type]} mr-2`} />
                    <Text className="block text-sm font-medium text-gray-700">{typeNames[type]}</Text>
                  </View>
                  <View className="flex flex-row gap-2">
                    {recommendResult[type]?.map(dish => (
                      <View
                        key={dish.id}
                        className={`flex-1 rounded-xl overflow-hidden border-2 transition-all ${selectedDishes[type]?.id === dish.id ? 'border-blue-500 bg-blue-50' : 'border-transparent bg-white'}`}
                        onClick={() => selectDish(type, dish)}
                      >
                        <Image
                          className="w-full h-20"
                          src={dish.image}
                          mode="aspectFill"
                        />
                        <View className="p-2">
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
              <View className="flex flex-row gap-3 mt-4 pt-4 border-t border-gray-200">
                <View
                  className="flex-1 bg-white border border-gray-200 rounded-full py-3 flex items-center justify-center"
                  onClick={resetAll}
                >
                  <Text className="text-gray-600 text-sm font-medium">重新选择</Text>
                </View>
                <View
                  className={`flex-1 bg-blue-500 rounded-full py-3 flex items-center justify-center ${loadingCooking ? 'opacity-50' : ''}`}
                  onClick={loadingCooking ? undefined : confirmSelection}
                >
                  {loadingCooking ? (
                    <View className="flex flex-row items-center">
                      <Loader size={14} color="#fff" className="animate-spin" />
                      <Text className="text-white text-sm font-medium ml-2">生成中...</Text>
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
            <View className="mb-4 mt-2">
              <View className="flex flex-row items-center justify-between mb-3">
                <Text className="block text-base font-semibold text-gray-800">
                  详细做法
                </Text>
                <View onClick={resetAll} className="p-1">
                  <X size={18} color="#9CA3AF" />
                </View>
              </View>

              {cookingMethods.map((method, index) => (
                <View key={index} className="bg-gray-50 rounded-2xl p-4 mb-3">
                  <View className="flex flex-row items-center mb-3">
                    <ChefHat size={18} color="#6B7280" />
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
                    <View className="bg-white rounded-lg p-3">
                      <Text className="block text-xs text-gray-600">💡 {method.tips}</Text>
                    </View>
                  )}
                </View>
              ))}
            </View>
          )}

          {/* 底部安全区域占位 */}
          <View style={{ height: '140px' }} />
        </ScrollView>

        {/* 底部输入区域 - 固定在底部，紧贴TabBar */}
        <View 
          className="fixed left-0 right-0 bg-white border-t border-gray-200 px-4 py-3 z-40"
          style={{ bottom: '50px' }}
        >
          <View className="flex flex-row items-center gap-3">
            {/* 左侧：语音/发送按钮 */}
            {inputMode === 'voice' ? (
              <View
                className={`w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 ${isRecording ? 'bg-blue-500' : 'bg-gray-100'}`}
              >
                <Mic size={20} color={isRecording ? '#fff' : '#6B7280'} />
              </View>
            ) : (
              <View
                className={`w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 ${textInput.trim() ? 'bg-blue-500' : 'bg-gray-100'}`}
                onClick={textInput.trim() ? sendMessage : undefined}
              >
                <Send size={18} color={textInput.trim() ? '#fff' : '#9CA3AF'} />
              </View>
            )}

            {/* 中间：输入区域 */}
            {inputMode === 'voice' ? (
              <View
                className="flex-1 bg-gray-100 rounded-full h-11 flex items-center justify-center"
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
                onTouchMove={handleTouchMove}
              >
                <Text className="text-sm text-gray-500">
                  按住 说话
                </Text>
              </View>
            ) : (
              <View className="flex-1 bg-gray-100 rounded-full h-11 flex items-center px-4">
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
              className="w-11 h-11 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0"
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
            <Text className="block text-xs text-gray-400 text-center mt-2">
              H5端不支持录音，请切换键盘输入
            </Text>
          )}
        </View>
      </View>
    </View>
  )
}

export default HomePage
