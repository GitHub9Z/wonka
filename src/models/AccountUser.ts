/**
 * 账号用户模型（邮箱/手机号+密码）
 */

import mongoose, { Document, Schema } from 'mongoose';

export interface IAccountUser extends Document {
  email?: string; // 邮箱（可选）
  phone?: string; // 手机号（可选）
  password: string; // 加密后的密码
  nickname: string; // 昵称
  avatar?: string; // 头像（可选）
  coins: number; // WTC
  galleryCoins: number; // 馆币
  level: number; // 等级
  experience: number; // 经验值
  popularity: number; // 人气值
  lastOnlineTime: Date; // 最后在线时间
  isMinor: boolean; // 是否未成年人
  createdAt: Date;
  updatedAt: Date;
}

const AccountUserSchema = new Schema<IAccountUser>(
  {
    email: {
      type: String,
      sparse: true, // 允许为空，但如果有值则必须唯一
      index: true
    },
    phone: {
      type: String,
      sparse: true, // 允许为空，但如果有值则必须唯一
      index: true
    },
    password: {
      type: String,
      required: true,
      minlength: 6
    },
    nickname: {
      type: String,
      required: true,
      default: '艺术收藏家'
    },
    avatar: {
      type: String,
      default: ''
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

// 唯一索引：确保邮箱和手机号唯一（sparse 索引允许 null 值）
AccountUserSchema.index(
  { email: 1 },
  { unique: true, sparse: true }
);

AccountUserSchema.index(
  { phone: 1 },
  { unique: true, sparse: true }
);

// 验证：邮箱和手机号至少有一个
AccountUserSchema.pre('validate', function(next) {
  if (!this.email && !this.phone) {
    this.invalidate('email', '邮箱和手机号至少需要填写一个');
    this.invalidate('phone', '邮箱和手机号至少需要填写一个');
  }
  next();
});

export default mongoose.model<IAccountUser>('AccountUser', AccountUserSchema);

