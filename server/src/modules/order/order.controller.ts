import { Controller, Get, Post, Put, Delete, Query, Param, Body } from '@nestjs/common'
import { OrderService } from './order.service'

@Controller('orders')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  /**
   * 获取订单列表
   */
  @Get()
  async findAll(@Query('status') status?: string) {
    const orders = await this.orderService.findAll(status)
    return {
      code: 200,
      msg: 'success',
      data: orders,
    }
  }

  /**
   * 获取美味记录列表
   */
  @Get('records')
  async getRecords() {
    const records = await this.orderService.getRecords()
    return {
      code: 200,
      msg: 'success',
      data: records,
    }
  }

  /**
   * 获取单个订单
   */
  @Get(':id')
  async findOne(@Param('id') id: string) {
    const order = await this.orderService.findOne(id)
    if (!order) {
      return {
        code: 404,
        msg: '订单不存在',
        data: null,
      }
    }
    return {
      code: 200,
      msg: 'success',
      data: order,
    }
  }

  /**
   * 创建订单
   */
  @Post()
  async create(@Body() body: {
    items: Array<{
      dish: {
        id: string
        name: string
        images: string[]
        calories: number
        ingredients?: string[]
        seasoning?: string[]
        steps?: string[]
      }
      quantity: number
    }>
    user?: {
      id: string
      nickname: string
      avatarUrl: string
    }
  }) {
    const order = await this.orderService.create(body.items, body.user)
    return {
      code: 200,
      msg: 'success',
      data: order,
    }
  }

  /**
   * 更新订单（添加/删除/修改菜品）
   */
  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() body: {
      items: Array<{
        dish: {
          id: string
          name: string
          images: string[]
          calories: number
          ingredients?: string[]
          seasoning?: string[]
          steps?: string[]
        }
        quantity: number
      }>
    }
  ) {
    const order = await this.orderService.updateItems(id, body.items)
    if (!order) {
      return {
        code: 404,
        msg: '订单不存在',
        data: null,
      }
    }
    return {
      code: 200,
      msg: 'success',
      data: order,
    }
  }

  /**
   * 删除订单中的某个菜品
   */
  @Delete(':id/items/:dishId')
  async removeItem(
    @Param('id') id: string,
    @Param('dishId') dishId: string
  ) {
    const order = await this.orderService.removeItem(id, dishId)
    if (!order) {
      return {
        code: 404,
        msg: '订单或菜品不存在',
        data: null,
      }
    }
    return {
      code: 200,
      msg: 'success',
      data: order,
    }
  }

  /**
   * 向订单添加菜品
   */
  @Post(':id/items')
  async addItem(
    @Param('id') id: string,
    @Body() body: {
      dish: {
        id: string
        name: string
        images: string[]
        calories: number
        ingredients?: string[]
        seasoning?: string[]
        steps?: string[]
      }
      quantity: number
    }
  ) {
    const order = await this.orderService.addItem(id, body.dish, body.quantity)
    if (!order) {
      return {
        code: 404,
        msg: '订单不存在',
        data: null,
      }
    }
    return {
      code: 200,
      msg: 'success',
      data: order,
    }
  }

  /**
   * 确认订单（管理员确认后生成美味记录）
   */
  @Post(':id/confirm')
  async confirm(@Param('id') id: string) {
    const result = await this.orderService.confirm(id)
    if (!result) {
      return {
        code: 404,
        msg: '订单不存在',
        data: null,
      }
    }
    return {
      code: 200,
      msg: 'success',
      data: result,
    }
  }
}
