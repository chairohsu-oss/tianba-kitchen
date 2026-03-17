import { Module } from '@nestjs/common'
import { VoiceController } from './voice.controller'
import { VoiceService } from './voice.service'
import { AiModule } from '../ai/ai.module'

@Module({
  imports: [AiModule],
  controllers: [VoiceController],
  providers: [VoiceService],
})
export class VoiceModule {}
