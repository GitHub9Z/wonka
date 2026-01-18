#!/bin/bash

# macOS Docker 快速安装指南
# 适用于 macOS Big Sur (11.x)

echo "🐳 Docker 安装指南"
echo ""
echo "你的系统：macOS 11.4 (Big Sur) - Apple Silicon"
echo ""
echo "由于你的 macOS 版本较旧，需要手动下载安装兼容版本的 Docker Desktop。"
echo ""
echo "📥 请按以下步骤操作："
echo ""
echo "1. 访问 Docker 官网下载页面："
echo "   https://docs.docker.com/desktop/release-notes/#docker-desktop-4120"
echo ""
echo "2. 或者直接下载（Apple Silicon 版本）："
echo "   https://desktop.docker.com/mac/main/arm64/Docker.dmg"
echo ""
echo "3. 下载完成后："
echo "   - 打开 .dmg 文件"
echo "   - 将 Docker 拖到 Applications 文件夹"
echo "   - 打开 Applications，双击 Docker 启动"
echo ""
echo "4. 启动 Docker Desktop 后，运行以下命令验证："
echo "   docker --version"
echo "   docker-compose --version"
echo ""
echo "5. 验证成功后，就可以运行构建脚本了："
echo "   ./构建镜像.sh"
echo ""

# 尝试打开下载页面
read -p "是否现在打开下载页面？(y/N) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    open "https://docs.docker.com/desktop/release-notes/#docker-desktop-4120"
fi



