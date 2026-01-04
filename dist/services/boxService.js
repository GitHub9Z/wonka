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
const User_1 = __importDefault(require("../models/User"));
const GalleryCoin_1 = __importDefault(require("../models/GalleryCoin"));
const Box_1 = __importDefault(require("../models/Box"));
const CopyrightFragment_1 = __importDefault(require("../models/CopyrightFragment"));
const Copyright_1 = __importDefault(require("../models/Copyright"));
const Series_1 = __importDefault(require("../models/Series"));
const NORMAL_BOX_COST = 100000; // 普通箱价格：10万馆币
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
    // 随机奖励
    const random = Math.random();
    let rewardType;
    let rewardValue;
    let copyrightId = null;
    if (random < 0.6) {
        // 60% 概率：馆币
        rewardType = 'coins';
        rewardValue = Math.floor(Math.random() * 50000 + 10000); // 1万-6万馆币
        galleryCoin.coins += rewardValue;
        await galleryCoin.save();
        user.galleryCoins = galleryCoin.coins;
        await user.save();
    }
    else if (random < 0.9) {
        // 30% 概率：版权碎片
        rewardType = 'fragment';
        rewardValue = Math.floor(Math.random() * 5 + 1); // 1-5碎片
        // 随机选择一个版权
        const copyrights = await Copyright_1.default.find();
        if (copyrights.length > 0) {
            const randomCopyright = copyrights[Math.floor(Math.random() * copyrights.length)];
            copyrightId = randomCopyright._id;
            // 保存碎片
            let fragment = await CopyrightFragment_1.default.findOne({ userId, copyrightId });
            if (!fragment) {
                fragment = new CopyrightFragment_1.default({ userId, copyrightId, fragments: 0 });
            }
            fragment.fragments += rewardValue;
            await fragment.save();
        }
    }
    else {
        // 10% 概率：广告卡
        rewardType = 'adCard';
        rewardValue = 1; // 1张广告卡（看广告额外开1次）
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
    return {
        rewardType,
        rewardValue,
        copyrightId,
        remainingCoins: galleryCoin.coins
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
    // 增加版权份额
    const CopyrightShare = require('../models/CopyrightShare').default;
    let share = await CopyrightShare.findOne({ userId, copyrightId });
    if (!share) {
        share = new CopyrightShare({ userId, copyrightId, shares: 0 });
    }
    share.shares += sharesToSynthesize;
    await share.save();
    return sharesToSynthesize;
}
