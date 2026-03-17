import { Controller, Post, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { UploadService } from './upload.service'

@Controller('upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  /**
   * 上传图片
   */
  @Post('image')
  @UseInterceptors(FileInterceptor('file'))
  async uploadImage(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('请选择要上传的图片')
    }

    console.log('收到图片上传请求:', {
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      hasPath: !!file.path,
      hasBuffer: !!file.buffer
    })

    const result = await this.uploadService.uploadImage(file)

    return {
      code: 200,
      msg: 'success',
      data: result,
    }
  }
}
