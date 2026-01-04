/**
 * 开箱记录模型
 */

import mongoose, { Document, Schema } from 'mongoose';

export type BoxType = 'normal' | 'series'; // 普通箱、系列箱
export type BoxRewardType = 'coins' | 'fragment' | 'adCard' | 'buffCard' | 'coupon'; // 奖励类型

export interface IBox extends Document {
  userId: mongoose.Types.ObjectId; // 用户ID
  boxType: BoxType; // 箱子类型
  rewardType: BoxRewardType; // 奖励类型
  rewardValue: number; // 奖励数值（馆币数量、碎片数量等）
  copyrightId?: mongoose.Types.ObjectId; // 关联的版权ID（碎片奖励）
  seriesId?: mongoose.Types.ObjectId; // 关联的系列ID（系列箱）
  createdAt: Date;
}

const BoxSchema = new Schema<IBox>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    boxType: {
      type: String,
      enum: ['normal', 'series'],
      required: true
    },
    rewardType: {
      type: String,
      enum: ['coins', 'fragment', 'adCard', 'buffCard', 'coupon'],
      required: true
    },
    rewardValue: {
      type: Number,
      required: true,
      min: 0
    },
    copyrightId: {
      type: Schema.Types.ObjectId,
      ref: 'Copyright'
    },
    seriesId: {
      type: Schema.Types.ObjectId,
      ref: 'Series'
    }
  },
  {
    timestamps: true
  }
);

BoxSchema.index({ userId: 1, createdAt: -1 });

export default mongoose.model<IBox>('Box', BoxSchema);


