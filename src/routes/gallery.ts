/**
 * 艺术馆相关路由（挂机产币、开箱等）
 */

import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import * as galleryCoinService from '../services/galleryCoinService';
import * as boxService from '../services/boxService';
import * as seriesBuffService from '../services/seriesBuffService';

const router = Router();

// 所有接口都需要认证
router.use(authenticate);

/**
 * 领取挂机收益
 */
router.post('/coins/claim', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const coins = await galleryCoinService.claimCoins(userId);
    
    res.json({
      code: 200,
      message: '领取成功',
      data: {
        coins,
        totalCoins: req.user!.galleryCoins || 0
      }
    });
  } catch (error: any) {
    console.error('领取馆币错误:', error);
    res.status(500).json({
      code: 500,
      message: error.message || '领取失败',
      data: null
    });
  }
});

/**
 * 获取挂机收益信息
 */
router.get('/coins/info', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const coinsPerHour = await galleryCoinService.calculateCoins(userId);
    
    // 从数据库获取最新的 WTC 数量，确保数据一致性
    const GalleryCoin = require('../models/GalleryCoin').default;
    const galleryCoin = await GalleryCoin.findOne({ userId });
    const totalCoins = galleryCoin ? galleryCoin.coins : (req.user!.galleryCoins || 0);
    
    // 同步到 User 模型
    if (galleryCoin) {
      const User = require('../models/User').default;
      const user = await User.findById(userId);
      if (user && user.coins !== galleryCoin.coins) {
        user.coins = galleryCoin.coins;
        user.galleryCoins = galleryCoin.coins;
        await user.save();
        console.log(`[GalleryCoinsInfo] 同步User.coins: ${user.coins} <- GalleryCoin.coins: ${galleryCoin.coins}`);
      }
    }
    
    res.json({
      code: 200,
      message: '获取成功',
      data: {
        coinsPerHour,
        totalCoins: totalCoins
      }
    });
  } catch (error: any) {
    console.error('获取馆币信息错误:', error);
    res.status(500).json({
      code: 500,
      message: error.message || '获取失败',
      data: null
    });
  }
});

/**
 * 记录离线时间
 */
router.post('/offline', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    await galleryCoinService.recordOfflineTime(userId);
    
    res.json({
      code: 200,
      message: '记录成功',
      data: null
    });
  } catch (error: any) {
    console.error('记录离线时间错误:', error);
    res.status(500).json({
      code: 500,
      message: error.message || '记录失败',
      data: null
    });
  }
});

/**
 * 开普通箱
 */
router.post('/box/normal', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const result = await boxService.openNormalBox(userId);
    
    res.json({
      code: 200,
      message: '开箱成功',
      data: result
    });
  } catch (error: any) {
    console.error('开箱错误:', error);
    res.status(500).json({
      code: 500,
      message: error.message || '开箱失败',
      data: null
    });
  }
});

/**
 * 开免费盲盒（每日限领一个）
 */
router.post('/box/free', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const result = await boxService.openFreeBox(userId);
    
    res.json({
      code: 200,
      message: '开箱成功',
      data: result
    });
  } catch (error: any) {
    console.error('开免费盲盒错误:', error);
    res.status(500).json({
      code: 500,
      message: error.message || '开箱失败',
      data: null
    });
  }
});

/**
 * 检查免费盲盒是否可领取
 */
router.get('/box/free/status', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const available = await boxService.checkFreeBoxAvailable(userId);
    
    res.json({
      code: 200,
      message: '获取成功',
      data: {
        available
      }
    });
  } catch (error: any) {
    console.error('检查免费盲盒状态错误:', error);
    res.status(500).json({
      code: 500,
      message: error.message || '获取失败',
      data: null
    });
  }
});

/**
 * 开系列箱
 */
router.post('/box/series', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { seriesId } = req.body;
    
    if (!seriesId) {
      return res.status(400).json({
        code: 400,
        message: '缺少系列ID',
        data: null
      });
    }
    
    const result = await boxService.openSeriesBox(userId, seriesId);
    
    res.json({
      code: 200,
      message: '开箱成功',
      data: result
    });
  } catch (error: any) {
    console.error('开系列箱错误:', error);
    res.status(500).json({
      code: 500,
      message: error.message || '开箱失败',
      data: null
    });
  }
});

