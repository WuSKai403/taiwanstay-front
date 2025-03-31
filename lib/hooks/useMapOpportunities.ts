import { useQuery } from '@tanstack/react-query';
import { transformOpportunities, transformToMarkers, OpportunityMarker } from '@/lib/transforms/opportunity';

export interface MapSearchParams {
  limit?: number;
  type?: string;
  region?: string;
  city?: string;
}

const MAP_OPPORTUNITIES_QUERY_KEY = 'mapOpportunities';

export const useMapOpportunities = (params?: MapSearchParams) => {
  return useQuery({
    queryKey: [MAP_OPPORTUNITIES_QUERY_KEY, params],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value) {
            searchParams.append(key, value);
          }
        });
      }
      // 默認獲取所有機會
      if (!params?.limit) {
        searchParams.append('limit', '1000');
      }

      const response = await fetch(`/api/opportunities?${searchParams.toString()}`);
      if (!response.ok) {
        throw new Error('獲取地圖機會數據失敗');
      }

      const data = await response.json();
      const opportunities = transformOpportunities(data.opportunities || []);
      const markers = transformToMarkers(opportunities);

      return {
        markers,
        opportunities,
        total: data.total || 0,
      };
    },
    staleTime: 5 * 60 * 1000, // 5分鐘
    gcTime: 30 * 60 * 1000, // 30分鐘
    refetchOnWindowFocus: false,
    retry: (failureCount, error: any) => {
      // 如果是 404 錯誤，不重試
      if (error.status === 404) return false;
      // 最多重試 3 次
      return failureCount < 3;
    },
  });
};

// 預取地圖數據
export const prefetchMapOpportunities = async (queryClient: any, params?: MapSearchParams) => {
  await queryClient.prefetchQuery({
    queryKey: [MAP_OPPORTUNITIES_QUERY_KEY, params],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value) {
            searchParams.append(key, value);
          }
        });
      }
      if (!params?.limit) {
        searchParams.append('limit', '1000');
      }

      const response = await fetch(`/api/opportunities?${searchParams.toString()}`);
      if (!response.ok) {
        throw new Error('預取地圖數據失敗');
      }

      const data = await response.json();
      const opportunities = transformOpportunities(data.opportunities || []);
      const markers = transformToMarkers(opportunities);

      return {
        markers,
        opportunities,
        total: data.total || 0,
      };
    },
  });
};