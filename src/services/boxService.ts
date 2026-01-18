/**
 * 开箱服务
 */

import User from '../models/User';
import GalleryCoin from '../models/GalleryCoin';
import Box from '../models/Box';
import CopyrightFragment from '../models/CopyrightFragment';
import Copyright from '../models/Copyright';
import Series from '../models/Series';

const NORMAL_BOX_COST = 100000; // 普通箱价格：10万WTC

/**
 * 开普通箱
 * @param userId 用户ID
 * @returns 开箱结果
 */
export async function openNormalBox(userId: string): Promise<any> {
  const user = await User.findById(userId);
  if (!user) {
    throw new Error('用户不存在');
  }
  
  const galleryCoin = await GalleryCoin.findOne({ userId });
  if (!galleryCoin || galleryCoin.coins < NORMAL_BOX_COST) {
    throw new Error('馆币不足');
  }
  
  // 扣除馆币
  galleryCoin.coins -= NORMAL_BOX_COST;
  await galleryCoin.save();
  user.galleryCoins = galleryCoin.coins;
  await user.save();
  
  // 随机奖励：只出WTC或版权份额
  const random = Math.random();
  let rewardType: 'coins' | 'copyright';
  let rewardValue: number;
  let copyrightId = null;
  
  if (random < 0.7) {
    // 70% 概率：WTC
    rewardType = 'coins';
    rewardValue = Math.floor(Math.random() * 50000 + 10000); // 1万-6万WTC
    console.log(`[BoxService] 开普通箱获得WTC: ${rewardValue}, 当前WTC: ${galleryCoin.coins}`);
    galleryCoin.coins += rewardValue;
    await galleryCoin.save();
    console.log(`[BoxService] 更新后WTC: ${galleryCoin.coins}`);
    user.galleryCoins = galleryCoin.coins;
    user.coins = galleryCoin.coins; // 同时更新个人账户的coins字段
    await user.save();
    console.log(`[BoxService] 用户WTC已更新: galleryCoins=${user.galleryCoins}, coins=${user.coins}`);
  } else {
    // 30% 概率：版权份额（直接获得1份）
    rewardType = 'copyright';
    rewardValue = 1; // 1份版权
    
    // 随机选择一个版权（只选择还有可售份额的）
    const copyrights = await Copyright.find();
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
      await Copyright.findByIdAndUpdate(copyrightId, {
        $inc: { soldShares: rewardValue }
      });
      
      console.log(`[BoxService] 开普通箱获得版权份额: ${randomCopyright.name} x${rewardValue}, copyrightId: ${copyrightId}`);
    } else {
      // 如果所有版权都已售罄，改为WTC奖励
      rewardType = 'coins';
      rewardValue = Math.floor(Math.random() * 50000 + 10000);
      galleryCoin.coins += rewardValue;
      await galleryCoin.save();
      user.galleryCoins = galleryCoin.coins;
      user.coins = galleryCoin.coins; // 同时更新个人账户的coins字段
      await user.save();
      copyrightId = null;
      console.log(`[BoxService] 所有版权已售罄，改为WTC奖励: ${rewardValue}`);
    }
  }
  
  // 记录开箱
  const box = new Box({
    userId,
    boxType: 'normal',
    rewardType,
    rewardValue,
    copyrightId
  });
  await box.save();
  console.log(`[BoxService] 开箱记录已保存，boxId: ${box._id}`);
  
  // 确保获取最新的WTC值
  const finalGalleryCoin = await GalleryCoin.findOne({ userId });
  const finalUser = await User.findById(userId);
  const finalCoins = finalGalleryCoin ? finalGalleryCoin.coins : galleryCoin.coins;
  
  // 确保User模型和GalleryCoin模型同步
  if (finalUser && finalGalleryCoin) {
    finalUser.galleryCoins = finalGalleryCoin.coins;
    finalUser.coins = finalGalleryCoin.coins; // 同时更新个人账户的coins字段
    await finalUser.save();
  }
  
  console.log(`[BoxService] 最终返回WTC: ${finalCoins}`);
  console.log(`[BoxService] User模型WTC: galleryCoins=${finalUser?.galleryCoins}, coins=${finalUser?.coins}, GalleryCoin模型WTC: ${finalGalleryCoin?.coins}`);
  
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
export async function openSeriesBox(userId: string, seriesId: string): Promise<any> {
  const series = await Series.findById(seriesId);
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
  const existingBox = await Box.findOne({ userId, boxType: 'series', seriesId });
  if (existingBox) {
    throw new Error('该系列箱已开启');
  }
  
  // 必掉：系列buff卡 + 对应周边5折券
  const box = new Box({
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
export async function synthesizeShares(userId: string, copyrightId: string): Promise<number> {
  const fragment = await CopyrightFragment.findOne({ userId, copyrightId });
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
  await Copyright.findByIdAndUpdate(copyrightId, {
    $inc: { soldShares: sharesToSynthesize }
  });
  
  return sharesToSynthesize;
}

/**
 * 开免费盲盒（每日限领一个）
 * @param userId 用户ID
 * @returns 开箱结果
 */
export async function openFreeBox(userId: string): Promise<any> {
  const user = await User.findById(userId);
  if (!user) {
    throw new Error('用户不存在');
  }
  
  // 检查今日是否已领取
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayEnd = new Date(today);
  todayEnd.setHours(23, 59, 59, 999);
  
  const todayBox = await Box.findOne({
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
  
  // 免费盲盒：只出WTC
  let rewardType: 'coins' = 'coins';
  let rewardValue: number;
  let copyrightId = null;
  
  let galleryCoin = await GalleryCoin.findOne({ userId });
  if (!galleryCoin) {
    // 如果没有馆币记录，创建一个
    galleryCoin = new GalleryCoin({ userId, coins: 0 });
    await galleryCoin.save();
  }
  
  // 100% 概率：WTC
  rewardValue = Math.floor(Math.random() * 50000 + 10000); // 1万-6万WTC
  console.log(`[BoxService] 开免费盲盒获得WTC: ${rewardValue}, 当前WTC: ${galleryCoin.coins}`);
  galleryCoin.coins += rewardValue;
  await galleryCoin.save();
  console.log(`[BoxService] 更新后WTC: ${galleryCoin.coins}`);
  user.galleryCoins = galleryCoin.coins;
  user.coins = galleryCoin.coins; // 同时更新个人账户的coins字段
  await user.save();
  console.log(`[BoxService] 用户WTC已更新: galleryCoins=${user.galleryCoins}, coins=${user.coins}`);
  
  // 记录开箱
  const box = new Box({
    userId,
    boxType: 'free',
    rewardType,
    rewardValue,
    copyrightId
  });
  await box.save();
  console.log(`[BoxService] 免费盲盒记录已保存，boxId: ${box._id}`);
  
  // 确保获取最新的WTC值
  const finalGalleryCoin = await GalleryCoin.findOne({ userId });
  const finalUser = await User.findById(userId);
  const finalCoins = finalGalleryCoin ? finalGalleryCoin.coins : (galleryCoin ? galleryCoin.coins : 0);
  
  // 确保User模型和GalleryCoin模型同步
  if (finalUser && finalGalleryCoin) {
    finalUser.galleryCoins = finalGalleryCoin.coins;
    finalUser.coins = finalGalleryCoin.coins; // 同时更新个人账户的coins字段
    await finalUser.save();
  }
  
  console.log(`[BoxService] 免费盲盒最终返回WTC: ${finalCoins}`);
  console.log(`[BoxService] User模型WTC: galleryCoins=${finalUser?.galleryCoins}, coins=${finalUser?.coins}, GalleryCoin模型WTC: ${finalGalleryCoin?.coins}`);
  
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
export async function checkFreeBoxAvailable(userId: string): Promise<boolean> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayEnd = new Date(today);
  todayEnd.setHours(23, 59, 59, 999);
  
  const todayBox = await Box.findOne({
    userId,
    boxType: 'free',
    createdAt: {
      $gte: today,
      $lte: todayEnd
    }
  });
  
  return !todayBox;
}

