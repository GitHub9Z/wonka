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
    // 注意：CopyrightShare是按份数存储的，每份一条记录
    const shares = await CopyrightShare_1.default.find({
        userId,
        copyrightId: { $in: series.copyrightIds }
    });
    const ownedCopyrightIds = new Set(shares.map(s => s.copyrightId.toString()));
    const requiredCopyrightIds = series.copyrightIds.map(id => id.toString());
    // 检查是否集齐所有版权（每个版权至少持有1份）
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
 * 获取用户激活的系列buff列表
 * @param userId 用户ID
 * @returns 激活的系列buff列表（包含每小时额外金币）
 */
async function getUserBuffEffects(userId) {
    const buffs = await UserBuff_1.default.find({ userId, isActive: true })
        .populate('seriesId', 'name hourlyBonusCoins')
        .sort({ activatedAt: -1 });
    let totalHourlyBonusCoins = 0;
    const buffList = buffs.map(buff => {
        const series = buff.seriesId;
        const hourlyBonusCoins = series?.hourlyBonusCoins || 0;
        totalHourlyBonusCoins += hourlyBonusCoins;
        return {
            seriesId: series?._id?.toString() || '',
            seriesName: series?.name || '未知系列',
            hourlyBonusCoins,
            activatedAt: buff.activatedAt
        };
    });
    return {
        buffs: buffList,
        totalHourlyBonusCoins
    };
}
