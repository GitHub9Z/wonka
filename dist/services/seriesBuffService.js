"use strict";
/**
 * 系列Buff服务
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkAndActivateBuff = checkAndActivateBuff;
exports.checkAllSeriesBuffs = checkAllSeriesBuffs;
exports.getUserBuffEffects = getUserBuffEffects;
const CopyrightShare_1 = __importDefault(require("../models/CopyrightShare"));
const Series_1 = __importDefault(require("../models/Series"));
const UserBuff_1 = __importDefault(require("../models/UserBuff"));
/**
 * 检查用户是否集齐系列并激活buff
 * @param userId 用户ID
 * @param seriesId 系列ID
 */
async function checkAndActivateBuff(userId, seriesId) {
    const series = await Series_1.default.findById(seriesId);
    if (!series) {
        return false;
    }
    // 检查用户是否已激活该buff
    const existingBuff = await UserBuff_1.default.findOne({ userId, seriesId });
    if (existingBuff && existingBuff.isActive) {
        return true; // 已激活
    }
    // 检查用户是否集齐该系列的所有版权
    const shares = await CopyrightShare_1.default.find({
        userId,
        copyrightId: { $in: series.copyrightIds },
        shares: { $gt: 0 }
    });
    const ownedCopyrightIds = new Set(shares.map(s => s.copyrightId.toString()));
    const requiredCopyrightIds = series.copyrightIds.map(id => id.toString());
    // 检查是否集齐所有版权
    const isComplete = requiredCopyrightIds.every(id => ownedCopyrightIds.has(id));
    if (!isComplete) {
        return false; // 未集齐
    }
    // 激活buff
    if (existingBuff) {
        existingBuff.isActive = true;
        existingBuff.activatedAt = new Date();
        await existingBuff.save();
    }
    else {
        const buff = new UserBuff_1.default({
            userId,
            seriesId,
            buffType: series.buffType,
            buffEffect: series.buffEffect,
            isActive: true
        });
        await buff.save();
    }
    return true;
}
/**
 * 检查用户所有系列并激活buff
 * @param userId 用户ID
 */
async function checkAllSeriesBuffs(userId) {
    const allSeries = await Series_1.default.find();
    for (const series of allSeries) {
        await checkAndActivateBuff(userId, series._id.toString());
    }
}
/**
 * 获取用户的buff效果
 * @param userId 用户ID
 * @returns buff效果统计
 */
async function getUserBuffEffects(userId) {
    const buffs = await UserBuff_1.default.find({ userId, isActive: true }).populate('seriesId');
    let revenueBuffCount = 0;
    let gameBuffCount = 0;
    buffs.forEach(buff => {
        if (buff.buffType === 'revenue') {
            revenueBuffCount++;
        }
        else if (buff.buffType === 'game') {
            gameBuffCount++;
        }
    });
    return {
        revenueBuffCount,
        gameBuffCount,
        revenueDiscount: revenueBuffCount * 0.05, // 每个收益buff +5%
        gameSpeedMultiplier: 1 + (gameBuffCount * 0.1) // 每个游戏buff +10%
    };
}
