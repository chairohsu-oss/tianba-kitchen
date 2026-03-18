import { Injectable, OnModuleInit } from '@nestjs/common'
import { S3Storage } from 'coze-coding-dev-sdk'
import { getSupabaseClient } from '@/storage/database/supabase-client'
import type { Dish } from '@/storage/database/shared/schema'

// 导出 Dish 类型供其他模块使用
export type { Dish }

@Injectable()
export class DishService implements OnModuleInit {
  private storage: S3Storage
  private client = getSupabaseClient()

  constructor() {
    this.storage = new S3Storage({
      endpointUrl: process.env.COZE_BUCKET_ENDPOINT_URL,
      accessKey: '',
      secretKey: '',
      bucketName: process.env.COZE_BUCKET_NAME,
      region: 'cn-beijing',
    })
  }

  async onModuleInit() {
    // 检查数据库是否有菜品，没有则初始化示例数据
    const { count } = await this.client
      .from('dishes')
      .select('*', { count: 'exact', head: true })

    if (count === 0) {
      console.log('初始化示例菜品数据...')
      await this.initSampleData()
    }
  }

  private async initSampleData() {
    const sampleDishes = [
      // ========== 中餐 - 天霸家自制 ==========
      {
        id: 'chinese-tianba-1',
        name: '秘制红烧肉',
        images: ['https://picsum.photos/400?random=101'],
        category: 'chinese',
        cuisine: 'tianba',
        calories: 520,
        protein: 32,
        carbs: 18,
        fat: 38,
        ingredients: ['五花肉 500g', '葱 2根', '姜 3片', '八角 2个'],
        seasoning: ['料酒 2勺', '生抽 3勺', '老抽 1勺', '冰糖 40g'],
        steps: ['五花肉切块焯水', '炒糖色', '放入肉块翻炒上色', '加调料炖煮1小时', '大火收汁'],
        tips: '选用三层五花肉，肥瘦相间口感最佳',
        description: '天霸家传秘方，肥而不腻，入口即化',
      },
      {
        id: 'chinese-tianba-2',
        name: '家传狮子头',
        images: ['https://picsum.photos/400?random=102'],
        category: 'chinese',
        cuisine: 'tianba',
        calories: 380,
        protein: 28,
        carbs: 12,
        fat: 25,
        ingredients: ['猪肉糜 400g', '马蹄 5个', '鸡蛋 1个', '青菜心 4棵'],
        seasoning: ['盐 适量', '料酒 1勺', '淀粉 2勺', '生抽 1勺'],
        steps: ['肉糜加调料搅打上劲', '马蹄切碎拌入', '捏成大肉丸', '小火慢炖30分钟', '加入青菜心'],
        tips: '肉丸要轻柔，炖煮时小火保持形状',
        description: '淮扬经典，肉丸松软，汤汁清鲜',
      },
      // ========== 中餐 - 江浙菜 ==========
      {
        id: 'chinese-jiangzhe-1',
        name: '西湖醋鱼',
        images: ['https://picsum.photos/400?random=103'],
        category: 'chinese',
        cuisine: 'jiangzhe',
        calories: 280,
        protein: 35,
        carbs: 8,
        fat: 12,
        ingredients: ['草鱼 1条', '葱 2根', '姜 3片'],
        seasoning: ['醋 3勺', '糖 2勺', '料酒 1勺', '生抽 1勺'],
        steps: ['草鱼处理干净', '水煮葱姜', '鱼入锅煮熟', '调糖醋汁', '浇汁上桌'],
        tips: '鱼肉要嫩，汁要酸甜适中',
        description: '杭州名菜，酸甜可口，鱼肉鲜嫩',
      },
      {
        id: 'chinese-jiangzhe-2',
        name: '东坡肉',
        images: ['https://picsum.photos/400?random=104'],
        category: 'chinese',
        cuisine: 'jiangzhe',
        calories: 580,
        protein: 38,
        carbs: 15,
        fat: 42,
        ingredients: ['五花肉 600g', '葱 3根', '姜 4片', '绍兴黄酒 300ml'],
        seasoning: ['生抽 2勺', '老抽 1勺', '冰糖 50g'],
        steps: ['五花肉切块焯水', '砂锅铺葱姜', '肉皮朝下码放', '加黄酒和调料', '小火炖2小时'],
        tips: '必须用绍兴黄酒，小火慢炖',
        description: '宋代名菜，色泽红亮，酥烂入味',
      },
      // ========== 中餐 - 温州菜 ==========
      {
        id: 'chinese-wenzhou-1',
        name: '温州鱼丸汤',
        images: ['https://picsum.photos/400?random=105'],
        category: 'chinese',
        cuisine: 'wenzhou',
        calories: 220,
        protein: 28,
        carbs: 10,
        fat: 8,
        ingredients: ['鮸鱼肉 300g', '蛋清 1个', '葱花 适量'],
        seasoning: ['盐 适量', '料酒 1勺', '胡椒粉 少许'],
        steps: ['鱼肉刮成鱼茸', '加调料搅打上劲', '挤成鱼丸入温水', '煮熟后加葱花'],
        tips: '鱼肉要新鲜，搅打要充分',
        description: '温州特色，鱼丸Q弹，汤鲜味美',
      },
      {
        id: 'chinese-wenzhou-2',
        name: '灯盏糕',
        images: ['https://picsum.photos/400?random=106'],
        category: 'chinese',
        cuisine: 'wenzhou',
        calories: 350,
        protein: 12,
        carbs: 38,
        fat: 18,
        ingredients: ['米粉 200g', '萝卜丝 100g', '肉末 50g', '鸡蛋 2个'],
        seasoning: ['盐 适量', '五香粉 少许'],
        steps: ['米粉调成浆', '萝卜丝加盐腌制', '油温烧至七成热', '倒入米浆加馅料', '炸至金黄'],
        tips: '油温要适中，炸至外酥里嫩',
        description: '温州传统小吃，外酥里嫩，咸香可口',
      },
      // ========== 中餐 - 粤菜 ==========
      {
        id: 'chinese-yue-1',
        name: '白切鸡',
        images: ['https://picsum.photos/400?random=107'],
        category: 'chinese',
        cuisine: 'yue',
        calories: 320,
        protein: 42,
        carbs: 5,
        fat: 15,
        ingredients: ['三黄鸡 1只', '葱 3根', '姜 4片'],
        seasoning: ['姜葱蓉 适量', '生抽 2勺', '花生油 适量'],
        steps: ['鸡处理干净', '水烧开放入葱姜', '提鸡三浸三提', '小火煮15分钟', '冰水浸泡'],
        tips: '三浸三提让皮更爽滑',
        description: '粤菜经典，皮爽肉滑，原汁原味',
      },
      {
        id: 'chinese-yue-2',
        name: '蒜蓉粉丝蒸扇贝',
        images: ['https://picsum.photos/400?random=108'],
        category: 'chinese',
        cuisine: 'yue',
        calories: 180,
        protein: 18,
        carbs: 15,
        fat: 6,
        ingredients: ['扇贝 6只', '粉丝 50g', '蒜 5瓣', '葱 1根'],
        seasoning: ['生抽 1勺', '蒸鱼豉油 适量'],
        steps: ['粉丝泡软', '蒜蓉爆香', '扇贝铺粉丝', '浇蒜蓉', '蒸5分钟'],
        tips: '蒜蓉要炒出香味',
        description: '粤式海鲜，鲜嫩多汁，蒜香浓郁',
      },
      // ========== 中餐 - 东北菜 ==========
      {
        id: 'chinese-dongbei-1',
        name: '锅包肉',
        images: ['https://picsum.photos/400?random=109'],
        category: 'chinese',
        cuisine: 'dongbei',
        calories: 480,
        protein: 28,
        carbs: 35,
        fat: 26,
        ingredients: ['里脊肉 300g', '淀粉 100g', '胡萝卜丝 适量'],
        seasoning: ['醋 3勺', '糖 2勺', '生抽 1勺'],
        steps: ['肉切片裹淀粉', '油炸至金黄', '调糖醋汁', '快炒裹汁出锅'],
        tips: '炸肉要复炸，糖醋汁要快炒',
        description: '东北名菜，外酥里嫩，酸甜可口',
      },
      {
        id: 'chinese-dongbei-2',
        name: '小鸡炖蘑菇',
        images: ['https://picsum.photos/400?random=110'],
        category: 'chinese',
        cuisine: 'dongbei',
        calories: 420,
        protein: 38,
        carbs: 18,
        fat: 22,
        ingredients: ['土鸡 1只', '榛蘑 100g', '粉条 100g'],
        seasoning: ['料酒 2勺', '生抽 2勺', '盐 适量'],
        steps: ['鸡块焯水', '榛蘑泡发', '炖煮鸡肉40分钟', '加蘑菇粉条', '继续炖20分钟'],
        tips: '榛蘑是灵魂，土鸡更香',
        description: '东北炖菜代表，鲜香浓郁',
      },
      // ========== 中餐 - 湖南菜 ==========
      {
        id: 'chinese-hunan-1',
        name: '剁椒鱼头',
        images: ['https://picsum.photos/400?random=111'],
        category: 'chinese',
        cuisine: 'hunan',
        calories: 350,
        protein: 45,
        carbs: 12,
        fat: 15,
        ingredients: ['胖头鱼头 1个', '剁椒 100g', '葱 2根', '蒜 4瓣'],
        seasoning: ['蒸鱼豉油 适量', '料酒 1勺'],
        steps: ['鱼头处理干净剖开', '铺剁椒', '蒸10分钟', '浇热油'],
        tips: '剁椒要铺满，蒸好浇热油更香',
        description: '湘菜代表，鲜辣开胃，鱼肉嫩滑',
      },
      {
        id: 'chinese-hunan-2',
        name: '辣椒炒肉',
        images: ['https://picsum.photos/400?random=112'],
        category: 'chinese',
        cuisine: 'hunan',
        calories: 380,
        protein: 32,
        carbs: 8,
        fat: 25,
        ingredients: ['五花肉 200g', '青椒 4个', '蒜 3瓣'],
        seasoning: ['生抽 1勺', '豆豉 适量', '盐 适量'],
        steps: ['五花肉煸炒出油', '加蒜和豆豉', '放青椒翻炒', '调味出锅'],
        tips: '青椒要选辣的，肉要煸出油',
        description: '湖南家常菜，香辣下饭',
      },
      // ========== 中餐 - 云南菜 ==========
      {
        id: 'chinese-yunnan-1',
        name: '过桥米线',
        images: ['https://picsum.photos/400?random=113'],
        category: 'chinese',
        cuisine: 'yunnan',
        calories: 420,
        protein: 28,
        carbs: 52,
        fat: 12,
        ingredients: ['米线 200g', '鸡肉片 50g', '鹌鹑蛋 2个', '豆皮 适量', '韭菜 适量'],
        seasoning: ['鸡汤 适量', '盐 适量'],
        steps: ['熬制鸡汤', '碗中放入配料', '滚烫鸡汤倒入', '放入米线'],
        tips: '汤要滚烫，配料分开下',
        description: '云南名吃，汤鲜料足，米线爽滑',
      },
      {
        id: 'chinese-yunnan-2',
        name: '汽锅鸡',
        images: ['https://picsum.photos/400?random=114'],
        category: 'chinese',
        cuisine: 'yunnan',
        calories: 280,
        protein: 35,
        carbs: 8,
        fat: 12,
        ingredients: ['土鸡 500g', '姜片 适量', '枸杞 适量'],
        seasoning: ['盐 适量', '料酒 1勺'],
        steps: ['鸡块放入汽锅', '加调料', '蒸2小时', '汤成出锅'],
        tips: '汽锅蒸制，原汁原味',
        description: '云南特色，汤清味鲜，营养丰富',
      },
      // ========== 中餐 - 其它 ==========
      {
        id: 'chinese-other-1',
        name: '宫保鸡丁',
        images: ['https://picsum.photos/400?random=115'],
        category: 'chinese',
        cuisine: 'other',
        calories: 320,
        protein: 28,
        carbs: 15,
        fat: 18,
        ingredients: ['鸡胸肉 300g', '花生米 50g', '干辣椒 适量', '葱 1根'],
        seasoning: ['醋 1勺', '糖 1勺', '生抽 1勺', '花椒 适量'],
        steps: ['鸡肉切丁上浆', '炸花生米', '炒鸡丁', '加调料和花生', '快速翻炒'],
        tips: '花生米要最后放保持酥脆',
        description: '经典川菜，麻辣酸甜，花生酥脆',
      },
      {
        id: 'chinese-other-2',
        name: '麻婆豆腐',
        images: ['https://picsum.photos/400?random=116'],
        category: 'chinese',
        cuisine: 'other',
        calories: 260,
        protein: 18,
        carbs: 12,
        fat: 16,
        ingredients: ['嫩豆腐 400g', '肉末 50g', '蒜苗 适量'],
        seasoning: ['豆瓣酱 1勺', '花椒粉 适量', '辣椒粉 适量'],
        steps: ['豆腐切块焯水', '炒肉末和豆瓣酱', '加豆腐炖煮', '勾芡撒花椒粉'],
        tips: '豆腐要嫩，花椒粉要香',
        description: '川菜经典，麻辣鲜香，嫩滑入味',
      },
      // ========== 早餐 ==========
      {
        id: 'breakfast-1',
        name: '葱油拌面',
        images: ['https://picsum.photos/400?random=201'],
        category: 'breakfast',
        calories: 380,
        protein: 12,
        carbs: 58,
        fat: 14,
        ingredients: ['面条 200g', '小葱 5根'],
        seasoning: ['生抽 2勺', '老抽 1勺', '糖 少许'],
        steps: ['煮面条', '熬葱油', '调酱汁', '拌匀'],
        tips: '葱要炸到焦香',
        description: '上海经典早餐，葱香四溢',
      },
      {
        id: 'breakfast-2',
        name: '豆浆油条',
        images: ['https://picsum.photos/400?random=202'],
        category: 'breakfast',
        calories: 420,
        protein: 15,
        carbs: 48,
        fat: 20,
        ingredients: ['黄豆 100g', '面粉 200g', '鸡蛋 1个'],
        seasoning: ['糖 适量'],
        steps: ['黄豆泡发打浆', '面粉加鸡蛋和面', '发酵后切条', '油炸至金黄'],
        tips: '油条要现炸现吃',
        description: '经典中式早餐，营养搭配',
      },
      // ========== 点心 ==========
      {
        id: 'snack-1',
        name: '小笼包',
        images: ['https://picsum.photos/400?random=301'],
        category: 'snack',
        calories: 280,
        protein: 18,
        carbs: 32,
        fat: 10,
        ingredients: ['面粉 200g', '猪肉糜 200g', '皮冻 100g'],
        seasoning: ['生抽 1勺', '姜汁 适量', '盐 适量'],
        steps: ['和面擀皮', '肉馅加皮冻', '包成小笼', '蒸8分钟'],
        tips: '皮冻是汤汁的关键',
        description: '江南名点，皮薄馅大，汤汁鲜美',
      },
      {
        id: 'snack-2',
        name: '煎饺',
        images: ['https://picsum.photos/400?random=302'],
        category: 'snack',
        calories: 320,
        protein: 15,
        carbs: 38,
        fat: 14,
        ingredients: ['饺子皮 10张', '韭菜 100g', '鸡蛋 2个'],
        seasoning: ['盐 适量', '香油 少许'],
        steps: ['调韭菜鸡蛋馅', '包饺子', '煎至底部金黄', '加水焖熟'],
        tips: '煎时要小火慢煎',
        description: '香脆可口，底部焦脆',
      },
      // ========== 甜点 ==========
      {
        id: 'dessert-1',
        name: '杨枝甘露',
        images: ['https://picsum.photos/400?random=401'],
        category: 'dessert',
        calories: 220,
        protein: 4,
        carbs: 42,
        fat: 5,
        ingredients: ['芒果 1个', '西米 30g', '椰浆 100ml', '柚子 适量'],
        seasoning: ['糖 适量'],
        steps: ['西米煮熟过冷水', '芒果打泥', '混合椰浆和西米', '加芒果粒和柚子'],
        tips: '西米要煮透，过冷水更Q',
        description: '港式甜品，芒果香甜，椰香浓郁',
      },
      {
        id: 'dessert-2',
        name: '双皮奶',
        images: ['https://picsum.photos/400?random=402'],
        category: 'dessert',
        calories: 180,
        protein: 8,
        carbs: 25,
        fat: 6,
        ingredients: ['牛奶 250ml', '蛋清 2个'],
        seasoning: ['糖 20g'],
        steps: ['牛奶煮出奶皮', '倒出牛奶与蛋清混合', '倒回碗中蒸制', '冷却后食用'],
        tips: '奶皮要完整，蒸制要小火',
        description: '顺德名点，奶香浓郁，口感嫩滑',
      },
      // ========== 饮料 ==========
      {
        id: 'drink-1',
        name: '珍珠奶茶',
        images: ['https://picsum.photos/400?random=501'],
        category: 'drink',
        calories: 280,
        protein: 3,
        carbs: 52,
        fat: 8,
        ingredients: ['红茶 5g', '牛奶 150ml', '珍珠 50g'],
        seasoning: ['糖 适量'],
        steps: ['煮珍珠', '泡红茶', '加牛奶和糖', '加入珍珠'],
        tips: '珍珠要现煮现用',
        description: '台式饮品，珍珠Q弹，茶香奶香',
      },
      {
        id: 'drink-2',
        name: '杨梅汁',
        images: ['https://picsum.photos/400?random=502'],
        category: 'drink',
        calories: 120,
        protein: 1,
        carbs: 28,
        fat: 0,
        ingredients: ['杨梅 200g', '冰糖 适量'],
        seasoning: ['盐 少许'],
        steps: ['杨梅洗净', '加盐水浸泡', '加冰糖煮制', '过滤取汁'],
        tips: '杨梅要新鲜，加盐可提鲜',
        description: '夏日饮品，酸甜解暑',
      },
      // ========== 西餐 ==========
      {
        id: 'western-1',
        name: '意式肉酱面',
        images: ['https://picsum.photos/400?random=601'],
        category: 'western',
        calories: 520,
        protein: 22,
        carbs: 68,
        fat: 18,
        ingredients: ['意面 150g', '牛肉末 100g', '番茄 2个', '洋葱 半个'],
        seasoning: ['番茄酱 2勺', '黑胡椒 适量', '橄榄油 适量'],
        steps: ['煮意面', '炒洋葱和牛肉', '加番茄煮酱', '与意面拌匀'],
        tips: '意面要煮到弹牙',
        description: '经典西餐，肉酱浓郁，面条爽滑',
      },
      {
        id: 'western-2',
        name: '牛排配薯条',
        images: ['https://picsum.photos/400?random=602'],
        category: 'western',
        calories: 680,
        protein: 48,
        carbs: 42,
        fat: 35,
        ingredients: ['牛排 200g', '土豆 2个', '西兰花 适量'],
        seasoning: ['黑胡椒 适量', '盐 适量', '黄油 20g'],
        steps: ['土豆切条炸制', '牛排煎至喜欢的熟度', '西兰花焯水', '摆盘浇黄油'],
        tips: '牛排要室温后再煎',
        description: '西式主菜，牛排鲜嫩，薯条酥脆',
      },
      // ========== 日餐 ==========
      {
        id: 'japanese-1',
        name: '寿司拼盘',
        images: ['https://picsum.photos/400?random=701'],
        category: 'japanese',
        calories: 380,
        protein: 25,
        carbs: 52,
        fat: 8,
        ingredients: ['寿司米 150g', '三文鱼 100g', '金枪鱼 50g', '海苔 适量'],
        seasoning: ['寿司醋 适量', '芥末 适量', '酱油 适量'],
        steps: ['米饭加寿司醋', '鱼片切好', '捏制寿司', '配芥末酱油'],
        tips: '米饭要微温时捏制',
        description: '日式料理，新鲜美味，精致美观',
      },
      {
        id: 'japanese-2',
        name: '日式拉面',
        images: ['https://picsum.photos/400?random=702'],
        category: 'japanese',
        calories: 480,
        protein: 28,
        carbs: 58,
        fat: 16,
        ingredients: ['拉面 150g', '叉烧 3片', '鸡蛋 1个', '葱花 适量'],
        seasoning: ['酱油 适量', '豚骨汤底 适量'],
        steps: ['煮拉面', '准备叉烧和溏心蛋', '盛入豚骨汤', '摆上配料'],
        tips: '溏心蛋是灵魂',
        description: '日本国民美食，汤浓面弹',
      },
      // ========== 韩餐 ==========
      {
        id: 'korean-1',
        name: '韩式烤肉',
        images: ['https://picsum.photos/400?random=801'],
        category: 'korean',
        calories: 520,
        protein: 42,
        carbs: 15,
        fat: 32,
        ingredients: ['五花肉 300g', '生菜 适量', '大蒜 适量', '韩式辣酱 适量'],
        seasoning: ['盐 适量', '黑胡椒 适量'],
        steps: ['五花肉切片', '烤盘烤至金黄', '生菜包肉', '加大蒜和辣酱'],
        tips: '五花肉要烤出油才香',
        description: '韩国美食，肉香四溢，包生菜解腻',
      },
      {
        id: 'korean-2',
        name: '石锅拌饭',
        images: ['https://picsum.photos/400?random=802'],
        category: 'korean',
        calories: 450,
        protein: 22,
        carbs: 58,
        fat: 14,
        ingredients: ['米饭 1碗', '牛肉末 50g', '鸡蛋 1个', '胡萝卜丝 适量', '豆芽 适量'],
        seasoning: ['韩式辣酱 2勺', '香油 适量'],
        steps: ['准备各种蔬菜', '牛肉炒熟', '石锅抹油放米饭', '摆菜加蛋', '加热到底部焦脆'],
        tips: '石锅要热到底部有锅巴',
        description: '韩式经典，营养均衡，底部锅巴香脆',
      },
      // ========== 东南亚 ==========
      {
        id: 'southeast-1',
        name: '泰式冬阴功汤',
        images: ['https://picsum.photos/400?random=901'],
        category: 'southeast',
        calories: 180,
        protein: 18,
        carbs: 12,
        fat: 8,
        ingredients: ['大虾 4只', '蘑菇 100g', '柠檬叶 3片', '香茅 1根'],
        seasoning: ['冬阴功酱 2勺', '椰浆 50ml', '鱼露 适量', '柠檬汁 适量'],
        steps: ['香茅柠檬叶煮汤底', '加冬阴功酱', '放入虾和蘑菇', '加椰浆和调料'],
        tips: '最后加柠檬汁保持酸味',
        description: '泰国名汤，酸辣开胃，椰香浓郁',
      },
      {
        id: 'southeast-2',
        name: '越南河粉',
        images: ['https://picsum.photos/400?random=902'],
        category: 'southeast',
        calories: 380,
        protein: 28,
        carbs: 48,
        fat: 8,
        ingredients: ['河粉 150g', '牛肉片 100g', '豆芽 适量', '九层塔 适量'],
        seasoning: ['鱼露 适量', '柠檬 适量', '辣椒 适量'],
        steps: ['熬制牛骨汤', '河粉烫熟', '放入牛肉片', '加配料和调料'],
        tips: '牛肉要薄，汤要滚烫',
        description: '越南国民美食，汤清味鲜',
      },
    ]

    const { error } = await this.client
      .from('dishes')
      .insert(sampleDishes)

    if (error) {
      console.error('初始化示例数据失败:', error)
    } else {
      console.log('示例菜品数据初始化完成，共', sampleDishes.length, '道菜')
    }
  }

