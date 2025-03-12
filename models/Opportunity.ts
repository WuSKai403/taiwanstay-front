import mongoose, { Schema, Document } from 'mongoose';
import { OpportunityStatus } from './enums/OpportunityStatus';
import { OpportunityType } from './enums/OpportunityType';

export interface IOpportunity extends Document {
  hostId: mongoose.Types.ObjectId;
  title: string;
  slug: string;
  description: string;
  shortDescription: string;
  status: OpportunityStatus;
  statusNote?: string;
  type: OpportunityType;

  // 工作詳情
  workDetails: {
    tasks: string[];
    skills: string[];
    learningOpportunities: string[];
    workHoursPerWeek: number;
    workDaysPerWeek: number;
    minimumStay: number; // 以天為單位
    maximumStay?: number; // 以天為單位
    startDate?: Date;
    endDate?: Date;
    isOngoing: boolean;
    seasonality?: {
      spring: boolean;
      summer: boolean;
      autumn: boolean;
      winter: boolean;
    };
    physicalDemand: 'low' | 'medium' | 'high';
    languages: string[];
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
    drivingLicenseRequired: boolean;
    specificNationalities?: string[];
    specificSkills?: string[];
    otherRequirements?: string[];
  };

  // 媒體資訊
  media: {
    coverImage?: string;
    gallery?: string[];
    videos?: string[];
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

  createdAt: Date;
  updatedAt: Date;
}

const OpportunitySchema: Schema = new Schema({
  hostId: { type: Schema.Types.ObjectId, ref: 'Host', required: true },
  title: { type: String, required: true },
  slug: { type: String, required: true },
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

  // 工作詳情
  workDetails: {
    tasks: [{ type: String, required: true }],
    skills: [{ type: String }],
    learningOpportunities: [{ type: String }],
    workHoursPerWeek: { type: Number, required: true },
    workDaysPerWeek: { type: Number, required: true },
    minimumStay: { type: Number, required: true }, // 以天為單位
    maximumStay: { type: Number }, // 以天為單位
    startDate: { type: Date },
    endDate: { type: Date },
    isOngoing: { type: Boolean, default: true },
    seasonality: {
      spring: { type: Boolean, default: true },
      summer: { type: Boolean, default: true },
      autumn: { type: Boolean, default: true },
      winter: { type: Boolean, default: true }
    },
    physicalDemand: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium'
    },
    languages: [{ type: String, required: true }]
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
    drivingLicenseRequired: { type: Boolean, default: false },
    specificNationalities: [{ type: String }],
    specificSkills: [{ type: String }],
    otherRequirements: [{ type: String }]
  },

  // 媒體資訊
  media: {
    coverImage: { type: String },
    gallery: [{ type: String }],
    videos: [{ type: String }]
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

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, {
  timestamps: true
});

OpportunitySchema.index({ 'location.coordinates': '2dsphere' });
OpportunitySchema.index({ title: 'text', description: 'text', shortDescription: 'text', 'workDetails.tasks': 'text', 'workDetails.skills': 'text', 'workDetails.learningOpportunities': 'text' });
OpportunitySchema.index({ slug: 1 }, { unique: true });
OpportunitySchema.index({ hostId: 1 });
OpportunitySchema.index({ status: 1 });
OpportunitySchema.index({ type: 1 });
OpportunitySchema.index({ 'workDetails.startDate': 1, 'workDetails.endDate': 1 });
OpportunitySchema.index({ 'workDetails.minimumStay': 1 });
OpportunitySchema.index({ 'location.country': 1, 'location.city': 1 });

export default mongoose.models.Opportunity || mongoose.model<IOpportunity>('Opportunity', OpportunitySchema);