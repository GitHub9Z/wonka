/**
 * 分红相关路由
 */

import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import * as dividendService from '../services/dividendService';

const router = Router();

// 所有接口都需要认证
router.use(authenticate);

/**
 * 获取用户的分红明细
 */
router.get('/my', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { limit } = req.query;
    
    const dividends = await dividendService.getUserDividends(
      userId,
      limit ? parseInt(limit as string) : 20
    );
    
    res.json({
      code: 200,
      message: '获取成功',
      data: dividends
    });
  } catch (error: any) {
    console.error('获取分红明细错误:', error);
    res.status(500).json({
      code: 500,
      message: error.message || '获取失败',
      data: null
    });
  }
});

export default router;