  async findAll(query: {
    category?: string
    cuisine?: string
    name?: string
  }): Promise<Dish[]> {
    let queryBuilder = this.client
      .from('dishes')
      .select('*')

    if (query.category) {
      queryBuilder = queryBuilder.eq('category', query.category)
    }

    if (query.cuisine) {
      queryBuilder = queryBuilder.eq('cuisine', query.cuisine)
    }

    if (query.name) {
      queryBuilder = queryBuilder.ilike('name', `%${query.name}%`)
    }

    const { data, error } = await queryBuilder.order('created_at', { ascending: false })

    if (error) {
      console.error('查询菜品失败:', error)
      return []
    }

    return data || []
  }

  async findOne(id: string): Promise<Dish | null> {
    const { data, error } = await this.client
      .from('dishes')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      return null
    }

    return data
  }

  async create(data: Partial<Dish>): Promise<Dish> {
    const dish = {
      id: data.id || Date.now().toString(),
      name: data.name || '',
      images: data.images || [],
      category: data.category || 'chinese',
      cuisine: data.cuisine,
      calories: data.calories || 0,
      protein: data.protein || 0,
      carbs: data.carbs || 0,
      fat: data.fat || 0,
      ingredients: data.ingredients || [],
      seasoning: data.seasoning || [],
      steps: data.steps || [],
      tips: data.tips || '',
      description: data.description || '',
    }

    const { data: result, error } = await this.client
      .from('dishes')
      .insert(dish)
      .select()
      .single()

    if (error) {
      console.error('创建菜品失败:', error)
      throw new Error('创建菜品失败')
    }

    return result
  }

  async update(id: string, data: Partial<Dish>): Promise<Dish | null> {
    const { data: result, error } = await this.client
      .from('dishes')
      .update({
        ...data,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return null
    }

    return result
  }

  async remove(id: string): Promise<boolean> {
    const { error } = await this.client
      .from('dishes')
      .delete()
      .eq('id', id)

    return !error
  }

  async uploadImage(file: Express.Multer.File): Promise<string> {
    const key = await this.storage.uploadFile({
      fileContent: file.buffer,
      fileName: `dishes/${Date.now()}_${file.originalname}`,
      contentType: file.mimetype,
    })

    const url = await this.storage.generatePresignedUrl({
      key,
      expireTime: 86400 * 30, // 30天
    })

    return url
  }
}
