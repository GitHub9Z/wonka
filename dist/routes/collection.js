"use strict";
/**
 * 收藏路由
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const Collection_1 = __importDefault(require("../models/Collection"));
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
/**
 * 获取用户收藏列表
 */
router.get('/', auth_1.authenticate, async (req, res) => {
    try {
        const collections = await Collection_1.default.find({ userId: req.userId })
            .populate('artworkId')
            .sort({ ownedAt: -1 });
        const artworks = collections.map(collection => {
            const artwork = collection.artworkId;
            return {
                ...artwork.toObject(),
                owned: true,
                ownedAt: collection.ownedAt
            };
        });
        res.json({
            code: 200,
            message: '获取成功',
            data: {
                list: artworks,
                total: artworks.length
            }
        });
    }
    catch (error) {
        console.error('获取收藏列表错误:', error);
        res.status(500).json({
            code: 500,
            message: error.message || '获取失败',
            data: null
        });
    }
});
exports.default = router;
