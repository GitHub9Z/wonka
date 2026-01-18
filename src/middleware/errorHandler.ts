/**
 * 错误处理中间件
 */

import { Request, Response, NextFunction } from 'express';

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  console.error('错误:', err);

  // 默认错误响应
  res.status(500).json({
    code: 500,
    message: err.message || '服务器内部错误',
    data: null
  });
}




