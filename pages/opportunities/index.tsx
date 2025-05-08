import { NextPage, GetServerSideProps } from 'next';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '@/components/layout/Layout';
import OpportunityList from '@/components/opportunities/OpportunityList';
import { TransformedOpportunity } from '@/lib/transforms/opportunity';

// 定義頁面 props 類型
interface OpportunitiesPageProps {
  initialOpportunities: TransformedOpportunity[];
  totalCount: number;
  filters: {
    search?: string;
    type?: string;
    region?: string;
    city?: string;
    sort?: string;
    page?: number;
    view?: 'list' | 'map';
    availableMonths?: string[];
  };
  availableFilters: {
    types: string[];
    regions: string[];
    cities: string[];
  };
}

const OpportunitiesPage: NextPage<OpportunitiesPageProps> = ({
  initialOpportunities,
  totalCount,
  filters,
  availableFilters
}) => {
  const router = useRouter();
  // 移除 isMounted 狀態和相關檢查

  // 使用 URL 參數進行導航而不重新載入頁面
  const handleFilterChange = (newFilters: Record<string, any>) => {
    const currentQuery = { ...router.query };

    // 更新查詢參數
    Object.entries(newFilters).forEach(([key, value]) => {
      if (value) {
        // 特殊處理 availableMonths 陣列
        if (key === 'availableMonths' && Array.isArray(value) && value.length > 0) {
          currentQuery[key] = value.join(',');
        } else {
          currentQuery[key] = String(value);
        }
      } else {
        delete currentQuery[key];
      }
    });

    // 如果這是載入更多操作 (僅更新 page 參數)，則不更新 URL
    const isLoadMoreOperation =
      Object.keys(newFilters).length === 1 &&
      'page' in newFilters &&
      newFilters.page > 1;

    if (!isLoadMoreOperation) {
      // 使用 shallow routing 更新 URL 而不重新加載頁面
      router.push(
        {
          pathname: router.pathname,
          query: currentQuery
        },
        undefined,
        { shallow: true }
      );
    }
  };

  return (
    <Layout title="機會探索">
      <OpportunityList
        initialOpportunities={initialOpportunities}
        totalCount={totalCount}
        initialFilters={filters}
        availableFilters={availableFilters}
        onFilterChange={handleFilterChange}
      />
    </Layout>
  );
};

// 定義 API 返回的機會數據類型
interface ApiOpportunity {
  id: string;
  title: string;
  slug: string;
  type: string;
  shortDescription?: string;
  status?: string;
  host?: {
    id: string;
    name: string;
    description?: string;
    profilePicture?: string;
  };
  location?: {
    city?: string;
    region?: string;
    country?: string;
    address?: string;
    coordinates?: {
      lat?: number;
      lng?: number;
      type?: string;
      coordinates?: number[];
    };
  };
  media?: {
    images?: {
      url?: string;
      secureUrl?: string;
      alt?: string;
      publicId?: string;
      previewUrl?: string;
      thumbnailUrl?: string;
      version?: string;
      format?: string;
      width?: number;
      height?: number;
    }[];
    coverImage?: {
      url?: string;
      secureUrl?: string;
      alt?: string;
      publicId?: string;
      previewUrl?: string;
      thumbnailUrl?: string;
      version?: string;
      format?: string;
      width?: number;
      height?: number;
    };
    descriptions?: string[];
    videoUrl?: string;
    videoDescription?: string;
    virtualTour?: string;
  };
  workDetails?: {
    workHoursPerDay?: number;
    workDaysPerWeek?: number;
    minimumStay?: number;
    maximumStay?: number;
    availableMonths?: number[];
  };
  workTimeSettings?: {
    workHoursPerDay?: number;
    workDaysPerWeek?: number;
    minimumStay?: number;
    maximumStay?: number;
    startDate?: string;
    endDate?: string;
    isOngoing?: boolean;
  };
  benefits?: {
    accommodation?: any;
    meals?: any;
    stipend?: any;
  };
  ratings?: {
    overall: number;
    reviewCount: number;
  };
  stats?: {
    applications: number;
    bookmarks: number;
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

// 伺服器端數據獲取
export const getServerSideProps: GetServerSideProps = async (context) => {
  const { query } = context;

  // 從 URL 獲取篩選條件
  const filters = {
    search: query.search as string || '',
    type: query.type as string || '',
    region: query.region as string || '',
    city: query.city as string || '',
    availableMonths: query.availableMonths
      ? (query.availableMonths as string).split(',').map(Number)
      : [],
    sort: query.sort as string || 'newest',
    page: query.page ? parseInt(query.page as string, 10) : 1,
    view: (query.view as 'list' | 'map') || 'list'
  };

  // 構建 API 查詢參數
  const searchParams = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
      if (value) {
      if (key === 'availableMonths' && Array.isArray(value) && value.length > 0) {
        searchParams.append(key, value.join(','));
      } else if (value) {
        searchParams.append(key, String(value));
      }
    }
  });

