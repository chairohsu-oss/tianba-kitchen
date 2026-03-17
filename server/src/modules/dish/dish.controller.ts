import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseInterceptors,
  UploadedFile,
  HttpCode,
  HttpStatus,
} from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { DishService } from './dish.service'

@Controller('dishes')
export class DishController {
  constructor(private readonly dishService: DishService) {}

  @Get()
  async findAll(@Query() query: { category?: string; cuisine?: string; name?: string }) {
    const dishes = await this.dishService.findAll(query)
    return {
      code: 200,
      msg: 'success',
      data: dishes,
    }
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const dish = await this.dishService.findOne(id)
    if (!dish) {
      return {
        code: 404,
        msg: '菜品不存在',
        data: null,
      }
    }
    return {
      code: 200,
      msg: 'success',
      data: dish,
    }
  }

  @Post()
  @HttpCode(HttpStatus.OK)
  async create(@Body() body: any) {
    const dish = await this.dishService.create(body)
    return {
      code: 200,
      msg: 'success',
      data: dish,
    }
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() body: any) {
    const dish = await this.dishService.update(id, body)
    if (!dish) {
      return {
        code: 404,
        msg: '菜品不存在',
        data: null,
      }
    }
    return {
      code: 200,
      msg: 'success',
      data: dish,
    }
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    const result = await this.dishService.remove(id)
    return {
      code: result ? 200 : 404,
      msg: result ? '删除成功' : '菜品不存在',
      data: null,
    }
  }

  @Post('upload')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(FileInterceptor('file'))
  async uploadImage(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      return {
        code: 400,
        msg: '请选择文件',
        data: null,
      }
    }

    // 支持小程序和H5两种上传方式
    let content: Buffer
    if (file.path) {
      const fs = await import('fs/promises')
      content = await fs.readFile(file.path)
    } else if (file.buffer) {
      content = file.buffer
    } else {
      return {
        code: 400,
        msg: '无法获取文件内容',
        data: null,
      }
    }

    const url = await this.dishService.uploadImage({
      ...file,
      buffer: content,
    })

    return {
      code: 200,
      msg: 'success',
      data: { url },
    }
  }
}
