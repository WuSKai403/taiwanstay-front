import mongoose, { Schema, Document } from 'mongoose';
import { OpportunityStatus } from './enums/OpportunityStatus';
import { OpportunityType } from './enums/OpportunityType';
import { TimeSlotStatus } from './enums/TimeSlotStatus';

// 容量覆蓋介面定義
export interface ICapacityOverride {
  _id?: mongoose.Types.ObjectId;
  startDate: Date; // 覆蓋開始日期
  endDate: Date; // 覆蓋結束日期
  capacity: number; // 該日期範圍的容量
}

// 月份容量介面定義
export interface IMonthlyCapacity {
  _id?: mongoose.Types.ObjectId;
  month: string; // 月份，格式為 'YYYY-MM'
  capacity: number; // 容量
  bookedCount: number; // 已預訂人數
}

// 時段介面定義
export interface ITimeSlot {
  _id?: mongoose.Types.ObjectId;
  startDate: string; // 時段開始年月，格式為 'YYYY-MM'
  endDate: string; // 時段結束年月，格式為 'YYYY-MM'
  defaultCapacity: number; // 默認容量（需求人數）
  minimumStay: number; // 最短停留天數
  workDaysPerWeek: number; // 每週工作天數
  workHoursPerDay: number; // 每日工作時數
  appliedCount: number; // 已申請人數
  confirmedCount: number; // 已確認人數
  status: TimeSlotStatus; // 時段狀態
  description?: string; // 時段描述
  capacityOverrides?: ICapacityOverride[]; // 特定日期範圍的容量覆蓋
  monthlyCapacities?: IMonthlyCapacity[]; // 每月容量管理
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IOpportunity extends Document {
  hostId: mongoose.Types.ObjectId;
  title: string;
  slug: string;
  publicId: string;
  description: string;
  shortDescription: string;
  status: OpportunityStatus;
  statusNote?: string;
  type: OpportunityType;

  // 狀態歷史紀錄
  statusHistory: Array<{
    status: OpportunityStatus;
    reason?: string;
    changedBy?: mongoose.Types.ObjectId;
    changedAt: Date;
  }>;

  // 工作詳情 - 移除時間相關欄位
  workDetails: {
    tasks: string[];
    skills: string[];
    learningOpportunities: string[];
    physicalDemand: 'low' | 'medium' | 'high';
    languages: string[];
    availableMonths: number[];
  };

  // 提供的福利
  benefits: {
    accommodation: {
      provided: boolean;
      type?: 'private_room' | 'shared_room' | 'dormitory' | 'camping' | 'other';
      description?: string;
    };
    meals: {
      provided: boolean;
      count?: number; // 每天提供幾餐
      description?: string;
    };
    stipend: {
      provided: boolean;
      amount?: number;
      currency?: string;
      frequency?: 'daily' | 'weekly' | 'monthly';
    };
    otherBenefits?: string[];
  };

  // 要求與限制
  requirements: {
    minAge?: number;
    maxAge?: number;
    gender?: 'any' | 'male' | 'female';
    acceptsCouples: boolean;
    acceptsFamilies: boolean;
    acceptsPets: boolean;
    drivingLicense?: {
      carRequired: boolean;
      motorcycleRequired: boolean;
      otherRequired: boolean;
      otherDescription?: string;
    };
    specificNationalities?: string[];
    specificSkills?: string[];
    otherRequirements?: string[];
  };

  // 媒體資訊
  media: {
    coverImage: {
      publicId: { type: String },
      secureUrl: { type: String },
      url: { type: String },
      previewUrl: { type: String },
      thumbnailUrl: { type: String },
      alt: { type: String },
      version: { type: String },
      format: { type: String },
      width: { type: Number },
      height: { type: Number }
    },
    images: [{
      publicId: { type: String },
      secureUrl: { type: String },
      url: { type: String },
      previewUrl: { type: String },
      thumbnailUrl: { type: String },
      alt: { type: String },
      version: { type: String },
      format: { type: String },
      width: { type: Number },
      height: { type: Number }
    }],
    descriptions: [{ type: String }],
    videoUrl: { type: String },
    videoDescription: { type: String },
    virtualTour: { type: String }
  };

  // 位置資訊
  location: {
    address?: string;
    city: string;
    district?: string;
    country: string;
    coordinates?: {
      type: string;
      coordinates: number[];
    };
  };

  // 申請資訊
  applicationProcess: {
    instructions?: string;
    questions?: string[];
    deadline?: Date;
    maxApplications?: number;
    currentApplications: number;
  };

  // 影響與可持續性
  impact: {
    environmentalContribution?: string;
    socialContribution?: string;
    culturalExchange?: string;
    sustainableDevelopmentGoals?: string[];
  };

  // 評價與評分
  ratings: {
    overall: number;
    workEnvironment: number;
    accommodation: number;
    food: number;
    hostHospitality: number;
    learningOpportunities: number;
    reviewCount: number;
  };

  // 統計數據
  stats: {
    views: number;
    applications: number;
    bookmarks: number;
    shares: number;
  };

  // 時段資訊
  timeSlots?: ITimeSlot[];
  hasTimeSlots: boolean; // 是否有時段需求

  createdAt: Date;
  updatedAt: Date;
}

// 容量覆蓋模式定義
const CapacityOverrideSchema: Schema = new Schema({
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  capacity: { type: Number, required: true, min: 1 }
});

// 月份容量模式定義
const MonthlyCapacitySchema: Schema = new Schema({
  month: { type: String, required: true, match: /^\d{4}-\d{2}$/ }, // 格式為 'YYYY-MM'
  capacity: { type: Number, required: true, min: 0 },
  bookedCount: { type: Number, default: 0, min: 0 }
});

// 時段模式定義
const TimeSlotSchema: Schema = new Schema({
  startDate: { type: String, required: true }, // 修改為接受 YYYY-MM-DD 格式
  endDate: { type: String, required: true }, // 修改為接受 YYYY-MM-DD 格式
  defaultCapacity: { type: Number, required: true, min: 1 }, // 改名為 defaultCapacity 更清晰
  minimumStay: { type: Number, required: true, min: 1, default: 14 }, // 最短停留天數，默認 14 天
  workDaysPerWeek: { type: Number, required: true, min: 1, max: 7 }, // 每週工作天數
  workHoursPerDay: { type: Number, required: true, min: 1 }, // 每日工作時數
  appliedCount: { type: Number, default: 0 },
  confirmedCount: { type: Number, default: 0 },
  status: {
    type: String,
    enum: Object.values(TimeSlotStatus),
    default: TimeSlotStatus.OPEN
  },
  description: { type: String },
  capacityOverrides: [CapacityOverrideSchema], // 特定日期範圍的容量覆蓋
  monthlyCapacities: [MonthlyCapacitySchema] // 每月容量管理
}, { timestamps: true });

const OpportunitySchema: Schema = new Schema({
  hostId: { type: Schema.Types.ObjectId, ref: 'Host', required: true },
  title: { type: String, required: true },
  slug: { type: String, required: true },
  publicId: { type: String, required: true, unique: true },
  description: { type: String, required: true },
  shortDescription: { type: String, required: true, maxlength: 200 },
  status: {
    type: String,
    enum: Object.values(OpportunityStatus),
    default: OpportunityStatus.DRAFT
  },
  statusNote: { type: String },
  type: {
    type: String,
    enum: Object.values(OpportunityType),
    required: true
  },
  // 狀態歷史紀錄
  statusHistory: [
    {
      status: { type: String, enum: Object.values(OpportunityStatus), required: true },
      reason: { type: String },
      changedBy: { type: Schema.Types.ObjectId, ref: 'User' },
      changedAt: { type: Date, default: Date.now }
    }
  ],

  // 工作詳情 - 移除時間相關欄位
  workDetails: {
    tasks: [{ type: String, required: true }],
    skills: [{ type: String }],
    learningOpportunities: [{ type: String }],
    physicalDemand: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium'
    },
    languages: [{ type: String, required: true }],
    availableMonths: [{ type: Number }]
  },

  // 提供的福利
  benefits: {
    accommodation: {
      provided: { type: Boolean, required: true },
      type: {
        type: String,
        enum: ['private_room', 'shared_room', 'dormitory', 'camping', 'other']
      },
      description: { type: String }
    },
    meals: {
      provided: { type: Boolean, required: true },
      count: { type: Number }, // 每天提供幾餐
      description: { type: String }
    },
    stipend: {
      provided: { type: Boolean, default: false },
      amount: { type: Number },
      currency: { type: String },
      frequency: {
        type: String,
        enum: ['daily', 'weekly', 'monthly']
      }
    },
    otherBenefits: [{ type: String }]
  },

  // 要求與限制
  requirements: {
    minAge: { type: Number },
    maxAge: { type: Number },
    gender: {
      type: String,
      enum: ['any', 'male', 'female'],
      default: 'any'
    },
    acceptsCouples: { type: Boolean, default: false },
    acceptsFamilies: { type: Boolean, default: false },
    acceptsPets: { type: Boolean, default: false },
    drivingLicense: {
      carRequired: { type: Boolean, default: false },
      motorcycleRequired: { type: Boolean, default: false },
      otherRequired: { type: Boolean, default: false },
      otherDescription: { type: String }
    },
    specificNationalities: [{ type: String }],
    specificSkills: [{ type: String }],
    otherRequirements: [{ type: String }]
  },

  // 媒體資訊
  media: {
    coverImage: {
      publicId: { type: String },
      secureUrl: { type: String },
      url: { type: String },
      previewUrl: { type: String },
      thumbnailUrl: { type: String },
      alt: { type: String },
      version: { type: String },
      format: { type: String },
      width: { type: Number },
      height: { type: Number }
    },
    images: [{
      publicId: { type: String },
      secureUrl: { type: String },
      url: { type: String },
      previewUrl: { type: String },
      thumbnailUrl: { type: String },
      alt: { type: String },
      version: { type: String },
      format: { type: String },
      width: { type: Number },
      height: { type: Number }
    }],
    descriptions: [{ type: String }],
    videoUrl: { type: String },
    videoDescription: { type: String },
    virtualTour: { type: String }
  },

  // 位置資訊
  location: {
    address: { type: String },
    city: { type: String, required: true },
    district: { type: String },
    country: { type: String, required: true },
    coordinates: {
      type: { type: String, default: 'Point' },
      coordinates: [Number]
    }
  },

  // 申請資訊
  applicationProcess: {
    instructions: { type: String },
    questions: [{ type: String }],
    deadline: { type: Date },
    maxApplications: { type: Number },
    currentApplications: { type: Number, default: 0 }
  },

  // 影響與可持續性
  impact: {
    environmentalContribution: { type: String },
    socialContribution: { type: String },
    culturalExchange: { type: String },
    sustainableDevelopmentGoals: [{ type: String }]
  },

  // 評價與評分
  ratings: {
    overall: { type: Number, default: 0 },
    workEnvironment: { type: Number, default: 0 },
    accommodation: { type: Number, default: 0 },
    food: { type: Number, default: 0 },
    hostHospitality: { type: Number, default: 0 },
    learningOpportunities: { type: Number, default: 0 },
    reviewCount: { type: Number, default: 0 }
  },

  // 統計數據
  stats: {
    views: { type: Number, default: 0 },
    applications: { type: Number, default: 0 },
    bookmarks: { type: Number, default: 0 },
    shares: { type: Number, default: 0 }
  },

  // 時段資訊
  timeSlots: [TimeSlotSchema],
  hasTimeSlots: { type: Boolean, default: false },

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, {
  timestamps: true
});

// 添加索引
OpportunitySchema.index({ slug: 1 }, { unique: true });
OpportunitySchema.index({ publicId: 1 }, { unique: true });
OpportunitySchema.index({ hostId: 1 });
OpportunitySchema.index({ status: 1 });
OpportunitySchema.index({ type: 1 });
OpportunitySchema.index({ 'location.city': 1 });
OpportunitySchema.index({ 'location.country': 1 });
OpportunitySchema.index({ 'location.coordinates': '2dsphere' });
OpportunitySchema.index({ 'timeSlots.startDate': 1 });
OpportunitySchema.index({ 'timeSlots.endDate': 1 });
OpportunitySchema.index({ 'timeSlots.status': 1 });
OpportunitySchema.index({ 'timeSlots.defaultCapacity': 1 });
OpportunitySchema.index({ 'timeSlots.startDate': 1, 'timeSlots.endDate': 1 });
OpportunitySchema.index({ 'timeSlots.status': 1, 'timeSlots.defaultCapacity': 1 });
OpportunitySchema.index({ hasTimeSlots: 1 });
OpportunitySchema.index({ 'workDetails.availableMonths': 1 });

// 保存前更新 hasTimeSlots 欄位
OpportunitySchema.pre('save', function(next) {
  const opportunity = this as unknown as IOpportunity;
  opportunity.hasTimeSlots = Array.isArray(opportunity.timeSlots) && opportunity.timeSlots.length > 0;
  next();
});

// 檢查時段狀態並自動更新
OpportunitySchema.pre('save', function(next) {
  const opportunity = this as unknown as IOpportunity;

  if (opportunity.timeSlots && opportunity.timeSlots.length > 0) {
    opportunity.timeSlots.forEach((slot: ITimeSlot) => {
      // 如果已申請人數達到默認容量，將狀態設為已滿
      if (slot.appliedCount >= slot.defaultCapacity && slot.status === TimeSlotStatus.OPEN) {
        slot.status = TimeSlotStatus.FILLED;
      }

      // 如果已申請人數減少，且狀態為已滿，將狀態設回開放
      if (slot.appliedCount < slot.defaultCapacity && slot.status === TimeSlotStatus.FILLED) {
        slot.status = TimeSlotStatus.OPEN;
      }

      // 如果結束月份已過，將狀態設為已關閉
      const currentDate = new Date();
      const currentYearMonth = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;

      if (slot.endDate < currentYearMonth &&
          (slot.status === TimeSlotStatus.OPEN || slot.status === TimeSlotStatus.FILLED)) {
        slot.status = TimeSlotStatus.CLOSED;
      }
    });
  }

  next();
});

export default mongoose.models.Opportunity || mongoose.model<IOpportunity>('Opportunity', OpportunitySchema);