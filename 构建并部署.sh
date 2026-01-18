#!/bin/bash

# 一键构建镜像并部署到服务器
# 使用方法：./构建并部署.sh [服务器IP] [服务器用户]

set -e

SERVER_IP=${1:-"your-server-ip"}
SERVER_USER=${2:-"root"}

cd "$(dirname "$0")"

echo "🚀 开始构建并部署..."

# 1. 构建镜像
echo "📦 步骤 1/4：构建镜像..."
./构建镜像.sh

# 2. 保存镜像
echo ""
echo "💾 步骤 2/4：保存镜像..."
./保存镜像.sh

# 3. 部署到服务器
echo ""
echo "🚀 步骤 3/4：部署到服务器..."
./部署脚本.sh ${SERVER_IP} ${SERVER_USER}

# 4. 清理本地镜像文件（可选）
echo ""
read -p "是否删除本地镜像文件 wonka-backend.tar？(y/N) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    rm -f wonka-backend.tar
    echo "✅ 已删除本地镜像文件"
fi

echo ""
echo "🎉 全部完成！"



