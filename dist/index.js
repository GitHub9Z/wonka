"use strict";
/**
 * 服务器入口文件
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
const https_1 = __importDefault(require("https"));
const http_1 = __importDefault(require("http"));
const fs_1 = __importDefault(require("fs"));
const database_1 = require("./config/database");
const errorHandler_1 = require("./middleware/errorHandler");
const auth_1 = __importDefault(require("./routes/auth"));
const user_1 = __importDefault(require("./routes/user"));
// import artworkRoutes from './routes/artwork'; // 已移除，改用 copyright 路由
const shop_1 = __importDefault(require("./routes/shop"));
const collection_1 = __importDefault(require("./routes/collection"));
const admin_1 = __importDefault(require("./routes/admin"));
const gallery_1 = __importDefault(require("./routes/gallery"));
const appreciation_1 = __importDefault(require("./routes/appreciation"));
const copyright_1 = __importDefault(require("./routes/copyright"));
const dividend_1 = __importDefault(require("./routes/dividend"));
const lottery_1 = __importDefault(require("./routes/lottery"));
const adminAuth_1 = __importDefault(require("./routes/adminAuth"));
// 加载环境变量
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3000;
// 中间件
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// 静态文件服务（后台管理页面）
const publicPath = path_1.default.join(__dirname, '../public');
app.use('/admin', express_1.default.static(publicPath));
app.use(express_1.default.static(publicPath));
// 后台管理页面路由
app.get('/admin', (req, res) => {
    res.sendFile(path_1.default.join(publicPath, 'index.html'));
});
// 健康检查
app.get('/health', (req, res) => {
    res.json({ status: 'ok', message: '数字艺术馆 API 服务运行正常' });
});
// API 路由
console.log('[Server] 注册 API 路由...');
app.use('/api/auth', auth_1.default);
console.log('[Server]   ✅ /api/auth - 认证路由');
app.use('/api/user', user_1.default);
// app.use('/api/artworks', artworkRoutes); // 已移除，改用 /api/copyright 路由
app.use('/api/shop', shop_1.default);
app.use('/api/collection', collection_1.default);
app.use('/api/admin-auth', adminAuth_1.default); // 管理员登录
app.use('/api/admin', admin_1.default);
app.use('/api/gallery', gallery_1.default);
app.use('/api/appreciation', appreciation_1.default);
app.use('/api/copyright', copyright_1.default);
app.use('/api/dividend', dividend_1.default);
app.use('/api/lottery', lottery_1.default);
console.log('[Server]   ✅ /api/lottery - 奖池路由');
console.log('[Server] ✅ 所有 API 路由注册完成');
// 错误处理中间件（必须放在最后）
app.use(errorHandler_1.errorHandler);
// 404 处理
app.use((req, res) => {
    res.status(404).json({
        code: 404,
        message: '接口不存在',
        data: null
    });
});
// 启动服务器
async function startServer() {
    console.log('[Server] ========== 服务器启动 ==========');
    console.log('[Server] 启动时间:', new Date().toISOString());
    console.log('[Server] Node.js 版本:', process.version);
    console.log('[Server] 环境变量检查:');
    console.log('[Server]   - NODE_ENV:', process.env.NODE_ENV || '未设置');
    console.log('[Server]   - PORT:', process.env.PORT || '3000 (默认)');
    console.log('[Server]   - MONGODB_URI:', process.env.MONGODB_URI ? '已设置' : '未设置');
    console.log('[Server]   - WECHAT_APPID:', process.env.WECHAT_APPID ? process.env.WECHAT_APPID.substring(0, 10) + '...' : '未设置');
    console.log('[Server]   - WECHAT_SECRET:', process.env.WECHAT_SECRET ? '已设置' : '未设置');
    console.log('[Server]   - JWT_SECRET:', process.env.JWT_SECRET ? '已设置 (长度: ' + process.env.JWT_SECRET.length + ')' : '未设置');
    console.log('[Server]   - SSL_CERT_PATH:', process.env.SSL_CERT_PATH || '未设置');
    console.log('[Server]   - SSL_KEY_PATH:', process.env.SSL_KEY_PATH || '未设置');
    try {
        // 连接数据库
        console.log('[Server] 正在连接数据库...');
        await (0, database_1.connectDatabase)();
        console.log('[Server] ✅ 数据库连接成功');
        const SSL_CERT_PATH = '/ssl/cert.pem';
        const SSL_KEY_PATH = '/ssl/cert.key';
        const HTTPS_PORT = process.env.HTTPS_PORT || 443;
        // 检查是否启用 HTTPS
        if (SSL_CERT_PATH && SSL_KEY_PATH) {
            try {
                // 读取 SSL 证书
                const cert = fs_1.default.readFileSync(SSL_CERT_PATH);
                const key = fs_1.default.readFileSync(SSL_KEY_PATH);
                // 创建 HTTPS 服务器
                const httpsServer = https_1.default.createServer({ cert, key }, app);
                httpsServer.listen(HTTPS_PORT, () => {
                    console.log(`[INFO] HTTPS 服务器运行在 https://localhost:${HTTPS_PORT}`);
                    console.log(`[INFO] API 文档: https://localhost:${HTTPS_PORT}/health`);
                    console.log(`[INFO] 后台管理: https://localhost:${HTTPS_PORT}/admin`);
                });
                // 可选：同时启动 HTTP 服务器并重定向到 HTTPS
                if (process.env.HTTP_REDIRECT_HTTPS === 'true') {
                    const httpApp = (0, express_1.default)();
                    httpApp.use((_req, res) => {
                        const host = _req.headers.host?.replace(/:\d+$/, '') || 'localhost';
                        res.redirect(`https://${host}:${HTTPS_PORT}${_req.url}`);
                    });
                    http_1.default.createServer(httpApp).listen(PORT, () => {
                        console.log(`[INFO] HTTP 服务器运行在 http://localhost:${PORT} (重定向到 HTTPS)`);
                    });
                }
            }
            catch (error) {
                console.error('[ERROR] HTTPS 证书读取失败:', error);
                console.log('[INFO] 回退到 HTTP 模式');
                startHttpServer();
            }
        }
        else {
            // 使用 HTTP
            startHttpServer();
        }
    }
    catch (error) {
        console.error('[ERROR] 服务器启动失败:', error);
        process.exit(1);
    }
}
function startHttpServer() {
    app.listen(PORT, () => {
        console.log(`[INFO] HTTP 服务器运行在 http://localhost:${PORT}`);
        console.log(`[INFO] API 文档: http://localhost:${PORT}/health`);
        console.log(`[INFO] 后台管理: http://localhost:${PORT}/admin`);
    });
}
startServer();
