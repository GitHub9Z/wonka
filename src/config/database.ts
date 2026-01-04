/**
 * 数据库配置
 */

import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/wonka';

/**
 * 连接数据库
 */
export async function connectDatabase(): Promise<void> {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('[INFO] MongoDB 连接成功');
  } catch (error) {
    console.error('[ERROR] MongoDB 连接失败:', error);
    throw error;
  }
}

/**
 * 断开数据库连接
 */
export async function disconnectDatabase(): Promise<void> {
  try {
    await mongoose.disconnect();
    console.log('[INFO] MongoDB 连接已断开');
  } catch (error) {
    console.error('[ERROR] 断开 MongoDB 连接失败:', error);
    throw error;
  }
}

