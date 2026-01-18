"use strict";
/**
 * 馆币服务（挂机产币）
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateCoins = calculateCoins;
exports.claimCoins = claimCoins;
exports.recordOfflineTime = recordOfflineTime;
const User_1 = __importDefault(require("../models/User"));
const CopyrightShare_1 = __importDefault(require("../models/CopyrightShare"));
const GalleryCoin_1 = __importDefault(require("../models/GalleryCoin"));
const UserBuff_1 = __importDefault(require("../models/UserBuff"));
const COINS_PER_HOUR = 10000; // 每5份不同版权每小时产10000馆币
const MIN_DIFFERENT_COPYRIGHTS = 5; // 需要5份不同版权
const MAX_OFFLINE_HOURS = 12; // 离线最多累计12小时
/**
 * 计算用户应得的馆币
 * @param userId 用户ID
 * @returns 应得的馆币数量
 */
async function calculateCoins(userId) {
    // 获取用户持有的版权份额（每份一条记录）
    const shares = await CopyrightShare_1.default.find({ userId });
    // 统计不同版权的数量
    const copyrightSet = new Set();
    shares.forEach(share => {
        copyrightSet.add(share.copyrightId.toString());
    });
    const differentCopyrights = copyrightSet.size;
    // 如果不足5份不同版权，不产币
    if (differentCopyrights < MIN_DIFFERENT_COPYRIGHTS) {
        return 0;
    }
    // 计算基础产币速度（每5份不同版权每小时10000金币）
    const baseCoinsPerHour = Math.floor(differentCopyrights / MIN_DIFFERENT_COPYRIGHTS) * COINS_PER_HOUR;
    // 获取用户激活的系列buff，累加每小时额外金币
    const activeBuffs = await UserBuff_1.default.find({
        userId,
        isActive: true
    }).populate('seriesId', 'hourlyBonusCoins');
    let totalBonusCoins = 0;
    activeBuffs.forEach(buff => {
        const series = buff.seriesId;
        if (series && series.hourlyBonusCoins) {
            totalBonusCoins += series.hourlyBonusCoins;
        }
    });
    return baseCoinsPerHour + totalBonusCoins;
}
/**
 * 领取挂机收益
 * @param userId 用户ID
 * @returns 领取的馆币数量
 */
async function claimCoins(userId) {
    const user = await User_1.default.findById(userId);
    if (!user) {
        throw new Error('用户不存在');
    }
    // 获取或创建馆币记录
    let galleryCoin = await GalleryCoin_1.default.findOne({ userId });
    if (!galleryCoin) {
        galleryCoin = new GalleryCoin_1.default({ userId, coins: 0 });
    }
    const now = new Date();
    const lastClaimTime = galleryCoin.lastClaimTime || user.lastOnlineTime || now;
    // 计算离线时间（如果用户有离线时间记录）
    let offlineHours = 0;
    if (galleryCoin.lastOfflineTime) {
        const offlineDiff = now.getTime() - galleryCoin.lastOfflineTime.getTime();
        offlineHours = Math.floor(offlineDiff / (1000 * 60 * 60));
        // 限制最多12小时
        offlineHours = Math.min(offlineHours, MAX_OFFLINE_HOURS);
    }
    // 计算在线时间（从上次领取到现在）
    const onlineDiff = now.getTime() - lastClaimTime.getTime();
    const onlineHours = Math.floor(onlineDiff / (1000 * 60 * 60));
    // 计算总收益时间（在线时间 + 离线时间）
    const totalHours = onlineHours + offlineHours;
    if (totalHours <= 0) {
        return 0;
    }
    // 计算每小时产币量
    const coinsPerHour = await calculateCoins(userId);
    // 计算应得馆币
    const earnedCoins = Math.floor(coinsPerHour * totalHours);
    if (earnedCoins > 0) {
        // 更新馆币
        galleryCoin.coins += earnedCoins;
        galleryCoin.lastClaimTime = now;
        galleryCoin.lastOfflineTime = null; // 清除离线时间记录
        await galleryCoin.save();
        // 更新用户馆币
        user.galleryCoins = galleryCoin.coins;
        user.lastOnlineTime = now;
        await user.save();
    }
    return earnedCoins;
}
/**
 * 记录用户离线时间
 * @param userId 用户ID
 */
async function recordOfflineTime(userId) {
    let galleryCoin = await GalleryCoin_1.default.findOne({ userId });
    if (!galleryCoin) {
        galleryCoin = new GalleryCoin_1.default({ userId, coins: 0 });
    }
    galleryCoin.lastOfflineTime = new Date();
    await galleryCoin.save();
    const user = await User_1.default.findById(userId);
    if (user) {
        user.lastOnlineTime = new Date();
        await user.save();
    }
}
