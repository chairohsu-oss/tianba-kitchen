import { Controller, Get } from '@nestjs/common'
import { OrderService } from './order.service'

@Controller('records')
export class RecordController {
  constructor(private readonly orderService: OrderService) {}

  /**
   * 获取美味记录列表
   */
  @Get()
  async findAll() {
    const records = await this.orderService.getRecords()
    return {
      code: 200,
      msg: 'success',
      data: records,
    }
  }
}
