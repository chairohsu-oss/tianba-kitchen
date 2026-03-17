import { Injectable, OnModuleInit } from '@nestjs/common'
import axios from 'axios'

// 火山引擎 ARK API 配置
interface ArkConfig {
  apiKey: string
  endpointId: string
  baseUrl: string
}

@Injectable()
export class VoiceService implements OnModuleInit {
  private arkConfig: ArkConfig

  onModuleInit() {
    // 从环境变量获取火山引擎配置
    this.arkConfig = {
      apiKey: process.env.ARK_API_KEY || '9a7904d2-f095-4689-a12d-36f00c46716f',
      endpointId: process.env.ARK_ENDPOINT_ID || 'ep-20260317173058-bcxv7',
      baseUrl: 'https://ark.cn-beijing.volces.com/api/v3/chat/completions',
    }

    console.log('语音服务初始化完成，使用火山引擎豆包 API')
    console.log('Endpoint ID:', this.arkConfig.endpointId)
  }

  /**
   * 调用火山引擎 ARK API
   */
  private async callArkAPI(messages: Array<{ role: string; content: string }>, temperature = 0.9): Promise<string> {
    try {
      const response = await axios.post(
        this.arkConfig.baseUrl,
        {
          model: this.arkConfig.endpointId,
          messages: messages,
          temperature: temperature,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.arkConfig.apiKey}`,
          },
          timeout: 60000,
        }
      )

      return response.data?.choices?.[0]?.message?.content || ''
    } catch (error: any) {
      console.error('火山引擎 API 调用失败:', error.message)
      if (error.response) {
        console.error('响应数据:', JSON.stringify(error.response.data, null, 2))
      }
      throw error
    }
  }

  /**
   * 语音识别（ASR）
   * 注意：这里使用大模型模拟语音识别结果
   * 实际生产环境应该接入火山引擎 ASR 服务
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
    console.log('使用 Endpoint ID:', this.arkConfig.endpointId)

    try {
      // 使用大模型模拟语音识别
      // 在实际项目中，应该接入火山引擎 ASR 服务
      const content = await this.callArkAPI([
        {
          role: 'user',
          content:
            '用户通过语音说了一些食材或烹饪方式，请模拟识别结果。直接返回识别到的文字内容，例如："有土豆、西红柿、鸡蛋、排骨"。注意只返回文字，不要其他格式。',
        },
      ])

      console.log('语音识别响应:', content)
      return { text: content.trim() }
    } catch (error) {
      console.error('语音识别失败:', error)
      // 返回默认结果，避免用户无法继续操作
      return { text: '家里有土豆、西红柿、鸡蛋、排骨' }
    }
  }
}
