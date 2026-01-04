/**
 * 服务器入口文件
 */

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
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

// 健康检查
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: '数字艺术馆 API 服务运行正常' });
});

// API 路由
app.use('/api/auth', authRoutes);
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
  try {
    // 连接数据库
    await connectDatabase();
    console.log('[INFO] 数据库连接成功');

    // 启动服务器
    app.listen(PORT, () => {
      console.log(`[INFO] 服务器运行在 http://localhost:${PORT}`);
      console.log(`[INFO] API 文档: http://localhost:${PORT}/health`);
      console.log(`[INFO] 后台管理: http://localhost:${PORT}/admin`);
    });
  } catch (error) {
    console.error('[ERROR] 服务器启动失败:', error);
    process.exit(1);
  }
}

startServer();
