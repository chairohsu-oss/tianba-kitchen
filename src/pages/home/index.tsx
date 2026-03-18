import { View, Text, ScrollView, Input, Image } from '@tarojs/components'
import { useState, useEffect, useRef, useCallback } from 'react'
import Taro from '@tarojs/taro'
import { Mic, Keyboard, Send, Bot, User, Loader, ImagePlus, Plus, ShoppingCart } from 'lucide-react-taro'
import { Network } from '@/network'
import type { FC } from 'react'
import './index.css'

// 推荐菜品类型
interface RecommendedDish {
  id: string
  name: string
  images: string[]
  calories: number
  category: string
  cuisine?: string
  description?: string
}

// 消息类型
interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  images?: string[] // 支持图片
  recommendedDishes?: RecommendedDish[] // AI推荐的菜品
  timestamp: number
}

const HomePage: FC = () => {
  const [inputMode, setInputMode] = useState<'voice' | 'keyboard'>('voice')
  const [textInput, setTextInput] = useState('')
  const [isRecording, setIsRecording] = useState(false)
  const recorderManagerRef = useRef<Taro.RecorderManager | null>(null)
  const isCancellingRef = useRef(false)
  const handleVoiceInputRef = useRef<(audioPath: string) => void>(() => {})
  const [isLoading, setIsLoading] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: '你好！我是天霸私厨的智能助手，专注于烹饪和营养领域。有什么我可以帮你的吗？你可以问我：\n\n• 今天买了土豆和鸡蛋，做什么好？\n• 晚餐想吃得清淡点，有什么推荐？\n• 如何挑选新鲜的海鲜？\n• 减肥期间该怎么搭配饮食？\n\n你也可以发送食材照片，我来帮你识别和推荐！',
      timestamp: Date.now()
    }
  ])
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
        // 使用 ref 来避免闭包问题
        if (!isCancellingRef.current) {
          handleVoiceInputRef.current(res.tempFilePath)
        }
        setIsCancelling(false)
      })
      manager.onError((err) => {
        console.error('录音错误', err)
        Taro.showToast({ title: '录音失败，请检查麦克风权限', icon: 'none', duration: 2000 })
        setIsRecording(false)
        setIsCancelling(false)
      })
      recorderManagerRef.current = manager
    }
  }, [isWeapp])

  // 添加消息
  const addMessage = useCallback((role: 'user' | 'assistant', content: string, images?: string[]) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      role,
      content,
      images,
      timestamp: Date.now()
    }
    setMessages(prev => [...prev, newMessage])
    scrollViewRef.current = `msg-${newMessage.id}`
    return newMessage
  }, [])

  // 选择图片并立即发送给AI
  const chooseImage = async () => {
    try {
      const result = await Taro.chooseImage({
        count: 1, // 每次选择一张
        sizeType: ['compressed'],
        sourceType: ['album', 'camera']
      })

      console.log('选择的图片:', result.tempFilePaths)
      const localPath = result.tempFilePaths[0]
      
      // 立即显示用户消息（本地图片路径）
      addMessage('user', '请看这张图片', [localPath])
      
      // 上传图片到对象存储
      console.log('开始上传图片...')
      const urls = await uploadImages([localPath])
      console.log('上传完成，URLs:', urls)
      
      if (urls.length > 0) {
        // 调用AI对话
        await chat('请看这张图片', urls)
      } else {
        addMessage('assistant', '图片上传失败，请重试。')
      }
    } catch (error) {
      console.error('选择图片失败:', error)
    }
  }

  // 上传图片到对象存储
  const uploadImages = async (filePaths: string[]): Promise<string[]> => {
    const urls: string[] = []
    for (const filePath of filePaths) {
      try {
        const result = await Network.uploadFile({
          url: '/api/upload/image',
          filePath,
          name: 'file'
        })
        
        console.log('上传结果:', result)
        const imageUrl = (result as any).data?.data?.url
        
        if (imageUrl) {
          urls.push(imageUrl)
        }
      } catch (error) {
        console.error('上传图片失败:', error)
      }
    }
    return urls
  }

  // 发送文本消息
  const sendMessage = async () => {
    if (!textInput.trim() || isLoading) return

    const userMessage = textInput.trim()
    setTextInput('')
    
    // 添加用户消息
    addMessage('user', userMessage)
    
    // 调用AI对话
    await chat(userMessage)
  }

  // AI对话
  const chat = async (userMessage: string, imageUrls: string[] = []) => {
    setIsLoading(true)
    try {
      // 构建消息历史（最近10条）
      const recentMessages = messages.slice(-10).map(m => ({
        role: m.role,
        content: m.content,
        images: m.images
      }))
      
      console.log('发送对话请求，历史消息数:', recentMessages.length, '图片URLs:', imageUrls)
      
      const result = await Network.request({
        url: '/api/ai/chat',
        method: 'POST',
        data: {
          messages: [
            ...recentMessages,
            { role: 'user' as const, content: userMessage, images: imageUrls }
          ]
        }
      })

      console.log('对话响应:', result)
      
      // 解析响应 - 注意嵌套data
      const reply = (result as any).data?.data?.reply || ''
      const recommendedDishes = (result as any).data?.data?.recommendedDishes || []
      
      if (reply) {
        // 添加AI回复，包含推荐菜品
        const msgId = Date.now().toString()
        const newMessage: Message = {
          id: msgId,
          role: 'assistant',
          content: reply,
          recommendedDishes: recommendedDishes.length > 0 ? recommendedDishes : undefined,
          timestamp: Date.now()
        }
        setMessages(prev => [...prev, newMessage])
        scrollViewRef.current = `msg-${msgId}`
      } else {
        addMessage('assistant', '抱歉，我暂时无法回复，请稍后再试。')
      }
    } catch (error) {
      console.error('对话失败:', error)
      addMessage('assistant', '网络好像有点问题，请稍后再试。')
    } finally {
      setIsLoading(false)
    }
  }

  // 添加菜品到待确认订单
  const addDishToOrder = async (dish: RecommendedDish) => {
    try {
      // 获取当前用户信息
      let user: { id: string; nickname: string; avatarUrl: string } | null = null
      try {
        const userResult = await Network.request({ url: '/api/users/me' })
        user = (userResult as any).data?.data
      } catch (e) {
        console.log('获取用户信息失败')
      }

      // 获取待确认订单
      const ordersResult = await Network.request({
        url: '/api/orders',
        data: { status: 'pending' }
      })
      const pendingOrders = (ordersResult as any).data?.data || []

      if (pendingOrders.length > 0) {
        // 已有待确认订单，添加菜品
        const orderId = pendingOrders[0].id
        await Network.request({
          url: `/api/orders/${orderId}/items`,
          method: 'POST',
          data: {
            dish: {
              id: dish.id,
              name: dish.name,
              images: dish.images,
              calories: dish.calories,
            },
            quantity: 1
          }
        })
        Taro.showToast({ title: `已添加「${dish.name}」到待确认订单`, icon: 'success' })
      } else {
        // 没有待确认订单，创建新订单
        await Network.request({
          url: '/api/orders',
          method: 'POST',
          data: {
            items: [{
              dish: {
                id: dish.id,
                name: dish.name,
                images: dish.images,
                calories: dish.calories,
              },
              quantity: 1
            }],
            user: user ? {
              id: user.id,
              nickname: user.nickname,
              avatarUrl: user.avatarUrl,
            } : undefined,
          }
        })
        Taro.showToast({ title: `已下单「${dish.name}」`, icon: 'success' })
      }
    } catch (error) {
      console.error('下单失败', error)
      Taro.showToast({ title: '下单失败', icon: 'none' })
    }
  }

  // 批量添加菜品到订单
  const addAllDishesToOrder = async (dishes: RecommendedDish[]) => {
    Taro.showModal({
      title: '确认下单',
      content: `将添加 ${dishes.length} 道菜到待确认订单`,
      success: async (res) => {
        if (res.confirm) {
          for (const dish of dishes) {
            await addDishToOrder(dish)
          }
        }
      }
    })
  }

  // 处理语音输入
  const handleVoiceInput = useCallback(async (audioPath: string) => {
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

      console.log('语音识别完整响应:', JSON.stringify(asrResult, null, 2))
      const recognizedText = (asrResult as any).data?.data?.text || ''
      console.log('解析出的识别文本:', recognizedText)
      
      if (recognizedText) {
        addMessage('user', recognizedText)
        await chat(recognizedText)
      } else {
        Taro.showToast({ title: '未识别到语音内容', icon: 'none' })
      }
    } catch (error) {
      console.error('语音识别失败', error)
      Taro.showToast({ title: '语音识别失败', icon: 'none' })
    } finally {
      setIsLoading(false)
    }
  }, [addMessage, chat])

  // 更新 ref
  useEffect(() => {
    handleVoiceInputRef.current = handleVoiceInput
  }, [handleVoiceInput])

  // 同步 isCancelling 到 ref
  useEffect(() => {
    isCancellingRef.current = isCancelling
  }, [isCancelling])

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

  return (
    <View 
      className="flex flex-col h-screen bg-white overflow-hidden"
      style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
    >
      {/* 录音状态遮罩层 */}
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
        {/* 对话区域 - 可自由滚动 */}
        <ScrollView 
          scrollY 
          className="flex-1 px-4"
          scrollIntoView={scrollViewRef.current}
          scrollWithAnimation
          style={{ 
            height: 'calc(100vh - 240px)',
            overflowY: 'auto'
          }}
        >
          {/* 对话消息列表 */}
          {messages.map(msg => (
            <View key={msg.id} id={`msg-${msg.id}`} className="mb-4 mt-2">
              {msg.role === 'user' ? (
                <View className="flex flex-row justify-end items-start gap-2">
                  <View className="bg-gray-800 rounded-2xl rounded-br-md px-4 py-3 max-w-[80%]">
                    {/* 用户图片 */}
                    {msg.images && msg.images.length > 0 && (
                      <View className="flex flex-row flex-wrap gap-2 mb-2">
                        {msg.images.map((img, i) => (
                          <Image 
                            key={i}
                            className="w-24 h-24 rounded-lg"
                            src={img}
                            mode="aspectFill"
                          />
                        ))}
                      </View>
                    )}
                    {msg.content && (
                      <Text className="text-white text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</Text>
                    )}
                  </View>
                  <View className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                    <User size={16} color="#6B7280" />
                  </View>
                </View>
              ) : (
                <View className="flex flex-col items-start gap-2" style={{ maxWidth: '85%' }}>
                  <View className="flex flex-row justify-start items-start gap-2">
                    <View className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center flex-shrink-0">
                      <Bot size={16} color="#fff" />
                    </View>
                    <View className="bg-gray-100 rounded-2xl rounded-bl-md px-4 py-3">
                      <Text className="text-gray-800 text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</Text>
                    </View>
                  </View>
                  
                  {/* 推荐菜品卡片 */}
                  {msg.recommendedDishes && msg.recommendedDishes.length > 0 && (
                    <View className="ml-10 w-full">
                      <View className="bg-orange-50 rounded-xl p-3 border border-orange-100">
                        <View className="flex flex-row items-center justify-between mb-2">
                          <Text className="text-sm font-medium text-orange-600">为您找到以下菜品</Text>
                          <View 
                            className="flex flex-row items-center gap-1 bg-orange-500 px-3 py-1 rounded-full"
                            onClick={() => addAllDishesToOrder(msg.recommendedDishes!)}
                          >
                            <ShoppingCart size={12} color="#fff" />
                            <Text className="text-xs text-white">全部下单</Text>
                          </View>
                        </View>
                        <View className="flex flex-row flex-wrap gap-2">
                          {msg.recommendedDishes.map((dish, i) => (
                            <View 
                              key={i}
                              className="bg-white rounded-lg overflow-hidden shadow-sm"
                              style={{ width: '48%' }}
                              onClick={() => Taro.navigateTo({ url: `/pages/dish-detail/index?id=${dish.id}` })}
                            >
                              <Image 
                                className="w-full h-20"
                                src={dish.images?.[0] || `https://picsum.photos/200?random=${dish.id}`}
                                mode="aspectFill"
                              />
                              <View className="p-2">
                                <Text className="text-sm font-medium text-gray-800 truncate">{dish.name}</Text>
                                <View className="flex flex-row items-center justify-between mt-1">
                                  <Text className="text-xs text-orange-500">{dish.calories}千卡</Text>
                                  <View
                                    className="flex flex-row items-center gap-0.5 bg-blue-500 px-2 py-0.5 rounded-full"
                                    onClick={(e) => { e.stopPropagation(); addDishToOrder(dish) }}
                                  >
                                    <Plus size={10} color="#fff" />
                                    <Text className="text-xs text-white">下单</Text>
                                  </View>
                                </View>
                              </View>
                            </View>
                          ))}
                        </View>
                      </View>
                    </View>
                  )}
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

          {/* 底部安全区域占位 */}
          <View style={{ height: '80px' }} />
        </ScrollView>

        {/* 底部输入区域 - 固定在底部 */}
        <View 
          className="fixed left-0 right-0 bg-white border-t border-gray-200 px-4 py-3 z-40"
          style={{ bottom: '0px' }}
        >
          <View className="flex flex-row items-center gap-2">
            {/* 左侧：图片上传按钮 */}
            <View
              className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0"
              onClick={chooseImage}
            >
              <ImagePlus size={18} color="#6B7280" />
            </View>

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
                  placeholder="问我任何烹饪和营养问题..."
                  value={textInput}
                  onInput={(e) => setTextInput(e.detail.value)}
                  onConfirm={sendMessage}
                  confirmType="send"
                />
              </View>
            )}

            {/* 右侧：发送/语音切换按钮 */}
            {inputMode === 'keyboard' ? (
              <View
                className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${textInput.trim() && !isLoading ? 'bg-blue-500' : 'bg-gray-100'}`}
                onClick={textInput.trim() && !isLoading ? sendMessage : undefined}
              >
                <Send size={16} color={textInput.trim() && !isLoading ? '#fff' : '#9CA3AF'} />
              </View>
            ) : (
              <View
                className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0"
                onClick={() => setInputMode('keyboard')}
              >
                <Keyboard size={18} color="#6B7280" />
              </View>
            )}

            {/* 最右侧：模式切换 */}
            {inputMode === 'keyboard' && (
              <View
                className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0"
                onClick={() => setInputMode('voice')}
              >
                <Mic size={18} color="#6B7280" />
              </View>
            )}
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
