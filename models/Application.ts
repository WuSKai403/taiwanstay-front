import mongoose, { Schema, Document } from 'mongoose';
import { ApplicationStatus } from './enums/ApplicationStatus';

export interface IApplication extends Document {
  userId: mongoose.Types.ObjectId;
  opportunityId: mongoose.Types.ObjectId;
  hostId: mongoose.Types.ObjectId;
  timeSlotId?: mongoose.Types.ObjectId; // 關聯到特定時段
  status: ApplicationStatus;
  statusNote?: string;

  // 申請資訊
  applicationDetails: {
    message: string;
    startMonth: string; // 用戶申請的開始月份，格式：YYYY-MM
    endMonth?: string; // 用戶申請的結束月份，格式：YYYY-MM
    duration: number; // 以天為單位，可以自動計算
    travelingWith?: {
      partner: boolean;
      children: boolean;
      pets: boolean;
      details?: string;
    };
    answers?: {
      question: string;
      answer: string;
    }[];
    specialRequirements?: string;
    dietaryRestrictions?: string[];
    languages?: string[];
    relevantExperience?: string;
    motivation?: string;
  };

  // 溝通記錄
  communications: {
    messages: {
      sender: mongoose.Types.ObjectId;
      content: string;
      timestamp: Date;
      read: boolean;
    }[];
    lastMessageAt?: Date;
    unreadHostMessages: number;
    unreadUserMessages: number;
  };

  // 審核資訊
  reviewDetails?: {
    reviewedBy: mongoose.Types.ObjectId;
    reviewedAt: Date;
    notes?: string;
    rating?: number;
  };

  // 確認資訊
  confirmationDetails?: {
    confirmedBy: mongoose.Types.ObjectId;
    confirmedAt: Date;
    arrivalInstructions?: string;
    additionalNotes?: string;
  };

  // 取消資訊
  cancellationDetails?: {
    cancelledBy: mongoose.Types.ObjectId;
    cancelledAt: Date;
    reason?: string;
    initiatedBy: 'host' | 'user';
  };

  // 完成資訊
  completionDetails?: {
    completedAt: Date;
    feedback?: {
      fromHost?: {
        rating: number;
        comment?: string;
        strengths?: string[];
        improvements?: string[];
        wouldHostAgain: boolean;
      };
      fromUser?: {
        rating: number;
        comment?: string;
        strengths?: string[];
        improvements?: string[];
        wouldVisitAgain: boolean;
        workEnvironment: number;
        accommodation: number;
        food: number;
        hostHospitality: number;
        learningOpportunities: number;
      };
    };
  };

  createdAt: Date;
  updatedAt: Date;
}

const ApplicationSchema: Schema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  opportunityId: { type: Schema.Types.ObjectId, ref: 'Opportunity', required: true },
  hostId: { type: Schema.Types.ObjectId, ref: 'Host', required: true },
  timeSlotId: { type: Schema.Types.ObjectId, ref: 'Opportunity.timeSlots' }, // 關聯到特定時段
  status: {
    type: String,
    enum: Object.values(ApplicationStatus),
    default: ApplicationStatus.PENDING
  },
  statusNote: { type: String },

  // 申請資訊
  applicationDetails: {
    message: { type: String, required: true },
    startMonth: { type: String, required: true, match: /^\d{4}-\d{2}$/ }, // YYYY-MM 格式
    endMonth: { type: String, match: /^\d{4}-\d{2}$/ }, // YYYY-MM 格式
    duration: { type: Number, required: true }, // 以天為單位
    travelingWith: {
      partner: { type: Boolean, default: false },
      children: { type: Boolean, default: false },
      pets: { type: Boolean, default: false },
      details: { type: String }
    },
    answers: [{
      question: { type: String },
      answer: { type: String }
    }],
    specialRequirements: { type: String },
    dietaryRestrictions: [{ type: String }],
    languages: [{ type: String }],
    relevantExperience: { type: String },
    motivation: { type: String }
  },

  // 溝通記錄
  communications: {
    messages: [{
      sender: { type: Schema.Types.ObjectId, ref: 'User', required: true },
      content: { type: String, required: true },
      timestamp: { type: Date, default: Date.now },
      read: { type: Boolean, default: false }
    }],
    lastMessageAt: { type: Date },
    unreadHostMessages: { type: Number, default: 0 },
    unreadUserMessages: { type: Number, default: 0 }
  },

  // 審核資訊
  reviewDetails: {
    reviewedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    reviewedAt: { type: Date },
    notes: { type: String },
    rating: { type: Number }
  },

  // 確認資訊
  confirmationDetails: {
    confirmedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    confirmedAt: { type: Date },
    arrivalInstructions: { type: String },
    additionalNotes: { type: String }
  },

  // 取消資訊
  cancellationDetails: {
    cancelledBy: { type: Schema.Types.ObjectId, ref: 'User' },
    cancelledAt: { type: Date },
    reason: { type: String },
    initiatedBy: { type: String, enum: ['host', 'user'] }
  },

  // 完成資訊
  completionDetails: {
    completedAt: { type: Date },
    feedback: {
      fromHost: {
        rating: { type: Number },
        comment: { type: String },
        strengths: [{ type: String }],
        improvements: [{ type: String }],
        wouldHostAgain: { type: Boolean }
      },
      fromUser: {
        rating: { type: Number },
        comment: { type: String },
        strengths: [{ type: String }],
        improvements: [{ type: String }],
        wouldVisitAgain: { type: Boolean },
        workEnvironment: { type: Number },
        accommodation: { type: Number },
        food: { type: Number },
        hostHospitality: { type: Number },
        learningOpportunities: { type: Number }
      }
    }
  },

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, {
  timestamps: true
});