/**
 * 碎片合成版权份额
 */
router.post('/fragment/synthesize', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { copyrightId } = req.body;
    
    if (!copyrightId) {
      return res.status(400).json({
        code: 400,
        message: '缺少版权ID',
        data: null
      });
    }
    
    const shares = await boxService.synthesizeShares(userId, copyrightId);
    
    // 检查并激活buff
    const Copyright = require('../models/Copyright').default;
    const copyright = await Copyright.findById(copyrightId);
    if (copyright) {
      await seriesBuffService.checkAndActivateBuff(userId, copyright.seriesId.toString());
    }
    
    res.json({
      code: 200,
      message: '合成成功',
      data: {
        shares
      }
    });
  } catch (error: any) {
    console.error('碎片合成错误:', error);
    res.status(500).json({
      code: 500,
      message: error.message || '合成失败',
      data: null
    });
  }
});

/**
 * 获取用户的buff效果（统计信息）
 */
router.get('/buffs', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const effects = await seriesBuffService.getUserBuffEffects(userId);
    
    res.json({
      code: 200,
      message: '获取成功',
      data: {
        totalHourlyBonusCoins: effects.totalHourlyBonusCoins,
        buffCount: effects.buffs.length
      }
    });
  } catch (error: any) {
    console.error('获取buff效果错误:', error);
    res.status(500).json({
      code: 500,
      message: error.message || '获取失败',
      data: null
    });
  }
});

/**
 * 获取用户的系列buff列表（收益明细）
 */
router.get('/buffs/list', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const UserBuff = require('../models/UserBuff').default;
    
    const buffs = await UserBuff.find({ userId, isActive: true })
      .populate('seriesId', 'name image description buffType buffEffect')
      .sort({ activatedAt: -1 });
    
    const buffList = buffs.map(buff => {
      const series = buff.seriesId as any;
      return {
        id: buff._id,
        seriesName: series?.name || '未知系列',
        seriesImage: series?.image || '',
        seriesDescription: series?.description || '',
        hourlyBonusCoins: series?.hourlyBonusCoins || 0,
        activatedAt: buff.activatedAt,
        createdAt: buff.createdAt
      };
    });
    
    res.json({
      code: 200,
      message: '获取成功',
      data: buffList
    });
  } catch (error: any) {
    console.error('获取系列buff列表错误:', error);
    res.status(500).json({
      code: 500,
      message: error.message || '获取失败',
      data: null
    });
  }
});

/**
 * 获取用户的开箱记录
 */
router.get('/box/my', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 20;
    const skip = (page - 1) * pageSize;
    
    const Box = require('../models/Box').default;
    const Copyright = require('../models/Copyright').default;
    
    const boxes = await Box.find({ userId })
      .populate('copyrightId', 'name image')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(pageSize);
    
    const total = await Box.countDocuments({ userId });
    
    const records = boxes.map(box => {
      const copyright = box.copyrightId as any;
      let rewardText = '';
      
      if (box.rewardType === 'coins') {
        rewardText = `获得 ${box.rewardValue.toLocaleString()} WTC`;
      } else if (box.rewardType === 'copyright') {
        rewardText = `获得 ${box.rewardValue} 份版权`;
        if (copyright) {
          rewardText += ` (${copyright.name})`;
        }
      } else if (box.rewardType === 'fragment') {
        rewardText = `获得 ${box.rewardValue} 个版权碎片`;
        if (copyright) {
          rewardText += ` (${copyright.name})`;
        }
      } else if (box.rewardType === 'adCard') {
        rewardText = `获得 ${box.rewardValue} 张广告卡`;
      } else if (box.rewardType === 'buffCard') {
        rewardText = `获得 Buff卡`;
      } else if (box.rewardType === 'coupon') {
        rewardText = `获得优惠券`;
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
      data: {
        list: records,
        total,
        page,
        pageSize
      }
    });
  } catch (error: any) {
    console.error('获取开箱记录错误:', error);
    res.status(500).json({
      code: 500,
      message: error.message || '获取失败',
      data: null
    });
  }
});

export default router;



