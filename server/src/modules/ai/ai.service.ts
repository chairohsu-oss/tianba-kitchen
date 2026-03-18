import { Injectable, OnModuleInit, Inject, forwardRef } from '@nestjs/common'
import { SearchClient, Config, LLMClient, HeaderUtils, APIError } from 'coze-coding-dev-sdk'
import { DishService, Dish } from '../dish/dish.service'
import { OrderService } from '../order/order.service'
import { UserService } from '../user/user.service'

@Injectable()
export class AiService implements OnModuleInit {
  private searchClient: SearchClient
  private llmClient: LLMClient

  constructor(
    @Inject(forwardRef(() => DishService))
    private readonly dishService: DishService,
    @Inject(forwardRef(() => OrderService))
    private readonly orderService: OrderService,
    @Inject(forwardRef(() => UserService))
    private readonly userService: UserService,
  ) {
    // 配置SDK
    const config = new Config()
    this.searchClient = new SearchClient(config)
    this.llmClient = new LLMClient(config)
  }

  onModuleInit() {
    console.log('LLM客户端初始化完成')
  }

  /**
   * 智能对话（烹饪营养万能助手）
   * 支持识别用户点菜意图，自动搜索菜品库
   */
  async chat(
    messages: Array<{ role: 'user' | 'assistant'; content: string; images?: string[] }>,
    headers?: Record<string, string>
  ): Promise<{ reply: string; recommendedDishes?: Dish[] }> {
    const systemPrompt = `你是"天霸私厨"的智能助手，一位专业的烹饪和营养顾问。

你的职责：
1. 回答用户关于烹饪、食材、营养的问题
2. 提供健康饮食建议
3. 推荐菜品搭配和制作方法
4. 解答食品安全和营养知识
5. 识别食材图片，给出烹饪建议
6. 当用户说想吃某道菜时，帮助确认菜品名称

你的特点：
- 专业但亲切，像一位经验丰富的家庭厨师
- 回答简洁实用，避免过于冗长
- 会主动提供实用的小贴士
- 关注健康和营养均衡

当用户说想吃某道菜时（如"我想吃红烧肉"、"来个宫保鸡丁"等），请在回复最后单独一行输出：
[菜品:菜名]

例如用户说"我想吃红烧肉"，你在回复中可以这样写：
好的，红烧肉是经典家常菜，肥而不腻，入口即化。我帮你在菜品库里找找看。
[菜品:红烧肉]

如果用户提到多道菜，可以用逗号分隔：
[菜品:红烧肉,清炒时蔬,番茄蛋汤]

如果没有提到具体菜品，就不需要输出这个标记。

请用自然的对话方式回复用户，不要使用Markdown格式，直接返回纯文本即可。`

    try {
      // 提取转发headers
      const customHeaders = headers ? HeaderUtils.extractForwardHeaders(headers) : undefined
      
      // 构建客户端实例
      const client = customHeaders ? new LLMClient(new Config(), customHeaders) : this.llmClient
      
      // 检查是否有图片
      const hasImages = messages.some(m => m.images && m.images.length > 0)
      
      // 构建消息列表
      const formattedMessages: Array<{
        role: 'system' | 'user' | 'assistant'
        content: string | Array<{ type: 'text'; text: string } | { type: 'image_url'; image_url: { url: string; detail?: 'high' | 'low' } }>
      }> = [
        { role: 'system', content: systemPrompt }
      ]
      
      for (const msg of messages) {
        if (msg.images && msg.images.length > 0) {
          // 多模态消息（包含图片）
          const content: Array<any> = [
            { type: 'text', text: msg.content || '请看这张图片' }
          ]
          
          // 添加图片
          for (const imageUrl of msg.images) {
            content.push({
              type: 'image_url',
              image_url: {
                url: imageUrl,
                detail: 'high' as const
              }
            })
          }
          
          formattedMessages.push({
            role: msg.role,
            content
          })
        } else {
          // 纯文本消息
          formattedMessages.push({
            role: msg.role,
            content: msg.content
          })
        }
      }

      console.log('发送消息到LLM，消息数:', formattedMessages.length, '包含图片:', hasImages)

      // 选择模型：如果有图片使用vision模型，否则使用默认模型
      const model = hasImages ? 'doubao-seed-1-6-vision-250815' : 'doubao-seed-1-8-251228'
      console.log('使用模型:', model)

      // 调用LLM
      const response = await client.invoke(formattedMessages, {
        model,
        temperature: 0.7,
      })

      console.log('LLM响应:', response.content.substring(0, 200) + '...')
      
      // 解析菜品标记
      let reply = response.content.trim()
      let recommendedDishes: Dish[] = []
      
      // 查找菜品标记 [菜品:xxx,yyy]
      const dishMatch = reply.match(/\[菜品:([^\]]+)\]/)
      if (dishMatch) {
        const dishNames = dishMatch[1].split(',').map(name => name.trim())
        console.log('识别到菜品名称:', dishNames)
        
        // 从菜品标记中移除，返回干净的回复
        reply = reply.replace(/\[菜品:[^\]]+\]/, '').trim()
        
        // 搜索菜品库
        const allDishes = await this.dishService.findAll({})
        for (const dishName of dishNames) {
          // 模糊匹配菜品名称
          const matched = allDishes.filter(d => 
            d.name.includes(dishName) || dishName.includes(d.name)
          )
          if (matched.length > 0) {
            recommendedDishes.push(...matched.slice(0, 1)) // 每个菜名最多匹配一个
          }
        }
        
        // 去重
        recommendedDishes = [...new Map(recommendedDishes.map(d => [d.id, d])).values()]
        
        console.log('找到匹配菜品:', recommendedDishes.length, '个')
      }
      
