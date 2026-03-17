import { View, Text, Image, ScrollView } from '@tarojs/components'
import { useState, useEffect } from 'react'
import Taro from '@tarojs/taro'
import { Network } from '@/network'
import type { FC } from 'react'
import './index.css'

// 菜品类型
interface Dish {
  id: string
  name: string
  image: string
  category: string
  cuisine?: string
  calories?: number
  description?: string
}

// 分类类型
interface Category {
  id: string
  name: string
}

// 菜系类型
interface Cuisine {
  id: string
  name: string
}

const DishesPage: FC = () => {
  // 一级分类
  const categories: Category[] = [
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

  // 中餐菜系
  const chineseCuisines: Cuisine[] = [
    { id: 'tianba', name: '天霸家自制' },
    { id: 'jiangzhe', name: '江浙菜' },
    { id: 'wenzhou', name: '温州菜' },
    { id: 'yue', name: '粤菜' },
    { id: 'dongbei', name: '东北菜' },
    { id: 'hunan', name: '湖南菜' },
    { id: 'yunnan', name: '云南菜' },
    { id: 'other', name: '其它' },
  ]

  const [selectedCategory, setSelectedCategory] = useState('chinese')
  const [selectedCuisine, setSelectedCuisine] = useState('tianba')
  const [dishes, setDishes] = useState<Dish[]>([])
  const [loading, setLoading] = useState(false)

  // 获取菜品列表
  useEffect(() => {
    fetchDishes()
  }, [selectedCategory, selectedCuisine])

  const fetchDishes = async () => {
    setLoading(true)
    try {
      const params: any = { category: selectedCategory }
      if (selectedCategory === 'chinese') {
        params.cuisine = selectedCuisine
      }
      const result = await Network.request({
        url: '/api/dishes',
        data: params
      })
      setDishes((result as any).data || [])
    } catch (error) {
      console.error('获取菜品失败', error)
      // 使用模拟数据
      setDishes(getMockDishes())
    } finally {
      setLoading(false)
    }
  }

  // 模拟数据
  const getMockDishes = (): Dish[] => {
    const mockNames = ['红烧排骨', '糖醋里脊', '宫保鸡丁', '水煮鱼', '麻婆豆腐', '回锅肉']
    return mockNames.map((name, index) => ({
      id: `dish-${index}`,
      name,
      image: `https://picsum.photos/200?random=${index}`,
      category: selectedCategory,
      cuisine: selectedCuisine,
      calories: Math.floor(Math.random() * 500) + 200,
      description: '经典家常菜，营养丰富，老少皆宜。'
    }))
  }

  // 跳转详情页
  const goToDetail = (dish: Dish) => {
    Taro.navigateTo({
      url: `/pages/dish-detail/index?id=${dish.id}`
    })
  }

  // 中餐分类电梯导航滚动
  const handleCuisineScroll = (cuisineId: string) => {
    setSelectedCuisine(cuisineId)
  }

  return (
    <View className="flex flex-row h-screen bg-white">
      {/* 左侧分类导航 */}
      <View className="w-40 bg-gray-50 flex flex-col">
        <ScrollView scrollY className="flex-1">
          {categories.map(category => (
            <View
              key={category.id}
              className={`px-4 py-4 flex items-center justify-start ${selectedCategory === category.id ? 'bg-white border-l-2 border-indigo-500' : ''}`}
              onClick={() => setSelectedCategory(category.id)}
            >
              <Text className={`block text-sm ${selectedCategory === category.id ? 'text-indigo-500 font-medium' : 'text-gray-600'}`}>
                {category.name}
              </Text>
            </View>
          ))}
        </ScrollView>
      </View>

      {/* 右侧内容区 */}
      <View className="flex-1 flex flex-col">
        {/* 中餐菜系电梯导航 */}
        {selectedCategory === 'chinese' && (
          <ScrollView
            scrollX
            className="bg-white border-b border-gray-100 px-2 py-3"
          >
            <View className="flex flex-row gap-2">
              {chineseCuisines.map(cuisine => (
                <View
                  key={cuisine.id}
                  className={`px-3 py-1 rounded-full flex-shrink-0 ${selectedCuisine === cuisine.id ? 'bg-indigo-500' : 'bg-gray-100'}`}
                  onClick={() => handleCuisineScroll(cuisine.id)}
                >
                  <Text className={`block text-sm ${selectedCuisine === cuisine.id ? 'text-white' : 'text-gray-600'}`}>
                    {cuisine.name}
                  </Text>
                </View>
              ))}
            </View>
          </ScrollView>
        )}

        {/* 双列商品展示 */}
        <ScrollView scrollY className="flex-1 p-3">
          {loading ? (
            <View className="flex flex-col items-center justify-center py-16">
              <Text className="block text-gray-400">加载中...</Text>
            </View>
          ) : dishes.length === 0 ? (
            <View className="flex flex-col items-center justify-center py-16">
              <Text className="block text-4xl mb-4">🍽️</Text>
              <Text className="block text-gray-400">暂无菜品</Text>
            </View>
          ) : (
            <View className="flex flex-row flex-wrap gap-3">
              {dishes.map(dish => (
                <View
                  key={dish.id}
                  className="w-[calc(50%-6px)] bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100"
                  onClick={() => goToDetail(dish)}
                >
                  <Image
                    className="w-full h-32"
                    src={dish.image}
                    mode="aspectFill"
                  />
                  <View className="p-3">
                    <Text className="block text-base font-medium text-gray-800 truncate">
                      {dish.name}
                    </Text>
                    <View className="flex flex-row items-center mt-1">
                      <Text className="block text-xs text-gray-400">
                        {dish.calories}千卡
                      </Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      </View>
    </View>
  )
}

export default DishesPage
