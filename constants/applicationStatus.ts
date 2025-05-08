import { ApplicationStatus } from '@/models/enums/ApplicationStatus';

// 申請狀態中文名稱映射
export const statusNameMap: Record<ApplicationStatus, string> = {
  [ApplicationStatus.DRAFT]: '草稿',
  [ApplicationStatus.PENDING]: '待審核',
  [ApplicationStatus.ACCEPTED]: '已接受',
  [ApplicationStatus.REJECTED]: '已拒絕',
  [ApplicationStatus.ACTIVE]: '進行中',
  [ApplicationStatus.COMPLETED]: '已結束'
};

// 申請狀態顏色映射
export const statusColorMap: Record<ApplicationStatus, string> = {
  [ApplicationStatus.DRAFT]: 'bg-gray-100 text-gray-800',
  [ApplicationStatus.PENDING]: 'bg-yellow-100 text-yellow-800',
  [ApplicationStatus.ACCEPTED]: 'bg-green-100 text-green-800',
  [ApplicationStatus.REJECTED]: 'bg-red-100 text-red-800',
  [ApplicationStatus.ACTIVE]: 'bg-blue-100 text-blue-800',
  [ApplicationStatus.COMPLETED]: 'bg-purple-100 text-purple-800'
};

// 申請詳情通用接口
export interface ApplicationDetail {
  _id: string;
  status: ApplicationStatus;
  statusNote?: string;
  opportunityId: {
    _id: string;
    title: string;
    slug: string;
    type: string;
    location?: {
      city?: string;
      district?: string;
    };
    media?: {
      images?: Array<{
        url: string;
        alt?: string;
      }>;
    };
  };
  hostId: {
    _id: string;
    name: string;
    profileImage?: string;
  };
  userId: {
    _id: string;
    name: string;
    email: string;
    profile?: {
      avatar?: string;
    };
  };
  applicationDetails: {
    message: string;
    startDate: string;
    endDate?: string;
    duration: number;
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
    dietaryRestrictions?: string[] | {
      type: string[];
      vegetarianType?: string;
      otherDetails?: string;
    };
    languages?: string[] | {
      language: string;
      level: string;
    }[];
    relevantExperience?: string;
    motivation?: string;
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
  };
  communications: {
    messages: {
      _id: string;
      sender: string;
      content: string;
      timestamp: string;
      read: boolean;
    }[];
    lastMessageAt?: string;
    unreadHostMessages: number;
    unreadUserMessages: number;
  };
  createdAt: string;
  updatedAt: string;
}