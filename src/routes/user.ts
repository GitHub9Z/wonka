/**
 * 用户路由
 */

import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import User from '../models/User';
import CopyrightShare from '../models/CopyrightShare';
import GalleryCoin from '../models/GalleryCoin';

const router = Router();

/**
 * 获取用户信息
 */
router.get('/info', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    
    // 从数据库获取最新的用户信息
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        code: 404,
        message: '用户不存在',
        data: null
      });
    }

    // 从 GalleryCoin 获取最新的 WTC 数量，确保数据一致性
    const galleryCoin = await GalleryCoin.findOne({ userId });
    let coins = user.coins;
    if (galleryCoin) {
      // 如果 GalleryCoin 存在，使用它的值，并同步到 User.coins
      coins = galleryCoin.coins;
      if (user.coins !== galleryCoin.coins) {
        user.coins = galleryCoin.coins;
        user.galleryCoins = galleryCoin.coins;
        await user.save();
        console.log(`[UserInfo] 同步User.coins: ${user.coins} <- GalleryCoin.coins: ${galleryCoin.coins}`);
      }
    }

    // 统计用户持有的不同版权数量
    const shares = await CopyrightShare.find({ userId });
    const copyrightSet = new Set<string>();
    shares.forEach(share => {
      copyrightSet.add(share.copyrightId.toString());
    });
    const copyrightCount = copyrightSet.size;

    res.json({
      code: 200,
      message: '获取成功',
      data: {
        id: user._id.toString(),
        nickname: user.nickname,
        avatar: user.avatar,
        coins: coins, // 使用从 GalleryCoin 同步的值
        level: user.level,
        experience: user.experience || 0,
        copyrightCount: copyrightCount
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



