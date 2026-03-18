import { Module } from '@nestjs/common'
import { AppController } from '@/app.controller'
import { AppService } from '@/app.service'
import { DishModule } from './modules/dish/dish.module'
import { AiModule } from './modules/ai/ai.module'
import { VoiceModule } from './modules/voice/voice.module'
import { UploadModule } from './modules/upload/upload.module'
import { OrderModule } from './modules/order/order.module'
import { UserModule } from './modules/user/user.module'
import { AuthModule } from './modules/auth/auth.module'

@Module({
  imports: [DishModule, AiModule, VoiceModule, UploadModule, OrderModule, UserModule, AuthModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
