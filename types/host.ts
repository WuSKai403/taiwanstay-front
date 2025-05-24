import { HostStatus } from '@/models/enums/HostStatus';
import { HostType } from '@/models/enums/HostType';

export interface HostBasicInfo {
  name: string;
  description: string;
  type: HostType;
  category: string;
  foundingYear?: number;
  teamSize?: string;
  languages: string[];
}

export interface LocationInfo {
  country: string;
  city: string;
  district: string;
  zipCode: string;
  address: string;
  latitude?: number;
  longitude?: number;
}

export interface ContactInfo {
  person: string;
  title: string;
  phone: string;
  email: string;
  fax?: string;
  website?: string;
  contactHours: string;
  notes?: string;
  social?: {
    facebook?: string;
    instagram?: string;
    line?: string;
    other?: string;
  };
}

export interface VideoIntroduction {
  url: string;
  description?: string;
}

export interface AdditionalMedia {
  virtualTour?: string;
}

export interface Host {
  id: string;
  // 基本信息
  name: string;
  description: string;
  type: HostType;
  category: string;
  foundingYear?: number;
  teamSize?: string;
  languages: string[];

  // 地址信息
  location: LocationInfo;

  // 聯絡信息
  contact: ContactInfo;
  // 頂層通訊欄位(與後端映射)
  email: string;
  mobile: string;

  // 照片與媒體
  photos: string[];
  photoDescriptions?: string[];
  videoIntroduction?: VideoIntroduction;
  additionalMedia?: AdditionalMedia;

  // 設施與服務 - 更新類別結構
  amenities: {
    basics?: {
      wifi?: boolean;
      parking?: boolean;
      elevator?: boolean;
      airConditioner?: boolean;
      heater?: boolean;
      washingMachine?: boolean;
      [key: string]: boolean | undefined;
    };
    accommodation?: {
      privateRoom?: boolean;
      sharedRoom?: boolean;
      camping?: boolean;
      kitchen?: boolean;
      bathroom?: boolean;
      sharedBathroom?: boolean;
      [key: string]: boolean | undefined;
    };
    workExchange?: {
      workingDesk?: boolean;
      internetAccess?: boolean;
      toolsProvided?: boolean;
      trainingProvided?: boolean;
      flexibleHours?: boolean;
      [key: string]: boolean | undefined;
    };
    lifestyle?: {
      petFriendly?: boolean;
      smokingAllowed?: boolean;
      childFriendly?: boolean;
      organic?: boolean;
      vegetarian?: boolean;
      ecoFriendly?: boolean;
      [key: string]: boolean | undefined;
    };
    activities?: {
      yoga?: boolean;
      meditation?: boolean;
      freeDiving?: boolean;
      scubaDiving?: boolean;
      hiking?: boolean;
      farmingActivities?: boolean;
      culturalExchange?: boolean;
      [key: string]: boolean | undefined;
    };
    [key: string]: Record<string, boolean | undefined> | undefined;
  };
  customAmenities?: string[];
  amenitiesNotes?: string;
  workExchangeDescription?: string; // 工作交換概述

  // 特色與描述
  features?: string[]; // 特色標籤
  story: string; // 主人故事
  experience?: string; // 工作交換經驗
  environment: {
    surroundings: string; // 周邊環境描述
    accessibility?: string; // 交通便利性
    nearbyAttractions?: string[]; // 附近景點
  };

  // 系統欄位
  createdAt: Date;
  updatedAt: Date;
  status: 'pending' | 'approved' | 'rejected' | 'inactive';
}

export interface HostData {
  _id: string;
  userId: string;
  name: string;
  slug: string;
  description: string;
  status: HostStatus;
  type: HostType;
  email: string;
  mobile?: string;
  contactInfo: {
    contactEmail: string;
    phone?: string;
    contactMobile: string;
    website?: string;
    contactHours?: string;
    notes?: string;
    socialMedia?: {
      facebook?: string;
      instagram?: string;
      line?: string;
      threads?: string;
      linkedin?: string;
      twitter?: string;
      youtube?: string;
      tiktok?: string;
      other?: {
        name: string;
        url: string;
      }[];
    };
  };
  location: {
    address: string;
    city: string;
    district?: string;
    zipCode?: string;
    country: string;
    coordinates: {
      type: string;
      coordinates: number[];
    };
    showExactLocation?: boolean;
  };
  createdAt: string;
  updatedAt: string;
}