/**
 * 系列Buff服务
 */

import CopyrightShare from '../models/CopyrightShare';
import Series from '../models/Series';
import UserBuff from '../models/UserBuff';

/**
 * 检查用户是否集齐系列并激活buff
 * @param userId 用户ID
 * @param seriesId 系列ID
 */
export async function checkAndActivateBuff(userId: string, seriesId: string): Promise<boolean> {
  const series = await Series.findById(seriesId);
  if (!series) {
    return false;
  }
  
  // 检查用户是否已激活该buff
  const existingBuff = await UserBuff.findOne({ userId, seriesId });
  if (existingBuff && existingBuff.isActive) {
    return true; // 已激活
  }
  
  // 检查用户是否集齐该系列的所有版权
  const shares = await CopyrightShare.find({
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
  } else {
    const buff = new UserBuff({
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
export async function checkAllSeriesBuffs(userId: string): Promise<void> {
  const allSeries = await Series.find();
  
  for (const series of allSeries) {
    await checkAndActivateBuff(userId, series._id.toString());
  }
}

/**
 * 获取用户的buff效果
 * @param userId 用户ID
 * @returns buff效果统计
 */
export async function getUserBuffEffects(userId: string): Promise<{
  revenueBuffCount: number;
  gameBuffCount: number;
  revenueDiscount: number; // 收益buff折扣（分红比例+5% * 数量）
  gameSpeedMultiplier: number; // 游戏buff速度倍数（+10% * 数量）
}> {
  const buffs = await UserBuff.find({ userId, isActive: true }).populate('seriesId');
  
  let revenueBuffCount = 0;
  let gameBuffCount = 0;
  
  buffs.forEach(buff => {
    if (buff.buffType === 'revenue') {
      revenueBuffCount++;
    } else if (buff.buffType === 'game') {
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


