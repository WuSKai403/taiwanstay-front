import { OpportunityType } from '@/models/enums/OpportunityType';

export interface Opportunity {
  _id: string;
  title: string;
  slug: string;
  type: string;
  description: string;
  requirement: string;
  host: {
    _id: string;
    name: string;
    avatar?: string;
  };
  location: {
    region: string;
    city: string;
    address?: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
  media?: {
    images: {
      url: string;
      alt?: string;
    }[];
  };
  workTimeSettings: {
    hoursPerDay: number;
    daysPerWeek: number;
    minimumStay?: number;
    availableMonths?: number[];
  };
  livingConditions: {
    accommodation: string;
    meals: string;
    other?: string;
  };
  createdAt: string;
  updatedAt: string;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
}

export interface TransformedOpportunity {
  _id: string;
  id: string;
  title: string;
  slug: string;
  type: string;
  host: {
    id: string;
    name: string;
    avatar?: string;
  };
  location: {
    region: string;
    city: string;
    address?: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
  media?: {
    images: {
      url: string;
      alt?: string;
    }[];
  };
  workTimeSettings: {
    hoursPerDay: number;
    daysPerWeek: number;
    minimumStay?: number;
    availableMonths?: number[];
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface OpportunityMarker {
  id: string;
  position: {
    lat: number;
    lng: number;
  };
  title: string;
  type: string;
  slug: string;
}

// 將原始機會數據轉換為前端使用的格式
export function transformOpportunity(opportunity: Opportunity): TransformedOpportunity {
  return {
    _id: opportunity._id,
    id: opportunity._id,
    title: opportunity.title,
    slug: opportunity.slug,
    type: opportunity.type,
    host: {
      id: opportunity.host._id,
      name: opportunity.host.name,
      avatar: opportunity.host.avatar
    },
    location: {
      region: opportunity.location.region,
      city: opportunity.location.city,
      address: opportunity.location.address,
      coordinates: opportunity.location.coordinates
    },
    media: opportunity.media,
    workTimeSettings: opportunity.workTimeSettings,
    createdAt: new Date(opportunity.createdAt),
    updatedAt: new Date(opportunity.updatedAt)
  };
}

// 批量轉換機會數據
export function transformOpportunities(opportunities: Opportunity[]): TransformedOpportunity[] {
  return opportunities.map(transformOpportunity);
}

// 將機會數據轉換為地圖標記
export function transformToMarkers(opportunities: Opportunity[] | TransformedOpportunity[]): OpportunityMarker[] {
  const validOpportunities = [];

  // 使用循環而非 filter 方法來避免類型問題
  for (let i = 0; i < opportunities.length; i++) {
    const opportunity = opportunities[i];
    if (
      opportunity.location?.coordinates?.lat !== undefined &&
      opportunity.location.coordinates?.lng !== undefined
    ) {
      validOpportunities.push(opportunity);
    }
  }

  // 對有效的機會數據進行映射
  return validOpportunities.map(opportunity => ({
    id: opportunity._id,
    position: {
      lat: opportunity.location.coordinates!.lat,
      lng: opportunity.location.coordinates!.lng
    },
    title: opportunity.title,
    type: opportunity.type,
    slug: opportunity.slug
  }));
}

// 根據類型獲取顏色
export function getTypeColor(type: string): string {
  const colorMap: Record<string, string> = {
    'FARMING': '#4ade80', // green-400
    'GARDENING': '#34d399', // emerald-400
    'ANIMAL_CARE': '#60a5fa', // blue-400
    'CONSTRUCTION': '#fb923c', // orange-400
    'HOSPITALITY': '#c084fc', // purple-400
    'COOKING': '#f87171', // red-400
    'CHILDCARE': '#f472b6', // pink-400
    'TEACHING': '#facc15', // yellow-400
    'OTHER': '#94a3b8', // slate-400
  };

  return colorMap[type] || colorMap.OTHER;
}