"use strict";
/**
 * 开箱服务
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.openNormalBox = openNormalBox;
exports.openSeriesBox = openSeriesBox;
exports.synthesizeShares = synthesizeShares;
exports.openFreeBox = openFreeBox;
exports.checkFreeBoxAvailable = checkFreeBoxAvailable;
const User_1 = __importDefault(require("../models/User"));
const GalleryCoin_1 = __importDefault(require("../models/GalleryCoin"));
const Box_1 = __importDefault(require("../models/Box"));
const CopyrightFragment_1 = __importDefault(require("../models/CopyrightFragment"));
const Copyright_1 = __importDefault(require("../models/Copyright"));
const Series_1 = __importDefault(require("../models/Series"));
const NORMAL_BOX_COST = 100000; // 普通箱价格：10万金币
/**
 * 开普通箱
 * @param userId 用户ID
 * @returns 开箱结果
 */
async function openNormalBox(userId) {
    const user = await User_1.default.findById(userId);
    if (!user) {
        throw new Error('用户不存在');
    }
    const galleryCoin = await GalleryCoin_1.default.findOne({ userId });
    if (!galleryCoin || galleryCoin.coins < NORMAL_BOX_COST) {
        throw new Error('馆币不足');
    }
    // 扣除馆币
    galleryCoin.coins -= NORMAL_BOX_COST;
    await galleryCoin.save();
    user.galleryCoins = galleryCoin.coins;
    await user.save();
    // 随机奖励：只出金币或版权份额
    const random = Math.random();
    let rewardType;
    let rewardValue;
    let copyrightId = null;
    if (random < 0.7) {
        // 70% 概率：金币
        rewardType = 'coins';
        rewardValue = Math.floor(Math.random() * 50000 + 10000); // 1万-6万金币
        console.log(`[BoxService] 开普通箱获得金币: ${rewardValue}, 当前金币: ${galleryCoin.coins}`);
        galleryCoin.coins += rewardValue;
        await galleryCoin.save();
        console.log(`[BoxService] 更新后金币: ${galleryCoin.coins}`);
        user.galleryCoins = galleryCoin.coins;
        await user.save();
        console.log(`[BoxService] 用户金币已更新: ${user.galleryCoins}`);
    }
    else {
        // 30% 概率：版权份额（直接获得1份）
        rewardType = 'copyright';
        rewardValue = 1; // 1份版权
        // 随机选择一个版权（只选择还有可售份额的）
        const copyrights = await Copyright_1.default.find();
        const availableCopyrights = copyrights.filter(c => {
            const available = c.totalShares - (c.soldShares || 0);
            return available > 0;
        });
        if (availableCopyrights.length > 0) {
            const randomCopyright = availableCopyrights[Math.floor(Math.random() * availableCopyrights.length)];
            copyrightId = randomCopyright._id;
            // 创建版权份额（每份一条记录）
            const CopyrightShare = require('../models/CopyrightShare').default;
            for (let i = 0; i < rewardValue; i++) {
                await CopyrightShare.create({
                    userId,
                    copyrightId,
                    blockchainHash: `0x${Math.random().toString(16).substr(2, 64)}`,
                    inLotteryPool: false,
                    giftCount: 0
                });
            }
            // 更新版权已售份额
            await Copyright_1.default.findByIdAndUpdate(copyrightId, {
                $inc: { soldShares: rewardValue }
            });
            console.log(`[BoxService] 开普通箱获得版权份额: ${randomCopyright.name} x${rewardValue}, copyrightId: ${copyrightId}`);
        }
        else {
            // 如果所有版权都已售罄，改为金币奖励
            rewardType = 'coins';
            rewardValue = Math.floor(Math.random() * 50000 + 10000);
            galleryCoin.coins += rewardValue;
            await galleryCoin.save();
            user.galleryCoins = galleryCoin.coins;
            await user.save();
            copyrightId = null;
            console.log(`[BoxService] 所有版权已售罄，改为金币奖励: ${rewardValue}`);
        }
    }
    // 记录开箱
    const box = new Box_1.default({
        userId,
        boxType: 'normal',
        rewardType,
        rewardValue,
        copyrightId
    });
    await box.save();
    console.log(`[BoxService] 开箱记录已保存，boxId: ${box._id}`);
    // 确保获取最新的金币值
    const finalGalleryCoin = await GalleryCoin_1.default.findOne({ userId });
    const finalUser = await User_1.default.findById(userId);
    const finalCoins = finalGalleryCoin ? finalGalleryCoin.coins : galleryCoin.coins;
    // 确保User模型和GalleryCoin模型同步
    if (finalUser && finalGalleryCoin) {
        finalUser.galleryCoins = finalGalleryCoin.coins;
        await finalUser.save();
    }
    console.log(`[BoxService] 最终返回金币: ${finalCoins}`);
    console.log(`[BoxService] User模型金币: ${finalUser?.galleryCoins}, GalleryCoin模型金币: ${finalGalleryCoin?.coins}`);
    return {
        rewardType,
        rewardValue,
        copyrightId,
        remainingCoins: finalCoins
    };
}
/**
 * 开系列箱（集齐系列后免费开1次）
 * @param userId 用户ID
 * @param seriesId 系列ID
 * @returns 开箱结果
 */
