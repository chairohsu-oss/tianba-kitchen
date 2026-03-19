import { Injectable } from '@nestjs/common'
import { getSupabaseClient } from '@/storage/database/supabase-client'
import type { Order, OrderItem, DeliciousRecord } from '@/storage/database/shared/schema'

export interface UserInfo {
  id: string
  nickname: string
  avatarUrl: string
}

export interface DishInfo {
  id: string
  name: string
  images: string[]
  calories: number
  ingredients?: string[]
  seasoning?: string[]
  steps?: string[]
}

@Injectable()
export class OrderService {
  private client = getSupabaseClient()

  /**
   * 获取订单列表
   */
  async findAll(status?: string): Promise<any[]> {
    let query = this.client
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false })

    if (status) {
      query = query.eq('status', status)
    }

    const { data: orders, error } = await query

    if (error) {
      console.error('查询订单失败:', error)
      return []
    }

    // 获取每个订单的订单项
    const result: any[] = []
    for (const order of orders || []) {
      const { data: items } = await this.client
        .from('order_items')
        .select('*')
        .eq('order_id', order.id)

      const orderItems = (items || []).map(item => ({
        dish: {
          id: item.dish_id,
          name: item.dish_name,
          images: item.dish_image ? [item.dish_image] : [],
          calories: 0,
        },
        quantity: item.quantity,
      }))

      result.push({
        ...order,
        items: orderItems,
        mergedIngredients: order.merged_ingredients || [],
        mergedSeasoning: order.merged_seasoning || [],
      })
    }

    return result
  }

  /**
   * 合并食材清单（去重合并）
   */
  private mergeIngredients(items: { dish: DishInfo; quantity: number }[]): string[] {
    const ingredientMap = new Map<string, string>()
    
    for (const item of items) {
      if (item.dish.ingredients && Array.isArray(item.dish.ingredients)) {
        for (const ing of item.dish.ingredients) {
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
  private mergeSeasoning(items: { dish: DishInfo; quantity: number }[]): string[] {
    const seasoningMap = new Map<string, string>()
    
    for (const item of items) {
      if (item.dish.seasoning && Array.isArray(item.dish.seasoning)) {
        for (const s of item.dish.seasoning) {
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
  async create(items: { dish: DishInfo; quantity: number }[], user?: UserInfo): Promise<any> {
    const totalCalories = items.reduce((sum, item) => {
      return sum + item.dish.calories * item.quantity
    }, 0)

    const mergedIngredients = this.mergeIngredients(items)
    const mergedSeasoning = this.mergeSeasoning(items)

    // 创建订单
    const { data: order, error: orderError } = await this.client
      .from('orders')
      .insert({
        user_id: user?.id,
        status: 'pending',
        total_calories: totalCalories,
        merged_ingredients: mergedIngredients,
        merged_seasoning: mergedSeasoning,
      })
      .select()
      .single()

    if (orderError) {
      console.error('创建订单失败:', orderError)
      throw new Error('创建订单失败')
    }

    // 创建订单项
    const orderItems = items.map(item => ({
      order_id: order.id,
      dish_id: item.dish.id,
      dish_name: item.dish.name,
      dish_image: item.dish.images?.[0] || '',
      quantity: item.quantity,
    }))

    const { error: itemsError } = await this.client
      .from('order_items')
      .insert(orderItems)

    if (itemsError) {
      console.error('创建订单项失败:', itemsError)
    }

    return {
      ...order,
      items: items.map(item => ({
        dish: item.dish,
        quantity: item.quantity,
      })),
      mergedIngredients,
      mergedSeasoning,
    }
  }

  /**
   * 确认订单（生成美味记录）
   */
  async confirm(id: string): Promise<{ order: any; record: any } | null> {
    // 获取订单
    const { data: order, error: orderError } = await this.client
      .from('orders')
      .select('*')
      .eq('id', id)
      .single()

    if (orderError || !order) return null

    // 获取订单项
    const { data: items } = await this.client
      .from('order_items')
      .select('*')
      .eq('order_id', id)

    // 更新订单状态
    const { data: updatedOrder } = await this.client
      .from('orders')
      .update({ status: 'confirmed' })
      .eq('id', id)
      .select()
      .single()

    // 生成美味记录
    const dishIds = (items || []).flatMap(item => 
      Array(item.quantity).fill(item.dish_id)
    )

    const { data: record } = await this.client
      .from('delicious_records')
      .insert({
        date: new Date().toISOString(),
        total_calories: order.total_calories,
        dish_ids: dishIds,
      })
      .select()
      .single()

    return {
      order: {
        ...updatedOrder,
        items: (items || []).map(item => ({
          dish: {
            id: item.dish_id,
            name: item.dish_name,
            images: item.dish_image ? [item.dish_image] : [],
          },
          quantity: item.quantity,
        })),
      },
      record,
    }
  }

  /**
   * 获取美味记录列表
   */
  async getRecords(): Promise<any[]> {
    const { data, error } = await this.client
      .from('delicious_records')
      .select('*')
      .order('date', { ascending: false })

    if (error) {
      console.error('查询美味记录失败:', error)
      return []
    }

    // 为每条记录查询菜品详情
    const result: any[] = []
    for (const record of data || []) {
      const dishIds: string[] = record.dish_ids || []
      
      // 根据 dish_ids 查询菜品信息
      const dishes: any[] = []
      for (const dishId of dishIds) {
        const { data: dish } = await this.client
          .from('dishes')
          .select('*')
          .eq('id', dishId)
          .single()
        
        if (dish) {
          dishes.push({
            id: dish.id,
            name: dish.name,
            images: dish.images || [],
            calories: dish.calories || 0,
          })
        }
      }

      result.push({
        id: record.id,
        date: record.date,
        dishes,
        totalCalories: record.total_calories,
        createdAt: record.created_at,
      })
    }

    return result
  }

  /**
   * 删除美味记录（批量）
   */
  async deleteRecords(ids: string[]): Promise<{ success: boolean; deletedCount: number }> {
    if (!ids || ids.length === 0) {
      return { success: false, deletedCount: 0 }
    }

    const { error, count } = await this.client
      .from('delicious_records')
      .delete()
      .in('id', ids)

    if (error) {
      console.error('删除美味记录失败:', error)
      throw new Error('删除美味记录失败')
    }

    return { 
      success: true, 
      deletedCount: count || ids.length 
    }
  }

  /**
   * 获取单个订单
   */
  async findOne(id: string): Promise<any | null> {
    const { data: order, error } = await this.client
      .from('orders')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !order) return null

    // 获取订单项
    const { data: items } = await this.client
      .from('order_items')
      .select('*')
      .eq('order_id', id)

    return {
      ...order,
      items: (items || []).map(item => ({
        dish: {
          id: item.dish_id,
          name: item.dish_name,
          images: item.dish_image ? [item.dish_image] : [],
        },
        quantity: item.quantity,
      })),
      mergedIngredients: order.merged_ingredients || [],
      mergedSeasoning: order.merged_seasoning || [],
    }
  }

  /**
   * 更新订单菜品列表
   */
  async updateItems(id: string, items: { dish: DishInfo; quantity: number }[]): Promise<any | null> {
    const { data: order } = await this.client
      .from('orders')
      .select('*')
      .eq('id', id)
      .single()

    if (!order) return null

    const totalCalories = items.reduce((sum, item) => {
      return sum + item.dish.calories * item.quantity
    }, 0)

    const mergedIngredients = this.mergeIngredients(items)
    const mergedSeasoning = this.mergeSeasoning(items)

    // 更新订单
    await this.client
      .from('orders')
      .update({
        total_calories: totalCalories,
        merged_ingredients: mergedIngredients,
        merged_seasoning: mergedSeasoning,
      })
      .eq('id', id)

    // 删除旧订单项
    await this.client
      .from('order_items')
      .delete()
      .eq('order_id', id)

    // 插入新订单项
    const orderItems = items.map(item => ({
      order_id: id,
      dish_id: item.dish.id,
      dish_name: item.dish.name,
      dish_image: item.dish.images?.[0] || '',
      quantity: item.quantity,
    }))

    await this.client
      .from('order_items')
      .insert(orderItems)

    return this.findOne(id)
  }

  /**
   * 删除订单中的某个菜品
   */
  async removeItem(orderId: string, dishId: string): Promise<any | null> {
    const order = await this.findOne(orderId)
    if (!order) return null

    const newItems = order.items.filter((item: any) => item.dish.id !== dishId)
    if (newItems.length === order.items.length) {
      return null
    }

    return this.updateItems(orderId, newItems)
  }

  /**
   * 向订单添加菜品
   */
  async addItem(orderId: string, dish: DishInfo, quantity: number): Promise<any | null> {
    const order = await this.findOne(orderId)
    if (!order) return null

    const existingIndex = order.items.findIndex((item: any) => item.dish.id === dish.id)
    
    if (existingIndex >= 0) {
      order.items[existingIndex].quantity += quantity
    } else {
      order.items.push({ dish, quantity })
    }

    return this.updateItems(orderId, order.items)
  }

  /**
   * 删除订单（同时删除订单项）
   */
  async delete(orderId: string): Promise<{ success: boolean }> {
    // 先删除订单项
    const { error: itemsError } = await this.client
      .from('order_items')
      .delete()
      .eq('order_id', orderId)

    if (itemsError) {
      console.error('删除订单项失败:', itemsError)
    }

    // 再删除订单
    const { error: orderError } = await this.client
      .from('orders')
      .delete()
      .eq('id', orderId)

    if (orderError) {
      console.error('删除订单失败:', orderError)
      throw new Error('删除订单失败')
    }

    return { success: true }
  }
}
