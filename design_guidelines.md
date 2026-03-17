# 天霸家厨房 - 设计指南

## 品牌定位

**应用名称**：天霸家厨房  
**核心价值**：家庭智慧烹饪助手，让每一餐都有温度  
**设计风格**：温馨现代风 - 结合家的温暖感与现代简约美学  
**目标用户**：注重家庭饮食健康的都市家庭，追求便捷与品质的烹饪爱好者  

## 配色方案

### 主色板
| 用途 | 色值 | Tailwind 类名 | 意象来源 |
|------|------|---------------|----------|
| 主色-温暖橙 | #FF6B35 | `bg-orange-500` | 厨房炉火的温度 |
| 主色-浅橙 | #FFF4ED | `bg-orange-50` | 晨光洒在餐桌 |
| 辅色-清新绿 | #22C55E | `bg-green-500` | 新鲜蔬菜的生命力 |
| 辅色-浅绿 | #F0FDF4 | `bg-green-50` | 清爽的沙拉盘 |

### 中性色
| 用途 | 色值 | Tailwind 类名 |
|------|------|---------------|
| 深色文字 | #1F2937 | `text-gray-800` |
| 次级文字 | #6B7280 | `text-gray-500` |
| 辅助文字 | #9CA3AF | `text-gray-400` |
| 边框/分割 | #E5E7EB | `border-gray-200` |
| 背景色 | #F9FAFB | `bg-gray-50` |
| 卡片背景 | #FFFFFF | `bg-white` |

### 语义色
| 用途 | 色值 | Tailwind 类名 |
|------|------|---------------|
| 成功 | #10B981 | `text-emerald-500` |
| 警告 | #F59E0B | `text-amber-500` |
| 错误 | #EF4444 | `text-red-500` |
| 信息 | #3B82F6 | `text-blue-500` |

## 字体规范

| 层级 | 字号 | 字重 | Tailwind 类名 | 用途 |
|------|------|------|---------------|------|
| H1 | 24px | Bold | `text-2xl font-bold` | 页面标题 |
| H2 | 20px | Semibold | `text-xl font-semibold` | 区块标题 |
| H3 | 18px | Semibold | `text-lg font-semibold` | 卡片标题 |
| Body | 14px | Regular | `text-base` | 正文内容 |
| Caption | 12px | Regular | `text-sm` | 辅助说明 |
| Small | 11px | Regular | `text-xs` | 标签、时间 |

## 间距系统

| 名称 | 数值 | Tailwind 类名 | 用途 |
|------|------|---------------|------|
| 页面边距 | 16px | `px-4` | 页面左右边距 |
| 卡片内边距 | 16px | `p-4` | 卡片内部间距 |
| 组件间距 | 12px | `gap-3` | 列表项、组件间隙 |
| 紧凑间距 | 8px | `gap-2` | 紧密排列元素 |
| 宽松间距 | 24px | `gap-6` | 区块分隔 |

## 组件规范

### 主按钮
```tsx
<View className="bg-orange-500 rounded-full py-3 px-6 flex items-center justify-center">
  <Text className="text-white font-semibold">确认推荐</Text>
</View>
```

### 次按钮
```tsx
<View className="bg-white border border-gray-200 rounded-full py-3 px-6 flex items-center justify-center">
  <Text className="text-gray-700 font-medium">取消</Text>
</View>
```

### 卡片
```tsx
<View className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
  {/* 卡片内容 */}
</View>
```

### 商品卡片（双列）
```tsx
<View className="bg-white rounded-xl overflow-hidden shadow-sm">
  <Image className="w-full h-32" mode="aspectFill" />
  <View className="p-3">
    <Text className="block text-base font-medium text-gray-800 truncate">菜名</Text>
    <Text className="block text-sm text-gray-400 mt-1">分类</Text>
  </View>
</View>
```

### 分类导航项
```tsx
// 选中态
<View className="bg-orange-50 border-l-2 border-orange-500 px-4 py-3">
  <Text className="text-orange-500 font-medium">中餐</Text>
</View>
// 未选中态
<View className="bg-white px-4 py-3">
  <Text className="text-gray-600">西餐</Text>
</View>
```

### 输入框
```tsx
<View className="bg-gray-50 rounded-xl px-4 py-3 border border-gray-100">
  <Input className="w-full bg-transparent text-base" placeholder="请输入" />
</View>
```

### 空状态
```tsx
<View className="flex flex-col items-center justify-center py-16">
  <Text className="text-4xl mb-4">🍽️</Text>
  <Text className="block text-gray-500 text-center">暂无菜品数据</Text>
</View>
```

## 导航结构

### TabBar 配置
| 页面 | 路径 | 图标 | 文字 |
|------|------|------|------|
| 首页 | pages/home/index | Sparkles | 智能推荐 |
| 菜品库 | pages/dishes/index | UtensilsCrossed | 菜品库 |
| 录入 | pages/add/index | PlusCircle | 录入菜品 |

### 页面跳转规范
- TabBar 页面切换：使用 `Taro.switchTab()`
- 详情页跳转：使用 `Taro.navigateTo()`
- 返回上一页：使用 `Taro.navigateBack()`

## 小程序约束

### 包体积优化
- 主包体积控制在 1.5MB 以内
- 图片使用 WebP 格式，单张不超过 100KB
- 首页关键资源内联，非关键资源按需加载

### 图片策略
- 商品图片：上传至对象存储，使用 CDN 加速
- TabBar 图标：本地 PNG，尺寸 81x81px
- 占位图：使用纯色背景 + 图标代替

### 性能优化
- 列表使用虚拟滚动（超过 50 项）
- 图片开启懒加载 `lazyLoad`
- 避免深层嵌套，控制在 10 层以内

## 菜品分类结构

### 一级分类（大类型）
中餐、早餐、点心、甜点、饮料、西餐、日餐、韩餐、东南亚

### 中餐二级分类（地方菜系）
天霸家自制、江浙菜、温州菜、粤菜、东北菜、湖南菜、云南菜、其它

## 交互规范

### 语音输入
- 点击麦克风按钮开始录音
- 录音时显示波形动画
- 松开按钮自动识别转文字
- 支持切换为键盘输入

### 推荐交互
- 展示三道菜推荐（一荤一素一汤）
- 每种类型展示 3 个选项供选择
- 选中后高亮显示
- 全部选择完成后展示详细制作方式

### 商品录入
- 图片上传支持拍照和相册
- 最多上传 3 张图片
- AI 自动识别食材生成菜谱
- 支持手动编辑调整
