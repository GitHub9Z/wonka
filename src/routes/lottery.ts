/**
 * 奖池相关路由
 */

import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import * as lotteryPoolService from '../services/lotteryPoolService';

const router = Router();

// 所有接口都需要认证
router.use(authenticate);

/**
 * 投入份额到奖池
 */
router.post('/join', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { copyrightId, shares } = req.body;
    
    if (!copyrightId || !shares) {
      return res.status(400).json({
        code: 400,
        message: '缺少必要参数',
        data: null
      });
    }
    
    await lotteryPoolService.joinLotteryPool(userId, copyrightId, shares);
    
    res.json({
      code: 200,
      message: '参与成功',
      data: null
    });
  } catch (error: any) {
    console.error('参与奖池错误:', error);
    res.status(500).json({
      code: 500,
      message: error.message || '参与失败',
      data: null
    });
  }
});

/**
 * 获取用户的奖池参与记录
 */
router.get('/my', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const records = await lotteryPoolService.getUserLotteryRecords(userId);
    
    res.json({
      code: 200,
      message: '获取成功',
      data: records
    });
  } catch (error: any) {
    console.error('获取奖池记录错误:', error);
    res.status(500).json({
      code: 500,
      message: error.message || '获取失败',
      data: null
    });
  }
});

export default router;



