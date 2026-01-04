# HTTPS 配置说明

后端服务支持两种方式配置 HTTPS：
1. **使用 Nginx 反向代理（推荐）** - 生产环境标准做法
2. **Node.js 直接支持 HTTPS** - 需要 SSL 证书文件

## 方式一：使用 Nginx 反向代理（推荐）

这是生产环境的推荐方式，更灵活、性能更好。

### 1. 安装 Nginx

```bash
# Ubuntu/Debian
sudo apt-get update
sudo apt-get install nginx

# CentOS/RHEL
sudo yum install nginx
```

### 2. 配置 SSL 证书

使用 Let's Encrypt 免费证书（推荐）：

```bash
# 安装 certbot
sudo apt-get install certbot python3-certbot-nginx  # Ubuntu/Debian
sudo yum install certbot python3-certbot-nginx      # CentOS/RHEL

# 获取证书（需要域名）
sudo certbot --nginx -d your-domain.com
```

或者手动配置证书文件：
- 将证书文件放在 `/etc/nginx/ssl/` 目录
- `your-domain.com.crt` - 证书文件
- `your-domain.com.key` - 私钥文件

### 3. 配置 Nginx

创建配置文件 `/etc/nginx/sites-available/wonka-backend`:

```nginx
# HTTP 重定向到 HTTPS
server {
    listen 80;
    server_name your-domain.com;

    # Let's Encrypt 验证（如果使用 certbot）
    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }

    # 重定向到 HTTPS
    location / {
        return 301 https://$server_name$request_uri;
    }
}

# HTTPS 配置
server {
    listen 443 ssl http2;
    server_name your-domain.com;

    # SSL 证书配置
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
    
    # 或者使用手动配置的证书
    # ssl_certificate /etc/nginx/ssl/your-domain.com.crt;
    # ssl_certificate_key /etc/nginx/ssl/your-domain.com.key;

    # SSL 安全配置
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # 日志
    access_log /var/log/nginx/wonka-backend-access.log;
    error_log /var/log/nginx/wonka-backend-error.log;

    # 反向代理到后端服务
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
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }
}
```

启用配置：

```bash
sudo ln -s /etc/nginx/sites-available/wonka-backend /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 4. 配置防火墙

```bash
# Ubuntu/Debian (ufw)
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# CentOS/RHEL (firewalld)
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --reload
```

### 5. 自动续期证书（Let's Encrypt）

```bash
# 测试自动续期
sudo certbot renew --dry-run

# 证书会自动续期（certbot 已配置 cron 任务）
```

---

## 方式二：Node.js 直接支持 HTTPS

### 1. 准备 SSL 证书

将证书文件放在项目目录（或安全的位置）：
- `ssl/cert.pem` - 证书文件
- `ssl/key.pem` - 私钥文件

### 2. 配置环境变量

在 `.env` 文件中添加：

```env
# HTTPS 配置
SSL_CERT_PATH=/path/to/ssl/cert.pem
SSL_KEY_PATH=/path/to/ssl/key.pem
HTTPS_PORT=3443

# 可选：HTTP 重定向到 HTTPS
HTTP_REDIRECT_HTTPS=true
```

### 3. 启动服务

服务会自动检测证书文件，如果存在则启动 HTTPS 服务器。

```bash
npm start
```

### 4. 使用 Docker 部署

在 `docker-compose.yml` 中挂载证书目录：

```yaml
services:
  backend:
    # ... 其他配置
    volumes:
      - ./ssl:/app/ssl:ro  # 只读挂载
    environment:
      - SSL_CERT_PATH=/app/ssl/cert.pem
      - SSL_KEY_PATH=/app/ssl/key.pem
      - HTTPS_PORT=3443
```

---

## 小程序配置更新

如果后端使用 HTTPS，需要更新小程序 API 地址：

`miniprogram/utils/constants.ts` 和 `miniprogram/utils/constants.js`:

```typescript
BASE_URL: 'https://your-domain.com/api'
// 或
BASE_URL: 'https://39.101.72.122/api'
```

---

## 推荐方案

**生产环境推荐使用方式一（Nginx 反向代理）**，原因：
1. ✅ 性能更好（Nginx 处理静态文件和反向代理）
2. ✅ 更灵活（可以轻松切换后端服务）
3. ✅ 统一管理证书（更容易维护）
4. ✅ 可以配置缓存、压缩等优化
5. ✅ 是生产环境的标准做法

**开发环境或简单场景可以使用方式二（Node.js 直接 HTTPS）**

---

## 测试 HTTPS

```bash
# 测试健康检查接口
curl https://your-domain.com/health

# 测试 API
curl https://your-domain.com/api/health
```

---

## 常见问题

### 1. 证书过期

Let's Encrypt 证书有效期 90 天，certbot 会自动续期。

### 2. 微信小程序要求 HTTPS

微信小程序要求所有网络请求必须使用 HTTPS（开发环境可以使用 localhost）。

### 3. 自签名证书

开发环境可以使用自签名证书，但小程序无法使用（会报错）。

---

## 注意事项

1. **证书文件安全**：私钥文件必须妥善保管，不要提交到代码仓库
2. **防火墙配置**：确保 443 端口开放
3. **域名配置**：如果使用域名，确保 DNS 解析正确
4. **小程序域名白名单**：在微信公众平台配置服务器域名

