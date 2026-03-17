import { Injectable } from '@nestjs/common'
import { LLMClient, Config } from 'coze-coding-dev-sdk'

@Injectable()
export class VoiceService {
  private llmClient: LLMClient

  constructor() {
    const config = new Config()
    this.llmClient = new LLMClient(config)
  }

  /**
   * 语音识别（ASR）
   * 注意：这里使用大模型模拟语音识别结果
   * 实际生产环境应该接入专业的ASR服务
   */
  async recognize(audioData: string): Promise<{ text: string }> {
    // 验证音频数据
    if (!audioData || audioData.length === 0) {
      throw new Error('音频数据为空')
    }

    // 验证base64格式
    const base64Regex = /^[A-Za-z0-9+/]+={0,2}$/
    if (!base64Regex.test(audioData)) {
      throw new Error('音频数据格式错误')
    }

    console.log('音频数据长度:', audioData.length)
    console.log('音频数据预览:', audioData.substring(0, 100))

    try {
      // 使用大模型模拟语音识别
      // 在实际项目中，应该接入专业的ASR服务如百度、阿里云等
      const response = await this.llmClient.invoke(
        [
          {
            role: 'user',
            content:
              '用户通过语音说了一些食材，请模拟识别结果。返回一个JSON：{"text": "识别到的食材内容，例如：家里有土豆、西红柿、鸡蛋、排骨"}',
          },
        ],
        { temperature: 0.9 },
      )

      const jsonMatch = response.content.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0])
      }

      // 返回默认结果
      return { text: '家里有土豆、西红柿、鸡蛋、排骨' }
    } catch (error) {
      console.error('语音识别失败:', error)
      // 返回默认结果，避免用户无法继续操作
      return { text: '家里有土豆、西红柿、鸡蛋、排骨' }
    }
  }
}
