/**
 * H5 录音工具类
 * 使用浏览器原生 MediaRecorder API 实现
 * 支持 PWA 和普通 H5 页面
 */

export interface H5RecorderOptions {
  onSuccess?: (blob: Blob) => void
  onError?: (error: Error) => void
  onStart?: () => void
  onStop?: () => void
}

export class H5Recorder {
  private mediaRecorder: MediaRecorder | null = null
  private audioChunks: Blob[] = []
  private stream: MediaStream | null = null
  private options: H5RecorderOptions
  private isRecording = false

  constructor(options: H5RecorderOptions = {}) {
    this.options = options
  }

  /**
   * 检查浏览器是否支持录音
   */
  static isSupported(): boolean {
    return !!(
      navigator.mediaDevices &&
      navigator.mediaDevices.getUserMedia &&
      window.MediaRecorder
    )
  }

  /**
   * 开始录音
   */
  async start(): Promise<void> {
    if (this.isRecording) {
      console.warn('已在录音中')
      return
    }

    if (!H5Recorder.isSupported()) {
      throw new Error('当前浏览器不支持录音功能')
    }

    try {
      // 请求麦克风权限
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,        // 单声道
          sampleRate: 16000,      // 采样率 16kHz（ASR推荐）
          echoCancellation: true, // 回声消除
          noiseSuppression: true, // 噪音抑制
        }
      })

      // 创建 MediaRecorder
      // 优先使用 audio/webm，不支持则用 audio/mp4
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/mp4')
          ? 'audio/mp4'
          : 'audio/webm'

      this.mediaRecorder = new MediaRecorder(this.stream, {
        mimeType,
        audioBitsPerSecond: 16000
      })

      this.audioChunks = []

      // 监听数据可用事件
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data)
        }
      }

      // 监听录音停止事件
      this.mediaRecorder.onstop = () => {
        const audioBlob = new Blob(this.audioChunks, { type: mimeType })
        this.options.onSuccess?.(audioBlob)
        this.options.onStop?.()
        this.cleanup()
      }

      // 开始录音
      this.mediaRecorder.start(100) // 每100ms收集一次数据
      this.isRecording = true
      this.options.onStart?.()

      console.log('H5 录音已开始，格式:', mimeType)
    } catch (error: any) {
      console.error('启动录音失败:', error)
      this.cleanup()
      
      // 友好的错误提示
      let errorMsg = '录音启动失败'
      if (error.name === 'NotAllowedError') {
        errorMsg = '请允许访问麦克风权限'
      } else if (error.name === 'NotFoundError') {
        errorMsg = '未找到麦克风设备'
      } else if (error.name === 'NotReadableError') {
        errorMsg = '麦克风被其他程序占用'
      }
      
      this.options.onError?.(new Error(errorMsg))
      throw error
    }
  }

  /**
   * 停止录音
   */
  stop(): void {
    if (!this.isRecording || !this.mediaRecorder) {
      return
    }

    this.isRecording = false
    this.mediaRecorder.stop()
  }

  /**
   * 取消录音
   */
  cancel(): void {
    this.isRecording = false
    this.audioChunks = [] // 清空已录制的数据
    this.cleanup()
    this.options.onStop?.()
  }

  /**
   * 清理资源
   */
  private cleanup(): void {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop())
      this.stream = null
    }
    this.mediaRecorder = null
  }

  /**
   * 获取录音状态
   */
  getIsRecording(): boolean {
    return this.isRecording
  }
}

/**
 * 将 Blob 转换为 Base64
 */
export const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => {
      const base64 = reader.result as string
      // 去掉 data:audio/webm;base64, 前缀
      const base64Data = base64.split(',')[1]
      resolve(base64Data)
    }
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

/**
 * 将 Blob 转换为 ArrayBuffer
 */
export const blobToArrayBuffer = (blob: Blob): Promise<ArrayBuffer> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => {
      resolve(reader.result as ArrayBuffer)
    }
    reader.onerror = reject
    reader.readAsArrayBuffer(blob)
  })
}
