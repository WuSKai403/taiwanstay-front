import mongoose, { Schema, Document } from 'mongoose';

export interface IDateCapacity extends Document {
  date: string; // 格式為 'YYYY-MM-DD'
  opportunityId: mongoose.Types.ObjectId;
  timeSlotId: mongoose.Types.ObjectId;
  capacity: number; // 該日期的總容量
  bookedCount: number; // 已預訂數量
  createdAt: Date;
  updatedAt: Date;
}

const DateCapacitySchema: Schema = new Schema({
  date: { type: String, required: true },
  opportunityId: { type: Schema.Types.ObjectId, ref: 'Opportunity', required: true },
  timeSlotId: { type: Schema.Types.ObjectId, required: true },
  capacity: { type: Number, required: true, min: 0 },
  bookedCount: { type: Number, default: 0, min: 0 }
}, {
  timestamps: true
});

// 複合唯一索引，確保每個機會的每一天只有一個容量記錄
DateCapacitySchema.index({ date: 1, opportunityId: 1 }, { unique: true });
// 為了提高查詢效率的索引
DateCapacitySchema.index({ opportunityId: 1, timeSlotId: 1 });
DateCapacitySchema.index({ timeSlotId: 1 });

export default mongoose.models.DateCapacity || mongoose.model<IDateCapacity>('DateCapacity', DateCapacitySchema);