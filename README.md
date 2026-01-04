# 数字艺术馆后端服务

## 环境要求

- Node.js >= 16
- MongoDB >= 5.0

## 安装依赖

```bash
npm install
```

## 环境配置

创建 `.env` 文件，配置以下环境变量：

```env
# 服务器配置
PORT=3000
NODE_ENV=development

# MongoDB 配置
MONGODB_URI=mongodb://localhost:27017/wonka

# JWT 配置
JWT_SECRET=your-secret-key-change-in-production
JWT_EXPIRES_IN=7d

# 微信小程序配置
WECHAT_APPID=your-wechat-appid
WECHAT_SECRET=your-wechat-secret
```

## 运行

### 开发模式

```bash
npm run dev
```

### 生产模式

```bash
npm run build
npm start
```

## API 接口

### 认证

- `POST /api/auth/login` - 微信登录

### 用户

- `GET /api/user/info` - 获取用户信息（需要认证）

### 藏品

- `GET /api/artworks` - 获取藏品列表
- `GET /api/artworks/:id` - 获取藏品详情

### 商店

- `GET /api/shop` - 获取商店藏品列表（需要认证）
- `POST /api/shop/purchase` - 购买藏品（需要认证）

### 收藏

- `GET /api/collection` - 获取用户收藏列表（需要认证）

## 数据库初始化

运行种子数据脚本添加丰富的示例数据：

```bash
npm run seed
```

这会添加：
- 20+ 件不同稀有度的藏品
- 测试管理员用户（openId: admin_test）

## 后台管理 API

所有管理接口都需要认证（JWT Token）：

- `GET /api/admin/stats` - 获取统计数据
- `GET /api/admin/artworks` - 获取藏品列表（支持搜索和筛选）
- `GET /api/admin/artworks/:id` - 获取单个藏品详情
- `POST /api/admin/artworks` - 创建新藏品
- `PUT /api/admin/artworks/:id` - 更新藏品
- `DELETE /api/admin/artworks/:id` - 删除藏品
- `GET /api/admin/users` - 获取用户列表
- `GET /api/admin/collections/stats` - 获取收藏统计

