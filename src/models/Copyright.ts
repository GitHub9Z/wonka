/**
 * 版权（图案）模型
 */

import mongoose, { Document, Schema } from 'mongoose';

export interface ICopyright extends Document {
  name: string; // 图案名称
  description: string; // 描述
  image: string; // 图片URL
  seriesId: mongoose.Types.ObjectId; // 所属系列
  totalShares: number; // 总份额（300-1000份）
  soldShares: number; // 已售份额
  price: number; // 单份价格（实体衍生品价格）
  blockchainHash?: string; // 区块链存证hash
  merchandiseStatus: 'undeveloped' | 'developing' | 'online'; // 周边开发状态
  createdAt: Date;
  updatedAt: Date;
}

const CopyrightSchema = new Schema<ICopyright>(
  {
    name: {
      type: String,
      required: true
    },
    description: {
      type: String,
      required: true
    },
    image: {
      type: String,
      required: true
    },
    seriesId: {
      type: Schema.Types.ObjectId,
      ref: 'Series',
      required: true,
      index: true
    },
    totalShares: {
      type: Number,
      required: true,
      min: 300,
      max: 1000
    },
    soldShares: {
      type: Number,
      default: 0,
      min: 0
    },
    price: {
      type: Number,
      required: true,
      min: 0
    },
    blockchainHash: {
      type: String
    },
    merchandiseStatus: {
      type: String,
      enum: ['undeveloped', 'developing', 'online'],
      default: 'undeveloped'
    }
  },
  {
    timestamps: true
  }
);

CopyrightSchema.index({ seriesId: 1 });
CopyrightSchema.index({ createdAt: -1 });

export default mongoose.model<ICopyright>('Copyright', CopyrightSchema);



