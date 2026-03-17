import { Controller, Get, Post, Query, Param, Body } from '@nestjs/common'
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
      }
      quantity: number
    }>
  }) {
    const order = await this.orderService.create(body.items)
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
