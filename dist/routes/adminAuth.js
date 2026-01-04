"use strict";
/**
 * 后台管理登录路由
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const router = (0, express_1.Router)();
// 简单的管理员账号（生产环境应该从数据库读取）
const ADMIN_USERS = [
    {
        username: 'admin',
        password: 'admin123' // 生产环境应该使用加密密码
    }
];
/**
 * 管理员登录
 */
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        if (!username || !password) {
            return res.status(400).json({
                code: 400,
                message: '用户名和密码不能为空',
                data: null
            });
        }
        // 验证用户名和密码
        const admin = ADMIN_USERS.find(u => u.username === username && u.password === password);
        if (!admin) {
            return res.status(401).json({
                code: 401,
                message: '用户名或密码错误',
                data: null
            });
        }
        // 生成JWT token
        const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
        const token = jsonwebtoken_1.default.sign({ userId: admin.username, role: 'admin' }, JWT_SECRET, { expiresIn: '7d' });
        res.json({
            code: 200,
            message: '登录成功',
            data: {
                token,
                userInfo: {
                    username: admin.username,
                    role: 'admin'
                }
            }
        });
    }
    catch (error) {
        console.error('管理员登录错误:', error);
        res.status(500).json({
            code: 500,
            message: error.message || '登录失败',
            data: null
        });
    }
});
exports.default = router;
