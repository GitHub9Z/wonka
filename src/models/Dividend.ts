/**
 * 分红记录模型
 */

import mongoose, { Document, Schema } from 'mongoose';

export interface IDividend extends Document {
  userId: mongoose.Types.ObjectId; // 用户ID
  copyrightId: mongoose.Types.ObjectId; // 版权ID
  amount: number; // 分红金额（元）
  shares: number; // 持有的份额数
  totalShares: number; // 版权总份额
  salesAmount: number; // 周边销售额
  dividendRate: number; // 分红比例（20%）
  settlementDate: Date; // 结算日期（每月15日）
  status: 'pending' | 'paid'; // 状态：待支付、已支付
  paidAt?: Date; // 支付时间
  createdAt: Date;
  updatedAt: Date;
}

const DividendSchema = new Schema<IDividend>(
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
    amount: {
      type: Number,
      required: true,
      min: 0
    },
    shares: {
      type: Number,
      required: true,
      min: 0
    },
    totalShares: {
      type: Number,
      required: true
    },
    salesAmount: {
      type: Number,
      required: true,
      min: 0
    },
    dividendRate: {
      type: Number,
      default: 0.2 // 20%
    },
    settlementDate: {
      type: Date,
      required: true,
      index: true
    },
    status: {
      type: String,
      enum: ['pending', 'paid'],
      default: 'pending'
    },
    paidAt: {
      type: Date
    }
  },
  {
    timestamps: true
  }
);

DividendSchema.index({ userId: 1, settlementDate: -1 });
DividendSchema.index({ status: 1, settlementDate: 1 });

export default mongoose.model<IDividend>('Dividend', DividendSchema);




