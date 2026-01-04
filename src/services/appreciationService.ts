/**
 * 鉴赏服务
 */

import User from '../models/User';
import Appreciation from '../models/Appreciation';
import CopyrightFragment from '../models/CopyrightFragment';
import GalleryCoin from '../models/GalleryCoin';
import Copyright from '../models/Copyright';

const MAX_APPRECIATIONS_PER_DAY = 10; // 每日最多鉴赏10次
const MIN_AD_DURATION = 5; // 最少观看5秒广告才有奖励
const MAX_AD_DURATION = 15; // 最多15秒广告

/**
 * 鉴赏他人艺术馆
 * @param userId 鉴赏者ID
 * @param targetUserId 被鉴赏者ID
 * @param copyrightId 被鉴赏的版权ID
 * @param watchDuration 观看广告时长（秒）
 * @returns 奖励信息
 */
export async function appreciate(
  userId: string,
  targetUserId: string,
  copyrightId: string,
  watchDuration: number
): Promise<any> {
  if (userId === targetUserId) {
    throw new Error('不能鉴赏自己的艺术馆');
  }
  
  // 检查观看时长
  if (watchDuration < MIN_AD_DURATION) {
    throw new Error('观看时长不足，无法获得奖励');
  }
  
  // 检查今日鉴赏次数
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayAppreciations = await Appreciation.countDocuments({
    userId,
    createdAt: { $gte: today }
  });
  
  const user = await User.findById(userId);
  const maxAppreciations = user?.isMinor ? 5 : MAX_APPRECIATIONS_PER_DAY;
  
  if (todayAppreciations >= maxAppreciations) {
    throw new Error('今日鉴赏次数已达上限');
  }
  
  // 检查是否已鉴赏过该版权
  const existingAppreciation = await Appreciation.findOne({
    userId,
    targetUserId,
    copyrightId,
    createdAt: { $gte: today }
  });
  
  if (existingAppreciation) {
    throw new Error('今日已鉴赏过该版权');
  }
  
  // 随机奖励
  const random = Math.random();
  let rewardType: 'fragment' | 'coins' | 'buffCard';
  let rewardValue: number;
  
  if (random < 0.4) {
    // 40% 概率：当前鉴赏图案的碎片
    rewardType = 'fragment';
    rewardValue = Math.floor(Math.random() * 3 + 1); // 1-3碎片
    
    // 保存碎片
    let fragment = await CopyrightFragment.findOne({ userId, copyrightId });
    if (!fragment) {
      fragment = new CopyrightFragment({ userId, copyrightId, fragments: 0 });
    }
    fragment.fragments += rewardValue;
    await fragment.save();
  } else if (random < 0.9) {
    // 50% 概率：馆币
    rewardType = 'coins';
    rewardValue = Math.floor(Math.random() * 5000 + 1000); // 1千-6千馆币
    
    // 增加馆币
    let galleryCoin = await GalleryCoin.findOne({ userId });
    if (!galleryCoin) {
      galleryCoin = new GalleryCoin({ userId, coins: 0 });
    }
    galleryCoin.coins += rewardValue;
    await galleryCoin.save();
    
    user.galleryCoins = galleryCoin.coins;
    await user.save();
  } else {
    // 10% 概率：buff体验卡
    rewardType = 'buffCard';
    rewardValue = 1;
  }
  
  // 记录鉴赏
  const appreciation = new Appreciation({
    userId,
    targetUserId,
    copyrightId,
    rewardType,
    rewardValue,
    watchDuration
  });
  await appreciation.save();
  
  // 增加被鉴赏者的人气值
  const targetUser = await User.findById(targetUserId);
  if (targetUser) {
    targetUser.popularity = (targetUser.popularity || 0) + 1;
    await targetUser.save();
  }
  
  return {
    rewardType,
    rewardValue,
    copyrightId,
    remainingAppreciations: maxAppreciations - todayAppreciations - 1
  };
}

/**
 * 获取用户今日鉴赏次数
 * @param userId 用户ID
 * @returns 今日鉴赏次数和剩余次数
 */
export async function getTodayAppreciationCount(userId: string): Promise<{
  count: number;
  remaining: number;
  max: number;
}> {
  const user = await User.findById(userId);
  const maxAppreciations = user?.isMinor ? 5 : MAX_APPRECIATIONS_PER_DAY;
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const count = await Appreciation.countDocuments({
    userId,
    createdAt: { $gte: today }
  });
  
  return {
    count,
    remaining: Math.max(0, maxAppreciations - count),
    max: maxAppreciations
  };
}

/**
 * 兑换人气值奖励（100点换免邮券）
 * @param userId 用户ID
 */
export async function exchangePopularityReward(userId: string): Promise<void> {
  const user = await User.findById(userId);
  if (!user) {
    throw new Error('用户不存在');
  }
  
  if (user.popularity < 100) {
    throw new Error('人气值不足（需要100点）');
  }
  
  user.popularity -= 100;
  await user.save();
  
  // TODO: 发放免邮券（需要实现券系统）
}


