# Docker 部署指南

本文档说明如何使用 Docker 将后端服务部署到阿里云服务器。

## 前置要求

1. **服务器环境**
   - 阿里云 ECS 实例（推荐 2核4G 或以上配置）
   - 操作系统：Ubuntu 20.04+ 或 CentOS 7+
   - 已安装 Docker 和 Docker Compose

2. **安装 Docker 和 Docker Compose**

   **Ubuntu/Debian:**
   ```bash
   # 安装 Docker
   curl -fsSL https://get.docker.com -o get-docker.sh
   sudo sh get-docker.sh
   
   # 安装 Docker Compose
   sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
   sudo chmod +x /usr/local/bin/docker-compose
   ```

   **CentOS/RHEL:**
   ```bash
   # 安装 Docker
   sudo yum install -y docker
   sudo systemctl start docker
   sudo systemctl enable docker
   
   # 安装 Docker Compose
   sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
   sudo chmod +x /usr/local/bin/docker-compose
   ```

## 部署步骤

### 1. 上传代码到服务器

```bash
# 在本地项目目录
cd backend

# 使用 scp 上传（或使用 git clone）
scp -r . root@your-server-ip:/opt/wonka-backend

# 或者使用 git
ssh root@your-server-ip
cd /opt
git clone your-repo-url wonka-backend
cd wonka-backend/backend
```

### 2. 配置环境变量

在服务器上创建 `.env` 文件（或使用环境变量）：

```bash
cd /opt/wonka-backend/backend
nano .env
```

添加以下配置：

```env
# 服务器配置
NODE_ENV=production
PORT=3000

# MongoDB 配置（如果使用 docker-compose，会自动连接）
MONGODB_URI=mongodb://mongodb:27017/wonka

# JWT 配置（请修改为强密码）
JWT_SECRET=your-very-strong-secret-key-here
JWT_EXPIRES_IN=7d

# 微信小程序配置
WECHAT_APPID=your-wechat-appid
WECHAT_SECRET=your-wechat-secret
```

### 3. 使用 Docker Compose 部署（推荐）

```bash
cd /opt/wonka-backend/backend

# 构建并启动服务
docker-compose up -d

# 查看日志
docker-compose logs -f

# 查看服务状态
docker-compose ps
```

### 4. 仅使用 Docker 部署（不使用 docker-compose）

如果服务器上已有 MongoDB，可以只部署后端服务：

```bash
cd /opt/wonka-backend/backend

# 构建镜像
docker build -t wonka-backend:latest .

# 运行容器
docker run -d \
  --name wonka-backend \
  --restart unless-stopped \
  -p 3000:3000 \
  --env-file .env \
  wonka-backend:latest

# 查看日志
docker logs -f wonka-backend
```

### 5. 初始化数据库（可选）

如果需要初始化数据库或导入种子数据：

```bash
# 进入容器
docker exec -it wonka-backend sh

# 在容器内运行初始化脚本（需要先安装开发依赖）
npm install
npm run init
npm run seed

# 或者直接在服务器上运行（需要本地安装 Node.js）
cd /opt/wonka-backend/backend
npm install
npm run build
npm run init
npm run seed
```

## 配置 Nginx 反向代理（推荐）

为了更好的性能和安全性，建议使用 Nginx 作为反向代理：

### 1. 安装 Nginx

```bash
sudo apt-get update
sudo apt-get install nginx
```

### 2. 配置 Nginx

创建配置文件 `/etc/nginx/sites-available/wonka-backend`:

```nginx
server {
    listen 80;
    server_name your-domain.com;  # 替换为你的域名或 IP

    # 重定向到 HTTPS（如果有 SSL 证书）
    # return 301 https://$server_name$request_uri;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

启用配置：

```bash
sudo ln -s /etc/nginx/sites-available/wonka-backend /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 3. 配置 SSL（可选，推荐）

使用 Let's Encrypt 免费 SSL 证书：

```bash
sudo apt-get install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

## 防火墙配置

确保服务器防火墙允许相应端口：

```bash
# Ubuntu/Debian (ufw)
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable

# CentOS/RHEL (firewalld)
sudo firewall-cmd --permanent --add-service=ssh
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --reload
```

## 常用命令

### Docker Compose

```bash
# 启动服务
docker-compose up -d

# 停止服务
docker-compose down

# 重启服务
docker-compose restart

# 查看日志
docker-compose logs -f backend

# 查看服务状态
docker-compose ps

# 更新代码后重新构建
docker-compose up -d --build
```

### Docker

```bash
# 查看运行中的容器
docker ps

# 查看日志
docker logs -f wonka-backend

# 重启容器
docker restart wonka-backend

# 停止容器
docker stop wonka-backend

# 删除容器
docker rm wonka-backend

# 删除镜像
docker rmi wonka-backend:latest
```

## 监控和维护

### 1. 健康检查

访问健康检查接口：

```bash
curl http://localhost:3000/health
```

### 2. 查看资源使用

```bash
# 查看容器资源使用
docker stats wonka-backend

# 查看磁盘使用
docker system df
```

### 3. 清理未使用的资源

```bash
# 清理未使用的镜像、容器、网络
docker system prune -a
```

## 故障排查

### 1. 容器无法启动

```bash
# 查看容器日志
docker logs wonka-backend

# 检查容器状态
docker ps -a
```

### 2. MongoDB 连接失败

```bash
# 检查 MongoDB 容器是否运行
docker-compose ps mongodb

# 查看 MongoDB 日志
docker-compose logs mongodb

# 测试 MongoDB 连接
docker exec -it wonka-mongodb mongosh
```

### 3. 端口被占用

```bash
# 查看端口占用
sudo netstat -tlnp | grep 3000

# 或使用
sudo lsof -i :3000
```

## 更新部署

当代码更新后：

```bash
cd /opt/wonka-backend/backend

# 拉取最新代码
git pull

# 重新构建并启动
docker-compose up -d --build

# 或仅使用 Docker
docker build -t wonka-backend:latest .
docker stop wonka-backend
docker rm wonka-backend
docker run -d --name wonka-backend --restart unless-stopped -p 3000:3000 --env-file .env wonka-backend:latest
```

## 备份和恢复

### 备份 MongoDB 数据

```bash
# 备份
docker exec wonka-mongodb mongodump --out /data/backup

# 导出到本地
docker cp wonka-mongodb:/data/backup ./mongodb-backup-$(date +%Y%m%d)
```

### 恢复 MongoDB 数据

```bash
# 恢复
docker exec -i wonka-mongodb mongorestore /data/backup
```

## 安全建议

1. **修改默认密码**：确保 JWT_SECRET 使用强密码
2. **使用 HTTPS**：配置 SSL 证书
3. **限制访问**：使用防火墙限制不必要的端口
4. **定期更新**：保持 Docker 和系统更新
5. **监控日志**：定期检查应用日志
6. **数据备份**：定期备份 MongoDB 数据

## 联系支持

如遇到问题，请检查：
- Docker 和 Docker Compose 版本
- 服务器资源（CPU、内存、磁盘）
- 网络连接
- 日志文件



