"use strict";
/**
 * 商店路由
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const Copyright_1 = __importDefault(require("../models/Copyright"));
const CopyrightShare_1 = __importDefault(require("../models/CopyrightShare"));
const Series_1 = __importDefault(require("../models/Series"));
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
/**
 * 获取商店版权列表（带持有份额信息）
 */
router.get('/', auth_1.authenticate, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const pageSize = parseInt(req.query.pageSize) || 20;
        const skip = (page - 1) * pageSize;
        // 构建查询条件
        const query = {};
        // 系列筛选（支持 series 名称或 seriesId）
        const series = req.query.series;
        const seriesId = req.query.seriesId;
        if (seriesId) {
            // 直接使用 seriesId
            query.seriesId = seriesId;
        }
        else if (series && series !== '全部系列') {
            // 通过系列名称查找系列ID
            const seriesDoc = await Series_1.default.findOne({ name: series });
            if (seriesDoc) {
                query.seriesId = seriesDoc._id;
            }
            else {
                // 如果系列不存在，返回空列表
                return res.json({
                    code: 200,
                    message: '获取成功',
                    data: {
                        list: [],
                        total: 0,
                        page,
                        pageSize
                    }
                });
            }
        }
        // 构建排序条件
        let sortOption = { createdAt: -1 }; // 默认按创建时间倒序
        const sort = req.query.sort;
        if (sort) {
            switch (sort) {
                case 'price':
                    sortOption = { price: 1 }; // 价格从低到高
                    break;
                case '-price':
                    sortOption = { price: -1 }; // 价格从高到低
                    break;
                case 'createdAt':
                default:
                    sortOption = { createdAt: -1 };
                    break;
            }
        }
        const copyrights = await Copyright_1.default.find(query)
            .populate('seriesId', 'name')
            .sort(sortOption)
            .skip(skip)
            .limit(pageSize);
        // 查询用户持有的版权份额（按版权分组统计）
        const userShares = await CopyrightShare_1.default.aggregate([
            { $match: { userId: req.userId } },
            {
                $group: {
                    _id: '$copyrightId',
                    shareCount: { $sum: 1 }
                }
            }
        ]);
        const shareCountMap = new Map(userShares.map(s => [s._id.toString(), s.shareCount]));
        // 添加持有份额信息
        const copyrightsWithShares = copyrights.map(copyright => {
            const shareCount = shareCountMap.get(copyright._id.toString()) || 0;
            return {
                ...copyright.toObject(),
                ownedShares: shareCount,
                availableShares: copyright.totalShares - copyright.soldShares
            };
        });
        const total = await Copyright_1.default.countDocuments(query);
        res.json({
            code: 200,
            message: '获取成功',
            data: {
                list: copyrightsWithShares,
                total,
                page,
                pageSize
            }
        });
    }
    catch (error) {
        console.error('获取商店列表错误:', error);
        res.status(500).json({
            code: 500,
            message: error.message || '获取失败',
            data: null
        });
    }
});
/**
 * 购买版权份额
 */
router.post('/purchase', auth_1.authenticate, async (req, res) => {
    try {
        const { copyrightId, shareCount = 1 } = req.body;
        if (!copyrightId) {
            return res.status(400).json({
                code: 400,
                message: '缺少版权ID',
                data: null
            });
        }
        if (shareCount < 1 || !Number.isInteger(shareCount)) {
            return res.status(400).json({
                code: 400,
                message: '份额数量必须为正整数',
                data: null
            });
        }
        // 查找版权
        const copyright = await Copyright_1.default.findById(copyrightId);
        if (!copyright) {
            return res.status(404).json({
                code: 404,
                message: '版权不存在',
                data: null
            });
        }
        // 检查可售份额是否足够
        const availableShares = copyright.totalShares - copyright.soldShares;
        if (availableShares < shareCount) {
            return res.status(400).json({
                code: 400,
                message: `可售份额不足，当前可售：${availableShares}份`,
                data: null
            });
        }
        // 检查金币是否足够
        const totalPrice = copyright.price * shareCount;
        const user = req.user;
        if (user.coins < totalPrice) {
            return res.status(400).json({
                code: 400,
                message: '金币不足',
                data: null
            });
        }
        // 扣除金币
        user.coins -= totalPrice;
        await user.save();
        // 创建版权份额记录（每份一条记录）
        const shareRecords = [];
        for (let i = 0; i < shareCount; i++) {
            const share = await CopyrightShare_1.default.create({
                userId: req.userId,
                copyrightId: copyrightId,
                blockchainHash: `0x${Math.random().toString(16).substr(2, 64)}`,
                inLotteryPool: false,
                giftCount: 0
            });
            shareRecords.push(share);
        }
        // 更新版权已售份额
        await Copyright_1.default.findByIdAndUpdate(copyrightId, {
            $inc: { soldShares: shareCount }
        });
        // 返回版权信息
        const copyrightData = {
            ...copyright.toObject(),
            purchasedShares: shareCount,
            totalPrice
        };
        res.json({
            code: 200,
            message: '购买成功',
            data: {
                copyright: copyrightData,
                remainingCoins: user.coins,
                shareCount
            }
        });
    }
    catch (error) {
        console.error('购买版权份额错误:', error);
        res.status(500).json({
            code: 500,
            message: error.message || '购买失败',
            data: null
        });
    }
});
exports.default = router;
