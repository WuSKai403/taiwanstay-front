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
  hasTimeSlots?: boolean;
  timeSlots?: Array<{
    id?: string;
    startDate: string;
    endDate: string;
    defaultCapacity: number;
    minimumStay: number;
    appliedCount?: number;
    confirmedCount?: number;
    status?: string;
    description?: string;
  }>;
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
    avatar?: string | null;
  };
  location: {
    region: string;
    city: string;
    address?: string | null;
    coordinates?: {
      lat: number;
      lng: number;
    } | null;
  };
  media?: {
    images: {
      url: string;
      alt?: string;
    }[];
  };
  hasTimeSlots?: boolean;
  timeSlots?: Array<{
    id?: string;
    startDate: string;
    endDate: string;
    defaultCapacity: number;
    minimumStay: number;
    appliedCount?: number;
    confirmedCount?: number;
    status?: string;
    description?: string;
  }>;
  createdAt: string;
  updatedAt: string;
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
  if (!opportunity) {
    console.error('無效的機會數據：', opportunity);
    throw new Error('無效的機會數據');
  }

  // 安全處理可能不存在的 _id
  const opportunityId = opportunity._id || '';

  // 安全處理可能不存在的 host
  const host = opportunity.host || {};
  const hostId = host._id || '';
  const hostName = host.name || '未知主辦方';

  // 處理時間段資訊
  const hasTimeSlots = Boolean(
    opportunity.hasTimeSlots ||
    (opportunity.timeSlots && opportunity.timeSlots.length > 0)
  );

  return {
    _id: opportunityId,
    id: opportunityId,
    title: opportunity.title || '未命名機會',
    slug: opportunity.slug || '',
    type: opportunity.type || 'OTHER',
    host: {
      id: hostId,
      name: hostName,
      avatar: host.avatar || null
    },
    location: {
      region: opportunity.location?.region || '',
      city: opportunity.location?.city || '',
      address: opportunity.location?.address || null,
      coordinates: opportunity.location?.coordinates || null
    },
    media: opportunity.media || { images: [] },
    // 新增時間段相關欄位
    hasTimeSlots,
    timeSlots: opportunity.timeSlots || [],
    createdAt: typeof opportunity.createdAt === 'string'
      ? opportunity.createdAt
      : opportunity.createdAt ? new Date(opportunity.createdAt).toISOString() : new Date().toISOString(),
    updatedAt: typeof opportunity.updatedAt === 'string'
      ? opportunity.updatedAt
      : opportunity.updatedAt ? new Date(opportunity.updatedAt).toISOString() : new Date().toISOString()
  };
}

// 批量轉換機會數據
export function transformOpportunities(opportunities: Opportunity[]): TransformedOpportunity[] {
  return opportunities.map(transformOpportunity);
}

// 將機會數據轉換為地圖標記
export function transformToMarkers(opportunities: Opportunity[] | TransformedOpportunity[]): OpportunityMarker[] {
  if (!opportunities || !Array.isArray(opportunities)) {
    console.error('無效的機會數據數組：', opportunities);
    return [];
  }

  const validOpportunities = [];

  // 使用循環而非 filter 方法來避免類型問題
  for (let i = 0; i < opportunities.length; i++) {
    const opportunity = opportunities[i];
    if (
      opportunity &&
      opportunity.location?.coordinates?.lat !== undefined &&
      opportunity.location.coordinates?.lng !== undefined
    ) {
      validOpportunities.push(opportunity);
    }
  }

  // 對有效的機會數據進行映射
  return validOpportunities.map(opportunity => {
    // 安全獲取 ID
    const id = opportunity._id || (opportunity as any).id || `marker-${Math.random().toString(36).substr(2, 9)}`;

    return {
      id,
      position: {
        lat: opportunity.location.coordinates!.lat,
        lng: opportunity.location.coordinates!.lng
      },
      title: opportunity.title || '未命名機會',
      type: opportunity.type || 'OTHER',
      slug: opportunity.slug || ''
    };
  });
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