import { View, Text, Image, ScrollView } from '@tarojs/components'
import { useState, useEffect } from 'react'
import Taro from '@tarojs/taro'
import { Plus, Minus, ShoppingCart, Trash2 } from 'lucide-react-taro'
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
  protein?: number
  description?: string
  price?: number
}

// 分类类型
interface Category {
  id: string
  name: string
  icon: string
}

// 菜系类型
interface Cuisine {
  id: string
  name: string
}

// 购物车项
interface CartItem {
  dish: Dish
  quantity: number
}

const DishesPage: FC = () => {
  // 分类数据
  const categories: Category[] = [
    { id: 'chinese', name: '中餐', icon: '🥢' },
    { id: 'breakfast', name: '早餐', icon: '🥣' },
    { id: 'snack', name: '点心', icon: '🥟' },
    { id: 'dessert', name: '甜点', icon: '🍰' },
    { id: 'drink', name: '饮料', icon: '🥤' },
    { id: 'western', name: '西餐', icon: '🍝' },
    { id: 'japanese', name: '日餐', icon: '🍣' },
    { id: 'korean', name: '韩餐', icon: '🥘' },
    { id: 'southeast', name: '东南亚', icon: '🍜' },
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
  
  // 购物车状态
  const [cart, setCart] = useState<CartItem[]>([])
  const [showCart, setShowCart] = useState(false)

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
      console.log('获取菜品完整响应:', JSON.stringify(result, null, 2))
      
      // 注意：Network.request返回的是Taro.request的结果，有两层data
      // result.data = { code: 200, msg: "success", data: [...] }
      // result.data.data = [...] 这才是菜品数组
      const dishData = (result as any).data?.data || []
      console.log('解析出的菜品数据:', dishData.length, '条')
      
      // 为每个菜品添加随机价格
      const dishesWithPrice = dishData.map((dish: Dish) => ({
        ...dish,
        price: Math.floor(Math.random() * 30) + 18 // 18-48元随机价格
      }))
      setDishes(dishesWithPrice)
    } catch (error) {
      console.error('获取菜品失败', error)
      setDishes([])
    } finally {
      setLoading(false)
    }
  }

  // 获取菜品图片
  const getDishImage = (dish: Dish) => {
    if (dish.images && dish.images.length > 0) {
      return dish.images[0]
    }
    return dish.image || 'https://picsum.photos/200?random=' + dish.id
  }

  // 获取购物车中某菜品的数量
  const getCartQuantity = (dishId: string) => {
    const cartItem = cart.find(ci => ci.dish.id === dishId)
    return cartItem ? cartItem.quantity : 0
  }

  // 添加到购物车
  const addToCart = (dish: Dish) => {
    setCart(prev => {
      const existing = prev.find(item => item.dish.id === dish.id)
      if (existing) {
        return prev.map(item =>
          item.dish.id === dish.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      }
      return [...prev, { dish, quantity: 1 }]
    })
  }

  // 从购物车减少
  const removeFromCart = (dishId: string) => {
    setCart(prev => {
      const existing = prev.find(item => item.dish.id === dishId)
      if (existing && existing.quantity > 1) {
        return prev.map(item =>
          item.dish.id === dishId
            ? { ...item, quantity: item.quantity - 1 }
            : item
        )
      }
      return prev.filter(item => item.dish.id !== dishId)
    })
  }

  // 清空购物车
  const clearCart = () => {
    setCart([])
    setShowCart(false)
  }

  // 计算购物车总价
  const getTotalPrice = () => {
    return cart.reduce((total, item) => total + (item.dish.price || 0) * item.quantity, 0)
  }

  // 计算购物车总数量
  const getTotalQuantity = () => {
    return cart.reduce((total, item) => total + item.quantity, 0)
  }

  // 提交订单
  const submitOrder = () => {
    if (cart.length === 0) {
      Taro.showToast({ title: '购物车是空的', icon: 'none' })
      return
    }
    
    Taro.showModal({
      title: '确认下单',
      content: `共 ${getTotalQuantity()} 道菜，合计 ¥${getTotalPrice().toFixed(2)}`,
      success: (res) => {
        if (res.confirm) {
          Taro.showToast({ title: '下单成功！', icon: 'success' })
          clearCart()
        }
      }
    })
  }

  return (
    <View 
      className="flex flex-col h-screen bg-white overflow-hidden"
      style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
    >
      {/* 主内容区域 */}
      <View className="flex flex-row flex-1 overflow-hidden">
        {/* 左侧分类导航 */}
        <View className="w-20 bg-gray-50 flex flex-col flex-shrink-0">
          <ScrollView scrollY className="flex-1">
            {categories.map(category => (
              <View
                key={category.id}
                className={`py-4 flex flex-col items-center justify-center ${selectedCategory === category.id ? 'bg-white' : ''}`}
                style={{
                  borderLeftWidth: selectedCategory === category.id ? '3px' : 0,
                  borderLeftColor: '#3B82F6',
                  borderLeftStyle: 'solid'
                }}
                onClick={() => setSelectedCategory(category.id)}
              >
                <Text className="text-lg mb-1">{category.icon}</Text>
                <Text className={`text-xs ${selectedCategory === category.id ? 'text-gray-800 font-medium' : 'text-gray-500'}`}>
                  {category.name}
                </Text>
              </View>
            ))}
          </ScrollView>
        </View>

        {/* 右侧内容区 */}
        <View className="flex-1 flex flex-col overflow-hidden">
          {/* 中餐菜系电梯导航 */}
          {selectedCategory === 'chinese' && (
            <ScrollView
              scrollX
              className="bg-white border-b border-gray-100 px-2 py-2 flex-shrink-0"
            >
              <View className="flex flex-row gap-2">
                {chineseCuisines.map(cuisine => (
                  <View
                    key={cuisine.id}
                    className={`px-3 py-1.5 rounded-full flex-shrink-0 ${selectedCuisine === cuisine.id ? 'bg-blue-500' : 'bg-gray-100'}`}
                    onClick={() => setSelectedCuisine(cuisine.id)}
                  >
                    <Text className={`text-xs ${selectedCuisine === cuisine.id ? 'text-white' : 'text-gray-600'}`}>
                      {cuisine.name}
                    </Text>
                  </View>
                ))}
              </View>
            </ScrollView>
          )}

          {/* 菜品列表 */}
          <ScrollView scrollY className="flex-1">
            {loading ? (
              <View className="flex flex-col items-center justify-center py-16">
                <Text className="text-gray-400">加载中...</Text>
              </View>
            ) : dishes.length === 0 ? (
              <View className="flex flex-col items-center justify-center py-16">
                <Text className="text-4xl mb-4">🍽️</Text>
                <Text className="text-gray-400">暂无菜品</Text>
              </View>
            ) : (
              <View className="p-3">
                {dishes.map(dish => (
                  <View
                    key={dish.id}
                    className="flex flex-row bg-white rounded-xl mb-3 overflow-hidden shadow-sm border border-gray-100"
                  >
                    {/* 菜品图片 */}
                    <Image
                      className="w-24 h-24 flex-shrink-0"
                      src={getDishImage(dish)}
                      mode="aspectFill"
                    />
                    
                    {/* 菜品信息 */}
                    <View className="flex-1 p-3 flex flex-col justify-between">
                      <View>
                        <Text className="block text-base font-medium text-gray-800">
                          {dish.name}
                        </Text>
                        <Text className="block text-xs text-gray-400 mt-1">
                          {dish.description || '美味佳肴'}
                        </Text>
                      </View>
                      
                      <View className="flex flex-row items-center justify-between mt-2">
                        <Text className="text-base font-semibold text-orange-500">
                          ¥{dish.price}
                        </Text>
                        
                        {/* 加减按钮 */}
                        <View className="flex flex-row items-center gap-2">
                          {getCartQuantity(dish.id) > 0 && (
                            <>
                              <View
                                className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center"
                                onClick={() => removeFromCart(dish.id)}
                              >
                                <Minus size={14} color="#6B7280" />
                              </View>
                              <Text className="text-sm font-medium w-6 text-center">
                                {getCartQuantity(dish.id)}
                              </Text>
                            </>
                          )}
                          <View
                            className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center"
                            onClick={() => addToCart(dish)}
                          >
                            <Plus size={14} color="#fff" />
                          </View>
                        </View>
                      </View>
                    </View>
                  </View>
                ))}
                
                {/* 底部占位 */}
                <View style={{ height: '70px' }} />
              </View>
            )}
          </ScrollView>
        </View>
      </View>

      {/* 底部购物车栏 */}
      <View 
        className="fixed left-0 right-0 bg-white px-4 py-3 z-40"
        style={{ bottom: 0, borderTop: '1px solid #E5E7EB' }}
      >
        <View className="flex flex-row items-center justify-between">
          {/* 购物车图标 */}
          <View 
            className="relative"
            onClick={() => setShowCart(!showCart)}
          >
            <View className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center">
              <ShoppingCart size={22} color="#fff" />
            </View>
            {getTotalQuantity() > 0 && (
              <View className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 flex items-center justify-center">
                <Text className="text-xs text-white font-medium">
                  {getTotalQuantity()}
                </Text>
              </View>
            )}
          </View>
          
          {/* 价格 */}
          <View className="flex-1 px-4">
            <Text className="text-xl font-bold text-gray-800">
              ¥{getTotalPrice().toFixed(2)}
            </Text>
            <Text className="text-xs text-gray-400">
              共 {getTotalQuantity()} 道菜
            </Text>
          </View>
          
          {/* 下单按钮 */}
          <View
            className={`px-8 py-3 rounded-full ${cart.length > 0 ? 'bg-blue-500' : 'bg-gray-300'}`}
            onClick={submitOrder}
          >
            <Text className="text-white font-medium">去下单</Text>
          </View>
        </View>
      </View>

      {/* 购物车详情弹窗 */}
      {showCart && cart.length > 0 && (
        <View 
          className="fixed inset-0 z-50"
          onClick={() => setShowCart(false)}
        >
          <View className="absolute inset-0 bg-black/30" />
          <View 
            className="absolute left-0 right-0 bg-white rounded-t-2xl"
            style={{ bottom: '60px', maxHeight: '50%' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* 标题栏 */}
            <View className="flex flex-row items-center justify-between p-4 border-b border-gray-100">
              <Text className="text-base font-semibold text-gray-800">已选菜品</Text>
              <View 
                className="flex flex-row items-center gap-1"
                onClick={clearCart}
              >
                <Trash2 size={14} color="#9CA3AF" />
                <Text className="text-sm text-gray-400">清空</Text>
              </View>
            </View>
            
            {/* 购物车列表 */}
            <ScrollView scrollY className="max-h-64">
              {cart.map(item => (
                <View 
                  key={item.dish.id}
                  className="flex flex-row items-center justify-between px-4 py-3 border-b border-gray-50"
                >
                  <View className="flex flex-row items-center gap-3">
                    <Image
                      className="w-12 h-12 rounded-lg"
                      src={getDishImage(item.dish)}
                      mode="aspectFill"
                    />
                    <View>
                      <Text className="text-sm font-medium text-gray-800">{item.dish.name}</Text>
                      <Text className="text-sm text-orange-500">¥{item.dish.price}</Text>
                    </View>
                  </View>
                  
                  {/* 数量控制 */}
                  <View className="flex flex-row items-center gap-2">
                    <View
                      className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center"
                      onClick={() => removeFromCart(item.dish.id)}
                    >
                      <Minus size={14} color="#6B7280" />
                    </View>
                    <Text className="text-sm font-medium w-6 text-center">{item.quantity}</Text>
                    <View
                      className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center"
                      onClick={() => addToCart(item.dish)}
                    >
                      <Plus size={14} color="#fff" />
                    </View>
                  </View>
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      )}
    </View>
  )
}

export default DishesPage
