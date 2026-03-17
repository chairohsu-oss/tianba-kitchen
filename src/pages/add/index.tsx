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
  const [showNameInput, setShowNameInput] = useState(false)
  const [nameInputMode, setNameInputMode] = useState<'voice' | 'keyboard'>('keyboard')

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

  // 开始/停止录音
  const startRecording = () => {
    if (!isWeapp) {
      Taro.showToast({ title: 'H5端暂不支持录音，请使用键盘输入', icon: 'none' })
      return
    }
    recorderManagerRef.current?.start({ format: 'wav', sampleRate: 16000, numberOfChannels: 1 })
  }

  const stopRecording = () => {
    recorderManagerRef.current?.stop()
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
        // 如果是在菜名输入模式，填充菜名
        if (showNameInput) {
          setDishName(recognizedText)
        } else {
          // 否则填充烹饪方式
          setTextInput(prev => prev ? prev + '\n' + recognizedText : recognizedText)
        }
      }
    } catch (error) {
      console.error('语音识别失败', error)
      Taro.showToast({ title: '语音识别失败', icon: 'none' })
    } finally {
      setIsGenerating(false)
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

  // 点击中间区域上传照片
  const handleCenterClick = () => {
    setShowActionSheet(true)
  }

  // 删除图片
  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index))
  }

  // AI生成菜谱
  const generateRecipe = async () => {
    if (!dishName.trim()) {
      Taro.showToast({ title: '请输入菜名', icon: 'none' })
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

  // 发送烹饪方式文本
  const sendCookingText = () => {
    if (!textInput.trim()) return
    // 可以在这里做一些处理，或者直接等待生成菜谱
  }

  return (
    <View className="flex flex-col h-screen bg-gray-50">
      {/* 顶部上传照片区域 */}
      <View className="bg-white border-b border-gray-100">
        {images.length === 0 ? (
          // 未上传照片时显示大区域
          <View
            className="flex flex-col items-center justify-center py-12"
            onClick={handleCenterClick}
          >
            <View className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-3">
              <Camera size={32} color="#9CA3AF" />
            </View>
            <Text className="block text-sm text-gray-500">点击上传菜品照片</Text>
            <Text className="block text-xs text-gray-400 mt-1">最多上传3张</Text>
          </View>
        ) : (
          // 已上传照片时显示缩略图
          <View className="p-4">
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
                  className="w-20 h-20 bg-gray-100 rounded-xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center"
                  onClick={() => setShowActionSheet(true)}
                >
                  <Plus size={20} color="#9CA3AF" />
                  <Text className="block text-xs text-gray-400 mt-1">添加</Text>
                </View>
              )}
            </View>
          </View>
        )}
      </View>

      <ScrollView scrollY className="flex-1 p-4">
        {/* 菜名输入 */}
        <View className="bg-white rounded-2xl p-4 shadow-sm mb-4">
          <Text className="block text-sm font-medium text-gray-800 mb-3">菜品名称</Text>
          <View className="flex flex-row items-center gap-2">
            {showNameInput && nameInputMode === 'voice' ? (
              <>
                <View
                  className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${isRecording ? 'bg-gray-800' : 'bg-gray-100'}`}
                  onTouchStart={startRecording}
                  onTouchEnd={stopRecording}
                >
                  <Mic size={18} color={isRecording ? '#fff' : '#6B7280'} />
                </View>
                <View
                  className="flex-1 bg-gray-100 rounded-full px-4 py-2.5 min-h-[40px] flex items-center justify-center"
                  onTouchStart={startRecording}
                  onTouchEnd={stopRecording}
                >
                  <Text className={`text-sm ${isRecording ? 'text-gray-800 font-medium' : 'text-gray-400'}`}>
                    {isRecording ? '松开结束' : '按住说菜名'}
                  </Text>
                </View>
              </>
            ) : (
              <>
                <View className="flex-1 bg-gray-100 rounded-full px-4 py-0 min-h-[40px] flex items-center">
                  <Input
                    className="w-full text-sm"
                    placeholder="输入菜名"
                    value={dishName}
                    onInput={(e) => setDishName(e.detail.value)}
                  />
                </View>
              </>
            )}
            <View
              className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0"
              onClick={() => {
                setShowNameInput(true)
                setNameInputMode(nameInputMode === 'voice' ? 'keyboard' : 'voice')
              }}
            >
              {nameInputMode === 'voice' ? (
                <Keyboard size={18} color="#6B7280" />
              ) : (
                <Mic size={18} color="#6B7280" />
              )}
            </View>
          </View>
        </View>

        {/* 分类和菜系选择 */}
        <View className="bg-white rounded-2xl p-4 shadow-sm mb-4">
          <Text className="block text-sm font-medium text-gray-800 mb-3">分类设置</Text>
          
          {/* 分类选择 */}
          <View className="mb-3">
            <Text className="block text-xs text-gray-500 mb-2">分类</Text>
            <Picker
              mode="selector"
              range={CATEGORIES.map(c => c.name)}
              value={categoryIndex}
              onChange={(e) => setCategoryIndex(Number(e.detail.value))}
            >
              <View className="bg-gray-100 rounded-xl px-3 py-2.5 flex flex-row justify-between items-center">
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
                <View className="bg-gray-100 rounded-xl px-3 py-2.5 flex flex-row justify-between items-center">
                  <Text className="text-sm text-gray-800">{CHINESE_CUISINES[cuisineIndex].name}</Text>
                  <Text className="text-gray-400 text-xs">▼</Text>
                </View>
              </Picker>
            </View>
          )}
        </View>

        {/* 烹饪方式输入 - 底部输入框样式 */}
        <View className="bg-white rounded-2xl p-4 shadow-sm mb-4">
          <Text className="block text-sm font-medium text-gray-800 mb-3">烹饪方式</Text>
          
          {/* 已输入的内容显示 */}
          {textInput && (
            <View className="bg-gray-100 rounded-xl p-3 mb-3">
              <Text className="text-sm text-gray-700 whitespace-pre-wrap">{textInput}</Text>
            </View>
          )}

          {/* 输入框 - 加高50% */}
          <View className="flex flex-row items-center gap-2">
            {inputMode === 'voice' ? (
              <>
                <View
                  className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${isRecording ? 'bg-gray-800' : 'bg-gray-100'}`}
                  onTouchStart={startRecording}
                  onTouchEnd={stopRecording}
                >
                  <Mic size={22} color={isRecording ? '#fff' : '#6B7280'} />
                </View>
                <View
                  className="flex-1 bg-gray-100 rounded-full px-5 py-4 min-h-[52px] flex items-center justify-center"
                  onTouchStart={startRecording}
                  onTouchEnd={stopRecording}
                >
                  <Text className={`text-sm ${isRecording ? 'text-gray-800 font-medium' : 'text-gray-400'}`}>
                    {isRecording ? '松开结束' : '按住说做法'}
                  </Text>
                </View>
              </>
            ) : (
              <>
                <View
                  className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${textInput.trim() ? 'bg-gray-800' : 'bg-gray-100'}`}
                  onClick={textInput.trim() ? sendCookingText : undefined}
                >
                  <Send size={20} color={textInput.trim() ? '#fff' : '#9CA3AF'} />
                </View>
                <View className="flex-1 bg-gray-100 rounded-full px-5 py-0 min-h-[52px] flex items-center">
                  <Input
                    className="w-full text-sm"
                    placeholder="输入食材和做法..."
                    value={textInput}
                    onInput={(e) => setTextInput(e.detail.value)}
                    onConfirm={sendCookingText}
                    confirmType="done"
                  />
                </View>
              </>
            )}
            <View
              className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0"
              onClick={() => setInputMode(inputMode === 'voice' ? 'keyboard' : 'voice')}
            >
              {inputMode === 'voice' ? (
                <Keyboard size={20} color="#6B7280" />
              ) : (
                <Mic size={20} color="#6B7280" />
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

        {/* 生成菜谱按钮 */}
        <View
          className={`bg-gray-800 rounded-full py-4 flex items-center justify-center mb-4 ${isGenerating ? 'opacity-50' : ''}`}
          onClick={isGenerating ? undefined : generateRecipe}
        >
          {isGenerating ? (
            <View className="flex flex-row items-center">
              <Loader size={18} color="#fff" className="animate-spin" />
              <Text className="text-white font-medium ml-2">AI生成中...</Text>
            </View>
          ) : (
            <Text className="text-white font-medium">AI 生成菜谱</Text>
          )}
        </View>

        {/* 生成的菜谱预览 */}
        {generatedRecipe && (
          <View className="bg-white rounded-2xl p-4 shadow-sm mb-4">
            <Text className="block text-base font-semibold text-gray-800 mb-3">菜谱预览</Text>

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
        <View className="h-4" />
      </ScrollView>

      {/* 图片选择弹窗 */}
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
    </View>
  )
}

export default AddDishPage
