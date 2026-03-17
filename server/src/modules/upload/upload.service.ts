import { Injectable } from '@nestjs/common'
import { S3Storage } from 'coze-coding-dev-sdk'

@Injectable()
export class UploadService {
  private storage: S3Storage

  constructor() {
    // 初始化S3存储
    this.storage = new S3Storage({
      endpointUrl: process.env.COZE_BUCKET_ENDPOINT_URL,
      accessKey: '',
      secretKey: '',
      bucketName: process.env.COZE_BUCKET_NAME,
      region: 'cn-beijing',
    })
    
    console.log('对象存储服务初始化完成')
  }

  /**
   * 上传图片到对象存储
   */
  async uploadImage(file: Express.Multer.File): Promise<{ key: string; url: string }> {
    // 生成文件名
    const timestamp = Date.now()
    const randomStr = Math.random().toString(36).substring(2, 8)
    const ext = file.originalname.split('.').pop() || 'jpg'
    const fileName = `images/${timestamp}_${randomStr}.${ext}`

    console.log('准备上传图片:', fileName)

    // 支持小程序端（file.path）和H5端（file.buffer）两种方式
    let fileContent: Buffer
    
    if (file.path) {
      // 小程序端：从路径读取文件
      const fs = await import('fs')
      fileContent = fs.readFileSync(file.path)
      console.log('从小程序端路径读取文件:', file.path)
    } else if (file.buffer) {
      // H5端：直接使用buffer
      fileContent = file.buffer
      console.log('从H5端buffer读取文件')
    } else {
      throw new Error('无法读取文件内容')
    }

    // 上传到对象存储
    const key = await this.storage.uploadFile({
      fileContent,
      fileName,
      contentType: file.mimetype || 'image/jpeg',
    })

    console.log('上传成功，key:', key)

    // 生成签名URL（有效期1天）
    const url = await this.storage.generatePresignedUrl({
      key,
      expireTime: 86400,
    })

    console.log('生成签名URL:', url)

    return { key, url }
  }
}