  // 使用絕對 URL 獲取數據
  const protocol = context.req.headers['x-forwarded-proto'] || 'http';
  const host = context.req.headers.host;
  const apiUrl = `${protocol}://${host}/api/opportunities/search?${searchParams.toString()}`;

  try {
    const response = await fetch(apiUrl);
    const data = await response.json();

    // 轉換 API 返回的數據結構為我們需要的格式
    const opportunities = data.opportunities?.map((opp: ApiOpportunity) => {
      // 處理日期，確保它們是可序列化的格式
      const createdAt = opp.createdAt ? new Date(opp.createdAt) : new Date();
      const updatedAt = opp.updatedAt ? new Date(opp.updatedAt) : new Date();

      // 轉換後的機會數據
      const transformedOpportunity = {
        _id: opp.id || '',
        id: opp.id || '',
        title: opp.title || '未命名機會',
        slug: opp.slug || '',
        type: opp.type || 'OTHER',
        description: opp.shortDescription || '',
        host: {
          id: opp.host?.id || '',
          name: opp.host?.name || '未知主辦方',
          avatar: opp.host?.profilePicture || null
        },
        location: {
          region: '', // 數據庫沒有直接存儲 region
          city: opp.location?.city || '',
          address: opp.location?.address || null,
          coordinates: opp.location?.coordinates ? {
            // 處理兩種可能的座標格式
            lat: opp.location.coordinates.lat ||
                 (opp.location.coordinates.coordinates && opp.location.coordinates.coordinates.length >= 2
                  ? opp.location.coordinates.coordinates[1] : null),
            lng: opp.location.coordinates.lng ||
                 (opp.location.coordinates.coordinates && opp.location.coordinates.coordinates.length >= 2
                  ? opp.location.coordinates.coordinates[0] : null)
          } : null
        },
        media: {
          images: (opp.media?.images || []).map(img => ({
            url: img.url || img.secureUrl || '',
            alt: img.alt || opp.title || '機會圖片'
          })),
          coverImage: opp.media?.coverImage ? {
            url: opp.media.coverImage.url || opp.media.coverImage.secureUrl || '',
            alt: opp.media.coverImage.alt || opp.title || '機會封面圖片'
          } : undefined
        },
        // 從 timeSlots 中獲取相關資訊
        hasTimeSlots: opp.hasTimeSlots || false,
        timeSlots: (opp.timeSlots || []).map(slot => ({
          id: slot.id || '',
          startDate: slot.startDate || '',
          endDate: slot.endDate || '',
          defaultCapacity: slot.defaultCapacity || 1,
          minimumStay: slot.minimumStay || 7,
          appliedCount: slot.appliedCount || 0,
          confirmedCount: slot.confirmedCount || 0,
          status: slot.status || 'OPEN'
        })),
        createdAt: createdAt.toISOString(),
        updatedAt: updatedAt.toISOString()
      };

      return transformedOpportunity;
    }) || [];

    return {
      props: {
        initialOpportunities: opportunities,
        totalCount: data.pagination?.total || 0,
        filters,
        availableFilters: {
          types: data.filters?.types || [],
          regions: data.filters?.regions || [],
          cities: data.filters?.cities || []
        }
      }
    };
  } catch (error) {
    console.error('Failed to fetch opportunities:', error);

    return {
      props: {
        initialOpportunities: [],
        totalCount: 0,
        filters,
        availableFilters: {
          types: [],
          regions: [],
          cities: []
        }
      }
    };
  }
};

export default OpportunitiesPage;