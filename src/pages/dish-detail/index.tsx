import { View, Text, Image, ScrollView } from '@tarojs/components'
import { useState, useEffect } from 'react'
import { useRouter } from '@tarojs/taro'
import { Flame, Wheat, Droplet, ChefHat } from 'lucide-react-taro'
import { Network } from '@/network'
import type { FC } from 'react'

interface DishDetail {
  id: string
  name: string
  images: string[]
  category: string
  cuisine?: string
  calories: number
  protein: number
  carbs: number
  fat: number
  ingredients: string[]
  seasoning: string[]
  steps: string[]
  tips: string
  description: string
}

const DishDetailPage: FC = () => {
  const router = useRouter()
  const { id } = router.params
  const [dish, setDish] = useState<DishDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)

  useEffect(() => {
    if (id) {
      fetchDishDetail()
    }
  }, [id])

  const fetchDishDetail = async () => {
    setLoading(true)
    try {
      const result = await Network.request({
        url: `/api/dishes/${id}`
      })
      setDish((result as any).data)
    } catch (error) {
      console.error('获取详情失败', error)
      // 使用模拟数据
      setDish(getMockDetail())
    } finally {
      setLoading(false)
    }
  }

  const getMockDetail = (): DishDetail => ({
    id: id || '1',
    name: '红烧排骨',
    images: [
      'https://picsum.photos/400?random=1',
      'https://picsum.photos/400?random=2',
    ],
    category: 'chinese',
    cuisine: 'jiangzhe',
    calories: 450,
    protein: 28,
    carbs: 15,
    fat: 32,
    ingredients: ['排骨 500g', '葱 2根', '姜 3片', '蒜 4瓣'],
    seasoning: ['料酒 2勺', '生抽 3勺', '老抽 1勺', '冰糖 30g', '盐 适量'],
    steps: [
      '排骨洗净，冷水下锅焯水，撇去浮沫后捞出备用',
      '锅中放油，加入冰糖小火炒出糖色',
      '放入排骨翻炒上色，加入葱姜蒜爆香',
      '加入料酒、生抽、老抽调味',
      '加入没过排骨的热水，大火烧开后转小火炖40分钟',
      '最后大火收汁，撒上葱花即可出锅'
    ],
    tips: '炒糖色时要用小火，避免炒糊发苦。炖煮时要用热水，肉质会更嫩。',
    description: '经典家常菜，色泽红亮，肉质软烂，甜咸适口。'
  })

  if (loading) {
    return (
      <View className="flex items-center justify-center min-h-screen bg-gray-50">
        <Text className="text-gray-400">加载中...</Text>
      </View>
    )
  }

  if (!dish) {
    return (
      <View className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
        <Text className="block text-4xl mb-4">🍽️</Text>
        <Text className="text-gray-400">菜品不存在</Text>
      </View>
    )
  }

  return (
    <ScrollView scrollY className="min-h-screen bg-gray-50">
      {/* 图片轮播 */}
      <View className="relative">
        <Image
          className="w-full h-64"
          src={dish.images[currentImageIndex] || dish.images[0]}
          mode="aspectFill"
        />
        {dish.images.length > 1 && (
          <View className="absolute bottom-4 left-0 right-0 flex flex-row justify-center gap-1">
            {dish.images.map((_, index) => (
              <View
                key={index}
                className={`w-2 h-2 rounded-full ${index === currentImageIndex ? 'bg-white' : 'bg-white/50'}`}
                onClick={() => setCurrentImageIndex(index)}
              />
            ))}
          </View>
        )}
      </View>

      <View className="p-4">
        {/* 基本信息 */}
        <View className="bg-white rounded-2xl p-4 shadow-sm mb-4">
          <Text className="block text-xl font-bold text-gray-800">{dish.name}</Text>
          <Text className="block text-sm text-gray-500 mt-1">{dish.description}</Text>

          {/* 营养信息 */}
          <View className="flex flex-row justify-between mt-4 pt-4 border-t border-gray-100">
            <View className="flex flex-col items-center">
              <Flame size={20} color="#FF6B35" />
              <Text className="block text-lg font-semibold text-gray-800 mt-1">{dish.calories}</Text>
              <Text className="block text-xs text-gray-400">千卡</Text>
            </View>
            <View className="flex flex-col items-center">
              <Wheat size={20} color="#22C55E" />
              <Text className="block text-lg font-semibold text-gray-800 mt-1">{dish.protein}g</Text>
              <Text className="block text-xs text-gray-400">蛋白质</Text>
            </View>
            <View className="flex flex-col items-center">
              <View className="w-5 h-5 rounded-full bg-amber-100 flex items-center justify-center">
                <Text className="text-xs text-amber-600">C</Text>
              </View>
              <Text className="block text-lg font-semibold text-gray-800 mt-1">{dish.carbs}g</Text>
              <Text className="block text-xs text-gray-400">碳水</Text>
            </View>
            <View className="flex flex-col items-center">
              <Droplet size={20} color="#3B82F6" />
              <Text className="block text-lg font-semibold text-gray-800 mt-1">{dish.fat}g</Text>
              <Text className="block text-xs text-gray-400">脂肪</Text>
            </View>
          </View>
        </View>

        {/* 食材 */}
        <View className="bg-white rounded-2xl p-4 shadow-sm mb-4">
          <View className="flex flex-row items-center mb-3">
            <ChefHat size={20} color="#FF6B35" />
            <Text className="block text-base font-semibold text-gray-800 ml-2">食材</Text>
          </View>
          <View className="flex flex-row flex-wrap gap-2">
            {dish.ingredients.map((item, index) => (
              <View key={index} className="bg-orange-50 rounded-full px-3 py-1">
                <Text className="text-sm text-orange-600">{item}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* 配料 */}
        <View className="bg-white rounded-2xl p-4 shadow-sm mb-4">
          <Text className="block text-base font-semibold text-gray-800 mb-3">配料</Text>
          <View className="flex flex-row flex-wrap gap-2">
            {dish.seasoning.map((item, index) => (
              <View key={index} className="bg-gray-100 rounded-full px-3 py-1">
                <Text className="text-sm text-gray-600">{item}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* 烹饪步骤 */}
        <View className="bg-white rounded-2xl p-4 shadow-sm mb-4">
          <Text className="block text-base font-semibold text-gray-800 mb-3">烹饪步骤</Text>
          {dish.steps.map((step, index) => (
            <View key={index} className="flex flex-row mb-3">
              <View className="w-6 h-6 rounded-full bg-orange-500 flex items-center justify-center flex-shrink-0">
                <Text className="text-xs text-white font-medium">{index + 1}</Text>
              </View>
              <Text className="flex-1 text-sm text-gray-600 ml-3 leading-6">{step}</Text>
            </View>
          ))}
        </View>

        {/* 小贴士 */}
        {dish.tips && (
          <View className="bg-amber-50 rounded-2xl p-4 mb-4">
            <Text className="block text-base font-semibold text-amber-700 mb-2">💡 小贴士</Text>
            <Text className="block text-sm text-amber-600">{dish.tips}</Text>
          </View>
        )}
      </View>
    </ScrollView>
  )
}

export default DishDetailPage
