#!/bin/bash

# Docker 镜像部署脚本（使用已构建的镜像）
# 使用方法：./部署脚本.sh [服务器IP] [服务器用户]

set -e

SERVER_IP=${1:-"your-server-ip"}
SERVER_USER=${2:-"root"}
REMOTE_PATH="/opt/wonka-backend"
IMAGE_FILE="wonka-backend.tar"

cd "$(dirname "$0")"

# 检查镜像文件是否存在
if [ ! -f "${IMAGE_FILE}" ]; then
    echo "❌ 错误：未找到镜像文件 ${IMAGE_FILE}"
    echo ""
    echo "💡 请先构建并保存镜像："
    echo "   1. ./构建镜像.sh"
    echo "   2. ./保存镜像.sh"
    echo "   或者直接运行：./构建并部署.sh 服务器IP"
    exit 1
fi

echo "📦 找到镜像文件：${IMAGE_FILE}"

# 上传到服务器
echo "📤 上传镜像到服务器..."
scp ${IMAGE_FILE} ${SERVER_USER}@${SERVER_IP}:${REMOTE_PATH}/

# 在服务器上执行部署
echo "🔧 在服务器上部署..."
ssh ${SERVER_USER}@${SERVER_IP} << ENDSSH
cd ${REMOTE_PATH}

# 加载镜像
echo "📥 加载镜像..."
docker load -i ${IMAGE_FILE}

# 确保 docker-compose 使用生产配置
if [ ! -f docker-compose.yml ]; then
    echo "⚠️  未找到 docker-compose.yml，请手动创建"
    exit 1
fi

# 重启服务
echo "🔄 重启服务..."
docker-compose down
docker-compose up -d

# 清理旧镜像文件
rm -f ${IMAGE_FILE}

echo "✅ 部署完成！"
docker-compose ps
ENDSSH

echo ""
echo "🎉 部署完成！"
echo "访问 http://${SERVER_IP}:3000/health 检查服务状态"

