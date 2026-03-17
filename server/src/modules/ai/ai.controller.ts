import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common'
import { AiService } from './ai.service'

@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  /**
   * 智能对话（烹饪营养万能助手）
   */
  @Post('chat')
  @HttpCode(HttpStatus.OK)
  async chat(@Body() body: { messages: Array<{ role: 'user' | 'assistant'; content: string }> }) {
    console.log('对话请求 - 消息数量:', body.messages?.length)

    if (!body.messages || body.messages.length === 0) {
      return {
        code: 400,
        msg: '消息不能为空',
        data: null,
      }
    }

    const result = await this.aiService.chat(body.messages)

    return {
      code: 200,
      msg: 'success',
      data: { reply: result },
    }
  }

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
