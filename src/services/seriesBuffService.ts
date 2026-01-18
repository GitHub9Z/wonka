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
  // 注意：CopyrightShare是按份数存储的，每份一条记录
  const shares = await CopyrightShare.find({
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
  } else {
    const buff = new UserBuff({
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
export async function checkAllSeriesBuffs(userId: string): Promise<void> {
  const allSeries = await Series.find();
  
  for (const series of allSeries) {
    await checkAndActivateBuff(userId, series._id.toString());
  }
}

/**
 * 获取用户激活的系列buff列表
 * @param userId 用户ID
 * @returns 激活的系列buff列表（包含每小时额外WTC）
 */
export async function getUserBuffEffects(userId: string): Promise<{
  buffs: Array<{
    seriesId: string;
    seriesName: string;
    hourlyBonusCoins: number;
    activatedAt: Date;
  }>;
  totalHourlyBonusCoins: number; // 总的小时额外WTC
}> {
  const buffs = await UserBuff.find({ userId, isActive: true })
    .populate('seriesId', 'name hourlyBonusCoins')
    .sort({ activatedAt: -1 });
  
  let totalHourlyBonusCoins = 0;
  const buffList = buffs.map(buff => {
    const series = buff.seriesId as any;
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



