import { Module } from '@nestjs/common'
import { AppController } from '@/app.controller'
import { AppService } from '@/app.service'
import { DishModule } from './modules/dish/dish.module'
import { AiModule } from './modules/ai/ai.module'
import { VoiceModule } from './modules/voice/voice.module'
import { UploadModule } from './modules/upload/upload.module'
import { OrderModule } from './modules/order/order.module'

@Module({
  imports: [DishModule, AiModule, VoiceModule, UploadModule, OrderModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
