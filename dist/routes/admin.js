"use strict";
/**
 * 后台管理路由
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const Artwork_1 = __importDefault(require("../models/Artwork"));
const User_1 = __importDefault(require("../models/User"));
const Collection_1 = __importDefault(require("../models/Collection"));
const router = (0, express_1.Router)();
// 所有管理接口都需要认证（除了登录接口）
router.use(auth_1.authenticate);
/**
 * 获取统计数据
 */
router.get('/stats', async (req, res) => {
    try {
        const totalArtworks = await Artwork_1.default.countDocuments();
        const totalUsers = await User_1.default.countDocuments();
        const totalCollections = await Collection_1.default.countDocuments();
        // 按稀有度统计
        const rarityStats = await Artwork_1.default.aggregate([
            {
                $group: {
                    _id: '$rarity',
                    count: { $sum: 1 }
                }
            }
        ]);
        // 最近7天的数据
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const recentArtworks = await Artwork_1.default.countDocuments({
            createdAt: { $gte: sevenDaysAgo }
        });
        const recentUsers = await User_1.default.countDocuments({
            createdAt: { $gte: sevenDaysAgo }
        });
        const recentCollections = await Collection_1.default.countDocuments({
            createdAt: { $gte: sevenDaysAgo }
        });
        res.json({
            code: 200,
            message: '获取成功',
            data: {
                total: {
                    artworks: totalArtworks,
                    users: totalUsers,
                    collections: totalCollections
                },
                rarity: rarityStats,
                recent: {
                    artworks: recentArtworks,
                    users: recentUsers,
                    collections: recentCollections
                }
            }
        });
    }
    catch (error) {
        console.error('获取统计数据错误:', error);
        res.status(500).json({
            code: 500,
            message: error.message || '获取失败',
            data: null
        });
    }
});
/**
 * 获取藏品列表（管理）
 */
router.get('/artworks', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const pageSize = parseInt(req.query.pageSize) || 20;
        const skip = (page - 1) * pageSize;
        const rarity = req.query.rarity;
        const keyword = req.query.keyword;
        const query = {};
        if (rarity) {
            query.rarity = rarity;
        }
        if (keyword) {
            query.$or = [
                { name: { $regex: keyword, $options: 'i' } },
                { artist: { $regex: keyword, $options: 'i' } },
                { description: { $regex: keyword, $options: 'i' } }
            ];
        }
        const artworks = await Artwork_1.default.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(pageSize);
        const total = await Artwork_1.default.countDocuments(query);
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
    }
    catch (error) {
        console.error('获取藏品列表错误:', error);
        res.status(500).json({
            code: 500,
            message: error.message || '获取失败',
            data: null
        });
    }
});
/**
 * 获取单个藏品详情（管理）
 */
router.get('/artworks/:id', async (req, res) => {
    try {
        const artwork = await Artwork_1.default.findById(req.params.id);
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
    }
    catch (error) {
        console.error('获取藏品详情错误:', error);
        res.status(500).json({
            code: 500,
            message: error.message || '获取失败',
            data: null
        });
    }
});
/**
 * 创建藏品
 */
router.post('/artworks', async (req, res) => {
    try {
        const { name, description, image, rarity, price, artist } = req.body;
        if (!name || !description || !image || !rarity || !price || !artist) {
            return res.status(400).json({
                code: 400,
                message: '缺少必要字段',
                data: null
            });
        }
        const artwork = new Artwork_1.default({
            name,
            description,
            image,
            rarity,
            price,
            artist
        });
        await artwork.save();
        res.json({
            code: 200,
            message: '创建成功',
            data: artwork
        });
    }
    catch (error) {
        console.error('创建藏品错误:', error);
        res.status(500).json({
            code: 500,
            message: error.message || '创建失败',
            data: null
        });
    }
});
/**
 * 更新藏品
 */
router.put('/artworks/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;
        const artwork = await Artwork_1.default.findByIdAndUpdate(id, { $set: updates }, { new: true, runValidators: true });
        if (!artwork) {
            return res.status(404).json({
                code: 404,
                message: '藏品不存在',
                data: null
            });
        }
        res.json({
            code: 200,
            message: '更新成功',
            data: artwork
        });
    }
    catch (error) {
        console.error('更新藏品错误:', error);
        res.status(500).json({
            code: 500,
            message: error.message || '更新失败',
            data: null
        });
    }
});
/**
 * 删除藏品
 */
router.delete('/artworks/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const artwork = await Artwork_1.default.findByIdAndDelete(id);
        if (!artwork) {
            return res.status(404).json({
                code: 404,
                message: '藏品不存在',
                data: null
            });
        }
        // 同时删除相关的收藏记录
        await Collection_1.default.deleteMany({ artworkId: id });
        res.json({
            code: 200,
            message: '删除成功',
            data: null
        });
    }
    catch (error) {
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
router.get('/users', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const pageSize = parseInt(req.query.pageSize) || 20;
        const skip = (page - 1) * pageSize;
        const users = await User_1.default.find()
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(pageSize)
            .select('-openId'); // 不返回openId
        const total = await User_1.default.countDocuments();
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
    }
    catch (error) {
        console.error('获取用户列表错误:', error);
        res.status(500).json({
            code: 500,
            message: error.message || '获取失败',
            data: null
        });
    }
});
/**
 * 获取收藏统计
 */
router.get('/collections/stats', async (req, res) => {
    try {
        // 最受欢迎的藏品（收藏数最多）
        const popularArtworks = await Collection_1.default.aggregate([
            {
                $group: {
                    _id: '$artworkId',
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
                    from: 'artworks',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'artwork'
                }
            },
            {
                $unwind: '$artwork'
            }
        ]);
        res.json({
            code: 200,
            message: '获取成功',
            data: {
                popular: popularArtworks
            }
        });
    }
    catch (error) {
        console.error('获取收藏统计错误:', error);
        res.status(500).json({
            code: 500,
            message: error.message || '获取失败',
            data: null
        });
    }
});
exports.default = router;
