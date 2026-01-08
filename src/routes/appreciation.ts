/**
 * 鉴赏相关路由
 */

import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import * as appreciationService from '../services/appreciationService';

const router = Router();

// 所有接口都需要认证
router.use(authenticate);

/**
 * 鉴赏他人艺术馆
 */
router.post('/appreciate', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { targetUserId, copyrightId, watchDuration } = req.body;
    
    if (!targetUserId || !copyrightId || !watchDuration) {
      return res.status(400).json({
        code: 400,
        message: '缺少必要参数',
        data: null
      });
    }
    
    const result = await appreciationService.appreciate(
      userId,
      targetUserId,
      copyrightId,
      watchDuration
    );
    
    res.json({
      code: 200,
      message: '鉴赏成功',
      data: result
    });
  } catch (error: any) {
    console.error('鉴赏错误:', error);
    res.status(500).json({
      code: 500,
      message: error.message || '鉴赏失败',
      data: null
    });
  }
});

/**
 * 获取今日鉴赏次数
 */
router.get('/appreciation/count', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const result = await appreciationService.getTodayAppreciationCount(userId);
    
    res.json({
      code: 200,
      message: '获取成功',
      data: result
    });
  } catch (error: any) {
    console.error('获取鉴赏次数错误:', error);
    res.status(500).json({
      code: 500,
      message: error.message || '获取失败',
      data: null
    });
  }
});

/**
 * 兑换人气值奖励
 */
router.post('/popularity/exchange', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    await appreciationService.exchangePopularityReward(userId);
    
    res.json({
      code: 200,
      message: '兑换成功',
      data: null
    });
  } catch (error: any) {
    console.error('兑换人气值奖励错误:', error);
    res.status(500).json({
      code: 500,
      message: error.message || '兑换失败',
      data: null
    });
  }
});

export default router;



