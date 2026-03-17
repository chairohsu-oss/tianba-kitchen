import { View, Text, Image, Input, Picker, ScrollView } from '@tarojs/components'
import { useState, useEffect, useRef } from 'react'
import Taro from '@tarojs/taro'
import { Mic, Keyboard, Camera, Image as ImageIcon, X, Loader, Plus, Send, Check } from 'lucide-react-taro'
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

// 消息类型
interface Message {
  id: string
  type: 'user' | 'ai'
  content: string
  timestamp: number
}

const AddDishPage: FC = () => {
  const [images, setImages] = useState<string[]>([])
  const [dishName, setDishName] = useState('')
  const [categoryIndex, setCategoryIndex] = useState(0)
  const [cuisineIndex, setCuisineIndex] = useState(0)
  const [inputMode, setInputMode] = useState<'voice' | 'keyboard'>('voice')
  const [textInput, setTextInput] = useState('')
  const [isRecording, setIsRecording] = useState(false)
  const recorderManagerRef = useRef<Taro.RecorderManager | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedRecipe, setGeneratedRecipe] = useState<any>(null)
  const [showActionSheet, setShowActionSheet] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [showForm, setShowForm] = useState(false)

  const scrollViewRef = useRef<string>('')

  const isWeapp = Taro.getEnv() === Taro.ENV_TYPE.WEAPP
  const showCuisineSelect = CATEGORIES[categoryIndex]?.id === 'chinese'

  // 初始化录音管理器
  useEffect(() => {
    if (isWeapp) {
      const manager = Taro.getRecorderManager()
      manager.onStart(() => setIsRecording(true))
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
    setIsGenerating(true)
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
      }
    } catch (error) {
      console.error('语音识别失败', error)
      Taro.showToast({ title: '语音识别失败', icon: 'none' })
    } finally {
      setIsGenerating(false)
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

  // 发送文本消息
  const sendMessage = () => {
    if (!textInput.trim()) return
    addMessage('user', textInput)
    setTextInput('')
  }

  // 选择图片
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

  // 删除图片
  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index))
  }

  // AI生成菜谱
  const generateRecipe = async () => {
    if (!textInput.trim() && !dishName.trim()) {
      Taro.showToast({ title: '请输入菜名或食材做法', icon: 'none' })
      return
    }
    setIsGenerating(true)
    addMessage('user', `生成菜谱：${dishName || '未命名菜品'}`)
    try {
      const result = await Network.request({
        url: '/api/ai/generate-recipe',
        method: 'POST',
        data: {
          name: dishName,
          category: CATEGORIES[categoryIndex].id,
          cuisine: showCuisineSelect ? CHINESE_CUISINES[cuisineIndex].id : undefined,
          input: textInput,
          images
        }
      })
      setGeneratedRecipe((result as any).data)
      addMessage('ai', '菜谱生成成功！请查看下方预览并保存。')
    } catch (error) {
      console.error('生成菜谱失败', error)
      addMessage('ai', '菜谱生成失败，请稍后再试。')
    } finally {
      setIsGenerating(false)
    }
  }

  // 提交保存
  const saveDish = async () => {
    if (!dishName.trim()) {
      Taro.showToast({ title: '请输入菜名', icon: 'none' })
      return
    }
    if (!generatedRecipe) {
      Taro.showToast({ title: '请先生成菜谱', icon: 'none' })
      return
    }
    try {
      await Network.request({
        url: '/api/dishes',
        method: 'POST',
        data: {
          name: dishName,
          images,
          category: CATEGORIES[categoryIndex].id,
          cuisine: showCuisineSelect ? CHINESE_CUISINES[cuisineIndex].id : undefined,
          ...generatedRecipe
        }
      })
      Taro.showToast({ title: '保存成功', icon: 'success' })
      // 重置表单
      setImages([])
      setDishName('')
      setTextInput('')
      setGeneratedRecipe(null)
      setMessages([])
      setShowForm(false)
    } catch (error) {
      console.error('保存失败', error)
      Taro.showToast({ title: '保存失败', icon: 'none' })
    }
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
        {messages.length === 0 && !showForm && (
          <View className="flex flex-col items-center justify-center py-12">
            <View className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center mb-4">
              <Plus size={32} color="#6366F1" />
            </View>
            <Text className="block text-lg font-semibold text-gray-800 mb-2">
              录入新菜品
            </Text>
            <Text className="block text-sm text-gray-500 text-center">
              说出菜品的食材和做法{'\n'}我来帮您生成菜谱
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
        {isGenerating && (
          <View className="flex flex-row justify-start mb-4">
            <View className="bg-white rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
              <View className="flex flex-row items-center">
                <Loader size={16} color="#6366F1" className="animate-spin" />
                <Text className="text-gray-500 text-sm ml-2">AI生成中...</Text>
              </View>
            </View>
          </View>
        )}

        {/* 图片上传区 */}
        {showForm && (
          <View className="bg-white rounded-2xl p-4 shadow-sm mb-4">
            <Text className="block text-sm font-medium text-gray-800 mb-3">菜品图片</Text>
            <View className="flex flex-row gap-3">
              {images.map((img, index) => (
                <View key={index} className="relative w-20 h-20">
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
                  className="w-20 h-20 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center"
                  onClick={() => setShowActionSheet(true)}
                >
                  <Plus size={20} color="#9CA3AF" />
                  <Text className="block text-xs text-gray-400 mt-1">添加</Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* 菜名和分类设置 */}
        {showForm && (
          <View className="bg-white rounded-2xl p-4 shadow-sm mb-4">
            {/* 菜名输入 */}
            <View className="mb-4">
              <Text className="block text-sm font-medium text-gray-800 mb-2">菜名</Text>
              <View className="bg-gray-50 rounded-xl px-3 py-2.5 border border-gray-100">
                <Input
                  className="w-full bg-transparent text-sm"
                  placeholder="请输入菜品名称"
                  value={dishName}
                  onInput={(e) => setDishName(e.detail.value)}
                />
              </View>
            </View>

            {/* 分类选择 */}
            <View className="mb-4">
              <Text className="block text-sm font-medium text-gray-800 mb-2">分类</Text>
              <Picker
                mode="selector"
                range={CATEGORIES.map(c => c.name)}
                value={categoryIndex}
                onChange={(e) => setCategoryIndex(Number(e.detail.value))}
              >
                <View className="bg-gray-50 rounded-xl px-3 py-2.5 border border-gray-100 flex flex-row justify-between items-center">
                  <Text className="text-sm text-gray-800">{CATEGORIES[categoryIndex].name}</Text>
                  <Text className="text-gray-400 text-xs">▼</Text>
                </View>
              </Picker>
            </View>

            {/* 中餐菜系选择 */}
            {showCuisineSelect && (
              <View>
                <Text className="block text-sm font-medium text-gray-800 mb-2">菜系</Text>
                <Picker
                  mode="selector"
                  range={CHINESE_CUISINES.map(c => c.name)}
                  value={cuisineIndex}
                  onChange={(e) => setCuisineIndex(Number(e.detail.value))}
                >
                  <View className="bg-gray-50 rounded-xl px-3 py-2.5 border border-gray-100 flex flex-row justify-between items-center">
                    <Text className="text-sm text-gray-800">{CHINESE_CUISINES[cuisineIndex].name}</Text>
                    <Text className="text-gray-400 text-xs">▼</Text>
                  </View>
                </Picker>
              </View>
            )}
          </View>
        )}

        {/* 生成的菜谱预览 */}
        {generatedRecipe && (
          <View className="bg-white rounded-2xl p-4 shadow-sm mb-4">
            <Text className="block text-sm font-semibold text-gray-800 mb-3">菜谱预览</Text>

            <View className="mb-3">
              <Text className="block text-xs font-medium text-gray-700">食材</Text>
              <Text className="block text-xs text-gray-600 mt-1">{generatedRecipe.ingredients}</Text>
            </View>

            <View className="mb-3">
              <Text className="block text-xs font-medium text-gray-700">配料</Text>
              <Text className="block text-xs text-gray-600 mt-1">{generatedRecipe.seasoning}</Text>
            </View>

            <View className="mb-3">
              <Text className="block text-xs font-medium text-gray-700">烹饪方式</Text>
              {generatedRecipe.steps?.map((step: string, i: number) => (
                <Text key={i} className="block text-xs text-gray-600 mt-1">
                  {i + 1}. {step}
                </Text>
              ))}
            </View>

            <View className="flex flex-row gap-4 pt-3 border-t border-gray-100">
              <View>
                <Text className="block text-xs text-gray-400">热量</Text>
                <Text className="block text-xs font-medium text-gray-800">{generatedRecipe.calories} 千卡</Text>
              </View>
              <View>
                <Text className="block text-xs text-gray-400">蛋白质</Text>
                <Text className="block text-xs font-medium text-gray-800">{generatedRecipe.protein}g</Text>
              </View>
              <View>
                <Text className="block text-xs text-gray-400">碳水</Text>
                <Text className="block text-xs font-medium text-gray-800">{generatedRecipe.carbs}g</Text>
              </View>
              <View>
                <Text className="block text-xs text-gray-400">脂肪</Text>
                <Text className="block text-xs font-medium text-gray-800">{generatedRecipe.fat}g</Text>
              </View>
            </View>

            {/* 保存按钮 */}
            <View
              className="bg-emerald-500 rounded-full py-3 flex items-center justify-center mt-4"
              onClick={saveDish}
            >
              <Check size={18} color="#fff" />
              <Text className="text-white font-medium ml-2">保存菜品</Text>
            </View>
          </View>
        )}

        {/* 底部占位 */}
        <View className="h-24" />
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
                placeholder="说出食材和做法..."
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

          {/* 设置按钮 */}
          <View
            className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0"
            onClick={() => setShowForm(!showForm)}
          >
            <Plus size={18} color={showForm ? '#6366F1' : '#6B7280'} />
          </View>
        </View>

        {/* 生成菜谱按钮 */}
        {(textInput.trim() || dishName.trim()) && !generatedRecipe && (
          <View
            className={`mt-2 bg-indigo-500 rounded-full py-2.5 flex items-center justify-center ${isGenerating ? 'opacity-50' : ''}`}
            onClick={isGenerating ? undefined : generateRecipe}
          >
            {isGenerating ? (
              <View className="flex flex-row items-center">
                <Loader size={14} color="#fff" className="animate-spin" />
                <Text className="text-white text-sm font-medium ml-1">AI生成中...</Text>
              </View>
            ) : (
              <Text className="text-white text-sm font-medium">AI 生成菜谱</Text>
            )}
          </View>
        )}

        {/* H5提示 */}
        {!isWeapp && inputMode === 'voice' && (
          <Text className="block text-xs text-gray-400 text-center mt-1">
            H5端不支持录音，请切换键盘输入
          </Text>
        )}
      </View>

      {/* 图片选择弹窗 */}
      {showActionSheet && (
        <View className="fixed inset-0 bg-black/50 flex items-end z-50" onClick={() => setShowActionSheet(false)}>
          <View className="bg-white w-full rounded-t-2xl p-4" onClick={(e) => e.stopPropagation()}>
            <View
              className="flex flex-row items-center justify-center py-4 border-b border-gray-100"
              onClick={() => chooseImage('camera')}
            >
              <Camera size={20} color="#6366F1" />
              <Text className="text-base text-gray-800 ml-2">拍照</Text>
            </View>
            <View
              className="flex flex-row items-center justify-center py-4 border-b border-gray-100"
              onClick={() => chooseImage('album')}
            >
              <ImageIcon size={20} color="#6366F1" />
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
    </View>
  )
}

export default AddDishPage
