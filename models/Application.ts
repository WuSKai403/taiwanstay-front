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
    availableMonths?: string[]; // 用戶可用的月份列表，格式：['YYYY-MM'...]
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

    // 更新為符合前端表單的結構
    dietaryRestrictions: {
      type: { type: mongoose.Schema.Types.Mixed, default: [] };
      otherDetails: { type: String, default: '' };
      vegetarianType: { type: String, default: '' };
    };

    // 更新為符合前端表單的結構
    languages?: {
      language: string;
      level: string; // basic, intermediate, advanced, native
    }[];

    relevantExperience?: string;
    motivation?: string;

    // 新增前端表單中的其他字段
    nationality?: string;
    visaType?: string;
    allergies?: string;
    drivingLicense?: {
      motorcycle: boolean;
      car: boolean;
      none: boolean;
      other: {
        enabled: boolean;
        details?: string;
      };
    };
    workExperience?: {
      position: string;
      company: string;
      startDate: string;
      endDate?: string;
      isCurrent?: boolean;
      description?: string;
    }[];
    physicalCondition?: string;
    skills?: string;
    preferredWorkHours?: string;
    accommodationNeeds?: string;
    culturalInterests?: string[];
    learningGoals?: string[];
    contribution?: string;
    adaptabilityRatings?: {
      farmWork: number;
      outdoorWork: number;
      physicalWork: number;
      teamWork: number;
      independence: number;
      adaptability: number;
    };
    photos?: {
      publicId: string;
      url: string;
      width: number;
      height: number;
      format: string;
      type: string;
    }[];
    photoDescriptions?: {
      [key: string]: string;
    };
    videoIntroduction?: {
      url: string;
      publicId?: string;
    };
    additionalNotes?: string;
    sourceChannel?: string;
    termsAgreed?: boolean;
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
    availableMonths: [{ type: String, match: /^\d{4}-\d{2}$/ }], // 用戶可用的月份列表
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

    // 更新為符合前端表單的結構
    dietaryRestrictions: {
      type: { type: mongoose.Schema.Types.Mixed, default: [] },
      otherDetails: { type: String, default: '' },
      vegetarianType: { type: String, default: '' }
    },

    // 更新為符合前端表單的結構
    languages: [{
      language: { type: String, required: true },
      level: { type: String, required: true } // basic, intermediate, advanced, native
    }],

    relevantExperience: { type: String },
    motivation: { type: String },

    // 新增前端表單中的其他字段
    nationality: { type: String },
    visaType: { type: String },
    allergies: { type: String },
    drivingLicense: {
      motorcycle: { type: Boolean, default: false },
      car: { type: Boolean, default: false },
      none: { type: Boolean, default: false },
      other: {
        enabled: { type: Boolean, default: false },
        details: { type: String }
      }
    },
    workExperience: [{
      position: { type: String },
      company: { type: String },
      startDate: { type: String },
      endDate: { type: String },
      isCurrent: { type: Boolean, default: false },
      description: { type: String }
    }],
    physicalCondition: { type: String },
    skills: { type: String },
    preferredWorkHours: { type: String },
    accommodationNeeds: { type: String },
    culturalInterests: [{ type: String }],
    learningGoals: [{ type: String }],
    contribution: { type: String },
    adaptabilityRatings: {
      farmWork: { type: Number, min: 1, max: 5 },
      outdoorWork: { type: Number, min: 1, max: 5 },
      physicalWork: { type: Number, min: 1, max: 5 },
      teamWork: { type: Number, min: 1, max: 5 },
      independence: { type: Number, min: 1, max: 5 },
      adaptability: { type: Number, min: 1, max: 5 }
    },
    photos: [{
      publicId: { type: String },
      url: { type: String },
      width: { type: Number },
      height: { type: Number },
      format: { type: String },
      type: { type: String }
    }],
    photoDescriptions: { type: mongoose.Schema.Types.Mixed, default: {} },
    videoIntroduction: {
      url: { type: String },
      publicId: { type: String }
    },
    additionalNotes: { type: String },
    sourceChannel: { type: String },
    termsAgreed: { type: Boolean, default: false }
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

      // 直接使用表單提交的 duration 進行檢查，而不是重新計算
      const submittedDuration = application.applicationDetails.duration;

      // 檢查申請的時間範圍是否符合時段的最短停留要求
      if (timeSlot.minimumStay > 0 && submittedDuration < timeSlot.minimumStay) {
        return next(new Error(`停留時間不得少於 ${timeSlot.minimumStay} 天`));
      }

      // 以下原始日期檢查邏輯仍然保留，確保日期範圍在時段有效期內
      const startMonth = new Date(application.applicationDetails.startMonth);
      const endMonth = application.applicationDetails.endMonth
        ? new Date(application.applicationDetails.endMonth)
        : null;

      if (!endMonth) {
        return next(new Error('請提供結束月份'));
      }

      // 檢查申請的時間範圍是否在時段的有效期內
      const timeSlotStart = new Date(timeSlot.startMonth);
      const timeSlotEnd = new Date(timeSlot.endMonth);

      if (startMonth < timeSlotStart || endMonth > timeSlotEnd) {
        return next(new Error('申請的時間範圍超出了時段的有效期'));
      }

      // 獲取所有月份 (YYYY-MM 格式)
      const allMonths = [];
      const currentMonth = new Date(startMonth);
      currentMonth.setDate(1); // 設置為月初

      while (currentMonth <= endMonth) {
        // 格式化為 YYYY-MM
        const monthStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}`;
        allMonths.push(monthStr);

        // 移至下一個月
        currentMonth.setMonth(currentMonth.getMonth() + 1);
      }

      // 檢查時段是否有每月容量設定，如果沒有則初始化
      if (!timeSlot.monthlyCapacities || timeSlot.monthlyCapacities.length === 0) {
        timeSlot.monthlyCapacities = [];

        // 初始化時段範圍內的每月容量
        const slotStartMonth = new Date(timeSlot.startMonth);
        const slotEndMonth = new Date(timeSlot.endMonth);
        const tempMonth = new Date(slotStartMonth);

        while (tempMonth <= slotEndMonth) {
          const monthStr = `${tempMonth.getFullYear()}-${String(tempMonth.getMonth() + 1).padStart(2, '0')}`;
          timeSlot.monthlyCapacities.push({
            month: monthStr,
            capacity: timeSlot.defaultCapacity,
            bookedCount: 0
          });

          tempMonth.setMonth(tempMonth.getMonth() + 1);
        }
      }

      // 檢查每個申請月份的容量
      for (const month of allMonths) {
        let monthlyCapacity = timeSlot.monthlyCapacities.find((mc: { month: string, capacity: number, bookedCount: number }) => mc.month === month);

        // 如果月份不存在，則添加新月份容量記錄
        if (!monthlyCapacity) {
          monthlyCapacity = {
            month: month,
            capacity: timeSlot.defaultCapacity,
            bookedCount: 0
          };
          timeSlot.monthlyCapacities.push(monthlyCapacity);
        }

        // 檢查容量
        if (monthlyCapacity.bookedCount >= monthlyCapacity.capacity) {
          return next(new Error(`${month} 月已無可用名額`));
        }

        // 更新已預訂數量
        monthlyCapacity.bookedCount += 1;
      }

      // 更新時段的總申請計數
      timeSlot.appliedCount += 1;

      // 保存更新後的機會
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

  // 檢查是否有時段ID且狀態變更為已確認（ACTIVE）
  if (application.timeSlotId &&
      application.status === ApplicationStatus.ACTIVE &&
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