"use strict";
/**
 * 认证路由
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const User_1 = __importDefault(require("../models/User"));
const jwt_1 = require("../utils/jwt");
const router = (0, express_1.Router)();
/**
 * 微信登录
 */
router.post('/login', async (req, res) => {
    try {
        const { code, userInfo } = req.body;
        if (!code) {
            return res.status(400).json({
                code: 400,
                message: '缺少登录凭证',
                data: null
            });
        }
        // TODO: 这里应该调用微信 API 获取 openId
        // 为了演示，我们使用 code 作为 openId（实际项目中需要调用微信接口）
        const openId = `openid_${code}`;
        // 查找或创建用户
        let user = await User_1.default.findOne({ openId });
        if (!user) {
            // 创建新用户
            user = new User_1.default({
                openId,
                nickname: userInfo?.nickName || '艺术收藏家',
                avatar: userInfo?.avatarUrl || 'https://via.placeholder.com/200',
                coins: 1000,
                level: 1,
                experience: 0
            });
            await user.save();
        }
        else {
            // 更新用户信息
            if (userInfo) {
                user.nickname = userInfo.nickName || user.nickname;
                user.avatar = userInfo.avatarUrl || user.avatar;
                await user.save();
            }
        }
        // 生成 token
        const token = (0, jwt_1.generateToken)(user._id.toString());
        res.json({
            code: 200,
            message: '登录成功',
            data: {
                token,
                userInfo: {
                    id: user._id.toString(),
                    nickname: user.nickname,
                    avatar: user.avatar,
                    coins: user.coins,
                    level: user.level,
                    experience: user.experience
                }
            }
        });
    }
    catch (error) {
        console.error('登录错误:', error);
        res.status(500).json({
            code: 500,
            message: error.message || '登录失败',
            data: null
        });
    }
});
exports.default = router;
