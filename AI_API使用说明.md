# AI 聊天 API 使用说明

## 接口地址

```
POST /api/ai/chat
```

## 认证

需要 JWT 认证，在请求头中携带：
```
Authorization: Bearer <your-jwt-token>
```

## 请求参数

```json
{
  "model": "deepseek-chat",  // 可选，默认为 "deepseek-chat"
  "messages": [
    {
      "role": "system",
      "content": "You are a helpful assistant. Please do not use emoji in your responses."
    },
    {
      "role": "user",
      "content": "你的问题"
    }
  ],
  "stream": true  // 可选，默认为 true（SSE 流式响应）
}
```

## 响应格式

SSE (Server-Sent Events) 流式响应，Content-Type: `text/event-stream`

响应格式示例：
```
data: {"id":"chatcmpl-xxx","object":"chat.completion.chunk","created":1234567890,"model":"deepseek-chat","choices":[{"index":0,"delta":{"content":"你好"},"finish_reason":null}]}

data: {"id":"chatcmpl-xxx","object":"chat.completion.chunk","created":1234567890,"model":"deepseek-chat","choices":[{"index":0,"delta":{"content":"！"},"finish_reason":null}]}

data: [DONE]
```

## 环境变量配置

在 `.env` 文件中添加：
```env
DEEPSEEK_API_KEY=sk-33314e85bc34498984e9db9ceddba435
```

如果不设置，将使用代码中的默认值。

## 使用示例

### JavaScript/TypeScript (使用 EventSource)

```javascript
// 注意：EventSource 只支持 GET 请求，需要使用 fetch 或其他方式
const response = await fetch('http://localhost:3000/api/ai/chat', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer <your-jwt-token>'
  },
  body: JSON.stringify({
    model: 'deepseek-chat',
    messages: [
      {
        role: 'system',
        content: 'You are a helpful assistant.'
      },
      {
        role: 'user',
        content: '你好'
      }
    ],
    stream: true
  })
});

const reader = response.body.getReader();
const decoder = new TextDecoder();

while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  
  const chunk = decoder.decode(value);
  const lines = chunk.split('\n');
  
  for (const line of lines) {
    if (line.startsWith('data: ')) {
      const data = line.slice(6);
      if (data === '[DONE]') {
        console.log('流结束');
        break;
      }
      try {
        const json = JSON.parse(data);
        const content = json.choices?.[0]?.delta?.content || '';
        if (content) {
          console.log(content);
        }
      } catch (e) {
        // 忽略解析错误
      }
    }
  }
}
```

### cURL 示例

```bash
curl -X POST 'http://localhost:3000/api/ai/chat' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <your-jwt-token>' \
  -d '{
    "model": "deepseek-chat",
    "messages": [
      {
        "role": "system",
        "content": "You are a helpful assistant."
      },
      {
        "role": "user",
        "content": "你好"
      }
    ],
    "stream": true
  }'
```

## 注意事项

1. **认证要求**：所有请求都需要 JWT 认证
2. **流式响应**：响应是 SSE 格式，需要客户端支持流式读取
3. **API Key 安全**：DeepSeek API Key 已配置在服务端，客户端无需传递
4. **错误处理**：如果请求失败，会返回 JSON 格式的错误信息


