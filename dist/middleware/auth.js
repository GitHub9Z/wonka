"use strict";
/**
 * 认证中间件
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticate = authenticate;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const User_1 = __importDefault(require("../models/User"));
/**
 * JWT 认证中间件
 */
async function authenticate(req, res, next) {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '');
        if (!token) {
            res.status(401).json({
                code: 401,
                message: '未提供认证令牌',
                data: null
            });
            return;
        }
        const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
        const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        // 检查是否为管理员
        if (decoded.role === 'admin') {
            req.userId = decoded.userId;
            req.user = {
                userId: decoded.userId,
                role: 'admin',
                isAdmin: true
            };
            return next();
        }
        // 普通用户认证
        const user = await User_1.default.findById(decoded.userId);
        if (!user) {
            res.status(401).json({
                code: 401,
                message: '用户不存在',
                data: null
            });
            return;
        }
        req.userId = decoded.userId;
        req.user = {
            userId: decoded.userId,
            galleryCoins: user.galleryCoins || 0,
            popularity: user.popularity || 0,
            isMinor: user.isMinor || false,
            ...user.toObject()
        };
        next();
    }
    catch (error) {
        res.status(401).json({
            code: 401,
            message: '认证令牌无效',
            data: null
        });
    }
}
