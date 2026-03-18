import { Module, forwardRef } from '@nestjs/common'
import { DishController } from './dish.controller'
import { DishService } from './dish.service'
import { AiModule } from '../ai/ai.module'

@Module({
  imports: [forwardRef(() => AiModule)],
  controllers: [DishController],
  providers: [DishService],
  exports: [DishService],
})
export class DishModule {}
