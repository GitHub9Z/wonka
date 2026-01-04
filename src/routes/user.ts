/**
 * 用户路由
 */

import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

/**
 * 获取用户信息
 */
router.get('/info', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;

    res.json({
      code: 200,
      message: '获取成功',
      data: {
        id: user._id.toString(),
        nickname: user.nickname,
        avatar: user.avatar,
        coins: user.coins,
        level: user.level,
        experience: user.experience
      }
    });
  } catch (error: any) {
    console.error('获取用户信息错误:', error);
    res.status(500).json({
      code: 500,
      message: error.message || '获取失败',
      data: null
    });
  }
});

export default router;


