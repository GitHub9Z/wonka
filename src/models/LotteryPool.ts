/**
 * 奖池模型
 */

import mongoose, { Document, Schema } from 'mongoose';

export interface ILotteryPool extends Document {
  userId: mongoose.Types.ObjectId; // 用户ID
  copyrightId: mongoose.Types.ObjectId; // 版权ID
  shares: number; // 投入的份额数
  month: string; // 月份（YYYY-MM格式）
  isWinner: boolean; // 是否中奖
  createdAt: Date;
}

const LotteryPoolSchema = new Schema<ILotteryPool>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    copyrightId: {
      type: Schema.Types.ObjectId,
      ref: 'Copyright',
      required: true
    },
    shares: {
      type: Number,
      required: true,
      min: 1
    },
    month: {
      type: String,
      required: true,
      index: true
    },
    isWinner: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

LotteryPoolSchema.index({ month: 1, isWinner: 1 });

export default mongoose.model<ILotteryPool>('LotteryPool', LotteryPoolSchema);



