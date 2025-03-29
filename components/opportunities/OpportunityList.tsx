import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import { useOpportunitySearch, useInfiniteOpportunitySearch } from '@/lib/hooks/useOpportunitySearch';
import { SearchIcon, ListIcon, MapIcon } from '@/components/icons/Icons';
import { TransformedOpportunity } from '@/lib/transforms/opportunity';

// 動態導入地圖組件
const MapComponent = dynamic(() => import('@/components/MapComponent'), {
  ssr: false,
  loading: () => <div className="h-[600px] bg-gray-100 animate-pulse" />
});

// 定義視圖模式類型
type ViewMode = 'list' | 'map';

// 機會類型標籤顏色映射
const typeColorMap: Record<string, string> = {
  'FARMING': 'bg-green-100 text-green-800',
  'GARDENING': 'bg-emerald-100 text-emerald-800',
  'ANIMAL_CARE': 'bg-blue-100 text-blue-800',
  'CONSTRUCTION': 'bg-orange-100 text-orange-800',
  'HOSPITALITY': 'bg-purple-100 text-purple-800',
  'COOKING': 'bg-red-100 text-red-800',
  'CLEANING': 'bg-gray-100 text-gray-800',
  'CHILDCARE': 'bg-pink-100 text-pink-800',
  'ELDERLY_CARE': 'bg-indigo-100 text-indigo-800',
  'TEACHING': 'bg-yellow-100 text-yellow-800',
  'LANGUAGE_EXCHANGE': 'bg-cyan-100 text-cyan-800',
  'CREATIVE': 'bg-fuchsia-100 text-fuchsia-800',
  'DIGITAL_NOMAD': 'bg-violet-100 text-violet-800',
  'ADMINISTRATION': 'bg-slate-100 text-slate-800',
  'MAINTENANCE': 'bg-zinc-100 text-zinc-800',
  'TOURISM': 'bg-rose-100 text-rose-800',
  'CONSERVATION': 'bg-teal-100 text-teal-800',
  'COMMUNITY': 'bg-amber-100 text-amber-800',
  'EVENT': 'bg-sky-100 text-sky-800',
  'OTHER': 'bg-neutral-100 text-neutral-800',
  'unknown': 'bg-gray-100 text-gray-800'
};

// 機會類型中文名稱映射
const typeNameMap = {
  'FARMING': '農場體驗',
  'GARDENING': '園藝工作',
  'ANIMAL_CARE': '動物照顧',
  'CONSTRUCTION': '建築工作',
  'HOSPITALITY': '接待服務',
  'COOKING': '烹飪工作',
  'CLEANING': '清潔工作',
  'CHILDCARE': '兒童照顧',
  'ELDERLY_CARE': '老人照顧',
  'TEACHING': '教學工作',
  'LANGUAGE_EXCHANGE': '語言交流',
  'CREATIVE': '創意工作',
  'DIGITAL_NOMAD': '數位遊牧',
  'ADMINISTRATION': '行政工作',
  'MAINTENANCE': '維修工作',
  'TOURISM': '旅遊工作',
  'CONSERVATION': '保育工作',
  'COMMUNITY': '社區工作',
  'EVENT': '活動工作',
  'OTHER': '其他機會'
};

// 定義搜索參數類型
interface SearchParams {
  search?: string;
  type?: string;
  region?: string;
  city?: string;
  duration?: string;
  sort?: 'newest' | 'oldest';
  page?: number;
  limit?: number;
}

// 機會卡片組件
const OpportunityCard: React.FC<{ opportunity: TransformedOpportunity }> = ({ opportunity }) => {
  const defaultImage = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgZmlsbD0iI2YzZjRmNiIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMjAiIGZpbGw9IiM5Y2EzYWYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj7nhKHlm77niYc8L3RleHQ+PC9zdmc+';

  return (
    <Link
      href={`/opportunities/${opportunity.slug}`}
      className="block bg-white rounded-lg shadow hover:shadow-md transition-shadow"
    >
      <div className="relative h-48">
        <Image
          src={opportunity.media?.images?.[0]?.url || defaultImage}
          alt={opportunity.title}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className="object-cover rounded-t-lg"
          priority={false}
          loading="lazy"
        />
        <div className="absolute top-2 right-2">
          <span
            className={`px-2 py-1 rounded-full text-sm ${
              typeColorMap[opportunity.type] || 'bg-gray-100 text-gray-800'
            }`}
          >
            {typeNameMap[opportunity.type as keyof typeof typeNameMap] || '其他機會'}
          </span>
        </div>
      </div>
      <div className="p-4">
        <h3 className="text-lg font-semibold mb-2">{opportunity.title}</h3>
        <div className="flex items-center text-sm text-gray-500">
          <span>{opportunity.location?.city || '地點未指定'}</span>
          <span className="mx-2">•</span>
          <span>
            {opportunity.workTimeSettings?.minimumStay
              ? `最少 ${opportunity.workTimeSettings.minimumStay} 天`
              : '彈性時間'}
          </span>
        </div>
      </div>
    </Link>
  );
};

