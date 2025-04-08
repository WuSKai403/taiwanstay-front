export enum HostType {
  FARM = 'FARM',                     // 農場
  HOSTEL = 'HOSTEL',                 // 青年旅館
  HOMESTAY = 'HOMESTAY',             // 民宿
  ECO_VILLAGE = 'ECO_VILLAGE',       // 生態村
  RETREAT_CENTER = 'RETREAT_CENTER', // 靜修中心
  COMMUNITY = 'COMMUNITY',           // 社區
  NGO = 'NGO',                       // 非政府組織
  SCHOOL = 'SCHOOL',                 // 學校
  CAFE = 'CAFE',                     // 咖啡廳
  RESTAURANT = 'RESTAURANT',         // 餐廳
  ART_CENTER = 'ART_CENTER',         // 藝術中心
  ANIMAL_SHELTER = 'ANIMAL_SHELTER', // 動物收容所
  OUTDOOR_ACTIVITY = 'OUTDOOR_ACTIVITY', // 戶外活動
  OTHER = 'OTHER',                   // 其他
  COWORKING_SPACE = 'COWORKING_SPACE', // 共享工作空間
  CULTURAL_VENUE = 'CULTURAL_VENUE',   // 文化場所
  COMMUNITY_CENTER = 'COMMUNITY_CENTER' // 社區中心
}

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