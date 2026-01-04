/**
 * 馆币模型（挂机产币记录）
 */

import mongoose, { Document, Schema } from 'mongoose';

export interface IGalleryCoin extends Document {
  userId: mongoose.Types.ObjectId; // 用户ID
  coins: number; // 馆币数量
  lastClaimTime: Date; // 上次领取时间
  lastOfflineTime?: Date; // 上次离线时间（用于计算离线收益）
  createdAt: Date;
  updatedAt: Date;
}

const GalleryCoinSchema = new Schema<IGalleryCoin>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true
    },
    coins: {
      type: Number,
      default: 0,
      min: 0
    },
    lastClaimTime: {
      type: Date,
      default: Date.now
    },
    lastOfflineTime: {
      type: Date
    }
  },
  {
    timestamps: true
  }
);

export default mongoose.model<IGalleryCoin>('GalleryCoin', GalleryCoinSchema);


