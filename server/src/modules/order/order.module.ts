import { Module } from '@nestjs/common'
import { OrderController } from './order.controller'
import { RecordController } from './record.controller'
import { OrderService } from './order.service'

@Module({
  controllers: [OrderController, RecordController],
  providers: [OrderService],
  exports: [OrderService],
})
export class OrderModule {}
