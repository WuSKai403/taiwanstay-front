import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { transformOpportunities, TransformedOpportunity } from '@/lib/transforms/opportunity';

export interface SearchParams {
  search?: string;
  type?: string;
  region?: string;
  duration?: string;
  availableMonths?: string[];
  page?: number;
  limit?: number;
  sort?: 'newest' | 'oldest';
}

interface SearchResponse {
  opportunities: TransformedOpportunity[];
  total: number;
  currentPage: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

const SEARCH_QUERY_KEY = 'opportunitySearch';

// 基本搜索 hook
export const useOpportunitySearch = (params: SearchParams) => {
  return useQuery<SearchResponse>({
    queryKey: [SEARCH_QUERY_KEY, params],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value) {
          searchParams.append(key, String(value));
        }
      });

      try {
        const response = await fetch(`/api/opportunities/search?${searchParams.toString()}`);
        if (!response.ok) {
          throw new Error('搜索機會失敗');
        }

        const data = await response.json();

        // 完整输出API响应
        console.log("API 基本搜索响应:", {
          路径: Object.keys(data),
          有分頁信息: !!data.pagination,
          分頁信息: data.pagination ? {...data.pagination} : null
        });

        return {
          opportunities: transformOpportunities(data.opportunities || []),
          total: data.pagination?.total || 0,
          currentPage: data.pagination?.currentPage || 1,
          totalPages: data.pagination?.totalPages || 1,
          hasNextPage: data.pagination?.hasNextPage || false,
          hasPrevPage: data.pagination?.hasPrevPage || false,
        };
      } catch (error) {
        console.error("搜索機會失敗:", error);
        throw error;
      }
    },
    staleTime: 1 * 60 * 1000, // 1分鐘
    gcTime: 5 * 60 * 1000, // 5分鐘
  });
};

// 無限加載搜索 hook
export const useInfiniteOpportunitySearch = (params: Omit<SearchParams, 'page'>) => {
  return useInfiniteQuery<SearchResponse>({
    queryKey: [SEARCH_QUERY_KEY, 'infinite', params],
    queryFn: async ({ pageParam = 1 }) => {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value) {
          searchParams.append(key, String(value));
        }
      });
      searchParams.append('page', String(pageParam));

      try {
        console.log(`無限查詢: 載入第 ${pageParam} 頁, 參數:`, Object.fromEntries(searchParams.entries()));
        const response = await fetch(`/api/opportunities/search?${searchParams.toString()}`);

        if (!response.ok) {
          throw new Error('搜索機會失敗');
        }

        const data = await response.json();

        // 直接輸出完整響應，方便調試
        console.log(`無限查詢 API 響應:`, {
          有機會: data.opportunities ? true : false,
          機會數量: data.opportunities?.length || 0,
          分頁信息: data.pagination ? { ...data.pagination } : '無分頁信息',
          路徑: Object.keys(data)
        });

        // 檢查返回格式
        if (!data.pagination) {
          console.error('API 響應沒有 pagination 屬性:', data);
        }

        console.log(`無限查詢: 第 ${pageParam} 頁結果:`, {
          獲取數量: data.opportunities?.length || 0,
          總數量: data.pagination?.total || 0,
          當前頁: data.pagination?.currentPage || 0,
          總頁數: data.pagination?.totalPages || 0,
          是否有下一頁: data.pagination?.hasNextPage || false
        });

        return {
          opportunities: transformOpportunities(data.opportunities || []),
          total: data.pagination?.total || 0,
          currentPage: data.pagination?.currentPage || pageParam,
          totalPages: data.pagination?.totalPages || 1,
          hasNextPage: data.pagination?.hasNextPage || false,
          hasPrevPage: data.pagination?.hasPrevPage || false,
        };
      } catch (error) {
        console.error('載入機會列表失敗:', error);
        throw error;
      }
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage: SearchResponse, allPages) => {
      // 直接檢查是否還有更多數據可加載
      const loadedItemsCount = allPages.reduce((total, page) => total + page.opportunities.length, 0);

      // 如果已加載的項目數少於總數，則有下一頁
      const hasMore = loadedItemsCount < lastPage.total;

      if (!hasMore) {
        console.log('無限查詢: 已加載所有數據', { 已加載: loadedItemsCount, 總數: lastPage.total });
        return undefined;
      }

      // 返回下一頁的頁碼
      const nextPage = allPages.length + 1; // 簡單地使用頁面數組長度 + 1
      console.log(`無限查詢: 下一頁是 ${nextPage}，已加載 ${loadedItemsCount}/${lastPage.total} 項`);
      return nextPage;
    },
    // 其他設置保持不變
    staleTime: 1 * 60 * 1000, // 1分鐘
    gcTime: 5 * 60 * 1000, // 5分鐘
  });
};

// 預取搜索結果
export const prefetchOpportunitySearch = async (queryClient: any, params: SearchParams) => {
  await queryClient.prefetchQuery({
    queryKey: [SEARCH_QUERY_KEY, params],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value) {
          searchParams.append(key, String(value));
        }
      });

      const response = await fetch(`/api/opportunities/search?${searchParams.toString()}`);
      if (!response.ok) {
        throw new Error('預取搜索結果失敗');
      }

      const data = await response.json();
      return {
        opportunities: transformOpportunities(data.opportunities || []),
        total: data.pagination?.total || 0,
        currentPage: data.pagination?.currentPage || 1,
        totalPages: data.pagination?.totalPages || 1,
        hasNextPage: data.pagination?.hasNextPage || false,
        hasPrevPage: data.pagination?.hasPrevPage || false,
      };
    },
  });
};