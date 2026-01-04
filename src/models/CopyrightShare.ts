/**
 * 版权份额模型（用户持有的版权份额）
 * 按1份为单位存储，每个份额对应一个区块链hash
 */

import mongoose, { Document, Schema } from 'mongoose';

export interface ICopyrightShare extends Document {
  userId: mongoose.Types.ObjectId; // 用户ID
  copyrightId: mongoose.Types.ObjectId; // 版权ID
  blockchainHash: string; // 区块链hash（每个份额对应一个）
  inLotteryPool: boolean; // 是否投入奖池
  lastGiftDate?: Date; // 最后一次转赠日期（每年3次）
  giftCount: number; // 转赠次数
  createdAt: Date;
  updatedAt: Date;
}

const CopyrightShareSchema = new Schema<ICopyrightShare>(
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
      required: true,
      index: true
    },
    blockchainHash: {
      type: String,
      required: true,
      unique: true, // 每个区块链hash唯一
      index: true
    },
    inLotteryPool: {
      type: Boolean,
      default: false
    },
    lastGiftDate: {
      type: Date
    },
    giftCount: {
      type: Number,
      default: 0,
      min: 0,
      max: 3
    }
  },
  {
    timestamps: true
  }
);

// 复合索引：用户和版权的组合查询
CopyrightShareSchema.index({ userId: 1, copyrightId: 1 });

export default mongoose.model<ICopyrightShare>('CopyrightShare', CopyrightShareSchema);
