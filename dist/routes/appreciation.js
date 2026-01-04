"use strict";
/**
 * 鉴赏相关路由
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
const appreciationService = __importStar(require("../services/appreciationService"));
const router = (0, express_1.Router)();
// 所有接口都需要认证
router.use(auth_1.authenticate);
/**
 * 鉴赏他人艺术馆
 */
router.post('/appreciate', async (req, res) => {
    try {
        const userId = req.user.userId;
        const { targetUserId, copyrightId, watchDuration } = req.body;
        if (!targetUserId || !copyrightId || !watchDuration) {
            return res.status(400).json({
                code: 400,
                message: '缺少必要参数',
                data: null
            });
        }
        const result = await appreciationService.appreciate(userId, targetUserId, copyrightId, watchDuration);
        res.json({
            code: 200,
            message: '鉴赏成功',
            data: result
        });
    }
    catch (error) {
        console.error('鉴赏错误:', error);
        res.status(500).json({
            code: 500,
            message: error.message || '鉴赏失败',
            data: null
        });
    }
});
/**
 * 获取今日鉴赏次数
 */
router.get('/appreciation/count', async (req, res) => {
    try {
        const userId = req.user.userId;
        const result = await appreciationService.getTodayAppreciationCount(userId);
        res.json({
            code: 200,
            message: '获取成功',
            data: result
        });
    }
    catch (error) {
        console.error('获取鉴赏次数错误:', error);
        res.status(500).json({
            code: 500,
            message: error.message || '获取失败',
            data: null
        });
    }
});
/**
 * 兑换人气值奖励
 */
router.post('/popularity/exchange', async (req, res) => {
    try {
        const userId = req.user.userId;
        await appreciationService.exchangePopularityReward(userId);
        res.json({
            code: 200,
            message: '兑换成功',
            data: null
        });
    }
    catch (error) {
        console.error('兑换人气值奖励错误:', error);
        res.status(500).json({
            code: 500,
            message: error.message || '兑换失败',
            data: null
        });
    }
});
exports.default = router;
