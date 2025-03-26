import mongoose, { Schema, Document } from 'mongoose';

export interface IEmailUsage extends Document {
  provider: string;
  date: Date;
  count: number;
  lastReset: Date;
}

const EmailUsageSchema: Schema = new Schema({
  provider: { type: String, required: true },
  date: { type: Date, required: true },
  count: { type: Number, default: 0 },
  lastReset: { type: Date, required: true }
}, {
  timestamps: true
});

// 建立複合索引
EmailUsageSchema.index({ provider: 1, date: 1 }, { unique: true });

export default mongoose.models.EmailUsage || mongoose.model<IEmailUsage>('EmailUsage', EmailUsageSchema);