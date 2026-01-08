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
    
    res.json({
      code: 200,
      message: '获取成功',
      data: {
        coinsPerHour,
        totalCoins: req.user!.galleryCoins || 0
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
 * 获取用户的buff效果
 */
router.get('/buffs', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const effects = await seriesBuffService.getUserBuffEffects(userId);
    
    res.json({
      code: 200,
      message: '获取成功',
      data: effects
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

export default router;



