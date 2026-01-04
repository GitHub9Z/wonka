/**
 * 奖池服务
 */

import CopyrightShare from '../models/CopyrightShare';
import LotteryPool from '../models/LotteryPool';
import User from '../models/User';

const LOTTERY_POOL_RATE = 0.1; // 投入奖池的比例：10%
const WINNER_COUNT = 10; // 每月抽10人

/**
 * 投入份额到奖池
 * @param userId 用户ID
 * @param copyrightId 版权ID
 * @param shares 投入的份额数
 */
export async function joinLotteryPool(
  userId: string,
  copyrightId: string,
  shares: number
): Promise<void> {
  const user = await User.findById(userId);
  if (user?.isMinor) {
    throw new Error('未成年人不能参与奖池');
  }
  
  const share = await CopyrightShare.findOne({ userId, copyrightId });
  if (!share || share.shares < shares) {
    throw new Error('份额不足');
  }
  
  // 检查投入比例（10%）
  const maxShares = Math.floor(share.shares * LOTTERY_POOL_RATE);
  if (shares > maxShares) {
    throw new Error(`最多只能投入${maxShares}份（10%）`);
  }
  
  // 检查是否已投入
  const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
  const existing = await LotteryPool.findOne({
    userId,
    copyrightId,
    month: currentMonth
  });
  
  if (existing) {
    throw new Error('本月已参与奖池');
  }
  
  // 投入份额
  share.inLotteryPool += shares;
  await share.save();
  
  // 记录奖池参与
  const lotteryPool = new LotteryPool({
    userId,
    copyrightId,
    shares,
    month: currentMonth
  });
  await lotteryPool.save();
}

/**
 * 抽奖（每月执行一次）
 * @param month 月份（YYYY-MM格式）
 */
export async function drawLottery(month: string): Promise<string[]> {
  // 获取该月所有参与者
  const participants = await LotteryPool.find({ month, isWinner: false });
  
  if (participants.length === 0) {
    return [];
  }
  
  // 随机抽取10人
  const winners: string[] = [];
  const participantIds = participants.map(p => p._id.toString());
  
  for (let i = 0; i < Math.min(WINNER_COUNT, participantIds.length); i++) {
    const randomIndex = Math.floor(Math.random() * participantIds.length);
    const winnerId = participantIds[randomIndex];
    winners.push(winnerId);
    participantIds.splice(randomIndex, 1);
  }
  
  // 标记中奖者
  for (const winnerId of winners) {
    await LotteryPool.findByIdAndUpdate(winnerId, { isWinner: true });
  }
  
  return winners;
}

/**
 * 获取用户的奖池参与记录
 * @param userId 用户ID
 * @returns 参与记录列表
 */
export async function getUserLotteryRecords(userId: string): Promise<any[]> {
  const records = await LotteryPool.find({ userId })
    .populate('copyrightId', 'name image')
    .sort({ month: -1 });
  
  return records.map(r => ({
    id: r._id,
    copyrightName: r.copyrightId.name,
    copyrightImage: r.copyrightId.image,
    shares: r.shares,
    month: r.month,
    isWinner: r.isWinner,
    createdAt: r.createdAt
  }));
}


