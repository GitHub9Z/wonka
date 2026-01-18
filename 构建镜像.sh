#!/bin/bash

# 本地构建 Docker 镜像脚本
# 使用方法：./构建镜像.sh

set -e

echo "🚀 开始构建 Docker 镜像..."

# 进入脚本所在目录
cd "$(dirname "$0")"

# 检查 Docker 是否安装
if ! command -v docker &> /dev/null; then
    echo "❌ 错误：未安装 Docker，请先安装 Docker"
    echo "   访问 https://docs.docker.com/get-docker/ 安装"
    exit 1
fi

# 检查 Dockerfile 是否存在
if [ ! -f "Dockerfile" ]; then
    echo "❌ 错误：未找到 Dockerfile"
    exit 1
fi

# 构建镜像
echo "📦 正在构建镜像（这可能需要几分钟）..."
docker build -t wonka-backend:latest .

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ 镜像构建成功！"
    echo ""
    echo "📋 镜像信息："
    docker images wonka-backend:latest
    echo ""
    echo "💡 下一步操作："
    echo "   1. 保存镜像：docker save wonka-backend:latest -o wonka-backend.tar"
    echo "   2. 上传到服务器：scp wonka-backend.tar root@服务器IP:/opt/"
    echo "   3. 或使用部署脚本：./部署脚本.sh 服务器IP"
    echo ""
else
    echo "❌ 镜像构建失败，请检查错误信息"
    exit 1
fi



