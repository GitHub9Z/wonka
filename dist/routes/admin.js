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
const User_1 = __importDefault(require("../models/User"));
const Series_1 = __importDefault(require("../models/Series"));
const Copyright_1 = __importDefault(require("../models/Copyright"));
const CopyrightShare_1 = __importDefault(require("../models/CopyrightShare"));
const Box_1 = __importDefault(require("../models/Box"));
const router = (0, express_1.Router)();
// 所有管理接口都需要认证（除了登录接口）
router.use(auth_1.authenticate);
/**
 * 获取统计数据
 */
router.get('/stats', async (req, res) => {
    try {
        const totalCopyrights = await Copyright_1.default.countDocuments();
        const totalUsers = await User_1.default.countDocuments();
        const totalShares = await CopyrightShare_1.default.countDocuments();
        // 按系列统计版权数量
        const seriesStats = await Copyright_1.default.aggregate([
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
        const recentCopyrights = await Copyright_1.default.countDocuments({
            createdAt: { $gte: sevenDaysAgo }
        });
        const recentUsers = await User_1.default.countDocuments({
            createdAt: { $gte: sevenDaysAgo }
        });
        const recentShares = await CopyrightShare_1.default.countDocuments({
            createdAt: { $gte: sevenDaysAgo }
        });
        const totalBoxes = await Box_1.default.countDocuments();
        const recentBoxes = await Box_1.default.countDocuments({
            createdAt: { $gte: sevenDaysAgo }
        });
        res.json({
            code: 200,
            message: '获取成功',
            data: {
                total: {
                    copyrights: totalCopyrights,
                    users: totalUsers,
                    shares: totalShares,
                    boxes: totalBoxes
                },
                series: seriesStats,
                recent: {
                    copyrights: recentCopyrights,
                    users: recentUsers,
                    shares: recentShares,
                    boxes: recentBoxes
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
 * 获取版权列表（管理）
 */
router.get('/copyrights', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const pageSize = parseInt(req.query.pageSize) || 20;
        const skip = (page - 1) * pageSize;
        const keyword = req.query.keyword;
        const seriesId = req.query.seriesId;
        const query = {};
        if (seriesId) {
            query.seriesId = seriesId;
        }
        if (keyword) {
            query.$or = [
                { name: { $regex: keyword, $options: 'i' } },
                { description: { $regex: keyword, $options: 'i' } }
            ];
        }
        const copyrights = await Copyright_1.default.find(query)
            .populate('seriesId', 'name')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(pageSize);
        const total = await Copyright_1.default.countDocuments(query);
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
    }
    catch (error) {
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
router.get('/copyrights/count', async (req, res) => {
    try {
        const count = await Copyright_1.default.countDocuments();
        res.json({
            code: 200,
            message: '获取成功',
            data: { count }
        });
    }
    catch (error) {
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
router.get('/copyrights/:id', async (req, res) => {
    try {
        const copyright = await Copyright_1.default.findById(req.params.id).populate('seriesId', 'name');
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
    }
    catch (error) {
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
router.post('/copyrights', async (req, res) => {
    try {
        const { name, description, image, seriesId, totalShares, price, merchandiseStatus } = req.body;
        if (!name || !description || !image || !seriesId || !totalShares || !price) {
            return res.status(400).json({
                code: 400,
                message: '缺少必要字段',
                data: null
            });
        }
        const copyright = new Copyright_1.default({
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
    }
    catch (error) {
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
router.put('/copyrights/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;
        const copyright = await Copyright_1.default.findByIdAndUpdate(id, { $set: updates }, { new: true, runValidators: true });
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
    }
    catch (error) {
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
router.delete('/copyrights/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const copyright = await Copyright_1.default.findByIdAndDelete(id);
        if (!copyright) {
            return res.status(404).json({
                code: 404,
                message: '版权不存在',
                data: null
            });
        }
        // 同时删除相关的份额记录
        await CopyrightShare_1.default.deleteMany({ copyrightId: id });
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
        const keyword = req.query.keyword;
        let query = {};
        if (keyword) {
            query.$or = [
                { nickname: { $regex: keyword, $options: 'i' } },
                { openId: { $regex: keyword, $options: 'i' } }
            ];
        }
        const users = await User_1.default.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(pageSize);
        const total = await User_1.default.countDocuments(query);
        // 检查每个用户今日是否已领取免费盲盒
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayEnd = new Date(today);
        todayEnd.setHours(23, 59, 59, 999);
        const usersWithBoxStatus = await Promise.all(users.map(async (user) => {
            const todayBox = await Box_1.default.findOne({
                userId: user._id,
                boxType: 'free',
                createdAt: {
                    $gte: today,
                    $lte: todayEnd
                }
            });
            return {
                ...user.toObject(),
                freeBoxClaimed: !!todayBox
            };
        }));
        res.json({
            code: 200,
            message: '获取成功',
            data: {
                list: usersWithBoxStatus,
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
 * 获取系列列表
 */
router.get('/series', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const pageSize = parseInt(req.query.pageSize) || 20;
        const skip = (page - 1) * pageSize;
        const keyword = req.query.keyword;
        let query = {};
        if (keyword) {
            query.name = { $regex: keyword, $options: 'i' };
        }
        const series = await Series_1.default.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(pageSize);
        const total = await Series_1.default.countDocuments(query);
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
    }
    catch (error) {
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
router.get('/copyrights', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const pageSize = parseInt(req.query.pageSize) || 20;
        const skip = (page - 1) * pageSize;
        const keyword = req.query.keyword;
        let query = {};
        if (keyword) {
            query.name = { $regex: keyword, $options: 'i' };
        }
        const copyrights = await Copyright_1.default.find(query)
            .populate('seriesId', 'name')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(pageSize);
        const total = await Copyright_1.default.countDocuments(query);
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
    }
    catch (error) {
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
router.post('/series', async (req, res) => {
    try {
        const { name, description, image, hourlyBonusCoins } = req.body;
        if (!name || !description || !image || hourlyBonusCoins === undefined) {
            return res.status(400).json({
                code: 400,
                message: '缺少必要字段',
                data: null
            });
        }
        const series = new Series_1.default({
            name,
            description,
            image,
            hourlyBonusCoins: Number(hourlyBonusCoins) || 0,
            copyrightIds: []
        });
        await series.save();
        res.json({
            code: 200,
            message: '创建成功',
            data: series
        });
    }
    catch (error) {
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
router.get('/series/count', async (req, res) => {
    try {
        const count = await Series_1.default.countDocuments();
        res.json({
            code: 200,
            message: '获取成功',
            data: { count }
        });
    }
    catch (error) {
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
router.get('/series/:id', async (req, res) => {
    try {
        const series = await Series_1.default.findById(req.params.id);
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
    }
    catch (error) {
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
router.put('/series/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;
        const series = await Series_1.default.findByIdAndUpdate(id, { $set: updates }, { new: true, runValidators: true });
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
    }
    catch (error) {
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
router.delete('/series/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const series = await Series_1.default.findByIdAndDelete(id);
        if (!series) {
            return res.status(404).json({
                code: 404,
                message: '系列不存在',
                data: null
            });
        }
        // 同时删除相关的版权记录
        await Copyright_1.default.deleteMany({ seriesId: id });
        res.json({
            code: 200,
            message: '删除成功',
            data: null
        });
    }
    catch (error) {
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
router.post('/copyrights', async (req, res) => {
    try {
        const { name, description, image, seriesId, totalShares, price, merchandiseStatus } = req.body;
        if (!name || !description || !image || !seriesId || !totalShares || !price) {
            return res.status(400).json({
                code: 400,
                message: '缺少必要字段',
                data: null
            });
        }
        const copyright = new Copyright_1.default({
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
    }
    catch (error) {
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
router.get('/copyrights/count', async (req, res) => {
    try {
        const count = await Copyright_1.default.countDocuments();
        res.json({
            code: 200,
            message: '获取成功',
            data: { count }
        });
    }
    catch (error) {
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
router.get('/copyrights/:id', async (req, res) => {
    try {
        const copyright = await Copyright_1.default.findById(req.params.id).populate('seriesId', 'name');
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
    }
    catch (error) {
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
router.put('/copyrights/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;
        const copyright = await Copyright_1.default.findByIdAndUpdate(id, { $set: updates }, { new: true, runValidators: true });
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
    }
    catch (error) {
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
router.delete('/copyrights/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const copyright = await Copyright_1.default.findByIdAndDelete(id);
        if (!copyright) {
            return res.status(404).json({
                code: 404,
                message: '版权不存在',
                data: null
            });
        }
        // 同时删除相关的份额记录
        await CopyrightShare_1.default.deleteMany({ copyrightId: id });
        res.json({
            code: 200,
            message: '删除成功',
            data: null
        });
    }
    catch (error) {
        console.error('删除版权错误:', error);
        res.status(500).json({
            code: 500,
            message: error.message || '删除失败',
            data: null
        });
    }
});
/**
 * 创建份额
 */
router.post('/shares', async (req, res) => {
    try {
        const { userId, copyrightId, blockchainHash } = req.body;
        if (!userId || !copyrightId || !blockchainHash) {
            return res.status(400).json({
                code: 400,
                message: '缺少必要字段',
                data: null
            });
        }
        const share = new CopyrightShare_1.default({
            userId,
            copyrightId,
            blockchainHash,
            inLotteryPool: false,
            giftCount: 0
        });
        await share.save();
        // 更新版权的已售份额
        await Copyright_1.default.findByIdAndUpdate(copyrightId, {
            $inc: { soldShares: 1 }
        });
        res.json({
            code: 200,
            message: '创建成功',
            data: share
        });
    }
    catch (error) {
        console.error('创建份额错误:', error);
        res.status(500).json({
            code: 500,
            message: error.message || '创建失败',
            data: null
        });
    }
});
/**
 * 获取份额统计
 */
router.get('/shares/stats', async (req, res) => {
    try {
        // 最受欢迎的版权（持有份额数最多）
        const popularCopyrights = await CopyrightShare_1.default.aggregate([
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
    }
    catch (error) {
        console.error('获取份额统计错误:', error);
        res.status(500).json({
            code: 500,
            message: error.message || '获取失败',
            data: null
        });
    }
});
/**
 * 获取份额详情
 */
router.get('/shares/:id', async (req, res) => {
    try {
        const share = await CopyrightShare_1.default.findById(req.params.id)
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
    }
    catch (error) {
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
router.put('/shares/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;
        const share = await CopyrightShare_1.default.findByIdAndUpdate(id, { $set: updates }, { new: true, runValidators: true });
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
    }
    catch (error) {
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
router.delete('/shares/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const share = await CopyrightShare_1.default.findById(id);
        if (!share) {
            return res.status(404).json({
                code: 404,
                message: '份额不存在',
                data: null
            });
        }
        await CopyrightShare_1.default.findByIdAndDelete(id);
        // 更新版权的已售份额
        await Copyright_1.default.findByIdAndUpdate(share.copyrightId, {
            $inc: { soldShares: -1 }
        });
        res.json({
            code: 200,
            message: '删除成功',
            data: null
        });
    }
    catch (error) {
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
router.get('/shares', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const pageSize = parseInt(req.query.pageSize) || 20;
        const skip = (page - 1) * pageSize;
        const keyword = req.query.keyword;
        let matchQuery = {};
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
        pipeline.push({ $sort: { firstOwnedAt: -1 } }, { $skip: skip }, { $limit: pageSize });
        const shares = await CopyrightShare_1.default.aggregate(pipeline);
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
        const totalResult = await CopyrightShare_1.default.aggregate(totalPipeline);
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
    }
    catch (error) {
        console.error('获取份额列表错误:', error);
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
router.get('/users/count', async (req, res) => {
    try {
        const count = await User_1.default.countDocuments();
        res.json({
            code: 200,
            message: '获取成功',
            data: { count }
        });
    }
    catch (error) {
        console.error('获取用户总数错误:', error);
        res.status(500).json({
            code: 500,
            message: error.message || '获取失败',
            data: null
        });
    }
});
/**
 * 获取开箱记录列表
 */
router.get('/boxes', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const pageSize = parseInt(req.query.pageSize) || 20;
        const skip = (page - 1) * pageSize;
        const userId = req.query.userId;
        const boxType = req.query.boxType;
        const query = {};
        if (userId) {
            query.userId = userId;
        }
        if (boxType) {
            query.boxType = boxType;
        }
        const boxes = await Box_1.default.find(query)
            .populate('userId', 'nickname avatar')
            .populate('copyrightId', 'name image')
            .populate('seriesId', 'name')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(pageSize);
        const total = await Box_1.default.countDocuments(query);
        res.json({
            code: 200,
            message: '获取成功',
            data: {
                list: boxes,
                total,
                page,
                pageSize
            }
        });
    }
    catch (error) {
        console.error('获取开箱记录错误:', error);
        res.status(500).json({
            code: 500,
            message: error.message || '获取失败',
            data: null
        });
    }
});
/**
 * 获取开箱记录统计
 */
router.get('/boxes/stats', async (req, res) => {
    try {
        const totalBoxes = await Box_1.default.countDocuments();
        // 按类型统计
        const byType = await Box_1.default.aggregate([
            {
                $group: {
                    _id: '$boxType',
                    count: { $sum: 1 }
                }
            }
        ]);
        // 按奖励类型统计
        const byReward = await Box_1.default.aggregate([
            {
                $group: {
                    _id: '$rewardType',
                    count: { $sum: 1 },
                    totalValue: { $sum: '$rewardValue' }
                }
            }
        ]);
        // 最近7天的数据
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const recentBoxes = await Box_1.default.countDocuments({
            createdAt: { $gte: sevenDaysAgo }
        });
        res.json({
            code: 200,
            message: '获取成功',
            data: {
                total: totalBoxes,
                byType,
                byReward,
                recent: recentBoxes
            }
        });
    }
    catch (error) {
        console.error('获取开箱统计错误:', error);
        res.status(500).json({
            code: 500,
            message: error.message || '获取失败',
            data: null
        });
    }
});
/**
 * 获取单个开箱记录详情
 */
router.get('/boxes/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const box = await Box_1.default.findById(id)
            .populate('userId', 'nickname avatar')
            .populate('copyrightId', 'name image seriesId')
            .populate('seriesId', 'name');
        if (!box) {
            return res.status(404).json({
                code: 404,
                message: '开箱记录不存在',
                data: null
            });
        }
        res.json({
            code: 200,
            message: '获取成功',
            data: box
        });
    }
    catch (error) {
        console.error('获取开箱记录详情错误:', error);
        res.status(500).json({
            code: 500,
            message: error.message || '获取失败',
            data: null
        });
    }
});
exports.default = router;
