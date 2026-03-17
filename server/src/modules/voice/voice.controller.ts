import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  BadRequestException,
  Headers,
} from '@nestjs/common'
import { VoiceService } from './voice.service'

@Controller('voice')
export class VoiceController {
  constructor(private readonly voiceService: VoiceService) {}

  /**
   * 语音识别接口
   * 
   * 支持两种输入方式：
   * 1. Base64编码的音频数据
   * 2. 音频文件URL
   * 
   * 支持的音频格式: WAV/MP3/OGG OPUS/M4A
   * 音频限制: 时长≤2小时, 大小≤100MB
   */
  @Post('recognize')
  @HttpCode(HttpStatus.OK)
  async recognize(
    @Body() body: { audioData?: string; audioUrl?: string },
    @Headers() headers: Record<string, string>,
  ) {
    const { audioData, audioUrl } = body

    // 至少需要提供一种输入
    if (!audioData && !audioUrl) {
      throw new BadRequestException('必须提供音频数据(audioData)或音频URL(audioUrl)')
    }

    // 如果提供了base64数据，验证格式
    if (audioData) {
      if (audioData.length === 0) {
        throw new BadRequestException('音频数据为空')
      }
      const base64Regex = /^[A-Za-z0-9+/]+={0,2}$/
      if (!base64Regex.test(audioData)) {
        throw new BadRequestException('音频数据格式错误，必须是有效的Base64编码')
      }
      console.log('音频数据长度:', audioData.length)
      console.log('音频数据预览:', audioData.substring(0, 100))
    }

    // 如果提供了URL，验证格式
    if (audioUrl) {
      try {
        new URL(audioUrl)
        console.log('音频URL:', audioUrl)
      } catch {
        throw new BadRequestException('音频URL格式错误')
      }
    }

    try {
      const result = await this.voiceService.recognize(audioData, audioUrl, headers)
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
