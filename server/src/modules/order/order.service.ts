import { Injectable } from '@nestjs/common'

export interface OrderItem {
  dish: {
    id: string
    name: string
    images: string[]
    calories: number
  }
  quantity: number
}

export interface Order {
  id: string
  items: OrderItem[]
  totalCalories: number
  createdAt: Date
  status: 'pending' | 'confirmed'
}

export interface DeliciousRecord {
  id: string
  date: Date
  dishes: Array<{
    id: string
    name: string
    images: string[]
    calories: number
  }>
  totalCalories: number
}

// 内存存储（生产环境应使用数据库）
const orders: Map<string, Order> = new Map()
const records: Map<string, DeliciousRecord> = new Map()

@Injectable()
export class OrderService {
  /**
   * 获取订单列表
   */
  async findAll(status?: string): Promise<Order[]> {
    let result = Array.from(orders.values())
    
    if (status) {
      result = result.filter(o => o.status === status)
    }
    
    // 按时间倒序排列
    return result.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
  }

  /**
   * 创建订单
   */
  async create(items: OrderItem[]): Promise<Order> {
    const totalCalories = items.reduce((sum, item) => {
      return sum + item.dish.calories * item.quantity
    }, 0)

    const order: Order = {
      id: Date.now().toString(),
      items,
      totalCalories,
      createdAt: new Date(),
      status: 'pending',
    }

    orders.set(order.id, order)
    return order
  }

  /**
   * 确认订单（生成美味记录）
   */
  async confirm(id: string): Promise<{ order: Order; record: DeliciousRecord } | null> {
    const order = orders.get(id)
    if (!order) return null

    // 更新订单状态
    order.status = 'confirmed'
    orders.set(id, order)

    // 生成美味记录
    const dishes = order.items.flatMap(item => {
      // 根据数量生成多条记录
      return Array(item.quantity).fill(null).map(() => ({
        id: item.dish.id,
        name: item.dish.name,
        images: item.dish.images,
        calories: item.dish.calories,
      }))
    })

    const record: DeliciousRecord = {
      id: Date.now().toString(),
      date: new Date(),
      dishes,
      totalCalories: order.totalCalories,
    }

    records.set(record.id, record)

    return { order, record }
  }

  /**
   * 获取美味记录列表
   */
  async getRecords(): Promise<DeliciousRecord[]> {
    const result = Array.from(records.values())
    // 按日期倒序排列
    return result.sort((a, b) => b.date.getTime() - a.date.getTime())
  }
}
