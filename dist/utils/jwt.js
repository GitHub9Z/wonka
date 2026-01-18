"use strict";
/**
 * JWT 工具函数
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateToken = generateToken;
exports.verifyToken = verifyToken;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
/**
 * 获取 JWT Secret（运行时读取，确保环境变量已加载）
 */
function getJwtSecret() {
    return process.env.JWT_SECRET || 'your-secret-key';
}
/**
 * 获取 JWT 过期时间
 */
function getJwtExpiresIn() {
    return process.env.JWT_EXPIRES_IN || '7d';
}
/**
 * 生成 JWT Token
 */
function generateToken(userId) {
    const JWT_SECRET = getJwtSecret();
    const JWT_EXPIRES_IN = getJwtExpiresIn();
    console.log('[JWT] 生成 token, JWT_SECRET 长度:', JWT_SECRET.length);
    return jsonwebtoken_1.default.sign({ userId }, JWT_SECRET, {
        expiresIn: JWT_EXPIRES_IN
    });
}
/**
 * 验证 JWT Token
 */
function verifyToken(token) {
    try {
        const JWT_SECRET = getJwtSecret();
        return jsonwebtoken_1.default.verify(token, JWT_SECRET);
    }
    catch (error) {
        return null;
    }
}
