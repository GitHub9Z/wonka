/**
 * 馆币服务（挂机产币）
 */

import User from '../models/User';
import CopyrightShare from '../models/CopyrightShare';
import GalleryCoin from '../models/GalleryCoin';
import UserBuff from '../models/UserBuff';

const COINS_PER_COPYRIGHT = 20; // 每个版权每小时产20 WTC
const MAX_OFFLINE_HOURS = 12; // 离线最多累计12小时

/**
 * 计算用户每小时应得的WTC
 * @param userId 用户ID
 * @returns 每小时应得的WTC数量
 */
export async function calculateCoins(userId: string): Promise<number> {
  // 获取用户持有的版权份额（每份一条记录）
  const shares = await CopyrightShare.find({ userId });
  
  // 统计不同版权的数量（去重）
  const copyrightSet = new Set<string>();
  shares.forEach(share => {
    copyrightSet.add(share.copyrightId.toString());
  });
  
  const copyrightCount = copyrightSet.size;
  
  // 计算基础产币速度：版权数量 * 20
  const baseCoinsPerHour = copyrightCount * COINS_PER_COPYRIGHT;
  
  // 获取用户激活的系列buff，累加每小时额外WTC
  const activeBuffs = await UserBuff.find({ 
    userId, 
    isActive: true 
  }).populate('seriesId', 'hourlyBonusCoins');
  
  let totalBonusCoins = 0;
  activeBuffs.forEach(buff => {
    const series = buff.seriesId as any;
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
export async function claimCoins(userId: string): Promise<number> {
  const user = await User.findById(userId);
  if (!user) {
    throw new Error('用户不存在');
  }
  
  // 获取或创建馆币记录
  let galleryCoin = await GalleryCoin.findOne({ userId });
  if (!galleryCoin) {
    galleryCoin = new GalleryCoin({ userId, coins: 0 });
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
export async function recordOfflineTime(userId: string): Promise<void> {
  let galleryCoin = await GalleryCoin.findOne({ userId });
  if (!galleryCoin) {
    galleryCoin = new GalleryCoin({ userId, coins: 0 });
  }
  
  galleryCoin.lastOfflineTime = new Date();
  await galleryCoin.save();
  
  const user = await User.findById(userId);
  if (user) {
    user.lastOnlineTime = new Date();
    await user.save();
  }
}



