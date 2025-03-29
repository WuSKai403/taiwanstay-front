import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { transformOpportunities, TransformedOpportunity } from '@/lib/transforms/opportunity';

export interface SearchParams {
  search?: string;
  type?: string;
  region?: string;
  city?: string;
  duration?: string;
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

      const response = await fetch(`/api/opportunities/search?${searchParams.toString()}`);
      if (!response.ok) {
        throw new Error('搜索機會失敗');
      }

      const data = await response.json();
      return {
        opportunities: transformOpportunities(data.opportunities || []),
        total: data.total || 0,
        currentPage: data.currentPage || 1,
        totalPages: data.totalPages || 1,
        hasNextPage: data.hasNextPage || false,
        hasPrevPage: data.hasPrevPage || false,
      };
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

      const response = await fetch(`/api/opportunities/search?${searchParams.toString()}`);
      if (!response.ok) {
        throw new Error('搜索機會失敗');
      }

      const data = await response.json();
      return {
        opportunities: transformOpportunities(data.opportunities || []),
        total: data.total || 0,
        currentPage: data.currentPage || 1,
        totalPages: data.totalPages || 1,
        hasNextPage: data.hasNextPage || false,
        hasPrevPage: data.hasPrevPage || false,
      };
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage: SearchResponse) => {
      if (!lastPage.hasNextPage) return undefined;
      return lastPage.currentPage + 1;
    },
    getPreviousPageParam: (firstPage: SearchResponse) => {
      if (!firstPage.hasPrevPage) return undefined;
      return firstPage.currentPage - 1;
    },
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
        total: data.total || 0,
        currentPage: data.currentPage || 1,
        totalPages: data.totalPages || 1,
        hasNextPage: data.hasNextPage || false,
        hasPrevPage: data.hasPrevPage || false,
      };
    },
  });
};