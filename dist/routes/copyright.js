"use strict";
/**
 * 版权相关路由
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const Copyright_1 = __importDefault(require("../models/Copyright"));
const CopyrightShare_1 = __importDefault(require("../models/CopyrightShare"));
const Series_1 = __importDefault(require("../models/Series"));
const merchandiseService = __importStar(require("../services/merchandiseService"));
const router = (0, express_1.Router)();
/**
 * 获取版权列表
 */
router.get('/', async (req, res) => {
    try {
        const { seriesId } = req.query;
        const query = {};
        if (seriesId) {
            query.seriesId = seriesId;
        }
        const copyrights = await Copyright_1.default.find(query).populate('seriesId', 'name');
        res.json({
            code: 200,
            message: '获取成功',
            data: copyrights
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
 * 获取版权详情
 */
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const copyright = await Copyright_1.default.findById(id).populate('seriesId');
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
            const share = await CopyrightShare_1.default.findOne({
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
 * 获取用户持有的版权份额
 */
router.get('/shares/my', auth_1.authenticate, async (req, res) => {
    try {
        const userId = req.user.userId;
        const shares = await CopyrightShare_1.default.find({ userId })
            .populate('copyrightId', 'name image seriesId')
            .populate('copyrightId.seriesId', 'name');
        res.json({
            code: 200,
            message: '获取成功',
            data: shares
        });
    }
    catch (error) {
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
router.get('/series/list', async (req, res) => {
    try {
        const series = await Series_1.default.find().populate('copyrightIds', 'name image');
        // 如果用户已登录，检查是否集齐系列
        const seriesWithStatus = await Promise.all(series.map(async (s) => {
            let isComplete = false;
            if (req.user && req.user.userId) {
                const shares = await CopyrightShare_1.default.find({
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
 * 获取周边价格（应用折扣）
 */
router.get('/merchandise/price/:copyrightId', auth_1.authenticate, async (req, res) => {
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
        const price = await merchandiseService.getDiscountedPrice(req.user.userId, copyrightId, parseFloat(originalPrice));
        const discount = await merchandiseService.calculateDiscount(req.user.userId, copyrightId);
        res.json({
            code: 200,
            message: '获取成功',
            data: {
                originalPrice: parseFloat(originalPrice),
                discountedPrice: price,
                discount: discount
            }
        });
    }
    catch (error) {
        console.error('获取周边价格错误:', error);
        res.status(500).json({
            code: 500,
            message: error.message || '获取失败',
            data: null
        });
    }
});
exports.default = router;
