import { View, Text, Image, Input, Picker, ScrollView } from '@tarojs/components'
import { useState, useEffect, useRef, useCallback } from 'react'
import Taro from '@tarojs/taro'
import { Mic, Keyboard, Camera, Image as ImageIcon, X, Loader, Plus, Send, Bot, User, Sparkles, Check } from 'lucide-react-taro'
import { Network } from '@/network'
import type { FC } from 'react'
import './index.css'

// 分类选项
const CATEGORIES = [
  { id: 'chinese', name: '中餐' },
  { id: 'breakfast', name: '早餐' },
  { id: 'snack', name: '点心' },
  { id: 'dessert', name: '甜点' },
  { id: 'drink', name: '饮料' },
  { id: 'western', name: '西餐' },
  { id: 'japanese', name: '日餐' },
  { id: 'korean', name: '韩餐' },
  { id: 'southeast', name: '东南亚' },
]

// 中餐菜系选项
const CHINESE_CUISINES = [
  { id: 'tianba', name: '天霸家自制' },
  { id: 'jiangzhe', name: '江浙菜' },
  { id: 'wenzhou', name: '温州菜' },
  { id: 'yue', name: '粤菜' },
  { id: 'dongbei', name: '东北菜' },
  { id: 'hunan', name: '湖南菜' },
  { id: 'yunnan', name: '云南菜' },
  { id: 'other', name: '其它' },
]

// 对话消息类型
interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: number
}

