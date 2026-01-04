/**
 * 版权相关路由
 */

import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import Copyright from '../models/Copyright';
import CopyrightShare from '../models/CopyrightShare';
import Series from '../models/Series';
import * as merchandiseService from '../services/merchandiseService';
import * as seriesBuffService from '../services/seriesBuffService';

const router = Router();

/**
 * 获取版权列表
 */
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const { seriesId } = req.query;
    const query: any = {};
    
    if (seriesId) {
      query.seriesId = seriesId;
    }
    
    const copyrights = await Copyright.find(query).populate('seriesId', 'name');
    
    res.json({
      code: 200,
      message: '获取成功',
      data: copyrights
    });
  } catch (error: any) {
    console.error('获取版权列表错误:', error);
    res.status(500).json({
      code: 500,
      message: error.message || '获取失败',
      data: null
    });
  }
});

/**
 * 获取版权详情
 */
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const copyright = await Copyright.findById(id).populate('seriesId');
    
    if (!copyright) {
      return res.status(404).json({
        code: 404,
        message: '版权不存在',
        data: null
      });
    }
    
    // 如果用户已登录，获取持有份额和折扣信息
    let userShare = null;
    let discount = 1;
    
    if (req.user && req.user.userId) {
      const share = await CopyrightShare.findOne({
        userId: req.user.userId,
        copyrightId: id
      });
      
      if (share) {
        userShare = {
          shares: share.shares,
          fragments: 0 // TODO: 获取碎片数量
        };
        
        // 计算折扣
        discount = await merchandiseService.calculateDiscount(req.user.userId, id);
      }
    }
    
    res.json({
      code: 200,
      message: '获取成功',
      data: {
        ...copyright.toObject(),
        userShare,
        discount
      }
    });
  } catch (error: any) {
    console.error('获取版权详情错误:', error);
    res.status(500).json({
      code: 500,
      message: error.message || '获取失败',
      data: null
    });
  }
});

/**
 * 获取用户持有的版权份额
 */
router.get('/shares/my', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const shares = await CopyrightShare.find({ userId })
      .populate('copyrightId', 'name image seriesId')
      .populate('copyrightId.seriesId', 'name');
    
    res.json({
      code: 200,
      message: '获取成功',
      data: shares
    });
  } catch (error: any) {
    console.error('获取版权份额错误:', error);
    res.status(500).json({
      code: 500,
      message: error.message || '获取失败',
      data: null
    });
  }
});

/**
 * 获取系列列表
 */
router.get('/series/list', async (req: AuthRequest, res: Response) => {
  try {
    const series = await Series.find().populate('copyrightIds', 'name image');
    
      // 如果用户已登录，检查是否集齐系列
      const seriesWithStatus = await Promise.all(series.map(async (s) => {
        let isComplete = false;
        if (req.user && req.user.userId) {
        const shares = await CopyrightShare.find({
          userId: req.user.userId,
          copyrightId: { $in: s.copyrightIds },
          shares: { $gt: 0 }
        });
        
        const ownedCopyrightIds = new Set(shares.map(sh => sh.copyrightId.toString()));
        const requiredCopyrightIds = s.copyrightIds.map(id => id.toString());
        isComplete = requiredCopyrightIds.every(id => ownedCopyrightIds.has(id));
      }
      
      return {
        ...s.toObject(),
        isComplete
      };
    }));
    
    res.json({
      code: 200,
      message: '获取成功',
      data: seriesWithStatus
    });
  } catch (error: any) {
    console.error('获取系列列表错误:', error);
    res.status(500).json({
      code: 500,
      message: error.message || '获取失败',
      data: null
    });
  }
});

/**
 * 获取周边价格（应用折扣）
 */
router.get('/merchandise/price/:copyrightId', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { copyrightId } = req.params;
    const { originalPrice } = req.query;
    
    if (!originalPrice) {
      return res.status(400).json({
        code: 400,
        message: '缺少原价参数',
        data: null
      });
    }
    
    const price = await merchandiseService.getDiscountedPrice(
      req.user!.userId,
      copyrightId,
      parseFloat(originalPrice as string)
    );
    
    const discount = await merchandiseService.calculateDiscount(req.user!.userId, copyrightId);
    
    res.json({
      code: 200,
      message: '获取成功',
      data: {
        originalPrice: parseFloat(originalPrice as string),
        discountedPrice: price,
        discount: discount
      }
    });
  } catch (error: any) {
    console.error('获取周边价格错误:', error);
    res.status(500).json({
      code: 500,
      message: error.message || '获取失败',
      data: null
    });
  }
});

export default router;

