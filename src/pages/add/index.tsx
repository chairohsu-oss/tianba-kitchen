import { View, Text, Image, Input, Textarea, Picker, ScrollView } from '@tarojs/components'
import { useState, useEffect } from 'react'
import Taro from '@tarojs/taro'
import { Mic, Keyboard, Camera, Image as ImageIcon, X, Loader, Plus } from 'lucide-react-taro'
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

const AddDishPage: FC = () => {
  const [images, setImages] = useState<string[]>([])
  const [dishName, setDishName] = useState('')
  const [categoryIndex, setCategoryIndex] = useState(0)
  const [cuisineIndex, setCuisineIndex] = useState(0)
  const [inputMode, setInputMode] = useState<'voice' | 'keyboard'>('voice')
  const [textInput, setTextInput] = useState('')
  const [isRecording, setIsRecording] = useState(false)
  const [recorderManager, setRecorderManager] = useState<Taro.RecorderManager | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedRecipe, setGeneratedRecipe] = useState<any>(null)
  const [showActionSheet, setShowActionSheet] = useState(false)

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
      setRecorderManager(manager)
    }
  }, [isWeapp])

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
      setTextInput(recognizedText)
    } catch (error) {
      console.error('语音识别失败', error)
      Taro.showToast({ title: '语音识别失败', icon: 'none' })
    } finally {
      setIsGenerating(false)
    }
  }

  // 开始/停止录音
  const toggleRecording = () => {
    if (!isWeapp) {
      Taro.showToast({ title: 'H5端暂不支持录音', icon: 'none' })
      return
    }
    if (isRecording) {
      recorderManager?.stop()
    } else {
      recorderManager?.start({ format: 'wav', sampleRate: 16000, numberOfChannels: 1 })
    }
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
    if (!textInput.trim()) {
      Taro.showToast({ title: '请输入食材和做法', icon: 'none' })
      return
    }
    setIsGenerating(true)
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
      Taro.showToast({ title: '菜谱生成成功', icon: 'success' })
    } catch (error) {
      console.error('生成菜谱失败', error)
      Taro.showToast({ title: '生成失败', icon: 'none' })
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
    } catch (error) {
      console.error('保存失败', error)
      Taro.showToast({ title: '保存失败', icon: 'none' })
    }
  }

  return (
    <ScrollView scrollY className="min-h-screen bg-gray-50">
      <View className="p-4">
        {/* 图片上传区 */}
        <View className="mb-6">
          <Text className="block text-base font-medium text-gray-800 mb-3">菜品图片</Text>
          <View className="flex flex-row gap-3">
            {images.map((img, index) => (
              <View key={index} className="relative w-24 h-24">
                <Image className="w-full h-full rounded-xl" src={img} mode="aspectFill" />
                <View
                  className="absolute -top-2 -right-2 w-6 h-6 bg-gray-800 rounded-full flex items-center justify-center"
                  onClick={() => removeImage(index)}
                >
                  <X size={14} color="#fff" />
                </View>
              </View>
            ))}
            {images.length < 3 && (
              <View
                className="w-24 h-24 bg-white rounded-xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center"
                onClick={() => setShowActionSheet(true)}
              >
                <Plus size={24} color="#9CA3AF" />
                <Text className="block text-xs text-gray-400 mt-1">添加图片</Text>
              </View>
            )}
          </View>
          <Text className="block text-xs text-gray-400 mt-2">最多上传3张，点击图片可删除</Text>
        </View>

        {/* 菜名输入 */}
        <View className="mb-6">
          <Text className="block text-base font-medium text-gray-800 mb-3">菜名</Text>
          <View className="bg-white rounded-xl px-4 py-3 border border-gray-100">
            <Input
              className="w-full bg-transparent text-base"
              placeholder="请输入菜品名称"
              value={dishName}
              onInput={(e) => setDishName(e.detail.value)}
            />
          </View>
        </View>

        {/* 分类选择 */}
        <View className="mb-6">
          <Text className="block text-base font-medium text-gray-800 mb-3">分类</Text>
          <Picker
            mode="selector"
            range={CATEGORIES.map(c => c.name)}
            value={categoryIndex}
            onChange={(e) => setCategoryIndex(Number(e.detail.value))}
          >
            <View className="bg-white rounded-xl px-4 py-3 border border-gray-100 flex flex-row justify-between items-center">
              <Text className="text-base text-gray-800">{CATEGORIES[categoryIndex].name}</Text>
              <Text className="text-gray-400">▼</Text>
            </View>
          </Picker>
        </View>

        {/* 中餐菜系选择 */}
        {showCuisineSelect && (
          <View className="mb-6">
            <Text className="block text-base font-medium text-gray-800 mb-3">菜系</Text>
            <Picker
              mode="selector"
              range={CHINESE_CUISINES.map(c => c.name)}
              value={cuisineIndex}
              onChange={(e) => setCuisineIndex(Number(e.detail.value))}
            >
              <View className="bg-white rounded-xl px-4 py-3 border border-gray-100 flex flex-row justify-between items-center">
                <Text className="text-base text-gray-800">{CHINESE_CUISINES[cuisineIndex].name}</Text>
                <Text className="text-gray-400">▼</Text>
              </View>
            </Picker>
          </View>
        )}

        {/* 食材做法输入 */}
        <View className="mb-6">
          <Text className="block text-base font-medium text-gray-800 mb-3">食材与做法</Text>

          {/* 输入模式切换 */}
          <View className="flex flex-row gap-2 mb-3">
            <View
              className={`flex-row items-center px-3 py-2 rounded-full ${inputMode === 'voice' ? 'bg-orange-50 border border-orange-200' : 'bg-gray-100'}`}
              onClick={() => setInputMode('voice')}
            >
              <Mic size={16} color={inputMode === 'voice' ? '#FF6B35' : '#6B7280'} />
              <Text className={`ml-1 text-sm ${inputMode === 'voice' ? 'text-orange-500' : 'text-gray-500'}`}>
                语音
              </Text>
            </View>
            <View
              className={`flex-row items-center px-3 py-2 rounded-full ${inputMode === 'keyboard' ? 'bg-orange-50 border border-orange-200' : 'bg-gray-100'}`}
              onClick={() => setInputMode('keyboard')}
            >
              <Keyboard size={16} color={inputMode === 'keyboard' ? '#FF6B35' : '#6B7280'} />
              <Text className={`ml-1 text-sm ${inputMode === 'keyboard' ? 'text-orange-500' : 'text-gray-500'}`}>
                键盘
              </Text>
            </View>
          </View>

          {inputMode === 'voice' ? (
            <View className="flex flex-col items-center py-6 bg-white rounded-xl border border-gray-100">
              {isWeapp ? (
                <View
                  className={`w-16 h-16 rounded-full flex items-center justify-center ${isRecording ? 'bg-orange-500' : 'bg-orange-100'}`}
                  onClick={toggleRecording}
                >
                  <Mic size={28} color={isRecording ? '#fff' : '#FF6B35'} />
                </View>
              ) : (
                <Text className="block text-gray-500 text-center">
                  H5端不支持录音，请使用键盘输入
                </Text>
              )}
            </View>
          ) : (
            <View className="bg-white rounded-xl p-4 border border-gray-100">
              <Textarea
                style={{ width: '100%', minHeight: '120px', backgroundColor: 'transparent' }}
                placeholder="请输入食材、配料、烹饪方式...&#10;例如：排骨500g、葱姜蒜、料酒、酱油，先焯水去腥，再红烧收汁..."
                value={textInput}
                onInput={(e) => setTextInput(e.detail.value)}
              />
            </View>
          )}
        </View>

        {/* 生成菜谱按钮 */}
        <View
          className={`bg-orange-500 rounded-full py-4 flex items-center justify-center mb-6 ${isGenerating ? 'opacity-50' : ''}`}
          onClick={isGenerating ? undefined : generateRecipe}
        >
          {isGenerating ? (
            <View className="flex flex-row items-center">
              <Loader size={20} color="#fff" className="animate-spin" />
              <Text className="text-white font-medium ml-2">AI生成中...</Text>
            </View>
          ) : (
            <Text className="text-white font-medium">AI 生成菜谱</Text>
          )}
        </View>

        {/* 生成的菜谱预览 */}
        {generatedRecipe && (
          <View className="bg-white rounded-2xl p-4 mb-6 shadow-sm">
            <Text className="block text-base font-semibold text-gray-800 mb-3">菜谱预览</Text>

            <View className="mb-3">
              <Text className="block text-sm font-medium text-gray-700">食材</Text>
              <Text className="block text-sm text-gray-600 mt-1">{generatedRecipe.ingredients}</Text>
            </View>

            <View className="mb-3">
              <Text className="block text-sm font-medium text-gray-700">配料</Text>
              <Text className="block text-sm text-gray-600 mt-1">{generatedRecipe.seasoning}</Text>
            </View>

            <View className="mb-3">
              <Text className="block text-sm font-medium text-gray-700">烹饪方式</Text>
              {generatedRecipe.steps?.map((step: string, i: number) => (
                <Text key={i} className="block text-sm text-gray-600 mt-1">
                  {i + 1}. {step}
                </Text>
              ))}
            </View>

            <View className="flex flex-row gap-4 pt-3 border-t border-gray-100">
              <View>
                <Text className="block text-xs text-gray-400">热量</Text>
                <Text className="block text-sm font-medium text-gray-800">{generatedRecipe.calories} 千卡</Text>
              </View>
              <View>
                <Text className="block text-xs text-gray-400">蛋白质</Text>
                <Text className="block text-sm font-medium text-gray-800">{generatedRecipe.protein}g</Text>
              </View>
              <View>
                <Text className="block text-xs text-gray-400">碳水</Text>
                <Text className="block text-sm font-medium text-gray-800">{generatedRecipe.carbs}g</Text>
              </View>
              <View>
                <Text className="block text-xs text-gray-400">脂肪</Text>
                <Text className="block text-sm font-medium text-gray-800">{generatedRecipe.fat}g</Text>
              </View>
            </View>
          </View>
        )}

        {/* 保存按钮 */}
        {generatedRecipe && (
          <View
            className="bg-green-500 rounded-full py-4 flex items-center justify-center"
            onClick={saveDish}
          >
            <Text className="text-white font-medium">保存菜品</Text>
          </View>
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
              <Camera size={20} color="#FF6B35" />
              <Text className="text-base text-gray-800 ml-2">拍照</Text>
            </View>
            <View
              className="flex flex-row items-center justify-center py-4 border-b border-gray-100"
              onClick={() => chooseImage('album')}
            >
              <ImageIcon size={20} color="#FF6B35" />
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
    </ScrollView>
  )
}

export default AddDishPage
