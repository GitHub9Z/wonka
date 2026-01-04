"use strict";
/**
 * 艺术馆相关路由（挂机产币、开箱等）
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
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const galleryCoinService = __importStar(require("../services/galleryCoinService"));
const boxService = __importStar(require("../services/boxService"));
const seriesBuffService = __importStar(require("../services/seriesBuffService"));
const router = (0, express_1.Router)();
// 所有接口都需要认证
router.use(auth_1.authenticate);
/**
 * 领取挂机收益
 */
router.post('/coins/claim', async (req, res) => {
    try {
        const userId = req.user.userId;
        const coins = await galleryCoinService.claimCoins(userId);
        res.json({
            code: 200,
            message: '领取成功',
            data: {
                coins,
                totalCoins: req.user.galleryCoins || 0
            }
        });
    }
    catch (error) {
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
router.get('/coins/info', async (req, res) => {
    try {
        const userId = req.user.userId;
        const coinsPerHour = await galleryCoinService.calculateCoins(userId);
        res.json({
            code: 200,
            message: '获取成功',
            data: {
                coinsPerHour,
                totalCoins: req.user.galleryCoins || 0
            }
        });
    }
    catch (error) {
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
router.post('/offline', async (req, res) => {
    try {
        const userId = req.user.userId;
        await galleryCoinService.recordOfflineTime(userId);
        res.json({
            code: 200,
            message: '记录成功',
            data: null
        });
    }
    catch (error) {
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
router.post('/box/normal', async (req, res) => {
    try {
        const userId = req.user.userId;
        const result = await boxService.openNormalBox(userId);
        res.json({
            code: 200,
            message: '开箱成功',
            data: result
        });
    }
    catch (error) {
        console.error('开箱错误:', error);
        res.status(500).json({
            code: 500,
            message: error.message || '开箱失败',
            data: null
        });
    }
});
/**
 * 开系列箱
 */
router.post('/box/series', async (req, res) => {
    try {
        const userId = req.user.userId;
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
    }
    catch (error) {
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
router.post('/fragment/synthesize', async (req, res) => {
    try {
        const userId = req.user.userId;
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
    }
    catch (error) {
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
router.get('/buffs', async (req, res) => {
    try {
        const userId = req.user.userId;
        const effects = await seriesBuffService.getUserBuffEffects(userId);
        res.json({
            code: 200,
            message: '获取成功',
            data: effects
        });
    }
    catch (error) {
        console.error('获取buff效果错误:', error);
        res.status(500).json({
            code: 500,
            message: error.message || '获取失败',
            data: null
        });
    }
});
exports.default = router;
