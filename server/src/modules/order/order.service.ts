import { Injectable } from '@nestjs/common'

export interface DishInfo {
  id: string
  name: string
  images: string[]
  calories: number
  ingredients?: string[]
  seasoning?: string[]
  steps?: string[]
}

export interface OrderItem {
  dish: DishInfo
  quantity: number
}

export interface Order {
  id: string
  items: OrderItem[]
  totalCalories: number
  createdAt: Date
  status: 'pending' | 'confirmed'
  mergedIngredients?: string[]
  mergedSeasoning?: string[]
}

export interface DeliciousRecord {
  id: string
  date: Date
  dishes: DishInfo[]
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
    
    // 按时间倒序排列，并计算合并的食材配料
    return result.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .map(order => ({
        ...order,
        mergedIngredients: this.mergeIngredients(order.items),
        mergedSeasoning: this.mergeSeasoning(order.items),
      }))
  }

  /**
   * 合并食材清单（去重合并）
   */
  private mergeIngredients(items: OrderItem[]): string[] {
    const ingredientMap = new Map<string, string>()
    
    for (const item of items) {
      if (item.dish.ingredients && Array.isArray(item.dish.ingredients)) {
        for (const ing of item.dish.ingredients) {
          // 提取食材名称（去掉用量）
          const match = ing.match(/^(.+?)(?:\s+\d+.*)?$/)
          const name = match ? match[1].trim() : ing.trim()
          if (name && !ingredientMap.has(name)) {
            ingredientMap.set(name, ing)
          }
        }
      }
    }
    
    return Array.from(ingredientMap.values())
  }

  /**
   * 合并配料清单（去重合并）
   */
  private mergeSeasoning(items: OrderItem[]): string[] {
    const seasoningMap = new Map<string, string>()
    
    for (const item of items) {
      if (item.dish.seasoning && Array.isArray(item.dish.seasoning)) {
        for (const s of item.dish.seasoning) {
          // 提取配料名称（去掉用量）
          const match = s.match(/^(.+?)(?:\s+\d+.*)?$/)
          const name = match ? match[1].trim() : s.trim()
          if (name && !seasoningMap.has(name)) {
            seasoningMap.set(name, s)
          }
        }
      }
    }
    
    return Array.from(seasoningMap.values())
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
      mergedIngredients: this.mergeIngredients(items),
      mergedSeasoning: this.mergeSeasoning(items),
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
        ingredients: item.dish.ingredients,
        seasoning: item.dish.seasoning,
        steps: item.dish.steps,
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
