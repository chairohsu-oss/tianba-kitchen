import { View, Text, Image, ScrollView } from '@tarojs/components'
import { useState, useEffect } from 'react'
import Taro from '@tarojs/taro'
import { Check, Clock, Flame, Calendar, ChefHat, X } from 'lucide-react-taro'
import { Network } from '@/network'
import type { FC } from 'react'

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

// 订单类型
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
}

// 美味记录类型
interface DeliciousRecord {
  id: string
  date: string
  dishes: DishInfo[]
  totalCalories: number
}

const RecordsPage: FC = () => {
  const [pendingOrders, setPendingOrders] = useState<Order[]>([])
  const [records, setRecords] = useState<DeliciousRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      // 获取待确认订单
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

  // 确认订单
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

  // 查看订单详情
  const viewOrderDetail = (order: Order) => {
    setSelectedOrder(order)
  }

  // 跳转菜品详情页
  const goToDishDetail = (dishId: string) => {
    Taro.navigateTo({ url: `/pages/dish-detail/index?id=${dishId}` })
  }

  return (
    <View className="flex flex-col bg-gray-50 min-h-screen">
      {/* 顶部待确认订单区域 */}
      <View className="bg-white mb-2">
        <View className="px-4 py-3 border-b border-gray-100">
          <View className="flex flex-row items-center gap-2">
            <Clock size={18} color="#F97316" />
            <Text className="text-base font-semibold text-gray-800">待确认订单</Text>
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
            <Text className="text-sm text-gray-400 mt-2">暂无待确认订单</Text>
          </View>
        ) : (
          <ScrollView scrollX className="px-4 py-3">
            <View className="flex flex-row gap-3">
              {pendingOrders.map(order => (
                <View
                  key={order.id}
                  className="flex-shrink-0 w-72 bg-orange-50 rounded-xl p-3"
                >
                  {/* 订单时间 */}
                  <View className="flex flex-row items-center justify-between mb-2">
                    <Text className="text-xs text-gray-500">{formatTime(order.createdAt)}</Text>
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
                  <View className="flex flex-row gap-2">
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
            <Text className="text-xs text-gray-300 mt-1">确认订单后会在这里显示</Text>
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

      {/* 订单详情弹窗 */}
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
              <Text className="text-base font-semibold text-gray-800">订单详情</Text>
              <View onClick={() => setSelectedOrder(null)}>
                <X size={20} color="#9CA3AF" />
              </View>
            </View>

            <ScrollView scrollY className="p-4" style={{ maxHeight: '60vh' }}>
              {/* 菜品列表 */}
              <View className="mb-4">
                <Text className="text-sm font-medium text-gray-800 mb-2">菜品清单</Text>
                {selectedOrder.items.map((item, i) => (
                  <View 
                    key={i} 
                    className="flex flex-row items-center gap-3 py-2 border-b border-gray-50"
                    onClick={() => {
                      goToDishDetail(item.dish.id)
                      setSelectedOrder(null)
                    }}
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
