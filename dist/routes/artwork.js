"use strict";
/**
 * 藏品路由
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const Artwork_1 = __importDefault(require("../models/Artwork"));
const router = (0, express_1.Router)();
/**
 * 获取藏品列表
 */
router.get('/', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const pageSize = parseInt(req.query.pageSize) || 20;
        const skip = (page - 1) * pageSize;
        const artworks = await Artwork_1.default.find()
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(pageSize);
        const total = await Artwork_1.default.countDocuments();
        res.json({
            code: 200,
            message: '获取成功',
            data: {
                list: artworks,
                total,
                page,
                pageSize
            }
        });
    }
    catch (error) {
        console.error('获取藏品列表错误:', error);
        res.status(500).json({
            code: 500,
            message: error.message || '获取失败',
            data: null
        });
    }
});
/**
 * 获取藏品详情
 */
router.get('/:id', async (req, res) => {
    try {
        const artwork = await Artwork_1.default.findById(req.params.id);
        if (!artwork) {
            return res.status(404).json({
                code: 404,
                message: '藏品不存在',
                data: null
            });
        }
        res.json({
            code: 200,
            message: '获取成功',
            data: artwork
        });
    }
    catch (error) {
        console.error('获取藏品详情错误:', error);
        res.status(500).json({
            code: 500,
            message: error.message || '获取失败',
            data: null
        });
    }
});
exports.default = router;
