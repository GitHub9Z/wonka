"use strict";
/**
 * 数据库初始化脚本
 * 添加示例藏品数据
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const Artwork_1 = __importDefault(require("../models/Artwork"));
const database_1 = require("../config/database");
dotenv_1.default.config();
const sampleArtworks = [
    {
        name: '数字星空',
        description: '一幅描绘数字时代星空的抽象艺术作品，融合了科技与艺术的完美结合。',
        image: 'https://via.placeholder.com/400x400/1a1a2e/e94560?text=数字星空',
        rarity: 'legendary',
        price: 5000,
        artist: '数字艺术家A'
    },
    {
        name: '代码之舞',
        description: '用代码绘制的舞蹈画面，展现了程序与艺术的和谐统一。',
        image: 'https://via.placeholder.com/400x400/16213e/2196f3?text=代码之舞',
        rarity: 'epic',
        price: 3000,
        artist: '数字艺术家B'
    },
    {
        name: '像素花园',
        description: '像素风格的虚拟花园，每一朵花都是精心设计的数字艺术品。',
        image: 'https://via.placeholder.com/400x400/0f0f1e/9c27b0?text=像素花园',
        rarity: 'rare',
        price: 1500,
        artist: '数字艺术家C'
    },
    {
        name: '数据流',
        description: '抽象的数据流动画面，展现了信息时代的独特美感。',
        image: 'https://via.placeholder.com/400x400/1a1a2e/9e9e9e?text=数据流',
        rarity: 'common',
        price: 500,
        artist: '数字艺术家D'
    },
    {
        name: '虚拟梦境',
        description: '一个充满想象力的虚拟梦境场景，带你进入数字艺术的奇妙世界。',
        image: 'https://via.placeholder.com/400x400/16213e/ff9800?text=虚拟梦境',
        rarity: 'epic',
        price: 2500,
        artist: '数字艺术家E'
    },
    {
        name: '算法之美',
        description: '用算法生成的美丽图案，展现了数学与艺术的完美融合。',
        image: 'https://via.placeholder.com/400x400/0f0f1e/2196f3?text=算法之美',
        rarity: 'rare',
        price: 1200,
        artist: '数字艺术家F'
    }
];
async function init() {
    try {
        console.log('开始初始化数据库...');
        // 连接数据库
        await (0, database_1.connectDatabase)();
        // 清空现有藏品（可选）
        await Artwork_1.default.deleteMany({});
        console.log('已清空现有藏品数据');
        // 插入示例数据
        await Artwork_1.default.insertMany(sampleArtworks);
        console.log(`[INFO] 成功添加 ${sampleArtworks.length} 件示例藏品`);
        // 断开连接
        await (0, database_1.disconnectDatabase)();
        console.log('初始化完成！');
        process.exit(0);
    }
    catch (error) {
        console.error('初始化失败:', error);
        process.exit(1);
    }
}
init();
