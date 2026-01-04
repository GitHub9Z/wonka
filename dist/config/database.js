"use strict";
/**
 * 数据库配置
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectDatabase = connectDatabase;
exports.disconnectDatabase = disconnectDatabase;
const mongoose_1 = __importDefault(require("mongoose"));
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/wonka';
/**
 * 连接数据库
 */
async function connectDatabase() {
    try {
        await mongoose_1.default.connect(MONGODB_URI);
        console.log('[INFO] MongoDB 连接成功');
    }
    catch (error) {
        console.error('[ERROR] MongoDB 连接失败:', error);
        throw error;
    }
}
/**
 * 断开数据库连接
 */
async function disconnectDatabase() {
    try {
        await mongoose_1.default.disconnect();
        console.log('[INFO] MongoDB 连接已断开');
    }
    catch (error) {
        console.error('[ERROR] 断开 MongoDB 连接失败:', error);
        throw error;
    }
}
