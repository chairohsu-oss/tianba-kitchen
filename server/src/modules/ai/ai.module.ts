import { Module, forwardRef } from '@nestjs/common'
import { AiController } from './ai.controller'
import { AiService } from './ai.service'
import { DishModule } from '../dish/dish.module'
import { OrderModule } from '../order/order.module'
import { UserModule } from '../user/user.module'

@Module({
  imports: [forwardRef(() => DishModule), OrderModule, UserModule],
  controllers: [AiController],
  providers: [AiService],
  exports: [AiService],
})
export class AiModule {}
