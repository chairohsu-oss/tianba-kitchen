import { View, Text, Image, Input, Picker, ScrollView } from '@tarojs/components'
import { useState, useEffect } from 'react'
import Taro, { useRouter } from '@tarojs/taro'
import { Camera, Image as ImageIcon, X, Loader, Plus, Check, ArrowLeft } from 'lucide-react-taro'
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

interface GeneratedDish {
  calories?: number
  protein?: number
  carbs?: number
  fat?: number
  ingredients?: string[]
  seasoning?: string[]
  steps?: string[]
  tips?: string
  description?: string
}

const EditDishPage: FC = () => {
  const router = useRouter()
  
  // 菜品ID
  const [editId, setEditId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  
  // 图片
  const [images, setImages] = useState<string[]>([])
  const [showActionSheet, setShowActionSheet] = useState(false)
  
  // 分类设置
  const [categoryIndex, setCategoryIndex] = useState(0)
  const [cuisineIndex, setCuisineIndex] = useState(0)
  
  // 菜名
  const [dishName, setDishName] = useState('')
  
  // 生成的菜品数据
  const [generatedDish, setGeneratedDish] = useState<GeneratedDish | null>(null)

  const showCuisineSelect = CATEGORIES[categoryIndex]?.id === 'chinese'

  // 检查登录状态和加载菜品数据
  useEffect(() => {
    const isLoggedIn = Taro.getStorageSync('tianba_logged_in')
    if (!isLoggedIn) {
      Taro.redirectTo({ url: '/pages/login/index' })
      return
    }

    const editIdParam = router.params?.editId
    if (editIdParam) {
      setEditId(editIdParam)
      loadDishForEdit(editIdParam)
    } else {
      Taro.showToast({ title: '缺少菜品ID', icon: 'none' })
      setTimeout(() => Taro.navigateBack(), 1500)
    }
  }, [])

  // 加载菜品数据
  const loadDishForEdit = async (dishId: string) => {
    setLoading(true)
    try {
      const result = await Network.request({
        url: `/api/dishes/${dishId}`
      })
      
      const dishData = (result as any).data?.data || (result as any).data
      if (dishData) {
        setDishName(dishData.name)
        setImages(dishData.images || [])
        
        const catIndex = CATEGORIES.findIndex(c => c.id === dishData.category)
        if (catIndex >= 0) setCategoryIndex(catIndex)
        
        if (dishData.cuisine) {
          const cuiIndex = CHINESE_CUISINES.findIndex(c => c.id === dishData.cuisine)
          if (cuiIndex >= 0) setCuisineIndex(cuiIndex)
        }
        
        setGeneratedDish({
          calories: dishData.calories,
          protein: dishData.protein,
          carbs: dishData.carbs,
          fat: dishData.fat,
          ingredients: dishData.ingredients,
          seasoning: dishData.seasoning,
          steps: dishData.steps,
          tips: dishData.tips,
          description: dishData.description,
        })
      } else {
        Taro.showToast({ title: '菜品不存在', icon: 'none' })
        setTimeout(() => Taro.navigateBack(), 1500)
      }
    } catch (error) {
      console.error('加载菜品失败:', error)
      Taro.showToast({ title: '加载失败', icon: 'none' })
    } finally {
      setLoading(false)
    }
  }

  // 图片选择
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

  // 保存菜品
  const saveDish = async () => {
    if (!dishName.trim()) {
      Taro.showToast({ title: '请输入菜名', icon: 'none' })
      return
    }

    if (!generatedDish) {
      Taro.showToast({ title: '菜品数据不完整', icon: 'none' })
      return
    }

    setSaving(true)
    try {
      const dishData = {
        name: dishName,
        images,
        category: CATEGORIES[categoryIndex].id,
        cuisine: showCuisineSelect ? CHINESE_CUISINES[cuisineIndex].id : undefined,
        ...generatedDish
      }

      await Network.request({
        url: `/api/dishes/${editId}`,
        method: 'PUT',
        data: dishData
      })
      
      Taro.showToast({ title: '更新成功！', icon: 'success' })
      setTimeout(() => Taro.navigateBack(), 1500)
    } catch (error) {
      console.error('保存失败:', error)
      Taro.showToast({ title: '保存失败', icon: 'none' })
    } finally {
      setSaving(false)
    }
  }

  // 更新生成数据的某个字段
  const updateGeneratedField = (field: keyof GeneratedDish, value: any) => {
    setGeneratedDish(prev => prev ? { ...prev, [field]: value } : null)
  }

  if (loading) {
    return (
      <View className="flex flex-col items-center justify-center h-screen bg-gray-50">
        <Loader size={32} color="#F97316" className="animate-spin" />
        <Text className="text-gray-400 mt-3">加载中...</Text>
      </View>
    )
  }

  return (
    <View className="flex flex-col bg-gray-50 min-h-screen">
      {/* 顶部导航栏 */}
      <View className="fixed top-0 left-0 right-0 bg-white border-b border-gray-100 px-4 py-3 z-50 flex flex-row items-center">
        <View onClick={() => Taro.navigateBack()}>
          <ArrowLeft size={24} color="#374151" />
        </View>
        <Text className="flex-1 text-center text-base font-semibold text-gray-800 pr-6">
          编辑菜品
        </Text>
      </View>

      <ScrollView scrollY style={{ paddingTop: '48px', paddingBottom: '100px' }}>
        {/* 菜品照片 */}
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

        {/* 分类设置 */}
        <View className="bg-white px-4 py-4 mb-2">
          <Text className="block text-sm font-medium text-gray-800 mb-3">🏷️ 分类设置</Text>
          
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

        {/* 菜名输入 */}
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

        {/* 营养信息编辑 */}
        {generatedDish && (
          <View className="bg-white px-4 py-4 mb-2">
            <Text className="block text-sm font-medium text-gray-800 mb-3">🔥 营养信息</Text>
            <View className="grid grid-cols-4 gap-3">
              <View>
                <Text className="block text-xs text-gray-500 mb-1">热量(千卡)</Text>
                <View className="bg-gray-50 rounded-lg px-3 py-2">
                  <Input
                    className="w-full text-sm text-center"
                    type="number"
                    value={String(generatedDish.calories || 0)}
                    onInput={(e) => updateGeneratedField('calories', Number(e.detail.value))}
                  />
                </View>
              </View>
              <View>
                <Text className="block text-xs text-gray-500 mb-1">蛋白质(g)</Text>
                <View className="bg-gray-50 rounded-lg px-3 py-2">
                  <Input
                    className="w-full text-sm text-center"
                    type="number"
                    value={String(generatedDish.protein || 0)}
                    onInput={(e) => updateGeneratedField('protein', Number(e.detail.value))}
                  />
                </View>
              </View>
              <View>
                <Text className="block text-xs text-gray-500 mb-1">碳水(g)</Text>
                <View className="bg-gray-50 rounded-lg px-3 py-2">
                  <Input
                    className="w-full text-sm text-center"
                    type="number"
                    value={String(generatedDish.carbs || 0)}
                    onInput={(e) => updateGeneratedField('carbs', Number(e.detail.value))}
                  />
                </View>
              </View>
              <View>
                <Text className="block text-xs text-gray-500 mb-1">脂肪(g)</Text>
                <View className="bg-gray-50 rounded-lg px-3 py-2">
                  <Input
                    className="w-full text-sm text-center"
                    type="number"
                    value={String(generatedDish.fat || 0)}
                    onInput={(e) => updateGeneratedField('fat', Number(e.detail.value))}
                  />
                </View>
              </View>
            </View>
          </View>
        )}

        {/* 食材编辑 */}
        {generatedDish && (
          <View className="bg-white px-4 py-4 mb-2">
            <Text className="block text-sm font-medium text-gray-800 mb-3">🥬 食材（每行一个）</Text>
            <View className="bg-gray-50 rounded-xl p-3">
              <Input
                className="w-full text-sm"
                style={{ minHeight: '80px' }}
                placeholder="排骨 500g&#10;葱 2根&#10;姜 3片"
                value={(generatedDish.ingredients || []).join('\n')}
                onInput={(e) => updateGeneratedField('ingredients', e.detail.value.split('\n').filter(s => s.trim()))}
              />
            </View>
          </View>
        )}

        {/* 配料编辑 */}
        {generatedDish && (
          <View className="bg-white px-4 py-4 mb-2">
            <Text className="block text-sm font-medium text-gray-800 mb-3">🧂 配料（每行一个）</Text>
            <View className="bg-gray-50 rounded-xl p-3">
              <Input
                className="w-full text-sm"
                style={{ minHeight: '60px' }}
                placeholder="料酒 2勺&#10;生抽 3勺"
                value={(generatedDish.seasoning || []).join('\n')}
                onInput={(e) => updateGeneratedField('seasoning', e.detail.value.split('\n').filter(s => s.trim()))}
              />
            </View>
          </View>
        )}

        {/* 烹饪步骤编辑 */}
        {generatedDish && (
          <View className="bg-white px-4 py-4 mb-2">
            <Text className="block text-sm font-medium text-gray-800 mb-3">👨‍🍳 烹饪步骤（每行一步）</Text>
            <View className="bg-gray-50 rounded-xl p-3">
              <Input
                className="w-full text-sm"
                style={{ minHeight: '100px' }}
                placeholder="排骨洗净焯水&#10;炒糖色&#10;放入排骨翻炒"
                value={(generatedDish.steps || []).join('\n')}
                onInput={(e) => updateGeneratedField('steps', e.detail.value.split('\n').filter(s => s.trim()))}
              />
            </View>
          </View>
        )}

        {/* 描述编辑 */}
        {generatedDish && (
          <View className="bg-white px-4 py-4 mb-2">
            <Text className="block text-sm font-medium text-gray-800 mb-3">📄 菜品描述</Text>
            <View className="bg-gray-50 rounded-xl p-3">
              <Input
                className="w-full text-sm"
                style={{ minHeight: '60px' }}
                placeholder="简要描述菜品特色..."
                value={generatedDish.description || ''}
                onInput={(e) => updateGeneratedField('description', e.detail.value)}
              />
            </View>
          </View>
        )}

        {/* 底部占位 */}
        <View style={{ height: '120px' }} />
      </ScrollView>

      {/* 底部保存按钮 */}
      <View 
        className="fixed left-0 right-0 bg-white border-t border-gray-200 px-4 py-3"
        style={{ bottom: 0, paddingBottom: '30px' }}
      >
        <View
          className={`rounded-full py-4 flex flex-row items-center justify-center ${saving ? 'bg-gray-400' : 'bg-emerald-500'}`}
          onClick={saving ? undefined : saveDish}
        >
          {saving ? (
            <>
              <Loader size={18} color="#fff" className="animate-spin" />
              <Text className="text-white font-medium ml-2">保存中...</Text>
            </>
          ) : (
            <>
              <Check size={18} color="#fff" />
              <Text className="text-white font-medium ml-2">保存修改</Text>
            </>
          )}
        </View>
      </View>

      {/* 图片选择弹窗 */}
      {showActionSheet && (
        <View 
          className="fixed inset-0 z-50 flex items-end"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
          onClick={() => setShowActionSheet(false)}
        >
          <View 
            className="bg-white rounded-t-2xl w-full p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <View
              className="flex flex-row items-center justify-center py-4 border-b border-gray-100"
              onClick={() => chooseImage('camera')}
            >
              <Camera size={20} color="#374151" />
              <Text className="text-base text-gray-800 ml-2">拍照</Text>
            </View>
            <View
              className="flex flex-row items-center justify-center py-4 border-b border-gray-100"
              onClick={() => chooseImage('album')}
            >
              <ImageIcon size={20} color="#374151" />
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

export default EditDishPage
