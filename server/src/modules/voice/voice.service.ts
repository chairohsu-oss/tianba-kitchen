import { Injectable, OnModuleInit } from '@nestjs/common'
import { ASRClient, Config, HeaderUtils, APIError } from 'coze-coding-dev-sdk'

// ASR服务 - 使用coze-coding-dev-sdk内置的语音识别能力
// 无需额外配置API Key，SDK会自动处理认证

@Injectable()
export class VoiceService implements OnModuleInit {
  private asrClient: ASRClient
  private config: Config

  onModuleInit() {
    // 初始化SDK配置
    this.config = new Config()
    
    // 初始化ASR客户端
    this.asrClient = new ASRClient(this.config)
    
    console.log('语音识别服务初始化完成')
    console.log('使用 coze-coding-dev-sdk ASRClient')
    console.log('支持格式: WAV/MP3/OGG OPUS/M4A')
    console.log('音频限制: 时长≤2小时, 大小≤100MB')
  }

  /**
   * 语音识别（ASR）
   * 
   * 使用 coze-coding-dev-sdk 的 ASRClient 进行真正的语音识别
   * 支持通过 URL 或 Base64 编码的音频数据
   * 
   * @param audioData - Base64编码的音频数据
   * @param audioUrl - 音频文件URL（可选）
   * @param headers - 请求头（用于认证追踪）
   * @returns 识别出的文本
   */
  async recognize(
    audioData?: string, 
    audioUrl?: string,
    headers?: Record<string, string>
  ): Promise<{ text: string; duration?: number }> {
    // 验证输入
    if (!audioData && !audioUrl) {
      throw new Error('必须提供音频数据(audioData)或音频URL(audioUrl)')
    }

    // 验证base64格式（如果提供的是base64数据）
    if (audioData) {
      const base64Regex = /^[A-Za-z0-9+/]+={0,2}$/
      if (!base64Regex.test(audioData)) {
        throw new Error('音频数据格式错误，必须是有效的Base64编码')
      }
      console.log('收到语音识别请求，音频数据长度:', audioData.length)
    }

    // 验证URL格式（如果提供的是URL）
    if (audioUrl) {
      try {
        new URL(audioUrl)
        console.log('收到语音识别请求，音频URL:', audioUrl)
      } catch {
        throw new Error('音频URL格式错误')
      }
    }

    try {
      // 提取转发headers（用于认证和追踪）
      const customHeaders = headers ? HeaderUtils.extractForwardHeaders(headers) : undefined
      
      // 如果有自定义headers，创建新的客户端实例
      const client = customHeaders 
        ? new ASRClient(this.config, customHeaders) 
        : this.asrClient

      // 调用ASR识别
      const result = await client.recognize({
        uid: 'tianba-user',  // 用户标识
        url: audioUrl,        // 音频URL
        base64Data: audioData // Base64音频数据
      })

      console.log('ASR识别成功:', result.text)
      if (result.duration) {
        console.log('音频时长:', result.duration / 1000, '秒')
      }

      return { 
        text: result.text,
        duration: result.duration 
      }
    } catch (error) {
      if (error instanceof APIError) {
        console.error('ASR API错误:', error.message)
        console.error('状态码:', error.statusCode)
      } else {
        console.error('语音识别失败:', error)
      }
      
      // 语音识别失败时返回空字符串，让前端处理
      // 不再返回默认食材，避免误导用户
      console.log('语音识别失败，返回空结果')
      return { text: '' }
    }
  }

  /**
   * 从文件路径识别语音
   * 用于本地测试
   */
  async recognizeFromFile?(filePath: string): Promise<{ text: string }> {
    const fs = await import('fs')
    const audioBuffer = fs.readFileSync(filePath)
    const base64Data = audioBuffer.toString('base64')
    return this.recognize(base64Data)
  }
}
