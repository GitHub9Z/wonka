# macOS 安装 Docker 指南

你的系统是 macOS 11.4 (Big Sur)，需要安装兼容版本的 Docker Desktop。

## 方法一：手动下载安装（推荐）

### 步骤 1：下载 Docker Desktop

访问 Docker 官网下载兼容版本：
- **Docker Desktop 4.12**（支持 macOS Big Sur）
- 下载地址：https://docs.docker.com/desktop/release-notes/#docker-desktop-4120

或者直接下载链接：
```
https://desktop.docker.com/mac/main/arm64/Docker.dmg  (Apple Silicon)
https://desktop.docker.com/mac/main/amd64/Docker.dmg  (Intel)
```

### 步骤 2：安装

1. 打开下载的 `.dmg` 文件
2. 将 Docker 图标拖到 Applications 文件夹
3. 打开 Applications，双击 Docker 启动
4. 按照提示完成初始设置（需要输入密码）

### 步骤 3：验证安装

打开终端，运行：
```bash
docker --version
docker-compose --version
```

如果显示版本号，说明安装成功！

---

## 方法二：使用旧版本 Homebrew（如果方法一不行）

```bash
# 安装旧版本的 Docker Desktop
brew install --cask docker@4.12
```

---

## 启动 Docker

安装后，需要启动 Docker Desktop：
1. 打开 Applications 文件夹
2. 双击 Docker 图标
3. 等待 Docker 启动（菜单栏会显示 Docker 图标）
4. 看到 "Docker Desktop is running" 就表示启动成功

---

## 常见问题

### 1. Docker 启动失败

**解决：**
- 检查系统是否允许运行（系统偏好设置 → 安全性与隐私）
- 重启电脑后重试

### 2. 权限问题

**解决：**
```bash
# 将当前用户加入 docker 组（如果需要）
sudo dscl . -append /Groups/docker GroupMembership $(whoami)
```

### 3. 无法连接到 Docker daemon

**解决：**
- 确保 Docker Desktop 正在运行
- 重启 Docker Desktop

---

## 安装完成后

运行以下命令验证：
```bash
docker --version
docker-compose --version
docker run hello-world
```

如果都能正常运行，就可以开始构建镜像了！


