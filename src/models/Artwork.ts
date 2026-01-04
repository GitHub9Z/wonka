/**
 * 藏品模型
 */

import mongoose, { Document, Schema } from 'mongoose';

export type Rarity = 'common' | 'rare' | 'epic' | 'legendary';

export interface IArtwork extends Document {
  name: string;
  description: string;
  image: string;
  rarity: Rarity;
  price: number;
  artist: string;
  seriesName?: string; // 系列名称（用于筛选）
  createdAt: Date;
  updatedAt: Date;
}

const ArtworkSchema = new Schema<IArtwork>(
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
    rarity: {
      type: String,
      enum: ['common', 'rare', 'epic', 'legendary'],
      required: true,
      default: 'common'
    },
    price: {
      type: Number,
      required: true,
      min: 0
    },
    artist: {
      type: String,
      required: true
    },
    seriesName: {
      type: String,
      index: true // 添加索引以提高查询性能
    }
  },
  {
    timestamps: true
  }
);

// 索引
ArtworkSchema.index({ rarity: 1 });
ArtworkSchema.index({ createdAt: -1 });

export default mongoose.model<IArtwork>('Artwork', ArtworkSchema);

