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
  };
  location?: {
    city?: string;
    region?: string;
    country?: string;
    address?: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
  media?: {
    images?: {
      url: string;
      alt?: string;
    }[];
  };
  workDetails?: {
    workHoursPerDay?: number;
    workDaysPerWeek?: number;
    minimumStay?: number;
    maximumStay?: number;
    availableMonths?: number[];
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

      return {
        id: opp.id,
        _id: opp.id, // 確保同時有 id 和 _id
        title: opp.title,
        slug: opp.slug,
        type: opp.type,
        host: {
          id: opp.host?.id || '',
          name: opp.host?.name || '',
          avatar: null // 使用 null 而非 undefined，因為 undefined 無法被 JSON 序列化
        },
        location: {
          region: opp.location?.region || '',
          city: opp.location?.city || '',
          address: opp.location?.address || null,
          coordinates: opp.location?.coordinates || null
        },
        media: opp.media || {
          images: []
        },
        workTimeSettings: {
          hoursPerDay: opp.workDetails?.workHoursPerDay || 0,
          daysPerWeek: opp.workDetails?.workDaysPerWeek || 0,
          minimumStay: opp.workDetails?.minimumStay || null,
          availableMonths: opp.workDetails?.availableMonths || null
        },
        // 將日期序列化為 ISO 字符串，這是 Next.js 推薦的方式
        createdAt: createdAt.toISOString(),
        updatedAt: updatedAt.toISOString()
      };
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