import { useQuery } from '@tanstack/react-query';
import { transformOpportunities, transformToMarkers, OpportunityMarker } from '@/lib/transforms/opportunity';

export interface MapSearchParams {
  search?: string;
  type?: string;
  region?: string;
  city?: string;
  availableMonths?: string[];
  limit?: number;
}

const MAP_OPPORTUNITIES_QUERY_KEY = 'mapOpportunities';

export const useMapOpportunities = (params?: MapSearchParams) => {
  return useQuery({
    queryKey: [MAP_OPPORTUNITIES_QUERY_KEY, params],
    queryFn: async () => {
      try {
        // 如果 params 為 undefined，則返回空數據
        if (!params) {
          console.log('地圖查詢被跳過 - 未提供參數');
          return { markers: [], opportunities: [], total: 0 };
        }

        const searchParams = new URLSearchParams();
        if (params) {
          Object.entries(params).forEach(([key, value]) => {
            if (value) {
              // 特殊處理 availableMonths 陣列
              if (key === 'availableMonths' && Array.isArray(value) && value.length > 0) {
                searchParams.append(key, value.join(','));
              } else {
                searchParams.append(key, String(value));
              }
            }
          });
        }

        // 固定設置為大數量限制，確保加載所有機會
        searchParams.append('limit', '1000');
        // 設置 map=true 讓後端知道這是地圖請求
        searchParams.append('map', 'true');

        console.log('地圖數據請求參數:', searchParams.toString());
        const response = await fetch(`/api/opportunities?${searchParams.toString()}`);

        if (!response.ok) {
          console.error('獲取地圖機會數據失敗:', response.status, response.statusText);
          throw new Error('獲取地圖機會數據失敗');
        }

        const data = await response.json();
        console.log('地圖數據響應:', data);

        try {
          // 安全檢查數據格式
          if (!data.opportunities || !Array.isArray(data.opportunities)) {
            console.error('無效的機會數據格式:', data);
            return { markers: [], opportunities: [], total: 0 };
          }

          const opportunities = transformOpportunities(data.opportunities || []);
          const markers = transformToMarkers(opportunities);

          return {
            markers,
            opportunities,
            total: data.total || 0,
          };
        } catch (error) {
          console.error('地圖數據處理錯誤:', error);
          return { markers: [], opportunities: [], total: data.total || 0 };
        }
      } catch (error) {
        console.error('地圖數據請求錯誤:', error);
        throw error;
      }
    },
    // 如果 params 為 undefined，則跳過此查詢
    enabled: !!params,
    staleTime: 5 * 60 * 1000, // 5分鐘
    gcTime: 30 * 60 * 1000, // 30分鐘
    refetchOnWindowFocus: false,
    retry: (failureCount, error: any) => {
      // 如果是 404 或 401 錯誤，不重試
      if (error.status === 404 || error.status === 401) return false;
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
            // 特殊處理 availableMonths 陣列
            if (key === 'availableMonths' && Array.isArray(value) && value.length > 0) {
              searchParams.append(key, value.join(','));
            } else {
              searchParams.append(key, String(value));
            }
          }
        });
      }

      // 固定設置為大數量限制，確保加載所有機會
        searchParams.append('limit', '1000');
      // 設置 map=true 讓後端知道這是地圖請求
      searchParams.append('map', 'true');

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