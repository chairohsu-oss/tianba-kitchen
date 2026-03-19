import { Controller, Get, Delete, Body } from '@nestjs/common'
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

  /**
   * 批量删除美味记录（仅厨师长权限）
   */
  @Delete('batch')
  async deleteBatch(@Body() body: { ids: string[] }) {
    const { ids } = body
    
    if (!ids || ids.length === 0) {
      return {
        code: 400,
        msg: '请选择要删除的记录',
        data: null,
      }
    }

    const result = await this.orderService.deleteRecords(ids)
    
    return {
      code: 200,
      msg: `成功删除 ${result.deletedCount} 条记录`,
      data: result,
    }
  }
}
