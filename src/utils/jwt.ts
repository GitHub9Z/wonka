/**
 * JWT 工具函数
 */

import jwt from 'jsonwebtoken';

/**
 * 获取 JWT Secret（运行时读取，确保环境变量已加载）
 */
function getJwtSecret(): string {
  return process.env.JWT_SECRET || 'your-secret-key';
}

/**
 * 获取 JWT 过期时间
 */
function getJwtExpiresIn(): string {
  return process.env.JWT_EXPIRES_IN || '7d';
}

/**
 * 生成 JWT Token
 */
export function generateToken(userId: string): string {
  const JWT_SECRET = getJwtSecret();
  const JWT_EXPIRES_IN = getJwtExpiresIn();
  
  console.log('[JWT] 生成 token, JWT_SECRET 长度:', JWT_SECRET.length);
  
  return jwt.sign({ userId }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN
  });
}

/**
 * 验证 JWT Token
 */
export function verifyToken(token: string): { userId: string } | null {
  try {
    const JWT_SECRET = getJwtSecret();
    return jwt.verify(token, JWT_SECRET) as { userId: string };
  } catch (error) {
    return null;
  }
}



