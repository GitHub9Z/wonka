/**
 * 认证中间件
 */

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User';

export interface AuthRequest extends Request {
  userId?: string;
  user?: {
    userId: string;
    role?: string;
    isAdmin?: boolean;
    galleryCoins?: number;
    popularity?: number;
    isMinor?: boolean;
    [key: string]: any;
  };
}

/**
 * JWT 认证中间件
 */
export async function authenticate(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  let token: string | undefined;
  try {
    const authHeader = req.headers.authorization;
    console.log('[Auth] 请求头 Authorization:', authHeader ? authHeader.substring(0, 30) + '...' : '无');
    
    token = authHeader?.replace('Bearer ', '');

    if (!token) {
      console.error('[Auth] 未提供 token');
      res.status(401).json({
        code: 401,
        message: '未提供认证令牌',
        data: null
      });
      return;
    }

    const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
    console.log('[Auth] JWT_SECRET 长度:', JWT_SECRET.length);
    console.log('[Auth] JWT_SECRET 前10字符:', JWT_SECRET.substring(0, 10));
    console.log('[Auth] Token 长度:', token.length);
    console.log('[Auth] Token 前20字符:', token.substring(0, 20));
    
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; role?: string };
    console.log('[Auth] Token 解码成功, userId:', decoded.userId);

    // 检查是否为管理员
    if (decoded.role === 'admin') {
      req.userId = decoded.userId;
      req.user = {
        userId: decoded.userId,
        role: 'admin',
        isAdmin: true
      };
      next();
      return;
    }

    // 普通用户认证
    const user = await User.findById(decoded.userId);
    if (!user) {
      res.status(401).json({
        code: 401,
        message: '用户不存在',
        data: null
      });
      return;
    }

    req.userId = decoded.userId;
    req.user = {
      userId: decoded.userId,
      galleryCoins: user.galleryCoins || 0,
      popularity: user.popularity || 0,
      isMinor: user.isMinor || false,
      ...user.toObject()
    };
    next();
  } catch (error: any) {
    console.error('[Auth] Token 验证失败:', {
      error: error.message,
      name: error.name,
      token: token ? token.substring(0, 20) + '...' : '无token'
    });
    
    res.status(401).json({
      code: 401,
      message: '认证令牌无效',
      data: null
    });
  }
}

