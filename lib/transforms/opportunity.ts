import { OpportunityType } from '@/lib/schemas/opportunity';

export interface TransformedOpportunity {
  id: string;
  title: string;
  slug: string;
  type: OpportunityType;
  location: {
    city?: string;
    country?: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
  workTimeSettings?: {
    minimumStay?: number;
    maximumStay?: number;
    workHoursPerDay?: number;
    workDaysPerWeek?: number;
  };
  media?: {
    images?: Array<{
      url: string;
      alt?: string;
    }>;
  };
  createdAt: string;
  updatedAt: string;
}

export interface TransformedMapMarker {
  id: string;
  position: [number, number];
  title: string;
  type: string;
  slug: string;
}

// 轉換單個機會數據
export const transformOpportunity = (data: any): TransformedOpportunity => ({
  id: data.id,
  title: data.title,
  slug: data.slug,
  type: data.type,
  location: {
    city: data.location?.city,
    country: data.location?.country,
    coordinates: data.location?.coordinates ? {
      lat: data.location.coordinates.lat,
      lng: data.location.coordinates.lng,
    } : undefined,
  },
  workTimeSettings: data.workTimeSettings ? {
    minimumStay: data.workTimeSettings.minimumStay,
    maximumStay: data.workTimeSettings.maximumStay,
    workHoursPerDay: data.workTimeSettings.workHoursPerDay,
    workDaysPerWeek: data.workTimeSettings.workDaysPerWeek,
  } : undefined,
  media: data.media,
  createdAt: data.createdAt,
  updatedAt: data.updatedAt,
});

// 轉換為地圖標記數據
export const transformToMapMarker = (opportunity: TransformedOpportunity): TransformedMapMarker | null => {
  if (!opportunity.location?.coordinates?.lat || !opportunity.location?.coordinates?.lng) {
    return null;
  }

  return {
    id: opportunity.id,
    position: [opportunity.location.coordinates.lat, opportunity.location.coordinates.lng],
    title: opportunity.title,
    type: opportunity.type,
    slug: opportunity.slug,
  };
};

// 批量轉換機會數據
export const transformOpportunities = (data: any[]): TransformedOpportunity[] => {
  return data.map(transformOpportunity);
};

// 批量轉換為地圖標記
export const transformToMapMarkers = (opportunities: TransformedOpportunity[]): TransformedMapMarker[] => {
  return opportunities
    .map(transformToMapMarker)
    .filter((marker): marker is TransformedMapMarker => marker !== null);
};