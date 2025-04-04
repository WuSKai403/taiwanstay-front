import mongoose, { Schema, Document } from 'mongoose';

/**
 * @deprecated 此模型已廢棄，請使用 Opportunity.timeSlots.monthlyCapacities 替代
 * 為了向後兼容性，本文件仍然保留
 *
 * 新的設計將月份容量直接嵌入到 TimeSlot 結構中，避免額外的資料庫查詢和同步問題
 * 請參考 models/Opportunity.ts 中的 ITimeSlot 和 IMonthlyCapacity 結構
 */

// 更名為 MonthCapacity，但保持檔名為 DateCapacity.ts 以避免破壞現有引用
export interface IMonthCapacity extends Document {
  date: string; // 月份，格式為 YYYY-MM
  opportunityId: mongoose.Types.ObjectId;
  timeSlotId: mongoose.Types.ObjectId;
  opportunitySlug: string;
  capacity: number;
  bookedCount: number;
  createdAt?: Date;
  updatedAt?: Date;
}

const MonthCapacitySchema: Schema = new Schema({
  date: { type: String, required: true, match: /^\d{4}-\d{2}$/ }, // 月份，格式為 YYYY-MM
  opportunityId: { type: Schema.Types.ObjectId, ref: 'Opportunity', required: true },
  timeSlotId: { type: Schema.Types.ObjectId, required: true },
  opportunitySlug: { type: String, required: true },
  capacity: { type: Number, required: true, min: 1 },
  bookedCount: { type: Number, default: 0 }
}, {
  timestamps: true
});

// 設定複合索引 - 機會ID + 時段ID + 月份
MonthCapacitySchema.index({ opportunityId: 1, timeSlotId: 1, date: 1 }, { unique: true });
MonthCapacitySchema.index({ opportunitySlug: 1 });
MonthCapacitySchema.index({ date: 1 });

// 保持舊的導出名稱 DateCapacity 以避免破壞現有引用，但實際上已更新為月份容量
export default mongoose.models.DateCapacity || mongoose.model<IMonthCapacity>('DateCapacity', MonthCapacitySchema);