/**
 * 分红服务
 */

import CopyrightShare from '../models/CopyrightShare';
import Dividend from '../models/Dividend';
import UserBuff from '../models/UserBuff';
import User from '../models/User';

const DIVIDEND_RATE = 0.2; // 分红比例：20%
const SETTLEMENT_DAY = 15; // 每月15日结算

/**
 * 计算用户的分红
 * @param userId 用户ID
 * @param copyrightId 版权ID
 * @param salesAmount 周边销售额
 * @returns 分红金额
 */
export async function calculateDividend(
  userId: string,
  copyrightId: string,
  salesAmount: number
): Promise<number> {
  // 获取用户持有的份额
  const share = await CopyrightShare.findOne({ userId, copyrightId });
  if (!share || share.shares === 0) {
    return 0;
  }
  
  // 获取版权总份额
  const Copyright = require('../models/Copyright').default;
  const copyright = await Copyright.findById(copyrightId);
  if (!copyright) {
    return 0;
  }
  
  // 计算基础分红（20%销售额按份额占比分配）
  const baseDividend = (salesAmount * DIVIDEND_RATE * share.shares) / copyright.totalShares;
  
  // 获取用户的收益buff（分红比例+5% * buff数量）
  const buffs = await UserBuff.find({ userId, buffType: 'revenue', isActive: true });
  const buffMultiplier = 1 + (buffs.length * 0.05);
  
  return baseDividend * buffMultiplier;
}

/**
 * 结算分红（每月15日执行）
 * @param copyrightId 版权ID
 * @param salesAmount 本月销售额
 * @param settlementDate 结算日期
 */
export async function settleDividend(
  copyrightId: string,
  salesAmount: number,
  settlementDate: Date
): Promise<void> {
  // 获取所有持有该版权的用户
  const shares = await CopyrightShare.find({ copyrightId, shares: { $gt: 0 } });
  
  // 获取版权总份额
  const Copyright = require('../models/Copyright').default;
  const copyright = await Copyright.findById(copyrightId);
  if (!copyright) {
    return;
  }
  
  for (const share of shares) {
    const dividendAmount = await calculateDividend(
      share.userId.toString(),
      copyrightId,
      salesAmount
    );
    
    if (dividendAmount > 0) {
      const dividend = new Dividend({
        userId: share.userId,
        copyrightId,
        amount: dividendAmount,
        shares: share.shares,
        totalShares: copyright.totalShares,
        salesAmount,
        dividendRate: DIVIDEND_RATE,
        settlementDate,
        status: 'pending'
      });
      await dividend.save();
    }
  }
}

/**
 * 支付分红（自动到账微信零钱）
 * @param dividendId 分红记录ID
 */
export async function payDividend(dividendId: string): Promise<void> {
  const dividend = await Dividend.findById(dividendId);
  if (!dividend || dividend.status === 'paid') {
    return;
  }
  
  const user = await User.findById(dividend.userId);
  if (!user) {
    return;
  }
  
  // TODO: 调用微信支付API，将分红金额转入用户微信零钱
  // 这里需要集成微信支付API
  
  dividend.status = 'paid';
  dividend.paidAt = new Date();
  await dividend.save();
}

/**
 * 批量支付待支付的分红
 */
export async function batchPayDividends(): Promise<void> {
  const pendingDividends = await Dividend.find({ status: 'pending' });
  
  for (const dividend of pendingDividends) {
    await payDividend(dividend._id.toString());
  }
}

/**
 * 获取用户的分红明细
 * @param userId 用户ID
 * @param limit 限制数量
 * @returns 分红明细列表
 */
export async function getUserDividends(userId: string, limit: number = 20): Promise<any[]> {
  const dividends = await Dividend.find({ userId })
    .populate('copyrightId', 'name image')
    .sort({ settlementDate: -1 })
    .limit(limit);
  
  return dividends.map(d => ({
    id: d._id,
    copyrightName: d.copyrightId.name,
    copyrightImage: d.copyrightId.image,
    amount: d.amount,
    shares: d.shares,
    settlementDate: d.settlementDate,
    status: d.status,
    paidAt: d.paidAt
  }));
}



