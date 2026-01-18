/**
 * 鉴赏记录模型
 */

import mongoose, { Document, Schema } from 'mongoose';

export interface IAppreciation extends Document {
  userId: mongoose.Types.ObjectId; // 鉴赏者ID
  targetUserId: mongoose.Types.ObjectId; // 被鉴赏者ID
  copyrightId: mongoose.Types.ObjectId; // 被鉴赏的版权ID
  rewardType: 'fragment' | 'coins' | 'buffCard'; // 奖励类型
  rewardValue: number; // 奖励数值
  watchDuration: number; // 观看广告时长（秒）
  createdAt: Date;
}

const AppreciationSchema = new Schema<IAppreciation>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    targetUserId: {
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
    rewardType: {
      type: String,
      enum: ['fragment', 'coins', 'buffCard'],
      required: true
    },
    rewardValue: {
      type: Number,
      required: true,
      min: 0
    },
    watchDuration: {
      type: Number,
      required: true,
      min: 0
    }
  },
  {
    timestamps: true
  }
);

// 索引：查询用户今日鉴赏次数
AppreciationSchema.index({ userId: 1, createdAt: -1 });
// 索引：查询用户被鉴赏次数（人气值）
AppreciationSchema.index({ targetUserId: 1, createdAt: -1 });

export default mongoose.model<IAppreciation>('Appreciation', AppreciationSchema);




