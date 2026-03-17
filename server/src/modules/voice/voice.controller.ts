import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common'
import { VoiceService } from './voice.service'

@Controller('voice')
export class VoiceController {
  constructor(private readonly voiceService: VoiceService) {}

  /**
   * 语音识别接口
   */
  @Post('recognize')
  @HttpCode(HttpStatus.OK)
  async recognize(@Body() body: { audioData: string }) {
    const { audioData } = body

    // 验证音频数据
    if (!audioData || audioData.length === 0) {
      throw new BadRequestException('音频数据为空')
    }

    // 验证base64格式
    const base64Regex = /^[A-Za-z0-9+/]+={0,2}$/
    if (!base64Regex.test(audioData)) {
      throw new BadRequestException('音频数据格式错误')
    }

    console.log('音频数据长度:', audioData.length)
    console.log('音频数据预览:', audioData.substring(0, 100))
    console.log('音频数据类型:', typeof audioData)

    try {
      const result = await this.voiceService.recognize(audioData)
      return {
        code: 200,
        msg: 'success',
        data: result,
      }
    } catch (error) {
      console.error('语音识别失败:', error)
      throw new BadRequestException('语音识别失败，请重试')
    }
  }
}
