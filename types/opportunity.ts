import { OpportunityStatus } from '../models/enums/OpportunityStatus';
import { OpportunityType } from '../models/enums/OpportunityType';
import { TimeSlotStatus } from '../models/enums/TimeSlotStatus';

// 容量覆蓋介面定義
export interface ICapacityOverride {
  _id?: string;
  startDate: Date | string; // 覆蓋開始日期
  endDate: Date | string; // 覆蓋結束日期
  capacity: number; // 該日期範圍的容量
}

// 月份容量介面定義
export interface IMonthlyCapacity {
  _id?: string;
  month: string; // 月份，格式為 'YYYY-MM'
  capacity: number; // 容量
  bookedCount: number; // 已預訂人數
}

// 時段介面定義
export interface ITimeSlot {
  _id?: string;
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
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export interface IOpportunity {
  _id?: string;
  hostId: string;
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
    changedBy?: string;
    changedAt: Date | string;
  }>;

  // 工作詳情
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
      publicId: string;
      secureUrl: string;
      url: string;
      previewUrl: string;
      thumbnailUrl: string;
      alt: string;
      version: string;
      format: string;
      width: number;
      height: number;
    };
    images: Array<{
      publicId: string;
      secureUrl: string;
      url: string;
      previewUrl: string;
      thumbnailUrl: string;
      alt: string;
      version: string;
      format: string;
      width: number;
      height: number;
    }>;
    descriptions: string[];
    videoUrl: string;
    videoDescription: string;
    virtualTour: string;
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
    deadline?: Date | string;
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

  createdAt: Date | string;
  updatedAt: Date | string;
}