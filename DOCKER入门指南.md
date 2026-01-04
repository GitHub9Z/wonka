# Docker 入门指南 - 大白话版

## Docker 是什么？

**简单理解：Docker 就像一个"打包箱"，把应用和它需要的所有东西（代码、依赖、配置）打包在一起。**

### 生活化比喻

想象一下：
- **传统方式**：你搬家时，要把家具、电器、日用品分别打包，到新家再一个个拆开安装
- **Docker 方式**：你把整个房间（包括所有东西）原样打包，到新家直接打开就能用

Docker 就是把你的应用"整个房间"打包，在任何地方都能一模一样地运行。

## 为什么用 Docker？

### 不用 Docker 的问题：
1. 服务器上要安装 Node.js、npm、各种依赖
2. 不同服务器环境可能不一样，容易出错
3. 配置复杂，容易漏掉某些步骤

### 用 Docker 的好处：
1. **一次打包，到处运行** - 本地、测试、生产环境都一样
2. **环境隔离** - 不会影响服务器其他程序
3. **简单部署** - 几条命令就能启动
4. **容易管理** - 启动、停止、更新都很简单

## 你需要知道的基本概念

### 1. 镜像（Image）
- **是什么**：就像"安装包"，包含了应用和运行环境
- **类比**：就像你下载的游戏安装包

### 2. 容器（Container）
- **是什么**：镜像运行起来就是容器，就是正在运行的应用
- **类比**：安装包安装后运行的游戏程序

### 3. Dockerfile
- **是什么**：告诉 Docker 怎么打包你的应用的"说明书"
- **类比**：就像 IKEA 家具的组装说明书

### 4. docker-compose
- **是什么**：一键启动多个服务（比如后端 + 数据库）的工具
- **类比**：一键启动整个"家"（房间 + 水电 + 网络）

## 两种部署方式（选一种就行）

### 方式一：本地构建镜像，上传镜像（推荐！⭐）

**优点：**
- ✅ 不需要在服务器上传源代码
- ✅ 镜像已经包含所有代码，直接运行
- ✅ 更安全（代码不暴露在服务器上）
- ✅ 构建更快（本地通常比服务器快）

**步骤：**

**1. 在本地电脑构建镜像：**
```bash
cd /Users/zhouzhihao/wonka/backend
docker build -t wonka-backend:latest .
```

**2. 保存镜像为文件：**
```bash
docker save wonka-backend:latest -o wonka-backend.tar
```

**3. 上传镜像文件到服务器：**
```bash
scp wonka-backend.tar root@你的服务器IP:/opt/
```

**4. 在服务器上安装 Docker（如果还没装）：**
```bash
ssh root@你的服务器IP

# 安装 Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# 安装 Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

**5. 在服务器上加载镜像：**
```bash
docker load -i /opt/wonka-backend.tar
```

**6. 创建 docker-compose.yml（只需要这个文件）：**
```bash
cd /opt
mkdir wonka-backend
cd wonka-backend
nano docker-compose.yml
```

**粘贴以下内容（注意：这里用的是 `image` 而不是 `build`）：**
```yaml
version: '3.8'

services:
  mongodb:
    image: mongo:7.0
    container_name: wonka-mongodb
    restart: unless-stopped
    ports:
      - "27017:27017"
    volumes:
      - mongodb_data:/data/db
    networks:
      - wonka-network

  backend:
    image: wonka-backend:latest  # 使用本地构建的镜像
    container_name: wonka-backend
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - PORT=3000
      - MONGODB_URI=mongodb://mongodb:27017/wonka
      - JWT_SECRET=${JWT_SECRET}
      - JWT_EXPIRES_IN=${JWT_EXPIRES_IN:-7d}
      - WECHAT_APPID=${WECHAT_APPID}
      - WECHAT_SECRET=${WECHAT_SECRET}
    depends_on:
      - mongodb
    networks:
      - wonka-network

volumes:
  mongodb_data:

networks:
  wonka-network:
    driver: bridge
```

**7. 创建 `.env` 配置文件：**
```bash
nano .env
```

**粘贴配置：**
```env
JWT_SECRET=你的密钥
JWT_EXPIRES_IN=7d
WECHAT_APPID=你的微信小程序ID
WECHAT_SECRET=你的微信小程序密钥
```

**8. 启动服务：**
```bash
docker-compose up -d
```

**完成！** 以后更新代码，只需要：
1. 本地重新构建镜像
2. 保存并上传新镜像
3. 在服务器上加载新镜像
4. 重启服务：`docker-compose restart backend`

---

### 方式二：在服务器上构建（需要上传源代码）

**适合：** 服务器配置很好，或者想用 CI/CD 自动构建

**步骤：**

**1. 在服务器上安装 Docker：**
```bash
ssh root@你的服务器IP

curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

