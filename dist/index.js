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
const database_1 = require("./config/database");
const errorHandler_1 = require("./middleware/errorHandler");
const auth_1 = __importDefault(require("./routes/auth"));
const user_1 = __importDefault(require("./routes/user"));
const artwork_1 = __importDefault(require("./routes/artwork"));
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
app.use('/api/auth', auth_1.default);
app.use('/api/user', user_1.default);
app.use('/api/artworks', artwork_1.default);
app.use('/api/shop', shop_1.default);
app.use('/api/collection', collection_1.default);
app.use('/api/admin', admin_1.default);
app.use('/api/admin', adminAuth_1.default); // 管理员登录
app.use('/api/gallery', gallery_1.default);
app.use('/api/appreciation', appreciation_1.default);
app.use('/api/copyright', copyright_1.default);
app.use('/api/dividend', dividend_1.default);
app.use('/api/lottery', lottery_1.default);
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
    try {
        // 连接数据库
        await (0, database_1.connectDatabase)();
        console.log('[INFO] 数据库连接成功');
        // 启动服务器
        app.listen(PORT, () => {
            console.log(`[INFO] 服务器运行在 http://localhost:${PORT}`);
            console.log(`[INFO] API 文档: http://localhost:${PORT}/health`);
            console.log(`[INFO] 后台管理: http://localhost:${PORT}/admin`);
        });
    }
    catch (error) {
        console.error('[ERROR] 服务器启动失败:', error);
        process.exit(1);
    }
}
startServer();
