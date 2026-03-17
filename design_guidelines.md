# 天霸家厨房 - 设计指南

## 品牌定位

**应用名称**：天霸家厨房  
**核心价值**：家庭智慧烹饪助手，让每一餐都有温度  
**设计风格**：现代对话式UI - 参考豆包APP的对话框交互风格  
**目标用户**：注重家庭饮食健康的都市家庭，追求便捷与品质的烹饪爱好者  

## 配色方案

### 主色板
| 用途 | 色值 | Tailwind 类名 | 意象来源 |
|------|------|---------------|----------|
| 主色-紫蓝 | #6366F1 | `bg-indigo-500` | 智慧与科技的融合 |
| 主色-浅紫 | #EEF2FF | `bg-indigo-50` | 柔和的科技感 |
| 辅色-天蓝 | #3B82F6 | `bg-blue-500` | 清新与信任 |
| 辅色-浅蓝 | #EFF6FF | `bg-blue-50` | 清爽的交互反馈 |

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
| 错误 | #6366F1 | `text-indigo-500` |
| 信息 | #3B82F6 | `text-blue-500` |

### 对话框配色
| 用途 | 色值 | Tailwind 类名 |
|------|------|---------------|
| 用户消息气泡 | #6366F1 | `bg-indigo-500` |
| AI回复气泡 | #F3F4F6 | `bg-gray-100` |
| 输入框背景 | #F9FAFB | `bg-gray-50` |
| 录音按钮激活 | #6366F1 | `bg-indigo-500` |
| 录音按钮默认 | #EEF2FF | `bg-indigo-50` |

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
<View className="bg-indigo-500 rounded-full py-3 px-6 flex items-center justify-center">
  <Text className="text-white font-semibold">确认推荐</Text>
</View>
```

### 次按钮
```tsx
<View className="bg-white border border-gray-200 rounded-full py-3 px-6 flex items-center justify-center">
  <Text className="text-gray-700 font-medium">取消</Text>
</View>
```

### 底部输入框（豆包风格）
```tsx
<View className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-3" style={{ paddingBottom: 50 }}>
  <View className="flex flex-row items-center gap-2">
    {/* 语音按钮 */}
    <View className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center flex-shrink-0">
      <Mic size={20} color="#6366F1" />
    </View>
    {/* 输入框 */}
    <View className="flex-1 bg-gray-50 rounded-full px-4 py-2 min-h-[40px] flex items-center">
      <Text className="text-gray-400 text-sm">按住说话</Text>
    </View>
    {/* 键盘切换按钮 */}
    <View className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
      <Keyboard size={20} color="#6B7280" />
    </View>
  </View>
</View>
```

### 用户消息气泡
```tsx
<View className="flex flex-row justify-end mb-3">
  <View className="bg-indigo-500 rounded-2xl rounded-br-md px-4 py-3 max-w-[80%]">
    <Text className="text-white text-sm">{message}</Text>
  </View>
</View>
```

### AI回复气泡
```tsx
<View className="flex flex-row justify-start mb-3">
  <View className="bg-gray-100 rounded-2xl rounded-bl-md px-4 py-3 max-w-[80%]">
    <Text className="text-gray-800 text-sm">{message}</Text>
  </View>
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
<View className="bg-indigo-50 border-l-2 border-indigo-500 px-4 py-3">
  <Text className="text-indigo-500 font-medium">中餐</Text>
</View>
// 未选中态
<View className="bg-white px-4 py-3">
  <Text className="text-gray-600">西餐</Text>
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

## 对话式交互规范

### 底部输入框
- 固定在底部 TabBar 上方
- 左侧：语音按钮（默认激活）
- 中间：输入区域（显示当前模式提示）
- 右侧：键盘/语音切换按钮

### 语音输入模式
- 点击左侧语音按钮或输入区域开始录音
- 录音时按钮变为激活状态（深色背景）
- 松开后自动识别并转换为文字
- 识别结果显示在上方聊天气泡中

### 键盘输入模式
- 点击右侧切换按钮进入键盘模式
- 输入框变为可编辑状态
- 输入完成后点击发送按钮提交

### 消息显示
- 用户消息显示在右侧（紫色气泡）
- AI回复显示在左侧（灰色气泡）
- 消息从底部向上滚动显示

## 菜品分类结构

### 一级分类（大类型）
中餐、早餐、点心、甜点、饮料、西餐、日餐、韩餐、东南亚

### 中餐二级分类（地方菜系）
天霸家自制、江浙菜、温州菜、粤菜、东北菜、湖南菜、云南菜、其它

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

## 交互规范

### 推荐交互
- 展示三道菜推荐（一荤一素一汤）
- 每种类型展示 3 个选项供选择
- 选中后高亮显示（紫色边框）
- 全部选择完成后展示详细制作方式

### 商品录入
- 图片上传支持拍照和相册
- 最多上传 3 张图片
- AI 自动识别食材生成菜谱
- 支持手动编辑调整