const AddDishPage: FC = () => {
  // A模块：上传菜品照片
  const [images, setImages] = useState<string[]>([])
  const [showActionSheet, setShowActionSheet] = useState(false)
  
  // 补充说明图片（用于AI识别）
  const [supplementImages, setSupplementImages] = useState<string[]>([])
  const [showSupplementImagePicker, setShowSupplementImagePicker] = useState(false)
  
  // B模块：分类设置
  const [categoryIndex, setCategoryIndex] = useState(0)
  const [cuisineIndex, setCuisineIndex] = useState(0)
  
  // C模块：菜名输入
  const [dishName, setDishName] = useState('')
  
  // D模块：补充说明对话
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: '请告诉我这道菜的食材、配料和烹饪方式，我会帮你自动计算热量和营养成分。\n\n例如：\n• 主料：五花肉500克、葱姜蒜\n• 配料：料酒、生抽、老抽、冰糖\n• 做法：切块焯水、炒糖色、炖煮1小时',
      timestamp: Date.now()
    }
  ])
  const [inputMode, setInputMode] = useState<'voice' | 'keyboard'>('voice')
  const [textInput, setTextInput] = useState('')
  const [isRecording, setIsRecording] = useState(false)
  const [touchStartY, setTouchStartY] = useState(0)
  const [isCancelling, setIsCancelling] = useState(false)
  const recorderManagerRef = useRef<Taro.RecorderManager | null>(null)
  const scrollViewRef = useRef<string>('')
  
  // E模块：生成状态
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedDish, setGeneratedDish] = useState<any>(null)

  const isWeapp = Taro.getEnv() === Taro.ENV_TYPE.WEAPP
  const showCuisineSelect = CATEGORIES[categoryIndex]?.id === 'chinese'

  // 检查登录状态
  useEffect(() => {
    const isLoggedIn = Taro.getStorageSync('tianba_logged_in')
    if (!isLoggedIn) {
      Taro.redirectTo({ url: '/pages/login/index' })
    }
  }, [])

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

  // A模块：图片选择（菜品照片）
  const chooseImage = (sourceType: 'album' | 'camera') => {
    if (images.length >= 3) {
      Taro.showToast({ title: '最多上传3张图片', icon: 'none' })
      return
    }
    setShowActionSheet(false)
    Taro.chooseImage({
      count: 3 - images.length,
      sourceType: [sourceType],
      success: (res) => {
        setImages([...images, ...res.tempFilePaths])
      }
    })
  }

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index))
  }

  // D模块：补充说明图片选择（用于AI识别）
  const chooseSupplementImage = (sourceType: 'album' | 'camera') => {
    setShowSupplementImagePicker(false)
    Taro.chooseImage({
      count: 1,
      sourceType: [sourceType],
      success: async (res) => {
        const imagePath = res.tempFilePaths[0]
        
        // 添加到补充说明图片列表
        setSupplementImages(prev => [...prev, imagePath])
        
        // 上传图片并调用AI识别
        try {
          // 上传图片到服务器
          const uploadResult = await Network.uploadFile({
            url: '/api/upload/image',
            filePath: imagePath,
            name: 'file'
          })
          
          // Taro.uploadFile 返回的 data 是字符串，需要解析
          const responseData = typeof (uploadResult as any).data === 'string'
            ? JSON.parse((uploadResult as any).data)
            : (uploadResult as any).data
          
          const imageUrl = responseData?.data?.url
          console.log('图片上传成功:', imageUrl)
          
          if (!imageUrl) {
            Taro.showToast({ title: '图片上传失败', icon: 'none' })
            return
          }
          
          // 显示用户上传的图片消息
          addMessage('user', '📸 [上传了一张图片]')
          
          // 调用AI识别图片 - 使用正确的格式
          Taro.showLoading({ title: 'AI识别中...' })
          
          // 构建包含图片的消息格式
          const chatMessages = [
            {
              role: 'user' as const,
              content: '请识别这张图片中的食材和菜品信息，告诉我：1. 这是什么食材或菜品？2. 推荐的烹饪方式？3. 估算的热量？',
              images: [imageUrl]
            }
          ]
          
          const aiResult = await Network.request({
            url: '/api/ai/chat',
            method: 'POST',
            data: { messages: chatMessages }
          })
          
          Taro.hideLoading()
          
          const aiResponse = (aiResult as any).data?.data?.reply || (aiResult as any).data?.reply
          console.log('AI识别响应:', aiResponse)
          
          if (aiResponse) {
            addMessage('assistant', aiResponse)
          } else {
            addMessage('assistant', '抱歉，无法识别图片内容，请手动输入食材信息。')
          }
        } catch (error) {
          Taro.hideLoading()
          console.error('图片识别失败', error)
          addMessage('assistant', '图片识别失败，请手动输入食材信息。')
        }
      }
    })
  }

  const removeSupplementImage = (index: number) => {
    setSupplementImages(supplementImages.filter((_, i) => i !== index))
  }

  // D模块：补充说明对话
  const addMessage = useCallback((role: 'user' | 'assistant', content: string) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      role,
      content,
      timestamp: Date.now()
    }
    setMessages(prev => [...prev, newMessage])
    scrollViewRef.current = `msg-${newMessage.id}`
    return newMessage
  }, [])

  const handleVoiceInput = async (audioPath: string) => {
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
      } else {
        Taro.showToast({ title: '未识别到语音内容', icon: 'none' })
      }
    } catch (error) {
      console.error('语音识别失败', error)
      Taro.showToast({ title: '语音识别失败', icon: 'none' })
    }
  }

  const sendMessage = async () => {
    if (!textInput.trim()) return

    const userMessage = textInput.trim()
    setTextInput('')
    addMessage('user', userMessage)
  }

  // 录音控制
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

  const stopRecording = () => {
    recorderManagerRef.current?.stop()
  }

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

  // E模块：自动生成菜品
  const generateDish = async () => {
    if (!dishName.trim()) {
      Taro.showToast({ title: '请输入菜名', icon: 'none' })
      return
    }

    setIsGenerating(true)
    try {
      // 收集用户的补充说明
      const userInputs = messages
        .filter(m => m.role === 'user')
        .map(m => m.content)
        .join('\n')

      console.log('自动生成菜品请求:', {
        name: dishName,
        category: CATEGORIES[categoryIndex].id,
        cuisine: showCuisineSelect ? CHINESE_CUISINES[cuisineIndex].id : undefined,
        userInputs,
        supplementImages,
        dishImages: images
      })

      const result = await Network.request({
        url: '/api/ai/generate-dish',
        method: 'POST',
        data: {
          name: dishName,
          category: CATEGORIES[categoryIndex].id,
          cuisine: showCuisineSelect ? CHINESE_CUISINES[cuisineIndex].id : undefined,
          userInputs,
          // 传递补充说明图片给AI识别
          supplementImages,
          // 同时传递菜品照片（如果有）
          dishImages: images
        }
      })

      console.log('AI生成响应:', result)
      const dishData = (result as any).data?.data || (result as any).data
      
      if (dishData) {
        setGeneratedDish(dishData)
        Taro.showToast({ title: '生成成功', icon: 'success' })
      } else {
        Taro.showToast({ title: '生成失败，请重试', icon: 'none' })
      }
    } catch (error) {
      console.error('生成菜品失败', error)
      Taro.showToast({ title: '生成失败', icon: 'none' })
    } finally {
      setIsGenerating(false)
    }
  }

  // 保存菜品到数据库
  const saveDish = async () => {
    if (!generatedDish) return

    try {
      await Network.request({
        url: '/api/dishes',
        method: 'POST',
        data: {
          name: dishName,
          images,
          category: CATEGORIES[categoryIndex].id,
          cuisine: showCuisineSelect ? CHINESE_CUISINES[cuisineIndex].id : undefined,
          ...generatedDish
        }
      })
      
      Taro.showToast({ title: '保存成功！', icon: 'success' })
      
      // 重置表单
      setImages([])
      setSupplementImages([])
      setDishName('')
      setTextInput('')
      setMessages([
        {
          id: 'welcome',
          role: 'assistant',
          content: '请告诉我这道菜的食材、配料和烹饪方式，我会帮你自动计算热量和营养成分。',
          timestamp: Date.now()
        }
      ])
      setGeneratedDish(null)
    } catch (error) {
      console.error('保存失败', error)
      Taro.showToast({ title: '保存失败', icon: 'none' })
    }
  }

  return (
    <View className="flex flex-col bg-gray-50">
      {/* 录音状态遮罩层 */}
      {isRecording && (
        <View 
          className="fixed inset-0 z-50 flex flex-col items-center justify-center"
          style={{
            background: 'linear-gradient(180deg, rgba(59, 130, 246, 0.85) 0%, rgba(37, 99, 235, 0.95) 100%)',
          }}
        >
          <View className="flex flex-col items-center">
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
        </View>
      )}

      <ScrollView scrollY style={{ height: 'calc(100vh - 80px)' }}>
        {/* A模块：上传菜品照片 */}
        <View className="bg-white px-4 py-4 mb-2">
          <Text className="block text-sm font-medium text-gray-800 mb-3">📸 菜品照片</Text>
          {images.length === 0 ? (
            <View
              className="flex flex-col items-center justify-center py-8 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200"
              onClick={() => setShowActionSheet(true)}
            >
              <Camera size={32} color="#9CA3AF" />
              <Text className="block text-sm text-gray-500 mt-2">点击上传菜品照片</Text>
              <Text className="block text-xs text-gray-400 mt-1">最多3张</Text>
            </View>
          ) : (
            <View className="flex flex-row gap-3 flex-wrap">
              {images.map((img, index) => (
                <View key={index} className="relative w-24 h-24">
                  <Image className="w-full h-full rounded-xl" src={img} mode="aspectFill" />
                  <View
                    className="absolute -top-1 -right-1 w-5 h-5 bg-gray-800 rounded-full flex items-center justify-center"
                    onClick={() => removeImage(index)}
                  >
                    <X size={12} color="#fff" />
                  </View>
                </View>
              ))}
              {images.length < 3 && (
                <View
                  className="w-24 h-24 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center"
                  onClick={() => setShowActionSheet(true)}
                >
                  <Plus size={20} color="#9CA3AF" />
                  <Text className="block text-xs text-gray-400 mt-1">添加</Text>
                </View>
              )}
            </View>
          )}
        </View>

        {/* B模块：分类设置 */}
        <View className="bg-white px-4 py-4 mb-2">
          <Text className="block text-sm font-medium text-gray-800 mb-3">🏷️ 分类设置</Text>
          
          {/* 分类选择 */}
          <View className="mb-3">
            <Text className="block text-xs text-gray-500 mb-2">分类</Text>
            <Picker
              mode="selector"
              range={CATEGORIES.map(c => c.name)}
              value={categoryIndex}
              onChange={(e) => setCategoryIndex(Number(e.detail.value))}
            >
              <View className="bg-gray-50 rounded-xl px-4 py-3 flex flex-row justify-between items-center">
                <Text className="text-sm text-gray-800">{CATEGORIES[categoryIndex].name}</Text>
                <Text className="text-gray-400 text-xs">▼</Text>
              </View>
            </Picker>
          </View>

          {/* 中餐菜系选择 */}
          {showCuisineSelect && (
            <View>
              <Text className="block text-xs text-gray-500 mb-2">菜系</Text>
              <Picker
                mode="selector"
                range={CHINESE_CUISINES.map(c => c.name)}
                value={cuisineIndex}
                onChange={(e) => setCuisineIndex(Number(e.detail.value))}
              >
                <View className="bg-gray-50 rounded-xl px-4 py-3 flex flex-row justify-between items-center">
                  <Text className="text-sm text-gray-800">{CHINESE_CUISINES[cuisineIndex].name}</Text>
                  <Text className="text-gray-400 text-xs">▼</Text>
                </View>
              </Picker>
            </View>
          )}
        </View>

        {/* C模块：菜名输入 */}
        <View className="bg-white px-4 py-4 mb-2">
          <Text className="block text-sm font-medium text-gray-800 mb-3">📝 菜品名称</Text>
          <View className="bg-gray-50 rounded-xl px-4 py-0 min-h-[44px] flex items-center">
            <Input
              className="w-full text-sm"
              placeholder="输入菜名..."
              value={dishName}
              onInput={(e) => setDishName(e.detail.value)}
            />
          </View>
        </View>

        {/* D模块：补充说明对话 */}
        <View className="bg-white px-4 py-4 mb-2">
          <Text className="block text-sm font-medium text-gray-800 mb-3">💬 补充说明</Text>
          
          {/* 补充说明图片预览（用于AI识别） */}
          {supplementImages.length > 0 && (
            <View className="flex flex-row gap-2 mb-3 flex-wrap">
              {supplementImages.map((img, index) => (
                <View key={index} className="relative w-16 h-16">
                  <Image className="w-full h-full rounded-lg" src={img} mode="aspectFill" />
                  <View
                    className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center"
                    onClick={() => removeSupplementImage(index)}
                  >
                    <X size={10} color="#fff" />
                  </View>
                </View>
              ))}
              <View
                className="w-16 h-16 bg-gray-50 rounded-lg border border-dashed border-gray-200 flex items-center justify-center"
                onClick={() => setShowSupplementImagePicker(true)}
              >
                <Plus size={16} color="#9CA3AF" />
              </View>
            </View>
          )}
          
          {/* 对话框 */}
          <View className="bg-gray-50 rounded-xl p-3 mb-3" style={{ minHeight: '150px', maxHeight: '300px' }}>
            <ScrollView 
              scrollY 
              className="h-full"
              scrollIntoView={scrollViewRef.current}
              scrollWithAnimation
            >
              {messages.map(msg => (
                <View key={msg.id} id={`msg-${msg.id}`} className="mb-3">
                  {msg.role === 'user' ? (
                    <View className="flex flex-row justify-end items-start gap-2">
                      <View className="bg-gray-800 rounded-2xl rounded-br-md px-3 py-2 max-w-[85%]">
                        <Text className="text-white text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</Text>
                      </View>
                      <View className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                        <User size={14} color="#6B7280" />
                      </View>
                    </View>
                  ) : (
                    <View className="flex flex-row justify-start items-start gap-2">
                      <View className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center flex-shrink-0">
                        <Bot size={14} color="#fff" />
                      </View>
                      <View className="bg-white rounded-2xl rounded-bl-md px-3 py-2 max-w-[85%] shadow-sm">
                        <Text className="text-gray-800 text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</Text>
                      </View>
                    </View>
                  )}
                </View>
              ))}
            </ScrollView>
          </View>
        </View>

        {/* 生成的菜品预览 */}
        {generatedDish && (
          <View className="bg-white px-4 py-4 mb-2">
            <View className="flex flex-row items-center gap-2 mb-3">
              <Sparkles size={18} color="#10B981" />
              <Text className="block text-sm font-medium text-gray-800">AI 生成的菜品信息</Text>
            </View>

            <View className="bg-gray-50 rounded-xl p-3 space-y-3">
              {/* 食材 */}
              {generatedDish.ingredients && (
                <View>
                  <Text className="block text-xs font-medium text-gray-700 mb-1">食材</Text>
                  <Text className="block text-sm text-gray-600">{Array.isArray(generatedDish.ingredients) ? generatedDish.ingredients.join('、') : generatedDish.ingredients}</Text>
                </View>
              )}

              {/* 配料 */}
              {generatedDish.seasoning && (
                <View>
                  <Text className="block text-xs font-medium text-gray-700 mb-1">配料</Text>
                  <Text className="block text-sm text-gray-600">{Array.isArray(generatedDish.seasoning) ? generatedDish.seasoning.join('、') : generatedDish.seasoning}</Text>
                </View>
              )}

              {/* 烹饪步骤 */}
              {generatedDish.steps && generatedDish.steps.length > 0 && (
                <View>
                  <Text className="block text-xs font-medium text-gray-700 mb-1">烹饪步骤</Text>
                  {generatedDish.steps.map((step: string, i: number) => (
                    <Text key={i} className="block text-sm text-gray-600 mt-1">{i + 1}. {step}</Text>
                  ))}
                </View>
              )}

              {/* 营养信息 */}
              <View className="flex flex-row gap-4 pt-2 border-t border-gray-200">
                <View className="flex-1 text-center">
                  <Text className="block text-lg font-bold text-orange-500">{generatedDish.calories || 0}</Text>
                  <Text className="block text-xs text-gray-400">千卡</Text>
                </View>
                <View className="flex-1 text-center">
                  <Text className="block text-lg font-bold text-green-500">{generatedDish.protein || 0}</Text>
                  <Text className="block text-xs text-gray-400">蛋白质</Text>
                </View>
                <View className="flex-1 text-center">
                  <Text className="block text-lg font-bold text-amber-500">{generatedDish.carbs || 0}</Text>
                  <Text className="block text-xs text-gray-400">碳水</Text>
                </View>
                <View className="flex-1 text-center">
                  <Text className="block text-lg font-bold text-blue-500">{generatedDish.fat || 0}</Text>
                  <Text className="block text-xs text-gray-400">脂肪</Text>
                </View>
              </View>

              {/* 保存按钮 */}
              <View
                className="bg-emerald-500 rounded-full py-3 flex flex-row items-center justify-center mt-3"
                onClick={saveDish}
              >
                <Check size={18} color="#fff" />
                <Text className="text-white font-medium ml-2">保存到菜品库</Text>
              </View>
            </View>
          </View>
        )}

        {/* 底部占位 */}
        <View style={{ height: '100px' }} />
      </ScrollView>

      {/* 底部固定区域：语音输入框 + AI生成按钮 */}
      <View 
        className="fixed left-0 right-0 bg-white border-t border-gray-200 px-4 py-3 z-40"
        style={{ bottom: 0 }}
      >
        {/* D模块：语音输入框 - 和首页一样 */}
        <View className="flex flex-row items-center gap-2 mb-3">
          {/* 左侧：图片上传按钮（用于AI识别补充说明） */}
          <View
            className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0"
            onClick={() => setShowSupplementImagePicker(true)}
          >
            <ImageIcon size={18} color="#6B7280" />
          </View>

          {/* 中间：输入区域 */}
          {inputMode === 'voice' ? (
            <View
              className="flex-1 bg-gray-100 rounded-full h-11 flex items-center justify-center"
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
              onTouchMove={handleTouchMove}
            >
              <Text className="text-sm text-gray-500">按住 说话</Text>
            </View>
          ) : (
            <View className="flex-1 bg-gray-100 rounded-full h-11 flex items-center px-4">
              <Input
                className="w-full text-sm"
                placeholder="输入食材、配料、做法..."
                value={textInput}
                onInput={(e) => setTextInput(e.detail.value)}
                onConfirm={sendMessage}
                confirmType="send"
              />
            </View>
          )}

          {/* 右侧：发送/语音切换按钮 */}
          {inputMode === 'keyboard' ? (
            <>
              <View
                className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${textInput.trim() ? 'bg-blue-500' : 'bg-gray-100'}`}
                onClick={textInput.trim() ? sendMessage : undefined}
              >
                <Send size={16} color={textInput.trim() ? '#fff' : '#9CA3AF'} />
              </View>
              <View
                className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0"
                onClick={() => setInputMode('voice')}
              >
                <Mic size={18} color="#6B7280" />
              </View>
            </>
          ) : (
            <View
              className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0"
              onClick={() => setInputMode('keyboard')}
            >
              <Keyboard size={18} color="#6B7280" />
            </View>
          )}
        </View>

        {/* H5提示 */}
        {!isWeapp && inputMode === 'voice' && (
          <Text className="block text-xs text-gray-400 text-center mb-2">
            H5端不支持录音，请切换键盘输入
          </Text>
        )}

        {/* E模块：自动生成菜品按钮 */}
        <View
          className={`rounded-full py-3 flex flex-row items-center justify-center ${isGenerating ? 'bg-gray-400' : 'bg-gray-800'}`}
          onClick={isGenerating ? undefined : generateDish}
        >
          {isGenerating ? (
            <>
              <Loader size={18} color="#fff" className="animate-spin" />
              <Text className="text-white font-medium ml-2">生成中...</Text>
            </>
          ) : (
            <>
              <Sparkles size={18} color="#fff" />
              <Text className="text-white font-medium ml-2">自动生成菜品</Text>
            </>
          )}
        </View>
      </View>

      {/* 图片选择弹窗（菜品照片） */}
      {showActionSheet && (
        <View className="fixed inset-0 bg-black/50 flex items-end z-50" onClick={() => setShowActionSheet(false)}>
          <View className="bg-white w-full rounded-t-2xl p-4" onClick={(e) => e.stopPropagation()}>
            <View
              className="flex flex-row items-center justify-center py-4 border-b border-gray-100"
              onClick={() => chooseImage('camera')}
            >
              <Camera size={20} color="#6B7280" />
              <Text className="text-base text-gray-800 ml-2">拍照</Text>
            </View>
            <View
              className="flex flex-row items-center justify-center py-4 border-b border-gray-100"
              onClick={() => chooseImage('album')}
            >
              <ImageIcon size={20} color="#6B7280" />
              <Text className="text-base text-gray-800 ml-2">从相册选择</Text>
            </View>
            <View
              className="flex flex-row items-center justify-center py-4"
              onClick={() => setShowActionSheet(false)}
            >
              <Text className="text-base text-gray-500">取消</Text>
            </View>
          </View>
        </View>
      )}

      {/* 补充说明图片选择弹窗（用于AI识别） */}
      {showSupplementImagePicker && (
        <View className="fixed inset-0 bg-black/50 flex items-end z-50" onClick={() => setShowSupplementImagePicker(false)}>
          <View className="bg-white w-full rounded-t-2xl p-4" onClick={(e) => e.stopPropagation()}>
            <View className="flex flex-row items-center justify-center py-2 mb-2">
              <Text className="text-sm text-gray-500">上传图片让AI识别食材和菜品信息</Text>
            </View>
            <View
              className="flex flex-row items-center justify-center py-4 border-b border-gray-100"
              onClick={() => chooseSupplementImage('camera')}
            >
              <Camera size={20} color="#6B7280" />
              <Text className="text-base text-gray-800 ml-2">拍照</Text>
            </View>
            <View
              className="flex flex-row items-center justify-center py-4 border-b border-gray-100"
              onClick={() => chooseSupplementImage('album')}
            >
              <ImageIcon size={20} color="#6B7280" />
              <Text className="text-base text-gray-800 ml-2">从相册选择</Text>
            </View>
            <View
              className="flex flex-row items-center justify-center py-4"
              onClick={() => setShowSupplementImagePicker(false)}
            >
              <Text className="text-base text-gray-500">取消</Text>
            </View>
          </View>
        </View>
      )}
    </View>
  )
}

export default AddDishPage
