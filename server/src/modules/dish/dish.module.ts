import { Module } from '@nestjs/common'
import { DishController } from './dish.controller'
import { DishService } from './dish.service'
import { AiModule } from '../ai/ai.module'

@Module({
  imports: [AiModule],
  controllers: [DishController],
  providers: [DishService],
})
export class DishModule {}
