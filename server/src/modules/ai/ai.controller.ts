import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common'
import { AiService } from './ai.service'

@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  /**
   * 根据食材推荐菜品
   */
  @Post('recommend')
  @HttpCode(HttpStatus.OK)
  async recommend(@Body() body: { ingredients: string }) {
    console.log('推荐请求 - 食材:', body.ingredients)

    const result = await this.aiService.recommendDishes(body.ingredients)

    return {
      code: 200,
      msg: 'success',
      data: result,
    }
  }

  /**
   * 获取菜品制作方式
   */
  @Post('cooking-methods')
  @HttpCode(HttpStatus.OK)
  async getCookingMethods(@Body() body: { dishes: string[] }) {
    console.log('获取制作方式 - 菜品:', body.dishes)

    const result = await this.aiService.getCookingMethods(body.dishes)

    return {
      code: 200,
      msg: 'success',
      data: result,
    }
  }

  /**
   * 生成菜谱
   */
  @Post('generate-recipe')
  @HttpCode(HttpStatus.OK)
  async generateRecipe(
    @Body() body: { name?: string; input: string; images?: string[] },
  ) {
    console.log('生成菜谱 - 输入:', body.input)

    const result = await this.aiService.generateRecipe(body)

    return {
      code: 200,
      msg: 'success',
      data: result,
    }
  }
}
