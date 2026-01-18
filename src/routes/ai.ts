/**
 * AI 聊天路由（SSE 转发到 DeepSeek API）
 */

import { Router, Response } from 'express';
import https from 'https';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

// DeepSeek API 配置
const DEEPSEEK_API_URL = 'https://api.deepseek.com/chat/completions';
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || 'sk-33314e85bc34498984e9db9ceddba435';

/**
 * SSE 转发到 DeepSeek API
 */
router.post('/chat', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { messages, model = 'deepseek-chat', stream = true } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({
        code: 400,
        message: '缺少 messages 参数',
        data: null
      });
    }

    // 构建请求数据（始终使用 stream=true 调用 DeepSeek API）
    const requestData = JSON.stringify({
      model,
      messages,
      stream: true // DeepSeek API 始终使用流式响应
    });

    // 解析 URL
    const url = new URL(DEEPSEEK_API_URL);

    // 配置请求选项
    const options = {
      hostname: url.hostname,
      port: 443,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
        'Accept': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
      }
    };

    // 收集所有响应数据
    let responseChunks: Buffer[] = [];

    // 创建 HTTPS 请求
    const proxyReq = https.request(options, (proxyRes) => {
      console.log('[AI] 收到代理响应，状态码:', proxyRes.statusCode);
      console.log('[AI] 请求参数 stream:', stream);
      
      // 根据 stream 参数决定返回方式
      if (stream) {
        // SSE 流式返回
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        res.setHeader('X-Accel-Buffering', 'no');
        res.status(proxyRes.statusCode || 200);

        // 流式转发响应数据（实时显示消息）
        proxyRes.on('data', (chunk: Buffer) => {
          try {
            // 收集数据用于后续解析
            responseChunks.push(chunk);
            
            // 同时流式转发给客户端（实时显示）
            res.write(chunk);
          } catch (error) {
            console.error('[AI] 写入响应数据错误:', error);
          }
        });

        // 流结束后解析完整内容（用于匹配链接）
        proxyRes.on('end', () => {
          try {
            // 合并所有数据块
            const allData = Buffer.concat(responseChunks).toString('utf8');
            
            // 解析 SSE 格式的数据，提取完整内容
            const lines = allData.split('\n');
            let fullContent = '';
            
            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const dataStr = line.slice(6); // 移除 'data: ' 前缀
                
                // 检查是否是结束标记
                if (dataStr.trim() === '[DONE]') {
                  break;
                }
                
                try {
                  const data = JSON.parse(dataStr);
                  // 提取内容
                  const content = data.choices?.[0]?.delta?.content || '';
                  if (content) {
                    fullContent += content;
                  }
                } catch (parseError) {
                  // 忽略解析错误
                }
              }
            }

            console.log('[AI] SSE 流结束，完整内容长度:', fullContent.length);
            
            // 在流结束时发送一个特殊标记，通知客户端可以解析链接了
            const doneData = {
              type: 'done',
              fullContent: fullContent
            };
            res.write(`data: ${JSON.stringify(doneData)}\n\n`);
            
            res.end();
          } catch (error: any) {
            console.error('[AI] 解析响应错误:', error);
            res.end();
          }
        });
      } else {
        // 非流式：等待完整响应后返回 JSON
        res.setHeader('Content-Type', 'application/json');
        res.status(proxyRes.statusCode || 200);

        // 收集所有响应数据
        proxyRes.on('data', (chunk: Buffer) => {
          responseChunks.push(chunk);
        });

        // 等待响应完成后解析并返回
        proxyRes.on('end', () => {
          try {
            // 合并所有数据块
            const allData = Buffer.concat(responseChunks).toString('utf8');
            console.log('[AI] 完整响应长度:', allData.length);

            // 解析 SSE 格式的数据
            const lines = allData.split('\n');
            let fullContent = '';
            
            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const dataStr = line.slice(6); // 移除 'data: ' 前缀
                
                // 检查是否是结束标记
                if (dataStr.trim() === '[DONE]') {
                  break;
                }
                
                try {
                  const data = JSON.parse(dataStr);
                  // 提取内容
                  const content = data.choices?.[0]?.delta?.content || '';
                  if (content) {
                    fullContent += content;
                  }
                } catch (parseError) {
                  // 忽略解析错误
                }
              }
            }

            console.log('[AI] 提取的完整内容长度:', fullContent.length);

            // 返回标准的 JSON 响应
            res.json({
              code: 200,
              message: '获取成功',
              data: {
                content: fullContent,
                model: model
              }
            });
          } catch (error: any) {
            console.error('[AI] 解析响应错误:', error);
            res.status(500).json({
              code: 500,
              message: '解析响应失败: ' + error.message,
              data: null
            });
          }
        });
      }

      proxyRes.on('error', (error: Error) => {
        console.error('[AI] 代理响应错误:', error);
        if (!res.headersSent) {
          res.status(500).json({
            code: 500,
            message: '代理响应错误',
            data: null
          });
        }
      });
    });

    // 处理请求错误
    proxyReq.on('error', (error: Error) => {
      console.error('[AI] 代理请求错误:', error);
      if (!res.headersSent) {
        res.status(500).json({
          code: 500,
          message: '代理请求错误: ' + error.message,
          data: null
        });
      } else {
        res.end();
      }
    });

    // 处理客户端断开连接
    req.on('close', () => {
      proxyReq.destroy();
      if (!res.headersSent) {
        res.end();
      }
    });

    // 发送请求数据
    proxyReq.write(requestData);
    proxyReq.end();

  } catch (error: any) {
    console.error('[AI] 处理请求错误:', error);
    if (!res.headersSent) {
      res.status(500).json({
        code: 500,
        message: error.message || '处理请求失败',
        data: null
      });
    }
  }
});

export default router;

