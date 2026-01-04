/**
 * 用户模型
 */

import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
  openId: string;
  nickname: string;
  avatar: string;
  coins: number; // 金币（保留兼容）
  galleryCoins: number; // 馆币
  level: number;
  experience: number;
  popularity: number; // 人气值（被鉴赏次数）
  lastOnlineTime: Date; // 最后在线时间（用于计算离线收益）
  isMinor: boolean; // 是否未成年人
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    openId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    nickname: {
      type: String,
      required: true,
      default: '艺术收藏家'
    },
    avatar: {
      type: String,
      required: true
    },
    coins: {
      type: Number,
      default: 1000,
      min: 0
    },
    level: {
      type: Number,
      default: 1,
      min: 1
    },
    experience: {
      type: Number,
      default: 0,
      min: 0
    },
    galleryCoins: {
      type: Number,
      default: 0,
      min: 0
    },
    popularity: {
      type: Number,
      default: 0,
      min: 0
    },
    lastOnlineTime: {
      type: Date,
      default: Date.now
    },
    isMinor: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

export default mongoose.model<IUser>('User', UserSchema);

