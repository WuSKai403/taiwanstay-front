import { OpportunityType } from '@/models/enums/OpportunityType';
import { MediaImage } from '@/lib/types/media';

// GeoJSON Point 格式定義
export interface GeoJSONPoint {
  type: 'Point';
  coordinates: [number, number]; // [經度, 緯度]
}

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
    coordinates?: GeoJSONPoint;
  };
  media?: {
    images: {
      url: string;
      alt?: string;
    }[];
    coverImage?: MediaImage;
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
    coordinates?: GeoJSONPoint | null;
  };
  media: {
    images: {
      url: string;
      alt?: string;
    }[];
    coverImage?: MediaImage | null;
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
  position: [number, number]; // [緯度, 經度] 用於 Leaflet
  title: string;
  type: string;
  slug: string;
}

// 將原始機會數據轉換為前端使用的格式
export function transformOpportunity(opportunity: any): TransformedOpportunity {
  if (!opportunity) {
    console.error('無效的機會數據：', opportunity);
    return {
      _id: '',
      id: '',
      title: '未命名機會',
      slug: '',
      type: 'OTHER',
      host: {
        id: '',
        name: '未知主辦方',
        avatar: null
      },
      location: {
        region: '',
        city: '',
        address: null,
        coordinates: null
      },
      media: {
        images: [],
        coverImage: null
      },
      hasTimeSlots: false,
      timeSlots: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }

  // 安全處理可能不存在的 _id
  const opportunityId = opportunity._id || opportunity.id || '';

  // 安全處理可能不存在的 host
  const host = opportunity.host || {};
  const hostId = host._id || host.id || '';
  const hostName = host.name || '未知主辦方';

  // 處理時間段資訊
  const hasTimeSlots = Boolean(
    opportunity.hasTimeSlots ||
    (opportunity.timeSlots && opportunity.timeSlots.length > 0)
  );

  // 安全處理坐標
  let coordinates = null;
  if (opportunity.location?.coordinates) {
    // 嘗試處理不同格式的坐標
    const locationCoords = opportunity.location.coordinates;

    if (locationCoords.type === 'Point' && Array.isArray(locationCoords.coordinates)) {
      // 標準 GeoJSON 格式
      coordinates = {
        type: 'Point' as const,
        coordinates: locationCoords.coordinates
      };
    } else if (typeof locationCoords.lat === 'number' && typeof locationCoords.lng === 'number') {
      // {lat, lng} 格式
      coordinates = {
        type: 'Point' as const,
        coordinates: [locationCoords.lng, locationCoords.lat]
      };
    } else if (Array.isArray(locationCoords) && locationCoords.length >= 2) {
      // 簡單數組格式 [lng, lat]
      coordinates = {
        type: 'Point' as const,
        coordinates: [locationCoords[0], locationCoords[1]]
      };
    }
  }

  return {
    _id: opportunityId,
    id: opportunityId,
    title: opportunity.title || '未命名機會',
    slug: opportunity.slug || '',
    type: opportunity.type || 'OTHER',
    host: {
      id: hostId,
      name: hostName,
      avatar: host.avatar || host.profilePicture || null
    },
    location: {
      region: opportunity.location?.region || '',
      city: opportunity.location?.city || '',
      address: opportunity.location?.address || null,
      coordinates: coordinates
    },
    media: {
      images: Array.isArray(opportunity.media?.images)
        ? opportunity.media.images.map((img: any) => ({
            url: img.url || img.secureUrl || '',
            alt: img.alt || opportunity.title || '機會圖片'
          }))
        : [],
      coverImage: opportunity.media?.coverImage
        ? {
            publicId: opportunity.media.coverImage.publicId || '',
            secureUrl: opportunity.media.coverImage.secureUrl || opportunity.media.coverImage.url || '',
            url: opportunity.media.coverImage.url || opportunity.media.coverImage.secureUrl || '',
            previewUrl: opportunity.media.coverImage.previewUrl || '',
            thumbnailUrl: opportunity.media.coverImage.thumbnailUrl || '',
            alt: opportunity.media.coverImage.alt || opportunity.title || '機會封面圖片',
            version: opportunity.media.coverImage.version || '',
            format: opportunity.media.coverImage.format || '',
            width: opportunity.media.coverImage.width || 0,
            height: opportunity.media.coverImage.height || 0
          }
        : null
    },
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
export function transformOpportunities(opportunities: any[]): TransformedOpportunity[] {
  if (!Array.isArray(opportunities)) {
    console.error('機會數據不是數組:', opportunities);
    return [];
  }

  return opportunities.map(opportunity => {
    try {
      return transformOpportunity(opportunity);
    } catch (error) {
      console.error('轉換機會數據失敗:', error, opportunity);
      return transformOpportunity(null); // 使用空數據作為備用
    }
  });
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
      opportunity.location?.coordinates?.type === 'Point' &&
      opportunity.location.coordinates?.coordinates &&
      Array.isArray(opportunity.location.coordinates.coordinates) &&
      opportunity.location.coordinates.coordinates.length === 2
    ) {
      validOpportunities.push(opportunity);
    }
  }

  // 對有效的機會數據進行映射
  return validOpportunities.map(opportunity => {
    // 安全獲取 ID
    const id = opportunity._id || (opportunity as any).id || `marker-${Math.random().toString(36).substr(2, 9)}`;

    // 從 GeoJSON 格式取出座標 [經度, 緯度] 並轉換為 Leaflet 所需的 [緯度, 經度] 格式
    const [longitude, latitude] = opportunity.location.coordinates!.coordinates;

    return {
      id,
      position: [latitude, longitude], // 轉換為 Leaflet 格式 [緯度, 經度]
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