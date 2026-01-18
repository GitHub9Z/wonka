# 账号认证 API 使用说明

## 接口地址

### 登录/注册（自动注册）
```
POST /api/account-auth/login
```

**说明**：此接口同时支持登录和注册。如果账户不存在，会自动创建新账户。

## 数据模型

账号用户存储在 `AccountUser` 集合中，包含以下字段：
- `email`: 邮箱（可选，但邮箱和手机号至少需要一个）
- `phone`: 手机号（可选，但邮箱和手机号至少需要一个）
- `password`: 加密后的密码（必填，至少6位）
- `nickname`: 昵称（默认：艺术收藏家）
- `avatar`: 头像URL（可选）
- `coins`: WTC（默认：1000）
- `galleryCoins`: 馆币（默认：0）
- `level`: 等级（默认：1）
- `experience`: 经验值（默认：0）
- `popularity`: 人气值（默认：0）
- `lastOnlineTime`: 最后在线时间
- `isMinor`: 是否未成年人（默认：false）

## 登录/注册接口

### 请求参数

```json
{
  "email": "user@example.com",  // 可选，邮箱或手机号至少需要一个
  "phone": "13800138000",        // 可选，邮箱或手机号至少需要一个
  "password": "123456",           // 必填，至少6位
  "nickname": "用户昵称",         // 可选，仅在注册时使用，默认：艺术收藏家
  "avatar": "https://..."        // 可选，仅在注册时使用
}
```

### 响应示例

**新用户注册成功（201）**
```json
{
  "code": 200,
  "message": "注册成功",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "65a1b2c3d4e5f6g7h8i9j0k1",
      "email": "user@example.com",
      "phone": "13800138000",
      "nickname": "用户昵称",
      "avatar": "https://...",
      "coins": 1000,
      "galleryCoins": 0,
      "level": 1,
      "experience": 0
    },
    "isNewUser": true
  }
}
```

**已存在用户登录成功（200）**
```json
{
  "code": 200,
  "message": "登录成功",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "65a1b2c3d4e5f6g7h8i9j0k1",
      "email": "user@example.com",
      "phone": "13800138000",
      "nickname": "用户昵称",
      "avatar": "https://...",
      "coins": 1000,
      "galleryCoins": 0,
      "level": 1,
      "experience": 0
    },
    "isNewUser": false
  }
}
```

**失败（400/401）**
```json
{
  "code": 400,
  "message": "该邮箱已被注册",
  "data": null
}
```

或

```json
{
  "code": 401,
  "message": "账号或密码错误",
  "data": null
}
```

### 错误码说明

- `400`: 参数错误（密码长度不足、邮箱/手机号已存在等）
- `401`: 认证失败（密码错误）
- `500`: 服务器错误

### 工作流程

1. **账户不存在**：自动创建新账户，返回 `isNewUser: true`，HTTP 状态码 201
2. **账户存在且密码正确**：登录成功，返回 `isNewUser: false`，HTTP 状态码 200
3. **账户存在但密码错误**：返回 401 错误

## 使用示例

### cURL 示例

**登录/注册（自动注册）**
```bash
# 首次调用会自动注册
curl -X POST 'http://localhost:3000/api/account-auth/login' \
  -H 'Content-Type: application/json' \
  -d '{
    "email": "user@example.com",
    "password": "123456",
    "nickname": "测试用户"
  }'

# 后续调用会直接登录
curl -X POST 'http://localhost:3000/api/account-auth/login' \
  -H 'Content-Type: application/json' \
  -d '{
    "email": "user@example.com",
    "password": "123456"
  }'
```

### JavaScript/TypeScript 示例

```javascript
// 登录/注册（自动注册）
async function loginOrRegister() {
  const response = await fetch('http://localhost:3000/api/account-auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      email: 'user@example.com',
      password: '123456',
      nickname: '测试用户' // 可选，仅在首次注册时使用
    })
  });
  
  const data = await response.json();
  if (data.code === 200) {
    if (data.data.isNewUser) {
      console.log('注册成功，Token:', data.data.token);
    } else {
      console.log('登录成功，Token:', data.data.token);
    }
    // 保存 token 到本地存储
    localStorage.setItem('token', data.data.token);
    // 保存用户信息
    localStorage.setItem('user', JSON.stringify(data.data.user));
  } else {
    console.error('登录/注册失败:', data.message);
  }
}
```

## 注意事项

1. **密码安全**：密码使用 bcrypt 加密存储，不会以明文形式保存
2. **唯一性**：邮箱和手机号分别具有唯一性约束，不能重复注册
3. **至少一个**：必须提供邮箱或手机号中的至少一个
4. **自动注册**：如果账户不存在，会自动创建新账户。首次注册时可以通过 `nickname` 和 `avatar` 参数设置昵称和头像
5. **Token 使用**：登录/注册成功后返回的 token 可用于后续 API 请求的认证（在请求头中携带 `Authorization: Bearer <token>`）
6. **格式验证**：
   - 邮箱格式：`xxx@xxx.xxx`
   - 手机号格式：11位数字，以1开头，第二位为3-9
7. **密码长度**：密码至少6位
8. **响应标识**：响应中的 `isNewUser` 字段可以用于判断是新注册还是已存在用户登录

## 与微信登录的区别

- **微信登录**：使用微信小程序 code 获取 openId，存储在 `User` 集合
- **账号登录**：使用邮箱/手机号+密码，存储在 `AccountUser` 集合，支持自动注册
- 两者使用相同的 JWT token 系统，但用户数据存储在不同的集合中

