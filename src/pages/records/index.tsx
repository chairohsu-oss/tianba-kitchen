import { View, Text, Image, ScrollView } from '@tarojs/components'
import { useState, useEffect } from 'react'
import Taro from '@tarojs/taro'
import { Check, Clock, Flame, Calendar, ChefHat } from 'lucide-react-taro'
import { Network } from '@/network'
import type { FC } from 'react'

// 订单类型
interface Order {
  id: string
  items: {
    dish: {
      id: string
      name: string
      images: string[]
      calories: number
    }
    quantity: number
  }[]
  totalCalories: number
  createdAt: string
  status: 'pending' | 'confirmed'
}

// 美味记录类型
interface DeliciousRecord {
  id: string
  date: string
  dishes: {
    id: string
    name: string
    images: string[]
    calories: number
  }[]
  totalCalories: number
}

const RecordsPage: FC = () => {
  const [pendingOrders, setPendingOrders] = useState<Order[]>([])
  const [records, setRecords] = useState<DeliciousRecord[]>([])
  const [loading, setLoading] = useState(true)

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
  const getDishImage = (dish: any) => {
    if (dish.images && dish.images.length > 0) {
      return dish.images[0]
    }
    return 'https://picsum.photos/200?random=' + dish.id
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
                  className="flex-shrink-0 w-64 bg-orange-50 rounded-xl p-3"
                >
                  {/* 订单时间 */}
                  <View className="flex flex-row items-center justify-between mb-2">
                    <Text className="text-xs text-gray-500">{formatTime(order.createdAt)}</Text>
                    <View className="flex flex-row items-center gap-1">
                      <Flame size={12} color="#F97316" />
                      <Text className="text-xs text-orange-500 font-medium">{order.totalCalories} 千卡</Text>
                    </View>
                  </View>

                  {/* 菜品列表 */}
                  <View className="mb-2">
                    {order.items.map((item, i) => (
                      <Text key={i} className="text-sm text-gray-700">
                        {item.dish.name} x{item.quantity}
                      </Text>
                    ))}
                  </View>

                  {/* 确认按钮 */}
                  <View
                    className="bg-orange-500 rounded-lg py-2 flex flex-row items-center justify-center"
                    onClick={() => confirmOrder(order.id)}
                  >
                    <Check size={14} color="#fff" />
                    <Text className="text-white text-sm font-medium ml-1">确认制作</Text>
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
                <View className="flex flex-row flex-wrap gap-2">
                  {record.dishes.map(dish => (
                    <View
                      key={dish.id}
                      className="w-[calc(25%-6px)] flex flex-col items-center"
                    >
                      {/* 1:1 缩略图 */}
                      <View className="w-full aspect-square rounded-lg overflow-hidden bg-gray-100 mb-1">
                        <Image
                          className="w-full h-full"
                          src={getDishImage(dish)}
                          mode="aspectFill"
                        />
                      </View>
                      {/* 菜品名称 */}
                      <Text className="text-xs text-gray-700 text-center truncate w-full" numberOfLines={1}>
                        {dish.name}
                      </Text>
                      {/* 热量 */}
                      <Text className="text-xs text-orange-500">{dish.calories}千卡</Text>
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
    </View>
  )
}

export default RecordsPage