**2. 上传代码到服务器：**
```bash
# 在本地电脑运行
cd /Users/zhouzhihao/wonka
scp -r backend root@你的服务器IP:/opt/wonka-backend
```

**3. 在服务器上配置和启动：**
```bash
cd /opt/wonka-backend

# 创建 .env 文件
nano .env
# 粘贴配置（同上）

# 一键启动（会自动构建镜像）
docker-compose up -d --build
```

**完成！** 以后更新代码：
1. 上传新代码
2. 运行 `docker-compose up -d --build`

---

## 常用命令（记住这几个就够了）

### 启动服务
```bash
docker-compose up -d
```
- `-d` 表示后台运行，不占用终端

### 停止服务
```bash
docker-compose down
```

### 重启服务
```bash
docker-compose restart
```

### 查看日志
```bash
docker-compose logs -f
```
- `-f` 表示实时查看，会一直显示新日志

### 查看服务状态
```bash
docker-compose ps
```

### 更新代码后重新部署
```bash
# 1. 更新代码（如果用 git）
git pull

# 2. 重新构建并启动
docker-compose up -d --build
```

---

## 测试服务是否正常

**在服务器上测试：**
```bash
curl http://localhost:3000/health
```

如果返回 `{"status":"ok",...}` 就说明服务正常！

**在浏览器访问：**
```
http://你的服务器IP:3000/health
```

---

## 可能遇到的问题

### 问题1：端口被占用
**错误信息：** `port is already allocated`

**解决：**
```bash
# 查看谁占用了 3000 端口
sudo lsof -i :3000

# 停止占用端口的程序，或者修改 docker-compose.yml 中的端口号
```

### 问题2：MongoDB 连接失败
**错误信息：** `MongoDB 连接失败`

**解决：**
```bash
# 检查 MongoDB 容器是否运行
docker-compose ps mongodb

# 查看 MongoDB 日志
docker-compose logs mongodb
```

### 问题3：构建失败
**错误信息：** `build failed`

**解决：**
```bash
# 查看详细错误信息
docker-compose build --no-cache

# 或者查看构建日志
docker-compose logs
```

### 问题4：权限问题
**错误信息：** `permission denied`

**解决：**
```bash
# 把当前用户加入 docker 组（需要重新登录）
sudo usermod -aG docker $USER

# 或者直接用 sudo
sudo docker-compose up -d
```

---

## 为什么有两种方式？

### 方式一：本地构建镜像（推荐）

**Docker 镜像确实包含代码！** 但是：
- 镜像需要在**构建时**把代码打包进去
- 在本地构建好镜像，上传镜像文件
- 服务器上不需要源代码，只需要镜像

**就像：**
- 你在家做好饭（构建镜像）
- 打包成便当盒（保存镜像文件）
- 带到公司直接吃（服务器加载镜像运行）

### 方式二：服务器上构建

- 上传源代码到服务器
- 在服务器上构建镜像
- 然后运行

**就像：**
- 带食材到公司（上传源代码）
- 在公司厨房做（服务器构建）
- 然后吃（运行）

**推荐用方式一**，因为：
1. 不需要在服务器上暴露源代码
2. 本地构建通常更快
3. 更安全

---

## 理解 docker-compose.yml（可选，想深入了解再看）

这个文件就像"一键启动脚本"，告诉 Docker：
1. 启动一个 MongoDB 数据库（叫 `mongodb`）
2. 启动一个后端服务（叫 `backend`）
3. 它们之间可以互相通信
4. 后端服务依赖数据库，等数据库启动好再启动后端

**两种配置的区别：**
- `docker-compose.yml` - 在服务器上构建（需要源代码）
- `docker-compose.prod.yml` - 使用已构建的镜像（不需要源代码）

**你不需要修改这些文件，直接用就行！**

---

## 总结

**Docker 部署就是 3 步：**
1. ✅ 安装 Docker
2. ✅ 上传代码
3. ✅ 运行 `docker-compose up -d`

**就这么简单！**

以后更新代码，只需要：
```bash
git pull
docker-compose up -d --build
```

**记住这几个命令就够了：**
- `docker-compose up -d` - 启动
- `docker-compose down` - 停止
- `docker-compose logs -f` - 看日志
- `docker-compose ps` - 看状态

---

## 下一步

服务启动后，你可能需要：
1. **配置 Nginx 反向代理**（让访问更安全，用域名访问）
2. **配置 SSL 证书**（让网站支持 HTTPS）
3. **设置自动备份**（定期备份数据库）

这些在 `DEPLOY.md` 里有详细说明，等基本部署成功后再看。

---

## 需要帮助？

如果遇到问题：
1. 先看日志：`docker-compose logs -f`
2. 检查状态：`docker-compose ps`
3. 查看错误信息，根据上面的"可能遇到的问题"解决

**记住：Docker 就是把复杂的事情变简单，不要怕，多试几次就熟悉了！** 🚀

