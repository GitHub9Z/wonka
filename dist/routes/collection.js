"use strict";
/**
 * 收藏路由（版权份额）
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const CopyrightShare_1 = __importDefault(require("../models/CopyrightShare"));
const Series_1 = __importDefault(require("../models/Series"));
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
/**
 * 获取用户收藏列表（按版权分组显示份额数）
 */
router.get('/', auth_1.authenticate, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const pageSize = parseInt(req.query.pageSize) || 20;
        const skip = (page - 1) * pageSize;
        // 系列筛选
        const series = req.query.series;
        let seriesId = null;
        if (series && series !== '全部系列') {
            const seriesDoc = await Series_1.default.findOne({ name: series });
            if (seriesDoc) {
                seriesId = seriesDoc._id;
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
        // 使用聚合查询按版权分组统计份额
        const pipeline = [
            { $match: { userId: req.userId } },
            {
                $group: {
                    _id: '$copyrightId',
                    shareCount: { $sum: 1 },
                    firstOwnedAt: { $min: '$createdAt' }
                }
            },
            {
                $lookup: {
                    from: 'copyrights',
                    localField: '_id',
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
            { $unwind: '$series' }
        ];
        // 添加系列筛选
        if (seriesId) {
            pipeline.push({
                $match: { 'copyright.seriesId': seriesId }
            });
        }
        // 构建排序条件
        const sort = req.query.sort;
        let sortOption = { firstOwnedAt: -1 }; // 默认按获得时间倒序
        if (sort) {
            switch (sort) {
                case 'price':
                    sortOption = { 'copyright.price': 1 }; // 价格从低到高
                    break;
                case '-price':
                    sortOption = { 'copyright.price': -1 }; // 价格从高到低
                    break;
                case 'createdAt':
                default:
                    sortOption = { firstOwnedAt: -1 };
                    break;
            }
        }
        // 添加排序
        pipeline.push({ $sort: sortOption });
        // 获取总数（在分页前）
        const totalPipeline = [...pipeline, { $count: 'total' }];
        const totalResult = await CopyrightShare_1.default.aggregate(totalPipeline);
        const total = totalResult.length > 0 ? totalResult[0].total : 0;
        // 分页
        pipeline.push({ $skip: skip });
        pipeline.push({ $limit: pageSize });
        const collections = await CopyrightShare_1.default.aggregate(pipeline);
        // 格式化返回数据
        const formattedCollections = collections.map(c => ({
            ...c.copyright,
            shareCount: c.shareCount,
            ownedAt: c.firstOwnedAt,
            seriesName: c.series.name
        }));
        res.json({
            code: 200,
            message: '获取成功',
            data: {
                list: formattedCollections,
                total,
                page,
                pageSize
            }
        });
    }
    catch (error) {
        console.error('获取收藏列表错误:', error);
        res.status(500).json({
            code: 500,
            message: error.message || '获取失败',
            data: null
        });
    }
});
exports.default = router;
