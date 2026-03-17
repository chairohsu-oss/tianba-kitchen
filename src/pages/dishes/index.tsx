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
  images: string[]
  image?: string
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
      const params: Record<string, string> = { category: selectedCategory }
      if (selectedCategory === 'chinese') {
        params.cuisine = selectedCuisine
      }
      const result = await Network.request({
        url: '/api/dishes',
        data: params
      })
      console.log('获取菜品结果:', result)
      const dishData = (result as any).data || []
      setDishes(dishData)
    } catch (error) {
      console.error('获取菜品失败', error)
      setDishes([])
    } finally {
      setLoading(false)
    }
  }

  // 跳转详情页
  const goToDetail = (dish: Dish) => {
    Taro.navigateTo({
      url: `/pages/dish-detail/index?id=${dish.id}`
    })
  }

  // 获取菜品图片
  const getDishImage = (dish: Dish) => {
    if (dish.images && dish.images.length > 0) {
      return dish.images[0]
    }
    return dish.image || 'https://picsum.photos/200?random=' + dish.id
  }

  return (
    <View className="flex flex-row h-screen bg-white">
      {/* 左侧分类导航 - 加宽25% */}
      <View className="w-50 bg-gray-50 flex flex-col" style={{ width: '200px' }}>
        <ScrollView scrollY className="flex-1">
          {categories.map(category => (
            <View
              key={category.id}
              className={`px-4 py-4 flex items-center justify-start ${selectedCategory === category.id ? 'bg-white border-l-2 border-gray-800' : ''}`}
              onClick={() => setSelectedCategory(category.id)}
            >
              <Text className={`block text-sm ${selectedCategory === category.id ? 'text-gray-800 font-medium' : 'text-gray-500'}`}>
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
                  className={`px-3 py-1.5 rounded-full flex-shrink-0 ${selectedCuisine === cuisine.id ? 'bg-gray-800' : 'bg-gray-100'}`}
                  onClick={() => setSelectedCuisine(cuisine.id)}
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
                    src={getDishImage(dish)}
                    mode="aspectFill"
                  />
                  <View className="p-3">
                    <Text className="block text-base font-medium text-gray-800 truncate">
                      {dish.name}
                    </Text>
                    <View className="flex flex-row items-center mt-1">
                      <Text className="block text-xs text-gray-400">
                        {dish.calories || 0}千卡
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
