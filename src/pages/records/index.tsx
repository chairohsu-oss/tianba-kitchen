import { View, Text, Image, ScrollView } from '@tarojs/components'
import { useState, useEffect } from 'react'
import Taro from '@tarojs/taro'
import { Check, Clock, Flame, Calendar, ChefHat, X, User, Plus, Minus, Trash2 } from 'lucide-react-taro'
import { Network } from '@/network'
import type { FC } from 'react'

// 用户信息
interface UserInfo {
  id: string
  nickname: string
  avatarUrl: string
  role: string
}

// 菜品完整信息
interface DishInfo {
  id: string
  name: string
  images: string[]
  calories: number
  ingredients?: string[]
  seasoning?: string[]
  steps?: string[]
}

// 菜单类型
interface Order {
  id: string
  items: {
    dish: DishInfo
    quantity: number
  }[]
  totalCalories: number
  createdAt: string
  status: 'pending' | 'confirmed'
  mergedIngredients?: string[]
  mergedSeasoning?: string[]
  userId?: string
  user?: UserInfo
}

// 美味记录类型
interface DeliciousRecord {
  id: string
  date: string
  dishes: DishInfo[]
  totalCalories: number
}

// 角色映射
const roleMap: Record<string, string> = {
  'head_chef': '厨师长',
  'sous_chef': '领班',
  'order_clerk': '点菜员',
  'guest': '客人',
}

const roleColors: Record<string, string> = {
  'head_chef': 'bg-amber-100 text-amber-700',
  'sous_chef': 'bg-blue-100 text-blue-700',
  'order_clerk': 'bg-green-100 text-green-700',
  'guest': 'bg-gray-100 text-gray-700',
}

// 有权限的角色（非客人）
const privilegedRoles = ['head_chef', 'sous_chef', 'order_clerk']

