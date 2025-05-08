import { OpportunityType } from '@/models/enums';

// 機會類型標籤顏色映射
export const typeColorMap = {
  [OpportunityType.FARMING]: 'bg-green-100 text-green-800',
  [OpportunityType.GARDENING]: 'bg-green-100 text-green-800',
  [OpportunityType.ANIMAL_CARE]: 'bg-yellow-100 text-yellow-800',
  [OpportunityType.CONSTRUCTION]: 'bg-orange-100 text-orange-800',
  [OpportunityType.HOSPITALITY]: 'bg-yellow-100 text-yellow-800',
  [OpportunityType.COOKING]: 'bg-red-100 text-red-800',
  [OpportunityType.CLEANING]: 'bg-blue-100 text-blue-800',
  [OpportunityType.CHILDCARE]: 'bg-pink-100 text-pink-800',
  [OpportunityType.ELDERLY_CARE]: 'bg-purple-100 text-purple-800',
  [OpportunityType.TEACHING]: 'bg-red-100 text-red-800',
  [OpportunityType.LANGUAGE_EXCHANGE]: 'bg-purple-100 text-purple-800',
  [OpportunityType.CREATIVE]: 'bg-indigo-100 text-indigo-800',
  [OpportunityType.DIGITAL_NOMAD]: 'bg-blue-100 text-blue-800',
  [OpportunityType.ADMINISTRATION]: 'bg-gray-100 text-gray-800',
  [OpportunityType.MAINTENANCE]: 'bg-gray-100 text-gray-800',
  [OpportunityType.TOURISM]: 'bg-blue-100 text-blue-800',
  [OpportunityType.CONSERVATION]: 'bg-blue-100 text-blue-800',
  [OpportunityType.COMMUNITY]: 'bg-indigo-100 text-indigo-800',
  [OpportunityType.EVENT]: 'bg-purple-100 text-purple-800',
  [OpportunityType.OTHER]: 'bg-gray-100 text-gray-800'
};

// 機會類型中文名稱映射
export const typeNameMap = {
  [OpportunityType.FARMING]: '農場體驗',
  [OpportunityType.GARDENING]: '園藝工作',
  [OpportunityType.ANIMAL_CARE]: '動物照顧',
  [OpportunityType.CONSTRUCTION]: '建築工作',
  [OpportunityType.HOSPITALITY]: '接待服務',
  [OpportunityType.COOKING]: '烹飪工作',
  [OpportunityType.CLEANING]: '清潔工作',
  [OpportunityType.CHILDCARE]: '兒童照顧',
  [OpportunityType.ELDERLY_CARE]: '老人照顧',
  [OpportunityType.TEACHING]: '教學工作',
  [OpportunityType.LANGUAGE_EXCHANGE]: '語言交流',
  [OpportunityType.CREATIVE]: '創意工作',
  [OpportunityType.DIGITAL_NOMAD]: '數位遊牧',
  [OpportunityType.ADMINISTRATION]: '行政工作',
  [OpportunityType.MAINTENANCE]: '維修工作',
  [OpportunityType.TOURISM]: '旅遊工作',
  [OpportunityType.CONSERVATION]: '保育工作',
  [OpportunityType.COMMUNITY]: '社區工作',
  [OpportunityType.EVENT]: '活動工作',
  [OpportunityType.OTHER]: '其他機會'
};

// TimeSlot 介面定義
export interface TimeSlot {
  id: string;
  startDate: string; // YYYY-MM 格式
  endDate: string; // YYYY-MM 格式
  defaultCapacity: number;
  minimumStay: number;
  appliedCount: number;
  confirmedCount: number;
  status: string;
  description?: string;
}

// 定義機會詳情接口
export interface OpportunityDetail {
  id: string;
  publicId: string;
  title: string;
  slug: string;
  shortDescription: string;
  description: string;
  type: OpportunityType;
  status: string;
  location: {
    address?: string;
    city?: string;
    district?: string;
    region?: string;
    country?: string;
    coordinates?: {
      type: string;
      coordinates: [number, number]; // 經度, 緯度
    };
  };
  workDetails: {
    tasks?: string[];
    skills?: string[];
    learningOpportunities?: string[];
    physicalDemand?: 'low' | 'medium' | 'high';
    languages?: string[];
  };
  benefits: {
    accommodation: {
      provided: boolean;
      type?: 'private_room' | 'shared_room' | 'dormitory' | 'camping' | 'other';
      description?: string;
    };
    meals: {
      provided: boolean;
      count?: number;
      description?: string;
    };
    stipend?: {
      provided: boolean;
      amount?: number;
      currency?: string;
      frequency?: string;
    };
    otherBenefits?: string[];
  };
  requirements: {
    minAge?: number;
    acceptsCouples?: boolean;
    acceptsFamilies?: boolean;
    acceptsPets?: boolean;
    drivingLicense?: {
      carRequired: boolean;
      motorcycleRequired: boolean;
      otherRequired: boolean;
      otherDescription?: string;
    };
    otherRequirements?: string[];
  };
  media: {
    images?: Array<{
      url: string;
      alt?: string;
    }>;
  };
  host: {
    id: string;
    name: string;
    profileImage?: string;
    description?: string;
    responseRate?: number;
    responseTime?: string;
    verificationStatus?: string;
    memberSince?: string;
    socialMedia?: {
      facebook?: string;
      instagram?: string;
      line?: string;
      website?: string;
      twitter?: string;
      youtube?: string;
      linkedin?: string;
    };
    contactPhone?: string;
  };
  stats: {
    applications: number;
    bookmarks: number;
    views: number;
  };
  hasTimeSlots?: boolean;
  timeSlots?: TimeSlot[];
  createdAt?: string;
  updatedAt?: string;
}

export interface OpportunityDetailProps {
  opportunity: OpportunityDetail;
}