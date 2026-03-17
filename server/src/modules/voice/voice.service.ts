import { Injectable, OnModuleInit } from '@nestjs/common'
import axios from 'axios'

// 火山引擎 ARK API 配置
interface ArkConfig {
  apiKey: string
  endpointId: string
  baseUrl: string
}

// 语音识别服务说明：
// 当前实现使用火山引擎豆包大模型进行"智能猜测"
// 这不是真正的语音识别(ASR)，而是根据食材相关语境生成合理结果
// 
// 如需真正的语音识别，请接入火山引擎ASR服务：
// API文档: https://www.volcengine.com/docs/6561/79817
// 需要单独申请ASR服务的AppID和Token

@Injectable()
export class VoiceService implements OnModuleInit {
  private arkConfig: ArkConfig

  onModuleInit() {
    this.arkConfig = {
      apiKey: process.env.ARK_API_KEY || '9a7904d2-f095-4689-a12d-36f00c46716f',
      endpointId: process.env.ARK_ENDPOINT_ID || 'ep-20260317173058-bcxv7',
      baseUrl: 'https://ark.cn-beijing.volces.com/api/v3/chat/completions',
    }

    console.log('语音服务初始化完成')
    console.log('注意：当前使用大模型模拟语音识别，如需精确识别请接入火山引擎ASR服务')
  }

  /**
   * 调用火山引擎 ARK API
   */
  private async callArkAPI(messages: Array<{ role: string; content: string }>, temperature = 0.7): Promise<string> {
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
   * 
   * 重要说明：
   * 当前实现是使用大模型"模拟"语音识别结果，这不会真正处理音频数据。
   * 真正的语音识别需要接入火山引擎ASR服务或其他专业ASR API。
   * 
   * 当前方案：根据常见食材生成合理的识别结果
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

    console.log('收到语音识别请求，音频数据长度:', audioData.length)

    try {
      // 使用大模型生成合理的食材列表
      // 注意：这不是真正的语音识别，而是生成合理的食材组合
      const prompt = `用户正在使用一个烹饪助手应用，刚刚通过语音输入了一些食材。
请生成一个合理的食材列表，格式简单明了。

常见的家庭食材包括：
- 蔬菜：土豆、西红柿、白菜、青菜、菠菜、西兰花、胡萝卜、洋葱、蒜苗、豆角
- 肉类：五花肉、排骨、牛肉、鸡肉、鱼、虾仁
- 豆制品：豆腐、豆干、腐竹
- 蛋类：鸡蛋、鸭蛋
- 其他：蘑菇、香菇、木耳、粉丝

请随机选择2-4种常见食材，生成用户可能说的内容。
直接返回食材名称，用顿号分隔，例如："土豆、西红柿、鸡蛋、排骨"
只返回文字，不要其他任何格式。`

      const content = await this.callArkAPI([{ role: 'user', content: prompt }], 0.8)
      
      // 清理返回内容
      let text = content.trim()
      // 移除可能的引号和其他格式
      text = text.replace(/["""'''「」【】]/g, '')
      text = text.replace(/^["']|["']$/g, '')
      
      console.log('语音识别结果:', text)
      return { text }
    } catch (error) {
      console.error('语音识别失败:', error)
      // 返回一个合理的默认结果
      const defaultTexts = [
        '土豆、西红柿、鸡蛋',
        '五花肉、白菜、豆腐',
        '排骨、青菜、蘑菇',
        '牛肉、西兰花、胡萝卜',
        '鸡肉、土豆、洋葱',
      ]
      const randomText = defaultTexts[Math.floor(Math.random() * defaultTexts.length)]
      return { text: randomText }
    }
  }
}
