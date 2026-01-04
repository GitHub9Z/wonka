/**
 * 后台管理路由
 */

import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import User from '../models/User';
import Series from '../models/Series';
import Copyright from '../models/Copyright';
import CopyrightShare from '../models/CopyrightShare';

const router = Router();

// 所有管理接口都需要认证（除了登录接口）
router.use(authenticate);

/**
 * 获取统计数据
 */
router.get('/stats', async (req: AuthRequest, res: Response) => {
  try {
    const totalCopyrights = await Copyright.countDocuments();
    const totalUsers = await User.countDocuments();
    const totalShares = await CopyrightShare.countDocuments();
    
    // 按系列统计版权数量
    const seriesStats = await Copyright.aggregate([
      {
        $group: {
          _id: '$seriesId',
          count: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'series',
          localField: '_id',
          foreignField: '_id',
          as: 'series'
        }
      },
      { $unwind: '$series' },
      {
        $project: {
          seriesName: '$series.name',
          count: 1
        }
      }
    ]);
    
    // 最近7天的数据
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const recentCopyrights = await Copyright.countDocuments({
      createdAt: { $gte: sevenDaysAgo }
    });
    
    const recentUsers = await User.countDocuments({
      createdAt: { $gte: sevenDaysAgo }
    });
    
    const recentShares = await CopyrightShare.countDocuments({
      createdAt: { $gte: sevenDaysAgo }
    });

    res.json({
      code: 200,
      message: '获取成功',
      data: {
        total: {
          copyrights: totalCopyrights,
          users: totalUsers,
          shares: totalShares
        },
        series: seriesStats,
        recent: {
          copyrights: recentCopyrights,
          users: recentUsers,
          shares: recentShares
        }
      }
    });
  } catch (error: any) {
    console.error('获取统计数据错误:', error);
    res.status(500).json({
      code: 500,
      message: error.message || '获取失败',
      data: null
    });
  }
});

/**
 * 获取版权列表（管理）
 */
