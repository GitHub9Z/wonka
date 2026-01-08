/**
 * 周边购买服务
 */

import CopyrightShare from '../models/CopyrightShare';
import UserBuff from '../models/UserBuff';
import Series from '../models/Series';
import Copyright from '../models/Copyright';

const BASE_DISCOUNT = 0.5; // 基础折扣：5折
const BUFF_DISCOUNT = 0.05; // 每个收益buff再降5%
const MAX_PURCHASE_PER_USER = 2; // 每人限购2件

/**
 * 计算用户购买周边的折扣
 * @param userId 用户ID
 * @param copyrightId 版权ID
 * @returns 折扣比例（0-1之间）
 */
export async function calculateDiscount(userId: string, copyrightId: string): Promise<number> {
  // 检查用户是否持有该版权
  const share = await CopyrightShare.findOne({ userId, copyrightId, shares: { $gt: 0 } });
  if (!share) {
    return 1; // 无折扣
  }
  
  // 基础折扣：5折
  let discount = BASE_DISCOUNT;
  
  // 检查用户是否集齐了该版权所属的系列
  const copyright = await Copyright.findById(copyrightId);
  if (!copyright) {
    return discount;
  }
  
  const series = await Series.findOne({ copyrightIds: copyright._id });
  if (series) {
    // 检查用户是否集齐该系列
    const shares = await CopyrightShare.find({
      userId,
      copyrightId: { $in: series.copyrightIds },
      shares: { $gt: 0 }
    });
    
    const ownedCopyrightIds = new Set(shares.map(s => s.copyrightId.toString()));
    const requiredCopyrightIds = series.copyrightIds.map(id => id.toString());
    const isComplete = requiredCopyrightIds.every(id => ownedCopyrightIds.has(id));
    
    if (isComplete) {
      // 集齐系列，获取收益buff
      const buffs = await UserBuff.find({ userId, buffType: 'revenue', isActive: true });
      // 每个收益buff再降5%
      discount -= buffs.length * BUFF_DISCOUNT;
      // 最低3折
      discount = Math.max(0.3, discount);
    }
  }
  
  return discount;
}

/**
 * 检查用户是否可以购买周边
 * @param userId 用户ID
 * @param copyrightId 版权ID
 * @returns 是否可以购买
 */
export async function canPurchaseMerchandise(
  userId: string,
  copyrightId: string
): Promise<boolean> {
  // 检查用户是否持有该版权
  const share = await CopyrightShare.findOne({ userId, copyrightId, shares: { $gt: 0 } });
  if (!share) {
    return false;
  }
  
  // TODO: 检查用户本月购买数量（需要实现购买记录表）
  // const purchaseCount = await getPurchaseCount(userId, copyrightId, currentMonth);
  // if (purchaseCount >= MAX_PURCHASE_PER_USER) {
  //   return false;
  // }
  
  return true;
}

/**
 * 获取周边价格（应用折扣后）
 * @param userId 用户ID
 * @param copyrightId 版权ID
 * @param originalPrice 原价
 * @returns 折扣后价格
 */
export async function getDiscountedPrice(
  userId: string,
  copyrightId: string,
  originalPrice: number
): Promise<number> {
  const discount = await calculateDiscount(userId, copyrightId);
  return Math.floor(originalPrice * discount);
}



