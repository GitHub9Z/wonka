/**
 * 系列模型
 */

import mongoose, { Document, Schema } from 'mongoose';

export interface ISeries extends Document {
  name: string; // 系列名称
  description: string; // 系列描述
  image: string; // 系列封面图
  copyrightIds: mongoose.Types.ObjectId[]; // 包含的版权ID列表（5-8个）
  buffType: 'revenue' | 'game'; // buff类型：收益buff或游戏buff
  buffEffect: string; // buff效果描述
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
    buffType: {
      type: String,
      enum: ['revenue', 'game'],
      required: true
    },
    buffEffect: {
      type: String,
      required: true
    }
  },
  {
    timestamps: true
  }
);

export default mongoose.model<ISeries>('Series', SeriesSchema);