async function openSeriesBox(userId, seriesId) {
    const series = await Series_1.default.findById(seriesId);
    if (!series) {
        throw new Error('系列不存在');
    }
    // 检查用户是否集齐该系列
    const CopyrightShare = require('../models/CopyrightShare').default;
    const shares = await CopyrightShare.find({
        userId,
        copyrightId: { $in: series.copyrightIds },
        shares: { $gt: 0 }
    });
    if (shares.length < series.copyrightIds.length) {
        throw new Error('未集齐该系列');
    }
    // 检查是否已经开过系列箱
    const existingBox = await Box_1.default.findOne({ userId, boxType: 'series', seriesId });
    if (existingBox) {
        throw new Error('该系列箱已开启');
    }
    // 必掉：系列buff卡 + 对应周边5折券
    const box = new Box_1.default({
        userId,
        boxType: 'series',
        rewardType: 'buffCard',
        rewardValue: 1,
        seriesId
    });
    await box.save();
    return {
        rewardType: 'buffCard',
        rewardValue: 1,
        seriesId,
        coupon: {
            type: 'merchandise',
            discount: 0.5, // 5折
            seriesId
        }
    };
}
/**
 * 碎片合成版权份额
 * @param userId 用户ID
 * @param copyrightId 版权ID
 * @returns 合成的份额数
 */
async function synthesizeShares(userId, copyrightId) {
    const fragment = await CopyrightFragment_1.default.findOne({ userId, copyrightId });
    if (!fragment || fragment.fragments < 10) {
        throw new Error('碎片不足（需要10碎片合成1份版权）');
    }
    const sharesToSynthesize = Math.floor(fragment.fragments / 10);
    fragment.fragments -= sharesToSynthesize * 10;
    await fragment.save();
    // 增加版权份额（每份一条记录）
    const CopyrightShare = require('../models/CopyrightShare').default;
    for (let i = 0; i < sharesToSynthesize; i++) {
        await CopyrightShare.create({
            userId,
            copyrightId,
            blockchainHash: `0x${Math.random().toString(16).substr(2, 64)}`,
            inLotteryPool: false,
            giftCount: 0
        });
    }
    // 更新版权已售份额
    await Copyright_1.default.findByIdAndUpdate(copyrightId, {
        $inc: { soldShares: sharesToSynthesize }
    });
    return sharesToSynthesize;
}
/**
 * 开免费盲盒（每日限领一个）
 * @param userId 用户ID
 * @returns 开箱结果
 */
async function openFreeBox(userId) {
    const user = await User_1.default.findById(userId);
    if (!user) {
        throw new Error('用户不存在');
    }
    // 检查今日是否已领取
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayEnd = new Date(today);
    todayEnd.setHours(23, 59, 59, 999);
    const todayBox = await Box_1.default.findOne({
        userId,
        boxType: 'free',
        createdAt: {
            $gte: today,
            $lte: todayEnd
        }
    });
    if (todayBox) {
        throw new Error('今日已领取免费盲盒');
    }
    // 免费盲盒：只出金币
    let rewardType = 'coins';
    let rewardValue;
    let copyrightId = null;
    let galleryCoin = await GalleryCoin_1.default.findOne({ userId });
    if (!galleryCoin) {
        // 如果没有馆币记录，创建一个
        galleryCoin = new GalleryCoin_1.default({ userId, coins: 0 });
        await galleryCoin.save();
    }
    // 100% 概率：金币
    rewardValue = Math.floor(Math.random() * 50000 + 10000); // 1万-6万金币
    console.log(`[BoxService] 开免费盲盒获得金币: ${rewardValue}, 当前金币: ${galleryCoin.coins}`);
    galleryCoin.coins += rewardValue;
    await galleryCoin.save();
    console.log(`[BoxService] 更新后金币: ${galleryCoin.coins}`);
    user.galleryCoins = galleryCoin.coins;
    await user.save();
    console.log(`[BoxService] 用户金币已更新: ${user.galleryCoins}`);
    // 记录开箱
    const box = new Box_1.default({
        userId,
        boxType: 'free',
        rewardType,
        rewardValue,
        copyrightId
    });
    await box.save();
    console.log(`[BoxService] 免费盲盒记录已保存，boxId: ${box._id}`);
    // 确保获取最新的金币值
    const finalGalleryCoin = await GalleryCoin_1.default.findOne({ userId });
    const finalUser = await User_1.default.findById(userId);
    const finalCoins = finalGalleryCoin ? finalGalleryCoin.coins : (galleryCoin ? galleryCoin.coins : 0);
    // 确保User模型和GalleryCoin模型同步
    if (finalUser && finalGalleryCoin) {
        finalUser.galleryCoins = finalGalleryCoin.coins;
        await finalUser.save();
    }
    console.log(`[BoxService] 免费盲盒最终返回金币: ${finalCoins}`);
    console.log(`[BoxService] User模型金币: ${finalUser?.galleryCoins}, GalleryCoin模型金币: ${finalGalleryCoin?.coins}`);
    return {
        rewardType,
        rewardValue,
        copyrightId,
        remainingCoins: finalCoins
    };
}
/**
 * 检查今日是否已领取免费盲盒
 * @param userId 用户ID
 * @returns 是否已领取
 */
async function checkFreeBoxAvailable(userId) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayEnd = new Date(today);
    todayEnd.setHours(23, 59, 59, 999);
    const todayBox = await Box_1.default.findOne({
        userId,
        boxType: 'free',
        createdAt: {
            $gte: today,
            $lte: todayEnd
        }
    });
    return !todayBox;
}
