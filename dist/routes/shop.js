"use strict";
/**
 * 商店路由
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const Artwork_1 = __importDefault(require("../models/Artwork"));
const Collection_1 = __importDefault(require("../models/Collection"));
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
/**
 * 获取商店藏品列表（带收藏状态）
 */
router.get('/', auth_1.authenticate, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const pageSize = parseInt(req.query.pageSize) || 20;
        const skip = (page - 1) * pageSize;
        const artworks = await Artwork_1.default.find()
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(pageSize);
        // 查询用户已收藏的藏品
        const userCollections = await Collection_1.default.find({
            userId: req.userId
        }).select('artworkId');
        const ownedArtworkIds = new Set(userCollections.map(c => c.artworkId.toString()));
        // 添加收藏状态
        const artworksWithOwned = artworks.map(artwork => ({
            ...artwork.toObject(),
            owned: ownedArtworkIds.has(artwork._id.toString())
        }));
        const total = await Artwork_1.default.countDocuments();
        res.json({
            code: 200,
            message: '获取成功',
            data: {
                list: artworksWithOwned,
                total,
                page,
                pageSize
            }
        });
    }
    catch (error) {
        console.error('获取商店列表错误:', error);
        res.status(500).json({
            code: 500,
            message: error.message || '获取失败',
            data: null
        });
    }
});
/**
 * 购买藏品
 */
router.post('/purchase', auth_1.authenticate, async (req, res) => {
    try {
        const { artworkId } = req.body;
        if (!artworkId) {
            return res.status(400).json({
                code: 400,
                message: '缺少藏品ID',
                data: null
            });
        }
        // 查找藏品
        const artwork = await Artwork_1.default.findById(artworkId);
        if (!artwork) {
            return res.status(404).json({
                code: 404,
                message: '藏品不存在',
                data: null
            });
        }
        // 检查是否已拥有
        const existingCollection = await Collection_1.default.findOne({
            userId: req.userId,
            artworkId: artworkId
        });
        if (existingCollection) {
            return res.status(400).json({
                code: 400,
                message: '已拥有此藏品',
                data: null
            });
        }
        // 检查金币是否足够
        const user = req.user;
        if (user.coins < artwork.price) {
            return res.status(400).json({
                code: 400,
                message: '金币不足',
                data: null
            });
        }
        // 扣除金币
        user.coins -= artwork.price;
        await user.save();
        // 创建收藏记录
        const collection = new Collection_1.default({
            userId: req.userId,
            artworkId: artworkId,
            ownedAt: new Date()
        });
        await collection.save();
        // 返回藏品信息
        const artworkData = {
            ...artwork.toObject(),
            owned: true,
            ownedAt: collection.ownedAt
        };
        res.json({
            code: 200,
            message: '购买成功',
            data: {
                artwork: artworkData,
                remainingCoins: user.coins
            }
        });
    }
    catch (error) {
        console.error('购买藏品错误:', error);
        res.status(500).json({
            code: 500,
            message: error.message || '购买失败',
            data: null
        });
    }
});
exports.default = router;
