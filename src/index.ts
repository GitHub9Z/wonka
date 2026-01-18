/**
 * 服务器入口文件
 */

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import https from 'https';
import http from 'http';
import fs from 'fs';
import { connectDatabase } from './config/database';
import { errorHandler } from './middleware/errorHandler';
import authRoutes from './routes/auth';
import userRoutes from './routes/user';
// import artworkRoutes from './routes/artwork'; // 已移除，改用 copyright 路由
import shopRoutes from './routes/shop';
import collectionRoutes from './routes/collection';
import adminRoutes from './routes/admin';
import galleryRoutes from './routes/gallery';
import appreciationRoutes from './routes/appreciation';
import copyrightRoutes from './routes/copyright';
import dividendRoutes from './routes/dividend';
import lotteryRoutes from './routes/lottery';
import adminAuthRoutes from './routes/adminAuth';
import aiRoutes from './routes/ai';
import accountAuthRoutes from './routes/accountAuth';

// 加载环境变量
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 静态文件服务（后台管理页面）
const publicPath = path.join(__dirname, '../public');
app.use('/admin', express.static(publicPath));
app.use(express.static(publicPath));

// 后台管理页面路由
app.get('/admin', (req, res) => {
  res.sendFile(path.join(publicPath, 'index.html'));
});

// 隐私政策页面路由
app.get('/policy', (req, res) => {
  res.sendFile(path.join(publicPath, 'policy.html'));
});

// 健康检查
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: '数字艺术馆 API 服务运行正常' });
});

// API 路由
console.log('[Server] 注册 API 路由...');
app.use('/api/auth', authRoutes);
console.log('[Server]   ✅ /api/auth - 认证路由');
app.use('/api/user', userRoutes);
// app.use('/api/artworks', artworkRoutes); // 已移除，改用 /api/copyright 路由
app.use('/api/shop', shopRoutes);
app.use('/api/collection', collectionRoutes);
app.use('/api/admin-auth', adminAuthRoutes); // 管理员登录
app.use('/api/admin', adminRoutes);
app.use('/api/gallery', galleryRoutes);
app.use('/api/appreciation', appreciationRoutes);
app.use('/api/copyright', copyrightRoutes);
app.use('/api/dividend', dividendRoutes);
app.use('/api/lottery', lotteryRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/account-auth', accountAuthRoutes);
console.log('[Server]   ✅ /api/lottery - 奖池路由');
console.log('[Server]   ✅ /api/ai - AI 聊天路由');
console.log('[Server]   ✅ /api/account-auth - 账号认证路由');
console.log('[Server] ✅ 所有 API 路由注册完成');

// 错误处理中间件（必须放在最后）
app.use(errorHandler);

// 404 处理
app.use((req, res) => {
  res.status(404).json({
    code: 404,
    message: '接口不存在',
    data: null
  });
});

// 启动服务器
async function startServer() {
  console.log('[Server] ========== 服务器启动 ==========');
  console.log('[Server] 启动时间:', new Date().toISOString());
  console.log('[Server] Node.js 版本:', process.version);
  console.log('[Server] 环境变量检查:');
  console.log('[Server]   - NODE_ENV:', process.env.NODE_ENV || '未设置');
  console.log('[Server]   - PORT:', process.env.PORT || '3000 (默认)');
  console.log('[Server]   - MONGODB_URI:', process.env.MONGODB_URI ? '已设置' : '未设置');
  console.log('[Server]   - WECHAT_APPID:', process.env.WECHAT_APPID ? process.env.WECHAT_APPID.substring(0, 10) + '...' : '未设置');
  console.log('[Server]   - WECHAT_SECRET:', process.env.WECHAT_SECRET ? '已设置' : '未设置');
  console.log('[Server]   - JWT_SECRET:', process.env.JWT_SECRET ? '已设置 (长度: ' + process.env.JWT_SECRET.length + ')' : '未设置');
  console.log('[Server]   - DEEPSEEK_API_KEY:', process.env.DEEPSEEK_API_KEY ? '已设置' : '未设置（使用默认值）');
  console.log('[Server]   - SSL_CERT_PATH:', process.env.SSL_CERT_PATH || '未设置');
  console.log('[Server]   - SSL_KEY_PATH:', process.env.SSL_KEY_PATH || '未设置');
  
  try {
    // 连接数据库
    console.log('[Server] 正在连接数据库...');
    await connectDatabase();
    console.log('[Server] ✅ 数据库连接成功');

    const SSL_CERT_PATH = '/ssl/cert.pem';
    const SSL_KEY_PATH = '/ssl/cert.key';
    const HTTPS_PORT = process.env.HTTPS_PORT || 443;

    // 检查是否启用 HTTPS
    if (SSL_CERT_PATH && SSL_KEY_PATH) {
      try {
        // 读取 SSL 证书
        const cert = fs.readFileSync(SSL_CERT_PATH);
        const key = fs.readFileSync(SSL_KEY_PATH);

        // 创建 HTTPS 服务器
        const httpsServer = https.createServer({ cert, key }, app);
        
        httpsServer.listen(HTTPS_PORT, () => {
          console.log(`[INFO] HTTPS 服务器运行在 https://localhost:${HTTPS_PORT}`);
          console.log(`[INFO] API 文档: https://localhost:${HTTPS_PORT}/health`);
          console.log(`[INFO] 后台管理: https://localhost:${HTTPS_PORT}/admin`);
        });

        // 可选：同时启动 HTTP 服务器并重定向到 HTTPS
        if (process.env.HTTP_REDIRECT_HTTPS === 'true') {
          const httpApp = express();
          httpApp.use((_req, res) => {
            const host = _req.headers.host?.replace(/:\d+$/, '') || 'localhost';
            res.redirect(`https://${host}:${HTTPS_PORT}${_req.url}`);
          });
          http.createServer(httpApp).listen(PORT, () => {
            console.log(`[INFO] HTTP 服务器运行在 http://localhost:${PORT} (重定向到 HTTPS)`);
          });
        }
      } catch (error) {
        console.error('[ERROR] HTTPS 证书读取失败:', error);
        console.log('[INFO] 回退到 HTTP 模式');
        startHttpServer();
      }
    } else {
      // 使用 HTTP
      startHttpServer();
    }
  } catch (error) {
    console.error('[ERROR] 服务器启动失败:', error);
    process.exit(1);
  }
}

function startHttpServer() {
  app.listen(PORT, () => {
    console.log(`[INFO] HTTP 服务器运行在 http://localhost:${PORT}`);
    console.log(`[INFO] API 文档: http://localhost:${PORT}/health`);
    console.log(`[INFO] 后台管理: http://localhost:${PORT}/admin`);
  });
}

startServer();