router.get('/copyrights', async (req: AuthRequest, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 20;
    const skip = (page - 1) * pageSize;
    const keyword = req.query.keyword as string;
    const seriesId = req.query.seriesId as string;

    const query: any = {};
    if (seriesId) {
      query.seriesId = seriesId;
    }
    if (keyword) {
      query.$or = [
        { name: { $regex: keyword, $options: 'i' } },
        { description: { $regex: keyword, $options: 'i' } }
      ];
    }

    const copyrights = await Copyright.find(query)
      .populate('seriesId', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(pageSize);

    const total = await Copyright.countDocuments(query);

    res.json({
      code: 200,
      message: '获取成功',
      data: {
        list: copyrights,
        total,
        page,
        pageSize
      }
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
 * 获取版权总数
 */
router.get('/copyrights/count', async (req: AuthRequest, res: Response) => {
  try {
    const count = await Copyright.countDocuments();
    res.json({
      code: 200,
      message: '获取成功',
      data: { count }
    });
  } catch (error: any) {
    console.error('获取版权总数错误:', error);
    res.status(500).json({
      code: 500,
      message: error.message || '获取失败',
      data: null
    });
  }
});

/**
 * 获取单个版权详情（管理）
 */
router.get('/copyrights/:id', async (req: AuthRequest, res: Response) => {
  try {
    const copyright = await Copyright.findById(req.params.id).populate('seriesId', 'name');

    if (!copyright) {
      return res.status(404).json({
        code: 404,
        message: '版权不存在',
        data: null
      });
    }

    res.json({
      code: 200,
      message: '获取成功',
      data: copyright
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
 * 创建版权
 */
router.post('/copyrights', async (req: AuthRequest, res: Response) => {
  try {
    const { name, description, image, seriesId, totalShares, price, merchandiseStatus } = req.body;

    if (!name || !description || !image || !seriesId || !totalShares || !price) {
      return res.status(400).json({
        code: 400,
        message: '缺少必要字段',
        data: null
      });
    }

    const copyright = new Copyright({
      name,
      description,
      image,
      seriesId,
      totalShares,
      soldShares: 0,
      price,
      merchandiseStatus: merchandiseStatus || 'undeveloped',
      blockchainHash: `0x${Math.random().toString(16).substr(2, 64)}`
    });

    await copyright.save();

    res.json({
      code: 200,
      message: '创建成功',
      data: copyright
    });
  } catch (error: any) {
    console.error('创建版权错误:', error);
    res.status(500).json({
      code: 500,
      message: error.message || '创建失败',
      data: null
    });
  }
});

/**
 * 更新版权
 */
router.put('/copyrights/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const copyright = await Copyright.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!copyright) {
      return res.status(404).json({
        code: 404,
        message: '版权不存在',
        data: null
      });
    }

    res.json({
      code: 200,
      message: '更新成功',
      data: copyright
    });
  } catch (error: any) {
    console.error('更新版权错误:', error);
    res.status(500).json({
      code: 500,
      message: error.message || '更新失败',
      data: null
    });
  }
});

/**
 * 删除版权
 */
router.delete('/copyrights/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const copyright = await Copyright.findByIdAndDelete(id);

    if (!copyright) {
      return res.status(404).json({
        code: 404,
        message: '版权不存在',
        data: null
      });
    }

    // 同时删除相关的份额记录
    await CopyrightShare.deleteMany({ copyrightId: id });

    res.json({
      code: 200,
      message: '删除成功',
      data: null
    });
  } catch (error: any) {
    console.error('删除藏品错误:', error);
    res.status(500).json({
      code: 500,
      message: error.message || '删除失败',
      data: null
    });
  }
});

/**
 * 获取用户列表
 */
router.get('/users', async (req: AuthRequest, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 20;
    const skip = (page - 1) * pageSize;
    const keyword = req.query.keyword as string;

    let query: any = {};
    if (keyword) {
      query.$or = [
        { nickname: { $regex: keyword, $options: 'i' } },
        { openId: { $regex: keyword, $options: 'i' } }
      ];
    }

    const users = await User.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(pageSize);

    const total = await User.countDocuments(query);

    res.json({
      code: 200,
      message: '获取成功',
      data: {
        list: users,
        total,
        page,
        pageSize
      }
    });
  } catch (error: any) {
    console.error('获取用户列表错误:', error);
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
router.get('/series', async (req: AuthRequest, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 20;
    const skip = (page - 1) * pageSize;
    const keyword = req.query.keyword as string;

    let query: any = {};
    if (keyword) {
      query.name = { $regex: keyword, $options: 'i' };
    }

    const series = await Series.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(pageSize);

    const total = await Series.countDocuments(query);

    res.json({
      code: 200,
      message: '获取成功',
      data: {
        list: series,
        total,
        page,
        pageSize
      }
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
 * 获取版权列表
 */
router.get('/copyrights', async (req: AuthRequest, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 20;
    const skip = (page - 1) * pageSize;
    const keyword = req.query.keyword as string;

    let query: any = {};
    if (keyword) {
      query.name = { $regex: keyword, $options: 'i' };
    }

    const copyrights = await Copyright.find(query)
      .populate('seriesId', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(pageSize);

    const total = await Copyright.countDocuments(query);

    res.json({
      code: 200,
      message: '获取成功',
      data: {
        list: copyrights,
        total,
        page,
        pageSize
      }
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
 * 创建系列
 */
router.post('/series', async (req: AuthRequest, res: Response) => {
  try {
    const { name, description, image, buffType, buffEffect } = req.body;

    if (!name || !description || !image || !buffType || !buffEffect) {
      return res.status(400).json({
        code: 400,
        message: '缺少必要字段',
        data: null
      });
    }

    const series = new Series({
      name,
      description,
      image,
      buffType,
      buffEffect
    });

    await series.save();

    res.json({
      code: 200,
      message: '创建成功',
      data: series
    });
  } catch (error: any) {
    console.error('创建系列错误:', error);
    res.status(500).json({
      code: 500,
      message: error.message || '创建失败',
      data: null
    });
  }
});

/**
 * 获取系列总数
 */
router.get('/series/count', async (req: AuthRequest, res: Response) => {
  try {
    const count = await Series.countDocuments();
    res.json({
      code: 200,
      message: '获取成功',
      data: { count }
    });
  } catch (error: any) {
    console.error('获取系列总数错误:', error);
    res.status(500).json({
      code: 500,
      message: error.message || '获取失败',
      data: null
    });
  }
});

/**
 * 获取系列详情
 */
router.get('/series/:id', async (req: AuthRequest, res: Response) => {
  try {
    const series = await Series.findById(req.params.id);

    if (!series) {
      return res.status(404).json({
        code: 404,
        message: '系列不存在',
        data: null
      });
    }

    res.json({
      code: 200,
      message: '获取成功',
      data: series
    });
  } catch (error: any) {
    console.error('获取系列详情错误:', error);
    res.status(500).json({
      code: 500,
      message: error.message || '获取失败',
      data: null
    });
  }
});

/**
 * 更新系列
 */
router.put('/series/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const series = await Series.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!series) {
      return res.status(404).json({
        code: 404,
        message: '系列不存在',
        data: null
      });
    }

    res.json({
      code: 200,
      message: '更新成功',
      data: series
    });
  } catch (error: any) {
    console.error('更新系列错误:', error);
    res.status(500).json({
      code: 500,
      message: error.message || '更新失败',
      data: null
    });
  }
});

/**
 * 删除系列
 */
router.delete('/series/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const series = await Series.findByIdAndDelete(id);

    if (!series) {
      return res.status(404).json({
        code: 404,
        message: '系列不存在',
        data: null
      });
    }

    // 同时删除相关的版权记录
    await Copyright.deleteMany({ seriesId: id });

    res.json({
      code: 200,
      message: '删除成功',
      data: null
    });
  } catch (error: any) {
    console.error('删除系列错误:', error);
    res.status(500).json({
      code: 500,
      message: error.message || '删除失败',
      data: null
    });
  }
});

/**
 * 创建版权
 */
router.post('/copyrights', async (req: AuthRequest, res: Response) => {
  try {
    const { name, description, image, seriesId, totalShares, price, merchandiseStatus } = req.body;

    if (!name || !description || !image || !seriesId || !totalShares || !price) {
      return res.status(400).json({
        code: 400,
        message: '缺少必要字段',
        data: null
      });
    }

    const copyright = new Copyright({
      name,
      description,
      image,
      seriesId,
      totalShares,
      soldShares: 0,
      price,
      merchandiseStatus: merchandiseStatus || 'undeveloped',
      blockchainHash: `0x${Math.random().toString(16).substr(2, 64)}`
    });

    await copyright.save();

    res.json({
      code: 200,
      message: '创建成功',
      data: copyright
    });
  } catch (error: any) {
    console.error('创建版权错误:', error);
    res.status(500).json({
      code: 500,
      message: error.message || '创建失败',
      data: null
    });
  }
});

/**
 * 获取版权总数
 */
router.get('/copyrights/count', async (req: AuthRequest, res: Response) => {
  try {
    const count = await Copyright.countDocuments();
    res.json({
      code: 200,
      message: '获取成功',
      data: { count }
    });
  } catch (error: any) {
    console.error('获取版权总数错误:', error);
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
router.get('/copyrights/:id', async (req: AuthRequest, res: Response) => {
  try {
    const copyright = await Copyright.findById(req.params.id).populate('seriesId', 'name');

    if (!copyright) {
      return res.status(404).json({
        code: 404,
        message: '版权不存在',
        data: null
      });
    }

    res.json({
      code: 200,
      message: '获取成功',
      data: copyright
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
 * 更新版权
 */
router.put('/copyrights/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const copyright = await Copyright.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!copyright) {
      return res.status(404).json({
        code: 404,
        message: '版权不存在',
        data: null
      });
    }

    res.json({
      code: 200,
      message: '更新成功',
      data: copyright
    });
  } catch (error: any) {
    console.error('更新版权错误:', error);
    res.status(500).json({
      code: 500,
      message: error.message || '更新失败',
      data: null
    });
  }
});

/**
 * 删除版权
 */
router.delete('/copyrights/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const copyright = await Copyright.findByIdAndDelete(id);

    if (!copyright) {
      return res.status(404).json({
        code: 404,
        message: '版权不存在',
        data: null
      });
    }

    // 同时删除相关的份额记录
    await CopyrightShare.deleteMany({ copyrightId: id });

    res.json({
      code: 200,
      message: '删除成功',
      data: null
    });
  } catch (error: any) {
    console.error('删除版权错误:', error);
    res.status(500).json({
      code: 500,
      message: error.message || '删除失败',
      data: null
    });
  }
});

/**
 * 获取版权份额列表
 */
router.get('/shares', async (req: AuthRequest, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 20;
    const skip = (page - 1) * pageSize;
    const keyword = req.query.keyword as string;

    let matchQuery: any = {};
    if (keyword) {
      matchQuery.$or = [
        { 'user.nickname': { $regex: keyword, $options: 'i' } },
        { 'user.openId': { $regex: keyword, $options: 'i' } },
        { 'copyright.name': { $regex: keyword, $options: 'i' } }
      ];
    }

    const pipeline = [
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'user'
        }
      },
      { $unwind: '$user' },
      {
        $lookup: {
          from: 'copyrights',
          localField: 'copyrightId',
          foreignField: '_id',
          as: 'copyright'
        }
      },
      { $unwind: '$copyright' },
      {
        $lookup: {
          from: 'series',
          localField: 'copyright.seriesId',
          foreignField: '_id',
          as: 'series'
        }
      },
      { $unwind: { path: '$series', preserveNullAndEmptyArrays: true } }
    ];

    if (Object.keys(matchQuery).length > 0) {
      pipeline.push({ $match: matchQuery });
    }

    pipeline.push(
      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: pageSize }
    );

    const shares = await CopyrightShare.aggregate(pipeline);

    // 获取总数
    let totalPipeline = [
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'user'
        }
      },
      { $unwind: '$user' },
      {
        $lookup: {
          from: 'copyrights',
          localField: 'copyrightId',
          foreignField: '_id',
          as: 'copyright'
        }
      },
      { $unwind: '$copyright' }
    ];

    if (Object.keys(matchQuery).length > 0) {
      totalPipeline.push({ $match: matchQuery });
    }

    totalPipeline.push({ $count: 'total' });

    const totalResult = await CopyrightShare.aggregate(totalPipeline);
    const total = totalResult.length > 0 ? totalResult[0].total : 0;

    res.json({
      code: 200,
      message: '获取成功',
      data: {
        list: shares,
        total,
        page,
        pageSize
      }
    });
  } catch (error: any) {
    console.error('获取版权份额列表错误:', error);
    res.status(500).json({
      code: 500,
      message: error.message || '获取失败',
      data: null
    });
  }
});

/**
 * 创建份额
 */
router.post('/shares', async (req: AuthRequest, res: Response) => {
  try {
    const { userId, copyrightId, blockchainHash } = req.body;

    if (!userId || !copyrightId || !blockchainHash) {
      return res.status(400).json({
        code: 400,
        message: '缺少必要字段',
        data: null
      });
    }

    const share = new CopyrightShare({
      userId,
      copyrightId,
      blockchainHash,
      inLotteryPool: false,
      giftCount: 0
    });

    await share.save();

    // 更新版权的已售份额
    await Copyright.findByIdAndUpdate(copyrightId, {
      $inc: { soldShares: 1 }
    });

    res.json({
      code: 200,
      message: '创建成功',
      data: share
    });
  } catch (error: any) {
    console.error('创建份额错误:', error);
    res.status(500).json({
      code: 500,
      message: error.message || '创建失败',
      data: null
    });
  }
});

/**
 * 获取份额详情
 */
router.get('/shares/:id', async (req: AuthRequest, res: Response) => {
  try {
    const share = await CopyrightShare.findById(req.params.id)
      .populate('userId', 'nickname')
      .populate('copyrightId', 'name');

    if (!share) {
      return res.status(404).json({
        code: 404,
        message: '份额不存在',
        data: null
      });
    }

    res.json({
      code: 200,
      message: '获取成功',
      data: share
    });
  } catch (error: any) {
    console.error('获取份额详情错误:', error);
    res.status(500).json({
      code: 500,
      message: error.message || '获取失败',
      data: null
    });
  }
});

/**
 * 更新份额
 */
router.put('/shares/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const share = await CopyrightShare.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!share) {
      return res.status(404).json({
        code: 404,
        message: '份额不存在',
        data: null
      });
    }

    res.json({
      code: 200,
      message: '更新成功',
      data: share
    });
  } catch (error: any) {
    console.error('更新份额错误:', error);
    res.status(500).json({
      code: 500,
      message: error.message || '更新失败',
      data: null
    });
  }
});

/**
 * 删除份额
 */
router.delete('/shares/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const share = await CopyrightShare.findById(id);
    if (!share) {
      return res.status(404).json({
        code: 404,
        message: '份额不存在',
        data: null
      });
    }

    await CopyrightShare.findByIdAndDelete(id);

    // 更新版权的已售份额
    await Copyright.findByIdAndUpdate(share.copyrightId, {
      $inc: { soldShares: -1 }
    });

    res.json({
      code: 200,
      message: '删除成功',
      data: null
    });
  } catch (error: any) {
    console.error('删除份额错误:', error);
    res.status(500).json({
      code: 500,
      message: error.message || '删除失败',
      data: null
    });
  }
});

/**
 * 获取份额列表（按版权分组）
 */
router.get('/shares', async (req: AuthRequest, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 20;
    const skip = (page - 1) * pageSize;
    const keyword = req.query.keyword as string;

    let matchQuery: any = {};
    if (keyword) {
      matchQuery.$or = [
        { 'user.nickname': { $regex: keyword, $options: 'i' } },
        { 'user.openId': { $regex: keyword, $options: 'i' } },
        { 'copyright.name': { $regex: keyword, $options: 'i' } }
      ];
    }

    // 按用户和版权分组统计份额数
    const pipeline = [
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'user'
        }
      },
      { $unwind: '$user' },
      {
        $lookup: {
          from: 'copyrights',
          localField: 'copyrightId',
          foreignField: '_id',
          as: 'copyright'
        }
      },
      { $unwind: '$copyright' },
      {
        $group: {
          _id: {
            userId: '$userId',
            copyrightId: '$copyrightId'
          },
          shareCount: { $sum: 1 },
          firstOwnedAt: { $min: '$createdAt' },
          user: { $first: '$user' },
          copyright: { $first: '$copyright' }
        }
      }
    ];

    if (Object.keys(matchQuery).length > 0) {
      pipeline.push({ $match: matchQuery });
    }

    pipeline.push(
      { $sort: { firstOwnedAt: -1 } },
      { $skip: skip },
      { $limit: pageSize }
    );

    const shares = await CopyrightShare.aggregate(pipeline);

    // 获取总数
    let totalPipeline = [
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'user'
        }
      },
      { $unwind: '$user' },
      {
        $lookup: {
          from: 'copyrights',
          localField: 'copyrightId',
          foreignField: '_id',
          as: 'copyright'
        }
      },
      { $unwind: '$copyright' },
      {
        $group: {
          _id: {
            userId: '$userId',
            copyrightId: '$copyrightId'
          }
        }
      }
    ];

    if (Object.keys(matchQuery).length > 0) {
      totalPipeline.push({ $match: matchQuery });
    }

    totalPipeline.push({ $count: 'total' });

    const totalResult = await CopyrightShare.aggregate(totalPipeline);
    const total = totalResult.length > 0 ? totalResult[0].total : 0;

    // 格式化返回数据
    const formattedShares = shares.map(s => ({
      userId: s._id.userId,
      copyrightId: s._id.copyrightId,
      shareCount: s.shareCount,
      firstOwnedAt: s.firstOwnedAt,
      user: s.user,
      copyright: s.copyright
    }));

    res.json({
      code: 200,
      message: '获取成功',
      data: {
        list: formattedShares,
        total,
        page,
        pageSize
      }
    });
  } catch (error: any) {
    console.error('获取份额列表错误:', error);
    res.status(500).json({
      code: 500,
      message: error.message || '获取失败',
      data: null
    });
  }
});

/**
 * 获取份额统计
 */
router.get('/shares/stats', async (req: AuthRequest, res: Response) => {
  try {
    // 最受欢迎的版权（持有份额数最多）
    const popularCopyrights = await CopyrightShare.aggregate([
      {
        $group: {
          _id: '$copyrightId',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      },
      {
        $limit: 10
      },
      {
        $lookup: {
          from: 'copyrights',
          localField: '_id',
          foreignField: '_id',
          as: 'copyright'
        }
      },
      {
        $unwind: '$copyright'
      }
    ]);

    res.json({
      code: 200,
      message: '获取成功',
      data: {
        popular: popularCopyrights
      }
    });
  } catch (error: any) {
    console.error('获取份额统计错误:', error);
    res.status(500).json({
      code: 500,
      message: error.message || '获取失败',
      data: null
    });
  }
});

/**
 * 获取用户总数
 */
router.get('/users/count', async (req: AuthRequest, res: Response) => {
  try {
    const count = await User.countDocuments();
    res.json({
      code: 200,
      message: '获取成功',
      data: { count }
    });
  } catch (error: any) {
    console.error('获取用户总数错误:', error);
    res.status(500).json({
      code: 500,
      message: error.message || '获取失败',
      data: null
    });
  }
});


export default router;

