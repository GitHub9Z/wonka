"use strict";
/**
 * 用户路由
 */
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
/**
 * 获取用户信息
 */
router.get('/info', auth_1.authenticate, async (req, res) => {
    try {
        const user = req.user;
        res.json({
            code: 200,
            message: '获取成功',
            data: {
                id: user._id.toString(),
                nickname: user.nickname,
                avatar: user.avatar,
                coins: user.coins,
                level: user.level,
                experience: user.experience
            }
        });
    }
    catch (error) {
        console.error('获取用户信息错误:', error);
        res.status(500).json({
            code: 500,
            message: error.message || '获取失败',
            data: null
        });
    }
});
exports.default = router;
