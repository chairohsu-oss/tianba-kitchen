import { View, Text, Image, ScrollView } from '@tarojs/components'
import { useState, useEffect } from 'react'
import Taro from '@tarojs/taro'
import { Plus, Minus, Soup, Trash2 } from 'lucide-react-taro'
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
  carbs?: number
  fat?: number
  description?: string
  ingredients?: string[]
  seasoning?: string[]
  steps?: string[]
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
  
  // 选择模式（从美味记录页面跳转过来）
  const [selectMode, setSelectMode] = useState(false)
  const [targetOrderId, setTargetOrderId] = useState<string | null>(null)

  // 初始化时检查是否为选择模式
  useEffect(() => {
    // 检查登录状态
    const isLoggedIn = Taro.getStorageSync('tianba_logged_in')
    if (!isLoggedIn) {
      Taro.redirectTo({ url: '/pages/login/index' })
      return
    }

    const instance = Taro.getCurrentInstance()
    const params = instance.router?.params || {}
    if (params.mode === 'select' && params.orderId) {
      setSelectMode(true)
      setTargetOrderId(params.orderId)
    }
  }, [])

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
      
      const dishData = (result as any).data?.data || []
      console.log('解析出的菜品数据:', dishData.length, '条')
      
      setDishes(dishData)
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

  // 选择模式：添加菜品到菜单
  const addDishToOrder = async (dish: Dish) => {
    if (!targetOrderId) return
    
    try {
      const result = await Network.request({
        url: `/api/orders/${targetOrderId}/items`,
        method: 'POST',
        data: {
          dish: {
            id: dish.id,
            name: dish.name,
            images: dish.images,
            calories: dish.calories || 0,
            ingredients: dish.ingredients || [],
            seasoning: dish.seasoning || [],
            steps: dish.steps || [],
          },
          quantity: 1
        }
      })
      if ((result as any).data?.code === 200) {
        Taro.showToast({ title: '已添加', icon: 'success', duration: 1000 })
      }
    } catch (error) {
      console.error('添加失败', error)
      Taro.showToast({ title: '添加失败', icon: 'none' })
    }
  }

  // 添加到购物车（或选择模式直接添加到菜单）
  const addToCart = (dish: Dish) => {
    if (selectMode && targetOrderId) {
      // 选择模式：直接添加到菜单
      addDishToOrder(dish)
      return
    }
    
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

  // 计算购物车总热量
  const getTotalCalories = () => {
    return cart.reduce((total, item) => total + (item.dish.calories || 0) * item.quantity, 0)
  }

  // 计算购物车总数量
  const getTotalQuantity = () => {
    return cart.reduce((total, item) => total + item.quantity, 0)
  }

  // 提交菜单
  const submitOrder = async () => {
    if (cart.length === 0) {
      Taro.showToast({ title: '购物车是空的', icon: 'none' })
      return
    }
    
    Taro.showModal({
      title: '确认下单',
      content: `共 ${getTotalQuantity()} 道菜，总热量 ${getTotalCalories()} 千卡`,
      success: async (res) => {
        if (res.confirm) {
          try {
            // 获取当前用户信息
            let user: { id: string; nickname: string; avatarUrl: string } | null = null
            try {
              const userResult = await Network.request({ url: '/api/users/me' })
              user = (userResult as any).data?.data
            } catch (e) {
              console.log('获取用户信息失败，使用默认用户')
            }

            await Network.request({
              url: '/api/orders',
              method: 'POST',
              data: {
                items: cart.map(item => ({
                  dish: {
                    id: item.dish.id,
                    name: item.dish.name,
                    images: item.dish.images,
                    calories: item.dish.calories || 0,
                    ingredients: item.dish.ingredients || [],
                    seasoning: item.dish.seasoning || [],
                    steps: item.dish.steps || [],
                  },
                  quantity: item.quantity,
                })),
                user: user ? {
                  id: user.id,
                  nickname: user.nickname,
                  avatarUrl: user.avatarUrl,
                } : undefined,
              },
            })
            Taro.showToast({ title: '下单成功！', icon: 'success' })
            clearCart()
          } catch (error) {
            console.error('下单失败', error)
            Taro.showToast({ title: '下单失败', icon: 'none' })
          }
        }
      }
    })
  }

  return (
    <View 
      className="flex flex-col bg-white overflow-hidden"
      style={{ 
        position: 'fixed', 
        top: 0, 
        left: 0, 
        right: 0, 
        bottom: Taro.getEnv() === Taro.ENV_TYPE.WEAPP ? 0 : 80,
        width: '100vw'
      }}
    >
      {/* 主内容区域 */}
      <View className="flex flex-row flex-1 overflow-hidden" style={{ width: '100%' }}>
        {/* 左侧分类导航 */}
        <View style={{ width: '80px', flexShrink: 0 }} className="bg-gray-50">
          <ScrollView 
            scrollY 
            scrollX={false}
            className="h-full"
          >
            {categories.map(category => (
              <View
                key={category.id}
                className={`py-3 flex flex-col items-center justify-center ${selectedCategory === category.id ? 'bg-white' : ''}`}
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
            {/* 底部安全区域 */}
            <View style={{ height: '100px' }} />
          </ScrollView>
        </View>

        {/* 右侧内容区 */}
        <View className="flex-1 flex flex-col overflow-hidden">
          {/* 中餐菜系电梯导航 */}
          {selectedCategory === 'chinese' && (
            <ScrollView
              scrollX
              scrollY={false}
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
          <ScrollView 
            scrollY 
            scrollX={false}
            className="flex-1"
          >
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
                    onClick={() => Taro.navigateTo({ url: `/pages/dish-detail/index?id=${dish.id}` })}
                  >
                    {/* 菜品图片 */}
                    <Image
                      className="flex-shrink-0"
                      style={{ width: '96px', height: '96px' }}
                      src={getDishImage(dish)}
                      mode="aspectFill"
                    />
                    
                    {/* 菜品信息 */}
                    <View className="flex-1 p-3 flex flex-col justify-between overflow-hidden">
                      <View>
                        <Text className="block text-base font-medium text-gray-800 truncate">
                          {dish.name}
                        </Text>
                        <Text className="block text-xs text-gray-400 mt-1 truncate">
                          {dish.description || '美味佳肴'}
                        </Text>
                      </View>
                      
                      <View className="flex flex-row items-center justify-between mt-2">
                        <View className="flex flex-row items-center gap-1">
                          <Text className="text-sm text-orange-500 font-medium">
                            {dish.calories || 0}
                          </Text>
                          <Text className="text-xs text-gray-400">千卡</Text>
                        </View>
                        
                        {/* 加减按钮 */}
                        <View className="flex flex-row items-center gap-2">
                          {!selectMode && getCartQuantity(dish.id) > 0 && (
                            <>
                              <View
                                className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center"
                                onClick={(e) => { e.stopPropagation(); removeFromCart(dish.id) }}
                              >
                                <Minus size={14} color="#6B7280" />
                              </View>
                              <Text className="text-sm font-medium w-6 text-center">
                                {getCartQuantity(dish.id)}
                              </Text>
                            </>
                          )}
                          <View
                            className={`w-6 h-6 rounded-full flex items-center justify-center ${selectMode ? 'bg-green-500' : 'bg-blue-500'}`}
                            onClick={(e) => { e.stopPropagation(); addToCart(dish) }}
                          >
                            <Plus size={14} color="#fff" />
                          </View>
                        </View>
                      </View>
                    </View>
                  </View>
                ))}
                
                {/* 底部占位 */}
                <View style={{ height: '80px' }} />
              </View>
            )}
          </ScrollView>
        </View>
      </View>

      {/* 底部购物车栏 */}
      <View 
        className="bg-white px-4 py-3 flex-shrink-0"
        style={{ borderTop: '1px solid #E5E7EB' }}
      >
        {selectMode ? (
          /* 选择模式：显示完成按钮 */
          <View className="flex flex-row items-center justify-between">
            <View className="flex flex-row items-center gap-2">
              <Text className="text-sm text-gray-600">选择模式</Text>
              <Text className="text-xs text-gray-400">点击菜品添加到菜单</Text>
            </View>
            <View
              className="px-8 py-3 rounded-full bg-blue-500"
              onClick={() => Taro.navigateBack()}
            >
              <Text className="text-white font-medium">完成选择</Text>
            </View>
          </View>
        ) : (
          /* 正常模式：购物车 */
          <View className="flex flex-row items-center justify-between">
            {/* 大碗容器 */}
            <View 
              className="relative"
              onClick={() => setShowCart(!showCart)}
            >
              {/* 大碗背景 */}
              <View 
                className="w-16 h-16 rounded-full flex items-center justify-center relative overflow-hidden"
                style={{ 
                  background: 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)',
                  boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
                }}
              >
                <Soup size={28} color="#fff" />
                
                {/* 碗中的菜品缩略图堆叠效果 */}
                {cart.length > 0 && (
                  <View className="absolute inset-0 flex items-center justify-center">
                    {cart.slice(0, 3).map((item, index) => (
                      <Image
                        key={item.dish.id}
                        className="absolute rounded-full"
                        style={{ 
                          width: '20px', 
                          height: '20px',
                          top: `${4 + index * 2}px`,
                          left: `${4 + index * 3}px`,
                          zIndex: 3 - index,
                          borderWidth: '1px',
                          borderColor: '#fff'
                        }}
                        src={getDishImage(item.dish)}
                        mode="aspectFill"
                      />
                    ))}
                  </View>
                )}
              </View>
              
              {/* 数量徽章 */}
              {getTotalQuantity() > 0 && (
                <View 
                  className="absolute -top-1 -right-1 flex items-center justify-center"
                  style={{ 
                    minWidth: '20px', 
                    height: '20px',
                    borderRadius: '10px',
                    backgroundColor: '#EF4444'
                  }}
                >
                  <Text className="text-xs text-white font-medium" style={{ paddingLeft: '4px', paddingRight: '4px' }}>
                    {getTotalQuantity()}
                  </Text>
                </View>
              )}
            </View>
            
            {/* 热量 */}
            <View className="flex-1 px-4">
              <View className="flex flex-row items-baseline gap-1">
                <Text className="text-xl font-bold text-orange-500">
                  {getTotalCalories()}
                </Text>
                <Text className="text-sm text-gray-400">千卡</Text>
              </View>
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
        )}
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
            style={{ bottom: Taro.getEnv() === Taro.ENV_TYPE.WEAPP ? '60px' : '140px', maxHeight: '50%' }}
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
                      <View className="flex flex-row items-center gap-1">
                        <Text className="text-sm text-orange-500">{item.dish.calories || 0}</Text>
                        <Text className="text-xs text-gray-400">千卡</Text>
                      </View>
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
