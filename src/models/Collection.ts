/**
 * 收藏模型
 */

import mongoose, { Document, Schema } from 'mongoose';

export interface ICollection extends Document {
  userId: mongoose.Types.ObjectId;
  artworkId: mongoose.Types.ObjectId;
  ownedAt: Date;
}

const CollectionSchema = new Schema<ICollection>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    artworkId: {
      type: Schema.Types.ObjectId,
      ref: 'Artwork',
      required: true
    },
    ownedAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

// 唯一索引：一个用户不能重复收藏同一件藏品
CollectionSchema.index({ userId: 1, artworkId: 1 }, { unique: true });

export default mongoose.model<ICollection>('Collection', CollectionSchema);




