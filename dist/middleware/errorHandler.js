"use strict";
/**
 * 错误处理中间件
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = errorHandler;
function errorHandler(err, req, res, next) {
    console.error('错误:', err);
    // 默认错误响应
    res.status(500).json({
        code: 500,
        message: err.message || '服务器内部错误',
        data: null
    });
}