const RecordsPage: FC = () => {
  const [currentUser, setCurrentUser] = useState<UserInfo | null>(null)
  const [pendingOrders, setPendingOrders] = useState<Order[]>([])
  const [records, setRecords] = useState<DeliciousRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)

  useEffect(() => {
    fetchData()
  }, [])

  // 页面显示时刷新数据（从菜品库返回时）
  Taro.useDidShow(() => {
    fetchData()
  })

  const fetchData = async () => {
    setLoading(true)
    try {
      // 获取当前用户信息
      const userResult = await Network.request({
        url: '/api/users/me'
      })
      const userData = (userResult as any).data?.data
      if (userData) {
        setCurrentUser(userData)
      }

      // 获取待确认菜单
      const ordersResult = await Network.request({
        url: '/api/orders',
        data: { status: 'pending' }
      })
      const ordersData = (ordersResult as any).data?.data || []
      setPendingOrders(ordersData)

      // 获取美味记录
      const recordsResult = await Network.request({
        url: '/api/records'
      })
      const recordsData = (recordsResult as any).data?.data || []
      setRecords(recordsData)
    } catch (error) {
      console.error('获取数据失败', error)
    } finally {
      setLoading(false)
    }
  }

  // 检查用户是否有权限操作菜单
  const canModifyOrder = () => {
    return currentUser && privilegedRoles.includes(currentUser.role)
  }

  // 确认菜单
  const confirmOrder = async (orderId: string) => {
    try {
      await Network.request({
        url: `/api/orders/${orderId}/confirm`,
        method: 'POST'
      })
      Taro.showToast({ title: '确认成功', icon: 'success' })
      setSelectedOrder(null)
      fetchData()
    } catch (error) {
      console.error('确认失败', error)
      Taro.showToast({ title: '确认失败', icon: 'none' })
    }
  }

  // 删除菜单中的菜品
  const removeDishFromOrder = async (orderId: string, dishId: string) => {
    if (!canModifyOrder()) {
      Taro.showToast({ title: '无权限操作', icon: 'none' })
      return
    }

    try {
      const result = await Network.request({
        url: `/api/orders/${orderId}/items/${dishId}`,
        method: 'DELETE'
      })
      if ((result as any).data?.code === 200) {
        Taro.showToast({ title: '已删除', icon: 'success' })
        fetchData()
        // 更新选中菜单
        if (selectedOrder && selectedOrder.id === orderId) {
          const updatedOrder = (result as any).data?.data
          if (updatedOrder && updatedOrder.items.length > 0) {
            setSelectedOrder(updatedOrder)
          } else {
            setSelectedOrder(null)
          }
        }
      }
    } catch (error) {
      console.error('删除失败', error)
      Taro.showToast({ title: '删除失败', icon: 'none' })
    }
  }

  // 修改菜品数量
  const updateDishQuantity = async (orderId: string, dishId: string, delta: number) => {
    if (!canModifyOrder()) {
      Taro.showToast({ title: '无权限操作', icon: 'none' })
      return
    }

    const order = pendingOrders.find(o => o.id === orderId)
    if (!order) return

    const item = order.items.find(i => i.dish.id === dishId)
    if (!item) return

    const newQuantity = item.quantity + delta
    if (newQuantity <= 0) {
      // 数量为0，删除菜品
      await removeDishFromOrder(orderId, dishId)
      return
    }

    // 更新数量
    const newItems = order.items.map(i => 
      i.dish.id === dishId ? { ...i, quantity: newQuantity } : i
    )

    try {
      await Network.request({
        url: `/api/orders/${orderId}`,
        method: 'PUT',
        data: { items: newItems }
      })
      fetchData()
      // 更新选中菜单
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder({
          ...selectedOrder,
          items: newItems,
          totalCalories: newItems.reduce((sum, i) => sum + i.dish.calories * i.quantity, 0)
        })
      }
    } catch (error) {
      console.error('更新失败', error)
      Taro.showToast({ title: '更新失败', icon: 'none' })
    }
  }

  // 跳转到菜品库添加菜品
  const goToAddDishes = (orderId: string) => {
    Taro.navigateTo({ 
      url: `/pages/dishes/index?orderId=${orderId}&mode=select`
    })
  }

  // 格式化日期
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    const month = date.getMonth() + 1
    const day = date.getDate()
    const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
    const weekday = weekdays[date.getDay()]
    return `${month}月${day}日 ${weekday}`
  }

  // 格式化时间
  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr)
    const hours = date.getHours().toString().padStart(2, '0')
    const minutes = date.getMinutes().toString().padStart(2, '0')
    return `${hours}:${minutes}`
  }

  // 获取菜品图片
  const getDishImage = (dish: DishInfo) => {
    if (dish.images && dish.images.length > 0) {
      return dish.images[0]
    }
    return 'https://picsum.photos/200?random=' + dish.id
  }

  // 查看菜单详情
  const viewOrderDetail = (order: Order) => {
    setSelectedOrder(order)
  }

  // 跳转菜品详情页
  const goToDishDetail = (dishId: string) => {
    Taro.navigateTo({ url: `/pages/dish-detail/index?id=${dishId}` })
  }

  return (
    <View className="flex flex-col bg-gray-50 min-h-screen">
      {/* 用户信息栏 */}
      <View 
        className="bg-white px-4 flex flex-row items-center justify-between"
        style={{ height: '100px' }}
      >
        {currentUser ? (
          <>
            <View className="flex flex-row items-center gap-3">
              <Image
                className="w-14 h-14 rounded-full"
                src={currentUser.avatarUrl}
                mode="aspectFill"
              />
              <View className="flex flex-col">
                <Text className="text-base font-semibold text-gray-800">{currentUser.nickname}</Text>
                <View className={`self-start px-2 py-0.5 rounded-full mt-1 ${roleColors[currentUser.role] || 'bg-gray-100 text-gray-700'}`}>
                  <Text className="text-xs">{roleMap[currentUser.role] || currentUser.role}</Text>
                </View>
              </View>
            </View>
            <View className="flex flex-col items-end">
              <View className="flex flex-row items-center gap-1">
                <Flame size={16} color="#F97316" />
                <Text className="text-sm text-gray-600">今日热量</Text>
              </View>
              <Text className="text-2xl font-bold text-orange-500 mt-1">
                {records.reduce((sum, r) => sum + r.totalCalories, 0)}
              </Text>
              <Text className="text-xs text-gray-400">千卡</Text>
            </View>
          </>
        ) : (
          <View className="flex flex-row items-center gap-3">
            <View className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center">
              <User size={24} color="#9CA3AF" />
            </View>
            <Text className="text-gray-400">加载用户信息...</Text>
          </View>
        )}
      </View>

      {/* 顶部待确认菜单区域 */}
      <View className="bg-white mb-2">
        <View className="px-4 py-3 border-b border-gray-100">
          <View className="flex flex-row items-center gap-2">
            <Clock size={18} color="#F97316" />
            <Text className="text-base font-semibold text-gray-800">待确认菜单</Text>
            {pendingOrders.length > 0 && (
              <View className="px-2 py-0.5 bg-orange-100 rounded-full">
                <Text className="text-xs text-orange-600">{pendingOrders.length}</Text>
              </View>
            )}
          </View>
        </View>

        {pendingOrders.length === 0 ? (
          <View className="flex flex-col items-center justify-center py-8">
            <ChefHat size={32} color="#D1D5DB" />
            <Text className="text-sm text-gray-400 mt-2">暂无待确认菜单</Text>
          </View>
        ) : (
          <ScrollView scrollX className="px-4 py-3">
            <View className="flex flex-row gap-3">
              {pendingOrders.map(order => (
                <View
                  key={order.id}
                  className="flex-shrink-0 w-72 bg-orange-50 rounded-xl p-3"
                >
                  {/* 下单用户信息和时间 */}
                  <View className="flex flex-row items-center justify-between mb-2">
                    <View className="flex flex-row items-center gap-2">
                      {order.user ? (
                        <>
                          <Image
                            className="w-6 h-6 rounded-full"
                            src={order.user.avatarUrl}
                            mode="aspectFill"
                          />
                          <Text className="text-xs text-gray-600">{order.user.nickname}</Text>
                        </>
                      ) : (
                        <>
                          <View className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center">
                            <User size={12} color="#9CA3AF" />
                          </View>
                          <Text className="text-xs text-gray-400">未知用户</Text>
                        </>
                      )}
                    </View>
                    <Text className="text-xs text-gray-500">{formatTime(order.createdAt)}</Text>
                  </View>

                  {/* 热量显示 */}
                  <View className="flex flex-row items-center justify-end mb-2">
                    <View className="flex flex-row items-center gap-1">
                      <Flame size={12} color="#F97316" />
                      <Text className="text-xs text-orange-500 font-medium">{order.totalCalories} 千卡</Text>
                    </View>
                  </View>

                  {/* 菜品图片网格 */}
                  <View 
                    className="flex flex-row flex-wrap gap-2 mb-3"
                    onClick={() => viewOrderDetail(order)}
                  >
                    {order.items.slice(0, 4).map((item, i) => (
                      <View key={i} className="w-14 h-14 rounded-lg overflow-hidden bg-gray-100">
                        <Image
                          className="w-full h-full"
                          src={getDishImage(item.dish)}
                          mode="aspectFill"
                        />
                      </View>
                    ))}
                    {order.items.length > 4 && (
                      <View className="w-14 h-14 rounded-lg bg-gray-200 flex items-center justify-center">
                        <Text className="text-xs text-gray-500">+{order.items.length - 4}</Text>
                      </View>
                    )}
                  </View>

                  {/* 菜品名称列表 */}
                  <View className="mb-3">
                    <Text className="text-xs text-gray-600" numberOfLines={2}>
                      {order.items.map(item => `${item.dish.name} x${item.quantity}`).join('、')}
                    </Text>
                  </View>

                  {/* 操作按钮 */}
                  <View className="flex flex-row gap-2 mb-2">
                    <View
                      className="flex-1 bg-white border border-orange-300 rounded-lg py-2 flex items-center justify-center"
                      onClick={() => viewOrderDetail(order)}
                    >
                      <Text className="text-sm text-orange-500">查看详情</Text>
                    </View>
                    <View
                      className="flex-1 bg-orange-500 rounded-lg py-2 flex flex-row items-center justify-center"
                      onClick={() => confirmOrder(order.id)}
                    >
                      <Check size={14} color="#fff" />
                      <Text className="text-white text-sm font-medium ml-1">确认</Text>
                    </View>
                  </View>

                  {/* 权限操作按钮（非客人可见） */}
                  {canModifyOrder() && (
                    <View className="flex flex-row gap-2">
                      <View
                        className="flex-1 bg-blue-50 border border-blue-200 rounded-lg py-1.5 flex flex-row items-center justify-center"
                        onClick={() => goToAddDishes(order.id)}
                      >
                        <Plus size={12} color="#3B82F6" />
                        <Text className="text-xs text-blue-500 ml-1">添加菜品</Text>
                      </View>
                      <View
                        className="flex-1 bg-red-50 border border-red-200 rounded-lg py-1.5 flex flex-row items-center justify-center"
                        onClick={() => viewOrderDetail(order)}
                      >
                        <Trash2 size={12} color="#EF4444" />
                        <Text className="text-xs text-red-500 ml-1">删除菜品</Text>
                      </View>
                    </View>
                  )}
                </View>
              ))}
            </View>
          </ScrollView>
        )}
      </View>

      {/* 美味记录区域 */}
      <View className="flex-1 bg-white">
        <View className="px-4 py-3 border-b border-gray-100">
          <View className="flex flex-row items-center gap-2">
            <Calendar size={18} color="#10B981" />
            <Text className="text-base font-semibold text-gray-800">美味记录</Text>
          </View>
        </View>

        {loading ? (
          <View className="flex flex-col items-center justify-center py-16">
            <Text className="text-gray-400">加载中...</Text>
          </View>
        ) : records.length === 0 ? (
          <View className="flex flex-col items-center justify-center py-16">
            <Text className="text-4xl mb-4">🍽️</Text>
            <Text className="text-gray-400">暂无美味记录</Text>
            <Text className="text-xs text-gray-300 mt-1">确认菜单后会在这里显示</Text>
          </View>
        ) : (
          <ScrollView scrollY className="flex-1">
            {records.map(record => (
              <View key={record.id} className="border-b border-gray-100 px-4 py-4">
                {/* 日期和总热量 */}
                <View className="flex flex-row items-center justify-between mb-3">
                  <Text className="text-sm font-medium text-gray-800">{formatDate(record.date)}</Text>
                  <View className="flex flex-row items-center gap-1 bg-orange-50 px-2 py-1 rounded-full">
                    <Flame size={12} color="#F97316" />
                    <Text className="text-xs text-orange-500 font-medium">共 {record.totalCalories} 千卡</Text>
                  </View>
                </View>

                {/* 菜品网格 - 一行四个 */}
                <View className="flex flex-row flex-wrap">
                  {record.dishes.map((dish, index) => (
                    <View
                      key={`${dish.id}-${index}`}
                      className="w-1/4 px-1 mb-2"
                      onClick={() => goToDishDetail(dish.id)}
                    >
                      {/* 1:1 缩略图 */}
                      <View className="aspect-square rounded-lg overflow-hidden bg-gray-100 mb-1">
                        <Image
                          className="w-full h-full"
                          src={getDishImage(dish)}
                          mode="aspectFill"
                        />
                      </View>
                      {/* 菜品名称 */}
                      <Text className="text-xs text-gray-700 text-center truncate block">
                        {dish.name}
                      </Text>
                      {/* 热量 */}
                      <Text className="text-xs text-orange-500 text-center block">{dish.calories}千卡</Text>
                    </View>
                  ))}
                </View>
              </View>
            ))}

            {/* 底部安全区域 */}
            <View style={{ height: '20px' }} />
          </ScrollView>
        )}
      </View>

      {/* 菜单详情弹窗 */}
      {selectedOrder && (
        <View 
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
          onClick={() => setSelectedOrder(null)}
        >
          <View 
            className="bg-white rounded-2xl w-11/12 max-h-4/5 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 标题栏 */}
            <View className="flex flex-row items-center justify-between px-4 py-3 border-b border-gray-100">
              <Text className="text-base font-semibold text-gray-800">菜单详情</Text>
              <View onClick={() => setSelectedOrder(null)}>
                <X size={20} color="#9CA3AF" />
              </View>
            </View>

            <ScrollView scrollY className="p-4" style={{ maxHeight: '60vh' }}>
              {/* 下单用户信息 */}
              {selectedOrder.user && (
                <View className="mb-4 flex flex-row items-center gap-3 p-3 bg-gray-50 rounded-xl">
                  <Image
                    className="w-10 h-10 rounded-full"
                    src={selectedOrder.user.avatarUrl}
                    mode="aspectFill"
                  />
                  <View>
                    <Text className="text-sm font-medium text-gray-800">{selectedOrder.user.nickname}</Text>
                    <Text className="text-xs text-gray-500">下单时间: {formatTime(selectedOrder.createdAt)}</Text>
                  </View>
                </View>
              )}

              {/* 菜品列表 */}
              <View className="mb-4">
                <Text className="text-sm font-medium text-gray-800 mb-2">菜品清单</Text>
                {selectedOrder.items.map((item, i) => (
                  <View 
                    key={i} 
                    className="flex flex-row items-center gap-3 py-2 border-b border-gray-50"
                  >
                    <Image
                      className="w-16 h-16 rounded-lg"
                      src={getDishImage(item.dish)}
                      mode="aspectFill"
                    />
                    <View className="flex-1">
                      <Text className="text-sm font-medium text-gray-800">{item.dish.name}</Text>
                      <Text className="text-xs text-gray-500">数量: {item.quantity}</Text>
                      <Text className="text-xs text-orange-500">{item.dish.calories} 千卡</Text>
                    </View>
                    {/* 权限操作按钮 */}
                    {canModifyOrder() && (
                      <View className="flex flex-row items-center gap-2">
                        <View
                          className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center"
                          onClick={() => updateDishQuantity(selectedOrder.id, item.dish.id, -1)}
                        >
                          <Minus size={14} color="#6B7280" />
                        </View>
                        <Text className="text-sm font-medium w-6 text-center">{item.quantity}</Text>
                        <View
                          className="w-7 h-7 rounded-full bg-orange-100 flex items-center justify-center"
                          onClick={() => updateDishQuantity(selectedOrder.id, item.dish.id, 1)}
                        >
                          <Plus size={14} color="#F97316" />
                        </View>
                        <View
                          className="w-7 h-7 rounded-full bg-red-100 flex items-center justify-center ml-1"
                          onClick={() => removeDishFromOrder(selectedOrder.id, item.dish.id)}
                        >
                          <Trash2 size={14} color="#EF4444" />
                        </View>
                      </View>
                    )}
                  </View>
                ))}
              </View>

              {/* 合并的食材清单 */}
              {selectedOrder.mergedIngredients && selectedOrder.mergedIngredients.length > 0 && (
                <View className="mb-4">
                  <Text className="text-sm font-medium text-gray-800 mb-2">🥬 所需食材</Text>
                  <View className="flex flex-row flex-wrap gap-2">
                    {selectedOrder.mergedIngredients.map((ing, i) => (
                      <View key={i} className="px-3 py-1.5 bg-green-50 rounded-lg">
                        <Text className="text-xs text-green-700">{ing}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {/* 合并的配料清单 */}
              {selectedOrder.mergedSeasoning && selectedOrder.mergedSeasoning.length > 0 && (
                <View className="mb-4">
                  <Text className="text-sm font-medium text-gray-800 mb-2">🧂 所需配料</Text>
                  <View className="flex flex-row flex-wrap gap-2">
                    {selectedOrder.mergedSeasoning.map((s, i) => (
                      <View key={i} className="px-3 py-1.5 bg-purple-50 rounded-lg">
                        <Text className="text-xs text-purple-700">{s}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {/* 总热量 */}
              <View className="flex flex-row items-center justify-center py-3 bg-orange-50 rounded-xl">
                <Flame size={18} color="#F97316" />
                <Text className="text-lg font-bold text-orange-500 ml-1">{selectedOrder.totalCalories}</Text>
                <Text className="text-sm text-orange-500 ml-1">千卡</Text>
              </View>
            </ScrollView>

            {/* 底部按钮 */}
            <View className="flex flex-row gap-3 p-4 border-t border-gray-100">
              {canModifyOrder() && (
                <View
                  className="flex-1 bg-blue-500 rounded-full py-3 flex flex-row items-center justify-center"
                  onClick={() => {
                    setSelectedOrder(null)
                    goToAddDishes(selectedOrder.id)
                  }}
                >
                  <Plus size={18} color="#fff" />
                  <Text className="text-white font-medium ml-1">添加菜品</Text>
                </View>
              )}
              <View
                className="flex-1 bg-gray-100 rounded-full py-3 flex items-center justify-center"
                onClick={() => setSelectedOrder(null)}
              >
                <Text className="text-gray-600 font-medium">取消</Text>
              </View>
              <View
                className="flex-1 bg-orange-500 rounded-full py-3 flex flex-row items-center justify-center"
                onClick={() => confirmOrder(selectedOrder.id)}
              >
                <Check size={18} color="#fff" />
                <Text className="text-white font-medium ml-1">确认制作</Text>
              </View>
            </View>
          </View>
        </View>
      )}
    </View>
  )
}

export default RecordsPage
