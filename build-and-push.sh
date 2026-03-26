#!/bin/bash
# 天霸私厨 - 阿里云镜像构建和推送脚本

echo "========================================="
echo "天霸私厨 - 构建和推送 Docker 镜像"
echo "========================================="

# 镜像地址
IMAGE_REGISTRY="crpi-muupe9p5oo5yd9hz.cn-shanghai.personal.cr.aliyuncs.com"
IMAGE_NAME="tianba-kitchen/tianba-kitchen"
IMAGE_TAG="latest"
FULL_IMAGE="${IMAGE_REGISTRY}/${IMAGE_NAME}:${IMAGE_TAG}"

echo ""
echo "📦 镜像地址: ${FULL_IMAGE}"
echo ""

# 进入 server 目录
cd server

echo "🔨 步骤 1/3: 构建 Docker 镜像..."
docker build -t ${FULL_IMAGE} .

if [ $? -ne 0 ]; then
    echo "❌ 构建失败！"
    exit 1
fi

echo "✅ 构建成功！"
echo ""

echo "📤 步骤 2/3: 推送镜像到阿里云..."
docker push ${FULL_IMAGE}

if [ $? -ne 0 ]; then
    echo "❌ 推送失败！请检查是否已登录 Docker"
    echo "💡 提示: 执行 docker login --username=chairohsu0905 ${IMAGE_REGISTRY}"
    exit 1
fi

echo "✅ 推送成功！"
echo ""

echo "🎉 步骤 3/3: 部署完成！"
echo ""
echo "========================================="
echo "✨ 镜像已成功推送到阿里云！"
echo ""
echo "📍 镜像地址: ${FULL_IMAGE}"
echo ""
echo "下一步操作："
echo "1. 进入函数计算控制台"
echo "2. 创建 Web 函数"
echo "3. 选择刚推送的镜像"
echo "4. 配置环境变量"
echo "========================================="
