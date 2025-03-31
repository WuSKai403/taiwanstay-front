import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import { useOpportunitySearch, useInfiniteOpportunitySearch } from '@/lib/hooks/useOpportunitySearch';
import { useMapOpportunities } from '@/lib/hooks/useMapOpportunities';
import { useOpportunityStore } from '@/store/opportunities';
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

const OpportunityList: React.FC = () => {
  const router = useRouter();

  // 從 store 獲取狀態
  const searchFilters = useOpportunityStore((state) => state.searchFilters);
  const setSearchFilters = useOpportunityStore((state) => state.setSearchFilters);
  const viewMode = useOpportunityStore((state) => state.viewMode);
  const setViewMode = useOpportunityStore((state) => state.setViewMode);
  const isSearching = useOpportunityStore((state) => state.isSearching);
  const setIsSearching = useOpportunityStore((state) => state.setIsSearching);

  const [searchTerm, setSearchTerm] = useState(searchFilters.search || '');
  const [filters, setFilters] = useState({
    type: searchFilters.type || '',
    region: searchFilters.region || '',
    city: searchFilters.city || '',
  });

  // 使用 hook 獲取數據
  const { data: searchData, isLoading, error } = useOpportunitySearch({
    ...searchFilters,
    sort: searchFilters.sort as 'newest' | 'oldest' | undefined
  });

  const {
    data: infiniteData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage
  } = useInfiniteOpportunitySearch({
    search: searchFilters.search,
    type: searchFilters.type,
    region: searchFilters.region,
    city: searchFilters.city,
    sort: searchFilters.sort as 'newest' | 'oldest',
    limit: searchFilters.limit
  });

  const { data: mapData, isLoading: isLoadingMap } = useMapOpportunities({
    type: searchFilters.type,
    region: searchFilters.region,
    city: searchFilters.city
  });

  // 更新 URL 和 store
  useEffect(() => {
    if (!router.isReady) return;

    const { search, type, region, city, sort, page, view } = router.query;

    const newFilters: Record<string, any> = {};

    if (search) newFilters.search = search as string;
    if (type) newFilters.type = type as string;
    if (region) newFilters.region = region as string;
    if (city) newFilters.city = city as string;
    if (sort) newFilters.sort = sort as string;
    if (page) newFilters.page = parseInt(page as string, 10);

    setSearchFilters(newFilters);

    if (view && (view === 'list' || view === 'map')) {
      setViewMode(view as 'list' | 'map');
    }

    // 更新本地狀態
    setSearchTerm(search as string || '');
    setFilters({
      type: type as string || '',
      region: region as string || '',
      city: city as string || '',
    });
  }, [router.isReady, router.query, setSearchFilters, setViewMode]);

  // 處理視圖切換
  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode);

    // 更新URL參數
    router.push({
      pathname: router.pathname,
      query: { ...router.query, view: mode }
    }, undefined, { shallow: true });
  };

  // 處理搜索
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSearching(true);

    setSearchFilters({ search: searchTerm, page: 1 });

    // 更新 URL
    const query = { ...router.query };
    if (searchTerm) {
      query.search = searchTerm;
    } else if (query.search) {
      delete query.search;
    }
    query.page = '1';

    router.push({
      pathname: router.pathname,
      query
    }, undefined, { shallow: true });

    setTimeout(() => setIsSearching(false), 300);
  };

  // 處理篩選
  const handleFilterChange = (name: string, value: string) => {
    setFilters(prev => ({ ...prev, [name]: value }));

    setSearchFilters({ [name]: value, page: 1 });

    // 更新 URL
    const query = { ...router.query };
    if (value) {
      query[name] = value;
    } else {
      delete query[name];
    }
    query.page = '1';

    router.push({
      pathname: router.pathname,
      query
    }, undefined, { shallow: true });
  };

  // 獲取當前顯示的機會列表
  const opportunities = useMemo(() => {
    if (viewMode === 'list') {
      return infiniteData?.pages.flatMap(page => page.opportunities) || [];
    }
    return searchData?.opportunities || [];
  }, [viewMode, infiniteData, searchData]);

  return (
    <div className="container mx-auto px-4 py-8">
      {/* 頂部標題和搜索欄 */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-6">探索工作機會</h1>

        <form onSubmit={handleSearch} className="mb-6">
          <div className="flex">
            <input
              type="text"
              placeholder="搜尋工作機會..."
              className="px-4 py-2 flex-grow border border-gray-300 rounded-l focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-r hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <SearchIcon className="w-5 h-5" />
            </button>
          </div>
        </form>

        {/* 過濾器區域 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div>
            <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">
              工作類型
            </label>
            <select
              id="type"
              value={filters.type}
              onChange={(e) => handleFilterChange('type', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">所有類型</option>
              {Object.entries(typeNameMap).map(([value, name]) => (
                <option key={value} value={value}>
                  {name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="region" className="block text-sm font-medium text-gray-700 mb-1">
              區域
            </label>
            <select
              id="region"
              value={filters.region}
              onChange={(e) => handleFilterChange('region', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">所有區域</option>
              <option value="北部">北部</option>
              <option value="中部">中部</option>
              <option value="南部">南部</option>
              <option value="東部">東部</option>
              <option value="離島">離島</option>
            </select>
          </div>

          <div>
            <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
              城市
            </label>
            <select
              id="city"
              value={filters.city}
              onChange={(e) => handleFilterChange('city', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">所有城市</option>
              <option value="臺北市">臺北市</option>
              <option value="新北市">新北市</option>
              <option value="桃園市">桃園市</option>
              <option value="臺中市">臺中市</option>
              <option value="臺南市">臺南市</option>
              <option value="高雄市">高雄市</option>
              <option value="基隆市">基隆市</option>
              <option value="新竹市">新竹市</option>
              <option value="嘉義市">嘉義市</option>
              <option value="新竹縣">新竹縣</option>
              <option value="苗栗縣">苗栗縣</option>
              <option value="彰化縣">彰化縣</option>
              <option value="南投縣">南投縣</option>
              <option value="雲林縣">雲林縣</option>
              <option value="嘉義縣">嘉義縣</option>
              <option value="屏東縣">屏東縣</option>
              <option value="宜蘭縣">宜蘭縣</option>
              <option value="花蓮縣">花蓮縣</option>
              <option value="臺東縣">臺東縣</option>
              <option value="澎湖縣">澎湖縣</option>
              <option value="金門縣">金門縣</option>
              <option value="連江縣">連江縣</option>
            </select>
          </div>
        </div>
      </div>

      {/* 視圖切換和結果數量 */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex space-x-4">
          <button
            onClick={() => handleViewModeChange('list')}
            className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
              viewMode === 'list' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <ListIcon className="w-5 h-5 mr-2" />
            列表視圖
          </button>
          <button
            onClick={() => handleViewModeChange('map')}
            className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
              viewMode === 'map' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <MapIcon className="w-5 h-5 mr-2" />
            地圖視圖
          </button>
        </div>

        <div>
          {searchData ? (
            <p className="text-sm text-gray-600">共找到 {searchData.total} 個工作機會</p>
          ) : (
            <p className="text-sm text-gray-600">載入中...</p>
          )}
        </div>
      </div>

      {/* 主要內容區域 */}
      <div>
        {viewMode === 'list' ? (
          <>
            {/* 列表視圖 */}
            {isLoading || isSearching ? (
              // 載入狀態
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="bg-gray-100 h-72 rounded-lg animate-pulse"></div>
                ))}
              </div>
            ) : error ? (
              // 錯誤狀態
              <div className="bg-red-50 p-4 rounded-lg">
                <p className="text-red-700">載入資料時發生錯誤，請稍後再試</p>
              </div>
            ) : opportunities.length === 0 ? (
              // 無結果狀態
              <div className="text-center py-10">
                <p className="text-gray-600 mb-4">沒有找到符合條件的工作機會</p>
                <button
                  onClick={() => {
                    setSearchFilters({
                      search: '',
                      type: '',
                      region: '',
                      city: '',
                      page: 1
                    });
                    setSearchTerm('');
                    setFilters({
                      type: '',
                      region: '',
                      city: ''
                    });
                    router.push({ pathname: router.pathname }, undefined, { shallow: true });
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  清除過濾條件
                </button>
              </div>
            ) : (
              // 結果列表
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {opportunities.map((opportunity) => (
                    <OpportunityCard key={opportunity._id} opportunity={opportunity} />
                  ))}
                </div>

                {/* 載入更多按鈕 */}
                {hasNextPage && (
                  <div className="mt-8 text-center">
                    <button
                      onClick={() => fetchNextPage()}
                      disabled={isFetchingNextPage}
                      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-blue-400"
                    >
                      {isFetchingNextPage ? '載入中...' : '載入更多'}
                    </button>
                  </div>
                )}
              </>
            )}
          </>
        ) : (
          // 地圖視圖
          <div className="h-[600px] relative rounded-lg overflow-hidden">
            <MapComponent
              filters={{
                type: searchFilters.type,
                region: searchFilters.region,
                city: searchFilters.city
              }}
            />

            {isLoadingMap && (
              <div className="absolute top-4 right-4 bg-white px-3 py-2 rounded-lg shadow-md z-[1000]">
                <div className="flex items-center">
                  <div className="mr-2 w-4 h-4 border-2 border-t-blue-500 border-r-transparent border-b-blue-500 border-l-transparent rounded-full animate-spin"></div>
                  <span className="text-sm">載入地圖中...</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default OpportunityList;