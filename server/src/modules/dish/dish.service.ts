import { Injectable } from '@nestjs/common'
import { S3Storage } from 'coze-coding-dev-sdk'

export interface Dish {
  id: string
  name: string
  images: string[]
  category: string
  cuisine?: string
  calories: number
  protein: number
  carbs: number
  fat: number
  ingredients: string[]
  seasoning: string[]
  steps: string[]
  tips: string
  description: string
  createdAt: Date
  updatedAt: Date
}

// 内存存储（生产环境应使用数据库）
const dishes: Map<string, Dish> = new Map()

@Injectable()
export class DishService {
  private storage: S3Storage

  constructor() {
    this.storage = new S3Storage({
      endpointUrl: process.env.COZE_BUCKET_ENDPOINT_URL,
      accessKey: '',
      secretKey: '',
      bucketName: process.env.COZE_BUCKET_NAME,
      region: 'cn-beijing',
    })

    // 初始化一些示例数据
    this.initSampleData()
  }

  private initSampleData() {
    const sampleDishes: Dish[] = [
      {
        id: '1',
        name: '红烧排骨',
        images: ['https://picsum.photos/400?random=1'],
        category: 'chinese',
        cuisine: 'jiangzhe',
        calories: 450,
        protein: 28,
        carbs: 15,
        fat: 32,
        ingredients: ['排骨 500g', '葱 2根', '姜 3片', '蒜 4瓣'],
        seasoning: ['料酒 2勺', '生抽 3勺', '老抽 1勺', '冰糖 30g'],
        steps: [
          '排骨洗净焯水',
          '炒糖色',
          '放入排骨翻炒',
          '加调料炖煮40分钟',
          '收汁出锅',
        ],
        tips: '炒糖色时要用小火，避免炒糊',
        description: '经典家常菜，色泽红亮，肉质软烂',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: '2',
        name: '清炒时蔬',
        images: ['https://picsum.photos/400?random=2'],
        category: 'chinese',
        cuisine: 'jiangzhe',
        calories: 120,
        protein: 4,
        carbs: 18,
        fat: 5,
        ingredients: ['时令蔬菜 300g', '蒜 2瓣'],
        seasoning: ['盐 适量', '食用油 适量'],
        steps: ['蔬菜洗净切段', '热锅凉油爆香蒜', '下蔬菜大火快炒', '调味出锅'],
        tips: '大火快炒保持蔬菜脆嫩',
        description: '清爽健康的家常蔬菜',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: '3',
        name: '番茄蛋汤',
        images: ['https://picsum.photos/400?random=3'],
        category: 'chinese',
        cuisine: 'jiangzhe',
        calories: 180,
        protein: 12,
        carbs: 10,
        fat: 10,
        ingredients: ['番茄 2个', '鸡蛋 2个', '葱 1根'],
        seasoning: ['盐 适量', '香油 少许'],
        steps: ['番茄切块', '鸡蛋打散', '热油炒番茄', '加水煮开', '倒入蛋液', '调味出锅'],
        tips: '蛋液倒入后不要搅动，等凝固后再轻轻推动',
        description: '酸甜可口的家常汤品',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]

    sampleDishes.forEach((dish) => {
      dishes.set(dish.id, dish)
    })
  }

  async findAll(query: {
    category?: string
    cuisine?: string
    name?: string
  }): Promise<Dish[]> {
    let result = Array.from(dishes.values())

    if (query.category) {
      result = result.filter((d) => d.category === query.category)
    }

    if (query.cuisine) {
      result = result.filter((d) => d.cuisine === query.cuisine)
    }

    if (query.name) {
      result = result.filter((d) =>
        d.name.toLowerCase().includes(query.name!.toLowerCase()),
      )
    }

    return result
  }

  async findOne(id: string): Promise<Dish | null> {
    return dishes.get(id) || null
  }

  async create(data: Partial<Dish>): Promise<Dish> {
    const dish: Dish = {
      id: Date.now().toString(),
      name: data.name || '',
      images: data.images || [],
      category: data.category || 'chinese',
      cuisine: data.cuisine,
      calories: data.calories || 0,
      protein: data.protein || 0,
      carbs: data.carbs || 0,
      fat: data.fat || 0,
      ingredients: data.ingredients || [],
      seasoning: data.seasoning || [],
      steps: data.steps || [],
      tips: data.tips || '',
      description: data.description || '',
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    dishes.set(dish.id, dish)
    return dish
  }

  async update(id: string, data: Partial<Dish>): Promise<Dish | null> {
    const existing = dishes.get(id)
    if (!existing) return null

    const updated: Dish = {
      ...existing,
      ...data,
      updatedAt: new Date(),
    }

    dishes.set(id, updated)
    return updated
  }

  async remove(id: string): Promise<boolean> {
    return dishes.delete(id)
  }

  async uploadImage(file: Express.Multer.File): Promise<string> {
    const key = await this.storage.uploadFile({
      fileContent: file.buffer,
      fileName: `dishes/${Date.now()}_${file.originalname}`,
      contentType: file.mimetype,
    })

    const url = await this.storage.generatePresignedUrl({
      key,
      expireTime: 86400 * 30, // 30天
    })

    return url
  }
}
