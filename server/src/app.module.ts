import { Module } from '@nestjs/common'
import { AppController } from '@/app.controller'
import { AppService } from '@/app.service'
import { DishModule } from './modules/dish/dish.module'
import { AiModule } from './modules/ai/ai.module'
import { VoiceModule } from './modules/voice/voice.module'

@Module({
  imports: [DishModule, AiModule, VoiceModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
