/**
 * 版权碎片模型（开箱获得的碎片）
 */

import mongoose, { Document, Schema } from 'mongoose';

export interface ICopyrightFragment extends Document {
  userId: mongoose.Types.ObjectId; // 用户ID
  copyrightId: mongoose.Types.ObjectId; // 版权ID
  fragments: number; // 碎片数量（10碎片=1份版权）
  createdAt: Date;
  updatedAt: Date;
}

const CopyrightFragmentSchema = new Schema<ICopyrightFragment>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    copyrightId: {
      type: Schema.Types.ObjectId,
      ref: 'Copyright',
      required: true,
      index: true
    },
    fragments: {
      type: Number,
      default: 0,
      min: 0
    }
  },
  {
    timestamps: true
  }
);

// 唯一索引：一个用户对一个版权只能有一条碎片记录
CopyrightFragmentSchema.index({ userId: 1, copyrightId: 1 }, { unique: true });

export default mongoose.model<ICopyrightFragment>('CopyrightFragment', CopyrightFragmentSchema);




