/**
 * 系列模型
 */

import mongoose, { Document, Schema } from 'mongoose';

export interface ISeries extends Document {
  name: string; // 系列名称
  description: string; // 系列描述
  image: string; // 系列封面图
  copyrightIds: mongoose.Types.ObjectId[]; // 包含的版权ID列表（5-8个）
  hourlyBonusCoins: number; // 每小时额外WTC数量（集齐系列后激活）
  createdAt: Date;
  updatedAt: Date;
}

const SeriesSchema = new Schema<ISeries>(
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
    copyrightIds: [{
      type: Schema.Types.ObjectId,
      ref: 'Copyright'
    }],
    hourlyBonusCoins: {
      type: Number,
      required: true,
      default: 0,
      min: 0
    }
  },
  {
    timestamps: true
  }
);

export default mongoose.model<ISeries>('Series', SeriesSchema);