      return { reply, recommendedDishes }
    } catch (error) {
      if (error instanceof APIError) {
        console.error('LLM API错误:', error.message)
        console.error('状态码:', error.statusCode)
      } else {
        console.error('对话失败:', error)
      }
      return { reply: '抱歉，我暂时无法回复，请稍后再试。' }
    }
  }

  /**
   * 根据食材推荐菜品
   */
  async recommendDishes(ingredients: string): Promise<{
    meat: any[]
    vegetable: any[]
    soup: any[]
  }> {
    const prompt = `你是一位专业的家庭厨师。用户家里有以下食材：${ingredients}

请根据这些食材，推荐一日三餐的搭配，每天三道菜（一荤一素一汤）。
对于每种类型，提供3个选项供用户选择。

请以JSON格式返回，格式如下：
{
  "meat": [
    {"id": "m1", "name": "菜名", "image": "图片URL", "description": "简短描述"},
    ...
  ],
  "vegetable": [
    {"id": "v1", "name": "菜名", "image": "图片URL", "description": "简短描述"},
    ...
  ],
  "soup": [
    {"id": "s1", "name": "菜名", "image": "图片URL", "description": "简短描述"},
    ...
  ]
}

注意：
1. 推荐的菜品应该能够用用户提供的食材制作
2. 图片URL使用 https://picsum.photos/200?random= 格式
3. 描述要简洁，不超过20个字
4. 只返回JSON，不要其他内容`

    try {
      const response = await this.llmClient.invoke([
        { role: 'system', content: '你是一个JSON生成助手，只返回JSON格式的数据。' },
        { role: 'user', content: prompt }
      ], { temperature: 0.7 })

      // 解析JSON响应
      const jsonMatch = response.content.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0])
      }

      // 返回默认推荐
      return this.getDefaultRecommendations()
    } catch (error) {
      console.error('AI推荐失败:', error)
      return this.getDefaultRecommendations()
    }
  }

  /**
   * 搜索菜品制作方式
   */
  async searchCookingMethods(dishName: string): Promise<any> {
    try {
      // 使用web搜索获取制作方式
      const searchResult = await this.searchClient.webSearch(
        `${dishName}的做法 食材 步骤`,
        5,
        true,
      )

      // 使用AI整理搜索结果
      const summary = searchResult.summary || ''
      const webItems = searchResult.web_items || []

      // 让AI从搜索结果中提取结构化信息
      const prompt = `请根据以下搜索结果，整理出"${dishName}"的详细制作方式。

搜索结果摘要：${summary}

搜索详情：
${webItems.map((item, i) => `${i + 1}. ${item.title}: ${item.snippet}`).join('\n')}

请以JSON格式返回：
{
  "name": "菜名",
  "image": "图片URL（使用 https://picsum.photos/400?random）",
  "ingredients": ["食材1", "食材2"],
  "steps": ["步骤1", "步骤2"],
  "tips": "小贴士"
}`

      const response = await this.llmClient.invoke([
        { role: 'system', content: '你是一个JSON生成助手，只返回JSON格式的数据。' },
        { role: 'user', content: prompt }
      ], { temperature: 0.5 })

      const jsonMatch = response.content.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0])
      }

      return this.getDefaultCookingMethod(dishName)
    } catch (error) {
      console.error('搜索制作方式失败:', error)
      return this.getDefaultCookingMethod(dishName)
    }
  }

  /**
   * 批量获取菜品制作方式
   */
  async getCookingMethods(dishes: string[]): Promise<any[]> {
    const results = await Promise.all(dishes.map((name) => this.searchCookingMethods(name)))
    return results
  }

  /**
   * 生成菜谱（录入菜品时使用）
   */
  async generateRecipe(input: {
    name?: string
    input: string
    images?: string[]
  }): Promise<any> {
    const prompt = `请根据以下信息生成一份完整的菜谱：

${input.name ? `菜名：${input.name}` : '请根据食材推断菜名'}
输入内容：${input.input}

请以JSON格式返回：
{
  "name": "菜名",
  "ingredients": "食材列表（用顿号分隔）",
  "seasoning": "配料列表（用顿号分隔）",
  "steps": ["步骤1", "步骤2", ...],
  "tips": "烹饪小贴士",
  "calories": 估算热量（数字，单位千卡）,
  "protein": 蛋白质含量（数字，单位克）,
  "carbs": 碳水化合物含量（数字，单位克）,
  "fat": 脂肪含量（数字，单位克）,
  "description": "菜品描述"
}

只返回JSON，不要其他内容。`

    try {
      const response = await this.llmClient.invoke([
        { role: 'system', content: '你是一个JSON生成助手，只返回JSON格式的数据。' },
        { role: 'user', content: prompt }
      ], { temperature: 0.7 })

      console.log('生成菜谱响应:', response.content)

      const jsonMatch = response.content.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0])
      }

      return this.getDefaultRecipe(input.name || '未知菜品')
    } catch (error) {
      console.error('生成菜谱失败:', error)
      return this.getDefaultRecipe(input.name || '未知菜品')
    }
  }

  /**
   * AI生成菜品（录入菜品页面使用）
   * 根据用户输入的菜名、分类、补充说明，自动整理食材、配料、烹饪步骤，计算营养信息
   */
  async generateDish(input: {
    name: string
    category: string
    cuisine?: string
    userInputs: string
    images?: string[]
  }): Promise<any> {
    const categoryNames: Record<string, string> = {
      'chinese': '中餐',
      'breakfast': '早餐',
      'snack': '点心',
      'dessert': '甜点',
      'drink': '饮料',
      'western': '西餐',
      'japanese': '日餐',
      'korean': '韩餐',
      'southeast': '东南亚',
    }

    const cuisineNames: Record<string, string> = {
      'tianba': '天霸家自制',
      'jiangzhe': '江浙菜',
      'wenzhou': '温州菜',
      'yue': '粤菜',
      'dongbei': '东北菜',
      'hunan': '湖南菜',
      'yunnan': '云南菜',
      'other': '其它',
    }

    const categoryName = categoryNames[input.category] || input.category
    const cuisineName = input.cuisine ? (cuisineNames[input.cuisine] || input.cuisine) : ''

    const prompt = `你是一位专业的厨师和营养师。请根据以下信息，为这道菜品生成完整的菜谱和营养信息。

菜名：${input.name}
分类：${categoryName}${cuisineName ? `（${cuisineName}）` : ''}
用户补充说明：
${input.userInputs || '（用户未提供详细信息，请根据菜名推断）'}

请以JSON格式返回，格式如下：
{
  "ingredients": ["食材1（用量）", "食材2（用量）", ...],
  "seasoning": ["配料1（用量）", "配料2（用量）", ...],
  "steps": ["步骤1", "步骤2", "步骤3", ...],
  "tips": "烹饪小贴士，帮助用户做出更好的味道",
  "calories": 热量数值（整数，单位千卡）,
  "protein": 蛋白质含量（整数，单位克）,
  "carbs": 碳水化合物含量（整数，单位克）,
  "fat": 脂肪含量（整数，单位克）,
  "description": "菜品简短描述（不超过30字）"
}

要求：
1. ingredients 数组：列出主要食材，包含用量（如"五花肉 500克"）
2. seasoning 数组：列出配料调料，包含用量（如"生抽 2勺"）
3. steps 数组：清晰的烹饪步骤，每步一个元素
4. tips：实用的小贴士，帮助用户做得更好
5. 营养数据：根据食材和烹饪方式估算合理的数值
6. description：简短描述菜品特点

只返回JSON，不要有任何其他文字。`

    try {
      console.log('AI生成菜品请求:', { name: input.name, category: categoryName, cuisine: cuisineName })
      
      const response = await this.llmClient.invoke([
        { role: 'system', content: '你是一个专业的菜谱生成助手，只返回JSON格式的数据。' },
        { role: 'user', content: prompt }
      ], { temperature: 0.7 })

      console.log('AI生成菜品响应:', response.content.substring(0, 300))

      const jsonMatch = response.content.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const result = JSON.parse(jsonMatch[0])
        // 确保必要的字段存在
        return {
          ingredients: result.ingredients || [],
          seasoning: result.seasoning || [],
          steps: result.steps || [],
          tips: result.tips || '',
          calories: result.calories || 300,
          protein: result.protein || 15,
          carbs: result.carbs || 20,
          fat: result.fat || 10,
          description: result.description || `${input.name}，美味佳肴`,
        }
      }

      return this.getDefaultDishData(input.name)
    } catch (error) {
      console.error('AI生成菜品失败:', error)
      return this.getDefaultDishData(input.name)
    }
  }

  /**
   * 默认菜品数据
   */
  private getDefaultDishData(name: string) {
    return {
      ingredients: ['请补充食材'],
      seasoning: ['请补充配料'],
      steps: ['请补充烹饪步骤'],
      tips: '请补充烹饪小贴士',
      calories: 300,
      protein: 15,
      carbs: 20,
      fat: 10,
      description: `${name}，美味佳肴`,
    }
  }

  /**
   * 默认推荐
   */
  private getDefaultRecommendations() {
    return {
      meat: [
        { id: 'm1', name: '红烧肉', image: 'https://picsum.photos/200?random=1', description: '经典红烧肉，肥而不腻' },
        { id: 'm2', name: '糖醋排骨', image: 'https://picsum.photos/200?random=2', description: '酸甜可口，老少皆宜' },
        { id: 'm3', name: '宫保鸡丁', image: 'https://picsum.photos/200?random=3', description: '麻辣鲜香，下饭神器' },
      ],
      vegetable: [
        { id: 'v1', name: '清炒时蔬', image: 'https://picsum.photos/200?random=4', description: '清爽健康，营养均衡' },
        { id: 'v2', name: '蒜蓉西兰花', image: 'https://picsum.photos/200?random=5', description: '翠绿爽口，营养丰富' },
        { id: 'v3', name: '醋溜白菜', image: 'https://picsum.photos/200?random=6', description: '酸甜开胃，简单易做' },
      ],
      soup: [
        { id: 's1', name: '番茄蛋汤', image: 'https://picsum.photos/200?random=7', description: '酸甜可口，开胃暖身' },
        { id: 's2', name: '紫菜蛋花汤', image: 'https://picsum.photos/200?random=8', description: '清淡鲜美，制作简单' },
        { id: 's3', name: '冬瓜排骨汤', image: 'https://picsum.photos/200?random=9', description: '清甜滋润，养生佳品' },
      ],
    }
  }

  /**
   * 默认制作方式
   */
  private getDefaultCookingMethod(dishName: string) {
    return {
      name: dishName,
      image: `https://picsum.photos/400?random=${Date.now()}`,
      ingredients: ['食材1', '食材2', '食材3'],
      steps: ['准备食材', '热锅凉油', '翻炒均匀', '调味出锅'],
      tips: '请根据实际情况调整',
    }
  }

  /**
   * 默认菜谱
   */
  private getDefaultRecipe(name: string) {
    return {
      name,
      ingredients: '请补充食材',
      seasoning: '请补充配料',
      steps: ['请补充步骤'],
      tips: '请补充小贴士',
      calories: 300,
      protein: 15,
      carbs: 20,
      fat: 10,
      description: '请补充描述',
    }
  }
}