// 修改唯一索引，考慮時段
ApplicationSchema.index({ userId: 1, opportunityId: 1, timeSlotId: 1 }, { unique: true });
ApplicationSchema.index({ hostId: 1 });
ApplicationSchema.index({ status: 1 });
ApplicationSchema.index({ 'applicationDetails.startMonth': 1 });
ApplicationSchema.index({ 'applicationDetails.endMonth': 1 });
ApplicationSchema.index({ createdAt: 1 });
ApplicationSchema.index({ timeSlotId: 1 });
ApplicationSchema.index({ opportunityId: 1, timeSlotId: 1 });

// 保存前檢查時段申請的有效性
ApplicationSchema.pre('save', async function(next) {
  const application = this as unknown as IApplication;

  // 如果有指定時段ID，則檢查時段是否存在且可申請
  if (application.timeSlotId && application.isNew) {
    try {
      // 獲取機會資訊
      const Opportunity = mongoose.model('Opportunity');
      const opportunity = await Opportunity.findById(application.opportunityId);

      if (!opportunity) {
        return next(new Error('工作機會不存在'));
      }

      // 檢查時段是否存在
      const timeSlot = opportunity.timeSlots?.id(application.timeSlotId);
      if (!timeSlot) {
        return next(new Error('指定的時段不存在'));
      }

      // 檢查時段狀態
      if (timeSlot.status !== 'OPEN') {
        return next(new Error('該時段已不開放申請'));
      }

      // 檢查最短停留時間
      const startMonth = new Date(application.applicationDetails.startMonth);
      const endMonth = application.applicationDetails.endMonth
        ? new Date(application.applicationDetails.endMonth)
        : null;

      if (!endMonth) {
        return next(new Error('請提供結束月份'));
      }

      const durationDays = Math.ceil((endMonth.getTime() - startMonth.getTime()) / (1000 * 60 * 60 * 24));

      // 檢查申請的時間範圍是否符合時段的最短停留要求
      if (timeSlot.minimumStay > 0 && durationDays < timeSlot.minimumStay) {
        return next(new Error(`停留時間不得少於 ${timeSlot.minimumStay} 天`));
      }

      // 檢查申請的時間範圍是否在時段的有效期內
      const timeSlotStart = new Date(timeSlot.startDate);
      const timeSlotEnd = new Date(timeSlot.endDate);

      if (startMonth < timeSlotStart || endMonth > timeSlotEnd) {
        return next(new Error('申請的時間範圍超出了時段的有效期'));
      }

      // 檢查所選日期範圍內的每一天是否都有足夠的容量
      const DateCapacity = mongoose.model('DateCapacity');

      // 獲取所有日期
      const allDates = [];
      const currentDate = new Date(startMonth);

      while (currentDate <= endMonth) {
        allDates.push(formatDate(currentDate));
        currentDate.setDate(currentDate.getDate() + 1);
      }

      // 檢查每一天的容量
      const dateCapacities = await DateCapacity.find({
        opportunityId: opportunity._id,
        date: { $in: allDates }
      });

      // 檢查是否所有日期都有容量記錄
      if (dateCapacities.length !== allDates.length) {
        return next(new Error('所選日期範圍部分日期不可預訂'));
      }

      // 檢查每一天是否都有足夠的容量
      for (const capacity of dateCapacities) {
        if (capacity.bookedCount >= capacity.capacity) {
          return next(new Error(`${capacity.date} 已無可用名額`));
        }
      }

      // 更新每一天的已預訂數量
      for (const date of allDates) {
        await DateCapacity.updateOne(
          { opportunityId: opportunity._id, date },
          { $inc: { bookedCount: 1 } }
        );
      }

      // 更新時段的申請計數
      timeSlot.appliedCount += 1;
      await opportunity.save();
    } catch (error) {
      return next(error instanceof Error ? error : new Error('未知錯誤'));
    }
  }

  next();
});

// 當申請狀態變更為已確認時，更新時段的確認計數
ApplicationSchema.pre('save', async function(next) {
  const application = this as unknown as IApplication;

  // 檢查是否有時段ID且狀態變更為已確認
  if (application.timeSlotId &&
      application.status === ApplicationStatus.CONFIRMED &&
      application.isModified('status')) {
    try {
      const Opportunity = mongoose.model('Opportunity');
      const opportunity = await Opportunity.findById(application.opportunityId);

      if (!opportunity) {
        return next();
      }

      const timeSlot = opportunity.timeSlots?.id(application.timeSlotId);
      if (!timeSlot) {
        return next();
      }

      // 更新確認計數
      timeSlot.confirmedCount += 1;
      await opportunity.save();
    } catch (error) {
      return next(error instanceof Error ? error : new Error('未知錯誤'));
    }
  }

  next();
});

// 日期格式化輔助函數
function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

export default mongoose.models.Application || mongoose.model<IApplication>('Application', ApplicationSchema);