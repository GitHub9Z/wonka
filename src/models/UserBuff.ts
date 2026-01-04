/**
 * 用户Buff模型（集齐系列后激活的buff）
 */

import mongoose, { Document, Schema } from 'mongoose';

export interface IUserBuff extends Document {
  userId: mongoose.Types.ObjectId; // 用户ID
  seriesId: mongoose.Types.ObjectId; // 系列ID
  buffType: 'revenue' | 'game'; // buff类型
  buffEffect: string; // buff效果
  isActive: boolean; // 是否激活
  activatedAt: Date; // 激活时间
  createdAt: Date;
  updatedAt: Date;
}

const UserBuffSchema = new Schema<IUserBuff>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    seriesId: {
      type: Schema.Types.ObjectId,
      ref: 'Series',
      required: true
    },
    buffType: {
      type: String,
      enum: ['revenue', 'game'],
      required: true
    },
    buffEffect: {
      type: String,
      required: true
    },
    isActive: {
      type: Boolean,
      default: true
    },
    activatedAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

// 唯一索引：一个用户对一个系列只能有一个buff
UserBuffSchema.index({ userId: 1, seriesId: 1 }, { unique: true });

export default mongoose.model<IUserBuff>('UserBuff', UserBuffSchema);


