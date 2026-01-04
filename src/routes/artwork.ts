/**
 * 藏品路由
 */

import { Router, Request, Response } from 'express';
import Artwork from '../models/Artwork';
import { authenticate, AuthRequest } from '../middleware/auth';
import Collection from '../models/Collection';

const router = Router();

/**
 * 获取藏品列表
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 20;
    const skip = (page - 1) * pageSize;

    const artworks = await Artwork.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(pageSize);

    const total = await Artwork.countDocuments();

    res.json({
      code: 200,
      message: '获取成功',
      data: {
        list: artworks,
        total,
        page,
        pageSize
      }
    });
  } catch (error: any) {
    console.error('获取藏品列表错误:', error);
    res.status(500).json({
      code: 500,
      message: error.message || '获取失败',
      data: null
    });
  }
});

/**
 * 获取藏品详情
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const artwork = await Artwork.findById(req.params.id);

    if (!artwork) {
      return res.status(404).json({
        code: 404,
        message: '藏品不存在',
        data: null
      });
    }

    res.json({
      code: 200,
      message: '获取成功',
      data: artwork
    });
  } catch (error: any) {
    console.error('获取藏品详情错误:', error);
    res.status(500).json({
      code: 500,
      message: error.message || '获取失败',
      data: null
    });
  }
});

export default router;