interface OpportunityListProps {
  initialOpportunities: TransformedOpportunity[];
  initialPagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

const OpportunityList: React.FC<OpportunityListProps> = ({
  initialOpportunities,
  initialPagination
}) => {
  const router = useRouter();
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    type: '',
    region: '',
    city: '',
    duration: '',
  });
  const [sortBy, setSortBy] = useState<'newest' | 'oldest'>('newest');

  // 修改 searchParams 的類型
  const searchParams: SearchParams = useMemo(() => ({
    search: searchTerm,
    type: filters.type,
    region: filters.region,
    city: filters.city,
    duration: filters.duration,
    sort: sortBy,
    page: Number(router.query.page) || 1,
    limit: 10
  }), [searchTerm, filters, sortBy, router.query.page]);

  // 使用搜索 hook
  const {
    data: searchData,
    isLoading,
    error
  } = useOpportunitySearch(searchParams);

  // 使用無限加載 hook（用於列表視圖）
  const {
    data: infiniteData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: isLoadingInfinite
  } = useInfiniteOpportunitySearch({
    search: searchTerm,
    type: filters.type,
    region: filters.region,
    city: filters.city,
    duration: filters.duration,
    sort: sortBy,
    limit: 10
  });

  // 更新 URL 查詢參數
  useEffect(() => {
    const query = {
      ...router.query,
      page: searchData?.currentPage.toString(),
      search: searchTerm,
      type: filters.type,
      region: filters.region,
      city: filters.city,
      duration: filters.duration,
      sort: sortBy
    };

    // 移除空值
    Object.keys(query).forEach(key => {
      if (!query[key as keyof typeof query]) {
        delete query[key as keyof typeof query];
      }
    });

    router.push({ pathname: router.pathname, query }, undefined, { shallow: true });
  }, [router, searchData?.currentPage, searchTerm, filters, sortBy]);

  // 處理搜索
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    router.push({
      pathname: router.pathname,
      query: { ...router.query, page: '1', search: searchTerm }
    }, undefined, { shallow: true });
  };

  // 處理篩選
  const handleFilterChange = (name: string, value: string) => {
    setFilters(prev => ({ ...prev, [name]: value }));
    router.push({
      pathname: router.pathname,
      query: { ...router.query, page: '1', [name]: value }
    }, undefined, { shallow: true });
  };

  // 處理排序
  const handleSortChange = (value: string) => {
    setSortBy(value as 'newest' | 'oldest');
    router.push({
      pathname: router.pathname,
      query: { ...router.query, page: '1', sort: value }
    }, undefined, { shallow: true });
  };

  // 獲取當前顯示的機會列表
  const opportunities = useMemo(() => {
    if (viewMode === 'list') {
      return infiniteData?.pages.flatMap(page => page.opportunities) || initialOpportunities;
    }
    return searchData?.opportunities || initialOpportunities;
  }, [viewMode, infiniteData, searchData, initialOpportunities]);

  return (
    <div className="container mx-auto px-4 py-8">
      {/* 搜索和篩選區域 */}
      <div className="mb-8">
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="搜尋工作機會..."
                className="w-full px-4 py-2 pl-10 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            </div>
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              搜尋
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <select
              value={filters.type}
              onChange={(e) => handleFilterChange('type', e.target.value)}
              className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">所有類型</option>
              {Object.entries(typeNameMap).map(([key, value]) => (
                <option key={key} value={key}>
                  {value}
                </option>
              ))}
            </select>
            <select
              value={filters.region}
              onChange={(e) => handleFilterChange('region', e.target.value)}
              className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">所有地區</option>
              <option value="north">北部</option>
              <option value="central">中部</option>
              <option value="south">南部</option>
              <option value="east">東部</option>
            </select>
            <select
              value={filters.duration}
              onChange={(e) => handleFilterChange('duration', e.target.value)}
              className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">所有時長</option>
              <option value="short">短期 (1-2週)</option>
              <option value="medium">中期 (2-4週)</option>
              <option value="long">長期 (4週以上)</option>
            </select>
            <select
              value={sortBy}
              onChange={(e) => handleSortChange(e.target.value)}
              className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="newest">最新發布</option>
              <option value="oldest">最早發布</option>
            </select>
          </div>
        </form>
      </div>

      {/* 視圖切換 */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex space-x-4">
          <button
            onClick={() => setViewMode('list')}
            className={`flex items-center px-4 py-2 rounded-lg ${
              viewMode === 'list' ? 'bg-blue-100 text-blue-600' : 'text-gray-600'
            }`}
          >
            <ListIcon className="w-5 h-5 mr-2" />
            列表視圖
          </button>
          <button
            onClick={() => setViewMode('map')}
            className={`flex items-center px-4 py-2 rounded-lg ${
              viewMode === 'map' ? 'bg-blue-100 text-blue-600' : 'text-gray-600'
            }`}
          >
            <MapIcon className="w-5 h-5 mr-2" />
            地圖視圖
          </button>
        </div>
      </div>

      {/* 內容區域 */}
      {viewMode === 'list' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {opportunities?.map((opportunity, index) => (
            <OpportunityCard
              key={`${opportunity.id}-${index}`}
              opportunity={opportunity}
            />
          ))}
          {isLoadingInfinite && (
            <div className="col-span-full flex justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          )}
          {hasNextPage && !isLoadingInfinite && (
            <button
              onClick={() => fetchNextPage()}
              className="col-span-full py-4 text-blue-600 hover:text-blue-700"
            >
              載入更多
            </button>
          )}
        </div>
      ) : (
        <div className="h-[600px] relative">
          <MapComponent
            filters={filters}
            onMarkerClick={(id) => router.push(`/opportunities/${id}`)}
            enableClustering
            showZoomControl
            showFullscreenControl
            showLocationControl
          />
        </div>
      )}

      {/* 錯誤提示 */}
      {error && (
        <div className="text-center py-8">
          <p className="text-red-600">載入資料時發生錯誤</p>
        </div>
      )}
    </div>
  );
};

export default OpportunityList;