#!/bin/bash

# 保存 Docker 镜像为文件
# 使用方法：./保存镜像.sh [输出文件名]

set -e

OUTPUT_FILE=${1:-"wonka-backend.tar"}
IMAGE_NAME="wonka-backend:latest"

echo "💾 正在保存镜像 ${IMAGE_NAME} 为 ${OUTPUT_FILE}..."

# 检查镜像是否存在
if ! docker images ${IMAGE_NAME} | grep -q wonka-backend; then
    echo "❌ 错误：镜像 ${IMAGE_NAME} 不存在"
    echo "   请先运行：./构建镜像.sh"
    exit 1
fi

# 保存镜像
docker save ${IMAGE_NAME} -o ${OUTPUT_FILE}

# 获取文件大小
FILE_SIZE=$(du -h ${OUTPUT_FILE} | cut -f1)

echo ""
echo "✅ 镜像已保存为 ${OUTPUT_FILE}"
echo "📦 文件大小：${FILE_SIZE}"
echo ""
echo "💡 下一步："
echo "   上传到服务器：scp ${OUTPUT_FILE} root@服务器IP:/opt/"
echo "   或使用部署脚本：./部署脚本.sh 服务器IP"

