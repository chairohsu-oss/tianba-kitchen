import { View, Text, Image, ScrollView } from '@tarojs/components'
import { useState, useEffect } from 'react'
import Taro, { useRouter } from '@tarojs/taro'
import { Flame, Wheat, Droplet, ChefHat, ArrowLeft, Pencil, Trash2 } from 'lucide-react-taro'
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

// 分类和菜系映射
const categoryMap: Record<string, string> = {
  'chinese': '中餐',
  'breakfast': '早餐',
  'snack': '点心',
  'dessert': '甜点',
  'drink': '饮料',
  'western': '西餐',
  'japanese': '日餐',
  'korean': '韩餐',
  'southeast': '东南亚'
}

const cuisineMap: Record<string, string> = {
  'tianba': '天霸家自制',
  'jiangzhe': '江浙菜',
  'wenzhou': '温州菜',
  'yue': '粤菜',
  'dongbei': '东北菜',
  'hunan': '湖南菜',
  'yunnan': '云南菜',
  'other': '其它'
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
      console.log('菜品详情响应:', result)
      // 注意嵌套data
      const dishData = (result as any).data?.data || (result as any).data
      if (dishData) {
        setDish(dishData)
      } else {
        Taro.showToast({ title: '菜品不存在', icon: 'none' })
        setTimeout(() => Taro.navigateBack(), 1500)
      }
    } catch (error) {
      console.error('获取详情失败', error)
      Taro.showToast({ title: '加载失败', icon: 'none' })
    } finally {
      setLoading(false)
    }
  }

  // 删除菜品
  const handleDelete = () => {
    Taro.showModal({
      title: '确认删除',
      content: `确定要删除「${dish?.name}」吗？此操作不可恢复。`,
      confirmColor: '#EF4444',
      confirmText: '删除',
      cancelText: '取消',
      success: async (res) => {
        if (res.confirm && dish) {
          try {
            const result = await Network.request({
              url: `/api/dishes/${dish.id}`,
              method: 'DELETE'
            })
            if ((result as any).data?.code === 200) {
              Taro.showToast({ title: '删除成功', icon: 'success' })
              setTimeout(() => Taro.navigateBack(), 1500)
            } else {
              Taro.showToast({ title: '删除失败', icon: 'none' })
            }
          } catch (error) {
            console.error('删除失败:', error)
            Taro.showToast({ title: '删除失败', icon: 'none' })
          }
        }
      }
    })
  }

  // 编辑菜品（跳转到编辑页面）
  const handleEdit = () => {
    if (dish) {
      Taro.navigateTo({ 
        url: `/pages/edit/index?editId=${dish.id}` 
      })
    }
  }

  if (loading) {
    return (
      <View className="flex flex-col items-center justify-center h-screen bg-white">
        <Text className="text-gray-400">加载中...</Text>
      </View>
    )
  }

  if (!dish) {
    return (
      <View className="flex flex-col items-center justify-center h-screen bg-white">
        <Text className="text-gray-400">菜品不存在</Text>
      </View>
    )
  }

  return (
    <View className="flex flex-col h-screen bg-gray-50">
      {/* 顶部导航栏 */}
      <View className="fixed top-0 left-0 right-0 bg-white border-b border-gray-100 px-4 py-3 z-50 flex flex-row items-center">
        <View onClick={() => Taro.navigateBack()}>
          <ArrowLeft size={24} color="#374151" />
        </View>
        <Text className="flex-1 text-center text-base font-semibold text-gray-800 pr-6">
          {dish.name}
        </Text>
      </View>

      <ScrollView scrollY className="flex-1 pt-12">
        {/* 菜品图片 */}
        <View className="bg-white">
          <Image
            className="w-full h-64"
            src={dish.images && dish.images.length > 0 ? dish.images[currentImageIndex] : 'https://picsum.photos/400?random=' + dish.id}
            mode="aspectFill"
          />
          {/* 图片指示器 */}
          {dish.images && dish.images.length > 1 && (
            <View className="flex flex-row justify-center gap-1.5 py-3">
              {dish.images.map((_, i) => (
                <View
                  key={i}
                  className={`w-2 h-2 rounded-full ${i === currentImageIndex ? 'bg-blue-500' : 'bg-gray-300'}`}
                  onClick={() => setCurrentImageIndex(i)}
                />
              ))}
            </View>
          )}
        </View>

        {/* 基本信息 */}
        <View className="bg-white mt-2 px-4 py-4">
          <Text className="block text-xl font-bold text-gray-800 mb-2">{dish.name}</Text>
          <Text className="block text-sm text-gray-500 mb-3">{dish.description}</Text>
          
          {/* 分类标签 */}
          <View className="flex flex-row gap-2 flex-wrap">
            <View className="px-3 py-1 bg-blue-50 rounded-full">
              <Text className="text-xs text-blue-600">{categoryMap[dish.category] || dish.category}</Text>
            </View>
            {dish.cuisine && (
              <View className="px-3 py-1 bg-orange-50 rounded-full">
                <Text className="text-xs text-orange-600">{cuisineMap[dish.cuisine] || dish.cuisine}</Text>
              </View>
            )}
          </View>
        </View>

        {/* 营养信息 */}
        <View className="bg-white mt-2 px-4 py-4">
          <View className="flex flex-row items-center gap-2 mb-3">
            <Flame size={18} color="#F97316" />
            <Text className="text-base font-semibold text-gray-800">营养信息</Text>
          </View>
          
          <View className="flex flex-row justify-around bg-orange-50 rounded-xl py-4">
            <View className="flex flex-col items-center">
              <Text className="text-2xl font-bold text-orange-500">{dish.calories || 0}</Text>
              <Text className="text-xs text-gray-500 mt-1">千卡</Text>
            </View>
            <View className="w-px bg-gray-200" />
            <View className="flex flex-col items-center">
              <Text className="text-2xl font-bold text-green-500">{dish.protein || 0}</Text>
              <Text className="text-xs text-gray-500 mt-1">蛋白质(g)</Text>
            </View>
            <View className="w-px bg-gray-200" />
            <View className="flex flex-col items-center">
              <Text className="text-2xl font-bold text-amber-500">{dish.carbs || 0}</Text>
              <Text className="text-xs text-gray-500 mt-1">碳水(g)</Text>
            </View>
            <View className="w-px bg-gray-200" />
            <View className="flex flex-col items-center">
              <Text className="text-2xl font-bold text-blue-500">{dish.fat || 0}</Text>
              <Text className="text-xs text-gray-500 mt-1">脂肪(g)</Text>
            </View>
          </View>
        </View>

        {/* 食材 */}
        <View className="bg-white mt-2 px-4 py-4">
          <View className="flex flex-row items-center gap-2 mb-3">
            <Wheat size={18} color="#10B981" />
            <Text className="text-base font-semibold text-gray-800">食材清单</Text>
          </View>
          
          {dish.ingredients && dish.ingredients.length > 0 ? (
            <View className="flex flex-row flex-wrap gap-2">
              {dish.ingredients.map((item, i) => (
                <View key={i} className="px-3 py-1.5 bg-green-50 rounded-lg">
                  <Text className="text-sm text-green-700">{item}</Text>
                </View>
              ))}
            </View>
          ) : (
            <Text className="text-sm text-gray-400">暂无食材信息</Text>
          )}
        </View>

        {/* 配料 */}
        <View className="bg-white mt-2 px-4 py-4">
          <View className="flex flex-row items-center gap-2 mb-3">
            <Droplet size={18} color="#8B5CF6" />
            <Text className="text-base font-semibold text-gray-800">配料调料</Text>
          </View>
          
          {dish.seasoning && dish.seasoning.length > 0 ? (
            <View className="flex flex-row flex-wrap gap-2">
              {dish.seasoning.map((item, i) => (
                <View key={i} className="px-3 py-1.5 bg-purple-50 rounded-lg">
                  <Text className="text-sm text-purple-700">{item}</Text>
                </View>
              ))}
            </View>
          ) : (
            <Text className="text-sm text-gray-400">暂无配料信息</Text>
          )}
        </View>

        {/* 烹饪步骤 */}
        <View className="bg-white mt-2 px-4 py-4">
          <View className="flex flex-row items-center gap-2 mb-3">
            <ChefHat size={18} color="#F59E0B" />
            <Text className="text-base font-semibold text-gray-800">烹饪步骤</Text>
          </View>
          
          {dish.steps && dish.steps.length > 0 ? (
            <View className="flex flex-col gap-3">
              {dish.steps.map((step, i) => (
                <View key={i} className="flex flex-row gap-3">
                  <View className="w-6 h-6 rounded-full bg-amber-500 flex items-center justify-center flex-shrink-0">
                    <Text className="text-xs text-white font-medium">{i + 1}</Text>
                  </View>
                  <Text className="flex-1 text-sm text-gray-700 leading-relaxed">{step}</Text>
                </View>
              ))}
            </View>
          ) : (
            <Text className="text-sm text-gray-400">暂无烹饪步骤</Text>
          )}
        </View>

        {/* 小贴士 */}
        {dish.tips && (
          <View className="bg-white mt-2 px-4 py-4 mb-4">
            <View className="flex flex-row items-center gap-2 mb-3">
              <Text className="text-base font-semibold text-gray-800">💡 小贴士</Text>
            </View>
            <View className="bg-blue-50 rounded-xl p-3">
              <Text className="text-sm text-gray-700 leading-relaxed">{dish.tips}</Text>
            </View>
          </View>
        )}

        {/* 底部安全区域 */}
        <View style={{ height: '100px' }} />
      </ScrollView>

      {/* 底部操作栏 */}
      <View 
        className="fixed left-0 right-0 bg-white border-t border-gray-200 px-4 py-3 flex flex-row gap-3"
        style={{ bottom: 0, paddingBottom: '20px' }}
      >
        <View 
          className="flex-1 flex flex-row items-center justify-center gap-2 bg-blue-500 rounded-xl py-3"
          onClick={handleEdit}
        >
          <Pencil size={18} color="#fff" />
          <Text className="text-white font-medium">编辑</Text>
        </View>
        <View 
          className="flex-1 flex flex-row items-center justify-center gap-2 bg-red-500 rounded-xl py-3"
          onClick={handleDelete}
        >
          <Trash2 size={18} color="#fff" />
          <Text className="text-white font-medium">删除</Text>
        </View>
      </View>
    </View>
  )
}

export default DishDetailPage
