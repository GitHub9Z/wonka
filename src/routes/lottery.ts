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
 * 获取用户的开箱记录（原奖池记录接口改为开箱记录）
 */
router.get('/my', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 50;
    const skip = (page - 1) * pageSize;
    
    console.log(`[Lottery] 获取用户开箱记录，userId: ${userId}, page: ${page}, pageSize: ${pageSize}`);
    
    const Box = require('../models/Box').default;
    const Copyright = require('../models/Copyright').default;
    
    const boxes = await Box.find({ userId })
      .populate('copyrightId', 'name image')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(pageSize);
    
    const total = await Box.countDocuments({ userId });
    
    console.log(`[Lottery] 找到 ${boxes.length} 条开箱记录，总计 ${total} 条`);
    
    const records = boxes.map(box => {
      const copyright = box.copyrightId as any;
      let rewardText = '';
      
      if (box.rewardType === 'coins') {
        rewardText = `${box.rewardValue.toLocaleString()} WTC`;
      } else if (box.rewardType === 'copyright') {
        rewardText = `获得 ${box.rewardValue} 份版权`;
        if (copyright) {
          rewardText += ` (${copyright.name})`;
        }
      } else if (box.rewardType === 'fragment') {
        rewardText = `${box.rewardValue} 个版权碎片`;
        if (copyright) {
          rewardText += ` (${copyright.name})`;
        }
      } else if (box.rewardType === 'adCard') {
        rewardText = `${box.rewardValue} 张广告卡`;
      } else if (box.rewardType === 'buffCard') {
        rewardText = `Buff卡`;
      } else if (box.rewardType === 'coupon') {
        rewardText = `优惠券`;
      }
      
      let boxTypeText = '';
      if (box.boxType === 'normal') {
        boxTypeText = '常规盲盒';
      } else if (box.boxType === 'free') {
        boxTypeText = '免费盲盒';
      } else if (box.boxType === 'series') {
        boxTypeText = '系列盲盒';
      }
      
      return {
        id: box._id,
        boxType: box.boxType,
        boxTypeText,
        rewardType: box.rewardType,
        rewardValue: box.rewardValue,
        rewardText,
        copyrightName: copyright?.name || '',
        copyrightImage: copyright?.image || '',
        createdAt: box.createdAt
      };
    });
    
    res.json({
      code: 200,
      message: '获取成功',
      data: records
    });
  } catch (error: any) {
    console.error('[Lottery] 获取开箱记录错误:', error);
    console.error('[Lottery] 错误堆栈:', error.stack);
    res.status(500).json({
      code: 500,
      message: error.message || '获取失败',
      data: null
    });
  }
});

export default router;



