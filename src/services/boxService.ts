/**
 * 开箱服务
 */

import User from '../models/User';
import GalleryCoin from '../models/GalleryCoin';
import Box from '../models/Box';
import CopyrightFragment from '../models/CopyrightFragment';
import Copyright from '../models/Copyright';
import Series from '../models/Series';

const NORMAL_BOX_COST = 100000; // 普通箱价格：10万馆币

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
  
  // 随机奖励
  const random = Math.random();
  let rewardType: 'coins' | 'fragment' | 'adCard';
  let rewardValue: number;
  let copyrightId = null;
  
  if (random < 0.6) {
    // 60% 概率：馆币
    rewardType = 'coins';
    rewardValue = Math.floor(Math.random() * 50000 + 10000); // 1万-6万馆币
    galleryCoin.coins += rewardValue;
    await galleryCoin.save();
    user.galleryCoins = galleryCoin.coins;
    await user.save();
  } else if (random < 0.9) {
    // 30% 概率：版权碎片
    rewardType = 'fragment';
    rewardValue = Math.floor(Math.random() * 5 + 1); // 1-5碎片
    
    // 随机选择一个版权
    const copyrights = await Copyright.find();
    if (copyrights.length > 0) {
      const randomCopyright = copyrights[Math.floor(Math.random() * copyrights.length)];
      copyrightId = randomCopyright._id;
      
      // 保存碎片
      let fragment = await CopyrightFragment.findOne({ userId, copyrightId });
      if (!fragment) {
        fragment = new CopyrightFragment({ userId, copyrightId, fragments: 0 });
      }
      fragment.fragments += rewardValue;
      await fragment.save();
    }
  } else {
    // 10% 概率：广告卡
    rewardType = 'adCard';
    rewardValue = 1; // 1张广告卡（看广告额外开1次）
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

