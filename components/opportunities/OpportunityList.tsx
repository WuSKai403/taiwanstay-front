import { useState, useEffect, useMemo, memo } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import { useOpportunitySearch, useInfiniteOpportunitySearch } from '@/lib/hooks/useOpportunitySearch';
import { useMapOpportunities } from '@/lib/hooks/useMapOpportunities';
import { SearchIcon, ListIcon, MapIcon } from '@/components/icons/Icons';
import { TransformedOpportunity, transformOpportunities } from '@/lib/transforms/opportunity';

// 動態導入地圖組件
const MapComponent = dynamic(() => import('@/components/MapComponent'), {
  ssr: false,
  loading: () => <div className="h-[600px] bg-gray-100 animate-pulse" />
});

// 擴展機會類型，添加臨時ID支持
interface EnhancedOpportunity extends TransformedOpportunity {
  _tempId?: string; // 添加可選的臨時ID屬性
}

// 定義視圖模式類型
type ViewMode = 'list' | 'map';

// OpportunityList props 介面
interface OpportunityListProps {
  initialOpportunities: TransformedOpportunity[];
  totalCount: number;
  initialFilters: {
    search?: string;
    type?: string;
    region?: string;
    availableMonths?: string[]; // 修改為string[]，格式為"YYYY-MM"
    sort?: string;
    page?: number;
    view?: ViewMode;
  };
  availableFilters: {
    types: string[];
    regions: string[];
    cities: string[];
  };
  onFilterChange: (filters: Record<string, any>) => void;
}

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

// 月份名稱
const monthNames = [
  '1月', '2月', '3月', '4月', '5月', '6月',
  '7月', '8月', '9月', '10月', '11月', '12月'
];

// 定義搜索參數類型
interface SearchParams {
  search?: string;
  type?: string;
  region?: string;
  availableMonths?: string[]; // 修改為string[]，格式為"YYYY-MM"
  duration?: string;
  sort?: 'newest' | 'oldest';
  page?: number;
  limit?: number;
}

// 機會卡片組件 - 使用memo優化避免不必要重新渲染
const OpportunityCard = memo(({ opportunity }: { opportunity: TransformedOpportunity }) => {
  // 默認圖片，當機會沒有提供圖片時使用
  const defaultImage = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgZmlsbD0iI2YzZjRmNiIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMjAiIGZpbGw9IiM5Y2EzYWYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj7nhKHlm77niYc8L3RleHQ+PC9zdmc+';

  // 安全地獲取圖片 URL
  const imageUrl = opportunity.media?.images &&
                  opportunity.media.images.length > 0 &&
                  opportunity.media.images[0]?.url
                  ? opportunity.media.images[0].url
                  : defaultImage;

  return (
    <Link
      href={`/opportunities/${opportunity.slug}`}
      className="block bg-white rounded-lg shadow hover:shadow-md transition-shadow"
    >
      <div className="relative h-48">
        <Image
          src={imageUrl}
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
});

// 添加顯示名稱
OpportunityCard.displayName = 'OpportunityCard';

const OpportunityList: React.FC<OpportunityListProps> = ({
  initialOpportunities,
  totalCount,
  initialFilters,
  availableFilters,
  onFilterChange
}) => {
  const router = useRouter();
  const currentYear = new Date().getFullYear();
  const years = [currentYear, currentYear + 1, currentYear + 2]; // 當前年份和未來2年

  // 本地狀態 - 移除 isMounted
  const [opportunities, setOpportunities] = useState<EnhancedOpportunity[]>(initialOpportunities as EnhancedOpportunity[]);
  const [viewMode, setViewMode] = useState<ViewMode>(initialFilters.view || 'list');
  const [searchTerm, setSearchTerm] = useState(initialFilters.search || '');
  const [filters, setFilters] = useState({
    type: initialFilters.type || '',
    region: initialFilters.region || '',
    availableMonths: initialFilters.availableMonths || [],
    sort: initialFilters.sort || 'newest',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [page, setPage] = useState(initialFilters.page || 1);
  const limit = 10;

  // 當 URL 參數變化時更新本地狀態
  useEffect(() => {
    setSearchTerm(router.query.search as string || '');

    // 安全解析 availableMonths
    let parsedAvailableMonths: string[] = [];
    if (router.query.availableMonths) {
      try {
        const monthsStr = router.query.availableMonths as string;
        parsedAvailableMonths = monthsStr.split(',').filter(m => m && m.includes('-'));
      } catch (error) {
        console.error('解析 availableMonths 錯誤:', error);
      }
    }

    setFilters({
      type: router.query.type as string || '',
      region: router.query.region as string || '',
      availableMonths: parsedAvailableMonths,
      sort: router.query.sort as string || 'newest',
    });

    // 設置頁碼
    if (router.query.page) {
      setPage(parseInt(router.query.page as string, 10));
    }

    if (router.query.view === 'list' || router.query.view === 'map') {
      setViewMode(router.query.view);
    }
  }, [router.query]);

  // 處理篩選變更
  const handleSearch = () => {
    onFilterChange({
      search: searchTerm,
      ...filters,
      page: 1
    });
  };

  // 處理重置篩選 - 確保同時重置月份篩選
  const handleResetFilters = () => {
    // 重置本地狀態
    setSearchTerm('');
    setFilters({
      type: '',
      region: '',
      availableMonths: [],
      sort: 'newest'
    });
    setPage(1);

    // 通知父組件重置篩選條件
    onFilterChange({
      search: '',
      type: '',
      region: '',
      availableMonths: [],
      sort: 'newest',
      page: 1
    });
  };

  // 處理視圖模式切換
  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode);
    onFilterChange({ view: mode });
  };

  // 使用我們的hooks加載數據 - 但是只用於初始載入和篩選條件變更
  const {
    data: searchResults,
    isLoading: isLoadingSearch,
    error: searchError
  } = useOpportunitySearch({
    search: searchTerm,
    type: filters.type,
    region: filters.region,
    availableMonths: filters.availableMonths,
    sort: filters.sort as 'newest' | 'oldest',
    page: 1, // 固定為第1頁，後續頁面由我們自己處理
    limit
  });

  // 使用地圖數據 hook - 專門為地圖視圖載入所有機會，不受分頁限制
  const {
    data: mapData,
    isLoading: isLoadingMap,
    error: mapError
  } = useMapOpportunities({
    search: searchTerm,
    type: filters.type,
    region: filters.region,
    availableMonths: filters.availableMonths,
    limit: 100 // 載入更多機會用於地圖顯示
  });

  // 增加調試信息
  console.log("搜索參數:", {
    search: searchTerm,
    type: filters.type,
    region: filters.region,
    availableMonths: filters.availableMonths,
    sort: filters.sort,
    page,
    limit
  });

  // 每當篩選條件變更時，重置機會列表
  useEffect(() => {
    if (searchResults && !isLoadingSearch) {
      // 為每個機會添加唯一標識符，防止 key 重複
      const processedOpportunities = searchResults.opportunities.map((opp, index) => {
        // 如果沒有 id 或 _id，添加一個唯一的臨時 ID
        if (!opp.id && !opp._id) {
          return {
            ...opp,
            _tempId: `temp-${index}-${Date.now()}`
          };
        }
        return opp;
      });

      setOpportunities(processedOpportunities);
      setPage(1); // 重置為第1頁
    }
  }, [searchResults, isLoadingSearch]);

  // 強制顯示載入更多按鈕條件 - 確保按鈕總是在有更多數據時顯示
  const hasMoreItems = searchResults?.total && opportunities.length < searchResults.total;

  // 徹底重寫載入更多邏輯，使用獨立的 fetch 請求而不觸發 React Query
  const handleLoadMore = async () => {
    if (isLoading) return; // 防止重複點擊

    setIsLoading(true);
    const nextPage = page + 1;

    try {
      // 手動構建查詢參數
      const searchParams = new URLSearchParams();
      if (searchTerm) searchParams.append('search', searchTerm);
      if (filters.type) searchParams.append('type', filters.type);
      if (filters.region) searchParams.append('region', filters.region);

      // 安全處理 availableMonths
      if (filters.availableMonths &&
          Array.isArray(filters.availableMonths) &&
          filters.availableMonths.length > 0 &&
          filters.availableMonths.filter(m => m && m.includes('-')).length > 0) {
        const validMonths = filters.availableMonths.filter(m => m && m.includes('-'));
        searchParams.append('availableMonths', validMonths.join(','));
      }
      searchParams.append('sort', filters.sort || 'newest');
      searchParams.append('page', String(nextPage));
      searchParams.append('limit', String(limit));

      // 使用 fetch API 直接請求，完全繞過 React Query
      console.log(`直接加載更多: 請求第 ${nextPage} 頁，參數:`, searchParams.toString());

      const response = await fetch(`/api/opportunities/search?${searchParams.toString()}`);

      if (!response.ok) {
        throw new Error(`加載更多數據失敗: ${response.status}`);
      }

      const data = await response.json();

      if (!data || !Array.isArray(data.opportunities)) {
        console.error('API 返回數據格式錯誤:', data);
        return;
      }

      // 處理新的機會數據
      const newOpportunities = transformOpportunities(data.opportunities || []);
      console.log(`直接加載更多: 獲取到 ${newOpportunities.length} 個新機會`);

      // 更新本地頁碼
      setPage(nextPage);

      // 使用函數式更新，確保基於最新狀態
      setOpportunities(prevOpportunities => {
        // 為每個機會創建映射，確保有 ID
        const currentOpps = new Map();
        prevOpportunities.forEach((opp, index) => {
          const id = opp.id || opp._id || `index-${index}`;
          currentOpps.set(id, opp);
        });

        // 添加新機會，避免重複
        newOpportunities.forEach((opp, index) => {
          const id = opp.id || opp._id || `new-${index}-${Date.now()}`;
          if (!currentOpps.has(id)) {
            currentOpps.set(id, opp);
          }
        });

        // 轉換回數組
        return Array.from(currentOpps.values());
      });

    } catch (error) {
      console.error("加載更多機會時出錯:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // 渲染篩選區塊
  const renderFilters = () => (
      <div className="mb-8">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* 類型篩選 */}
          <div>
          <label htmlFor="type-filter" className="block text-sm font-medium text-gray-700 mb-1">工作類型</label>
            <select
            id="type-filter"
            className="block w-full bg-white border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              value={filters.type}
            onChange={(e) => {
              const newFilters = { ...filters, type: e.target.value, page: 1 };
              setFilters(newFilters);
              onFilterChange({ ...newFilters, search: searchTerm });
            }}
            >
              <option value="">所有類型</option>
            {availableFilters.types.map((type) => (
              <option key={type} value={type}>
                {typeNameMap[type as keyof typeof typeNameMap] || type}
                </option>
              ))}
            </select>
          </div>

        {/* 地區篩選 */}
        <div>
          <label htmlFor="region-filter" className="block text-sm font-medium text-gray-700 mb-1">所在地區</label>
          <select
            id="region-filter"
            className="block w-full bg-white border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            value={filters.region}
            onChange={(e) => {
              const newFilters = { ...filters, region: e.target.value, page: 1 };
              setFilters(newFilters);
              onFilterChange({ ...newFilters, search: searchTerm });
            }}
          >
            <option value="">所有地區</option>
            {availableFilters.regions.map((region) => (
              <option key={region} value={region}>{region}</option>
            ))}
          </select>
        </div>

        {/* 年月篩選 */}
          <div>
          <label htmlFor="month-filter" className="block text-sm font-medium text-gray-700 mb-1">可工作年月</label>
          <div className="grid grid-cols-2 gap-2">
            <select
              id="year-filter"
              className="block w-full bg-white border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              value={filters.availableMonths &&
                     filters.availableMonths.length > 0 &&
                     filters.availableMonths[0] &&
                     filters.availableMonths[0].includes('-')
                ? filters.availableMonths[0].split('-')[0]
                : currentYear}
              onChange={(e) => {
                const selectedYear = e.target.value;
                // 如果原先有選擇的月份，則保留月份但更改年份
                if (filters.availableMonths && filters.availableMonths.length > 0 && filters.availableMonths[0] && filters.availableMonths[0].includes('-')) {
                  const oldMonthStr = filters.availableMonths[0].split('-')[1] || '1';
                  const oldMonth = parseInt(oldMonthStr, 10);
                  // 確保月份使用兩位數格式
                  const paddedMonth = String(oldMonth).padStart(2, '0');
                  const newYearMonth = `${selectedYear}-${paddedMonth}`;
                  const newFilters = { ...filters, availableMonths: [newYearMonth], page: 1 };

                  // 更新本地狀態
                  setFilters(newFilters);
                  // 重置機會列表和頁碼以獲取新結果
                  setPage(1);
                  setIsSearching(true);

                  // 通知父組件更新URL，但不觸發頁面重載
                  onFilterChange({ ...newFilters, search: searchTerm });
                  setTimeout(() => setIsSearching(false), 300);
                } else {
                  // 如果沒有選擇的月份，則設置為所選年份的1月
                  const newYearMonth = `${selectedYear}-01`;  // 使用兩位數格式 "01"
                  const newFilters = { ...filters, availableMonths: [newYearMonth], page: 1 };

                  // 更新本地狀態
                  setFilters(newFilters);
                  // 重置機會列表和頁碼以獲取新結果
                  setPage(1);
                  setIsSearching(true);

                  // 通知父組件更新URL，但不觸發頁面重載
                  onFilterChange({ ...newFilters, search: searchTerm });
                  setTimeout(() => setIsSearching(false), 300);
                }
              }}
            >
              {years.map((year) => (
                <option key={year} value={year}>
                  {year}年
                </option>
              ))}
            </select>

            <select
              id="month-filter"
              className="block w-full bg-white border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              value={filters.availableMonths &&
                     filters.availableMonths.length > 0 &&
                     filters.availableMonths[0] &&
                     filters.availableMonths[0].includes('-')
                ? filters.availableMonths[0].split('-')[1] || '0'
                : '0'}
              onChange={(e) => {
                const selectedMonth = e.target.value;
                if (selectedMonth === '0') {
                  // 選擇"所有月份"
                  const newFilters = { ...filters, availableMonths: [], page: 1 };

                  // 更新本地狀態
                  setFilters(newFilters);
                  // 重置機會列表和頁碼以獲取新結果
                  setPage(1);
                  setIsSearching(true);

                  // 通知父組件更新URL，但不觸發頁面重載
                  onFilterChange({ ...newFilters, search: searchTerm });
                  setTimeout(() => setIsSearching(false), 300);
                } else {
                  // 獲取當前選中的年份，如果沒有，則使用當前年份
                  const currentSelectedYear = filters.availableMonths &&
                                             filters.availableMonths.length > 0 &&
                                             filters.availableMonths[0] &&
                                             filters.availableMonths[0].includes('-')
                    ? filters.availableMonths[0].split('-')[0]
                    : currentYear.toString();

                  // 確保月份使用兩位數格式
                  const paddedMonth = String(selectedMonth).padStart(2, '0');

                  // 組合成年月格式
                  const yearMonth = `${currentSelectedYear}-${paddedMonth}`;
                  const newFilters = { ...filters, availableMonths: [yearMonth], page: 1 };

                  // 更新本地狀態
                  setFilters(newFilters);
                  // 重置機會列表和頁碼以獲取新結果
                  setPage(1);
                  setIsSearching(true);

                  // 通知父組件更新URL，但不觸發頁面重載
                  onFilterChange({ ...newFilters, search: searchTerm });
                  setTimeout(() => setIsSearching(false), 300);
                }
              }}
            >
              <option value="0">所有月份</option>
              {monthNames.map((month, index) => (
                <option key={index + 1} value={index + 1}>
                  {month}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* 排序方式 */}
        <div>
          <label htmlFor="sort-filter" className="block text-sm font-medium text-gray-700 mb-1">排序方式</label>
          <select
            id="sort-filter"
            className="block w-full bg-white border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            value={filters.sort}
            onChange={(e) => {
              const newFilters = { ...filters, sort: e.target.value, page: 1 };
              setFilters(newFilters);
              onFilterChange({ ...newFilters, search: searchTerm });
            }}
          >
            <option value="newest">最新發布</option>
            <option value="oldest">最舊發布</option>
          </select>
        </div>
      </div>
    </div>
  );

  // 渲染空狀態
  const renderEmptyState = () => (
    <div className="text-center py-12">
      <p className="text-xl text-gray-500 mb-4">沒有找到符合條件的機會</p>
      <button
        onClick={handleResetFilters}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        清除篩選條件
      </button>
    </div>
  );

  // 添加按鈕狀態信息
  console.log("載入更多按鈕條件:", {
    總機會數: searchResults?.total || 0,
    已載入數量: opportunities.length,
    還有更多: hasMoreItems
  });

  // 修改主視圖渲染，確保正確顯示載入更多按鈕和地圖
  return (
    <div className="space-y-8">
      {/* 搜索欄 */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div className="flex-1">
          <div className="relative">
            <input
              type="text"
              placeholder="搜索機會..."
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
            <button
              onClick={handleSearch}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              aria-label="搜索"
            >
              <SearchIcon className="w-5 h-5" />
            </button>
        </div>
      </div>

        {/* 視圖切換 */}
        <div className="flex space-x-2">
          <button
            onClick={() => onFilterChange({ ...filters, search: searchTerm, view: 'list' })}
            className={`px-3 py-1.5 rounded text-sm font-medium transition-colors duration-200 flex items-center ${
              viewMode === 'list'
                ? 'bg-blue-100 text-blue-700'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <ListIcon className="w-4 h-4 mr-1" />
            列表視圖
          </button>
          <button
            onClick={() => onFilterChange({ ...filters, search: searchTerm, view: 'map' })}
            className={`px-3 py-1.5 rounded text-sm font-medium transition-colors duration-200 flex items-center ${
              viewMode === 'map'
                ? 'bg-blue-100 text-blue-700'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <MapIcon className="w-4 h-4 mr-1" />
            地圖視圖
          </button>
        </div>
      </div>

      {/* 篩選條件 */}
      {renderFilters()}

      {/* 搜索結果數量顯示 */}
      {!isLoadingSearch && !searchError && searchResults && (
        <div className="mb-6">
          <p className="text-gray-600">
            找到 <span className="font-semibold">{searchResults.total}</span> 個符合條件的機會
          </p>
        </div>
      )}

      {/* 主內容區域 */}
      {viewMode === 'list' ? (
        <div>
          {isLoadingSearch ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={`skeleton-${i}`} className="bg-white rounded-lg shadow animate-pulse h-80">
                  <div className="h-48 bg-gray-200 rounded-t-lg"></div>
                  <div className="p-4">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : opportunities.length === 0 ? (
            renderEmptyState()
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {opportunities.map((opportunity, index) => {
                  // 為每個機會生成唯一的 key，考慮所有可能的 ID 來源
                  const uniqueKey =
                    opportunity.id ||
                    opportunity._id ||
                    opportunity._tempId ||
                    `opp-${index}-${Math.random().toString(36).substr(2, 9)}`;

                  return (
                    <OpportunityCard
                      key={uniqueKey}
                      opportunity={opportunity}
                    />
                  );
                })}
              </div>

              {/* 確保載入更多按鈕顯示 */}
              {hasMoreItems && (
                <div className="mt-8 text-center">
                <button
                    type="button"
                    onClick={(e) => {
                      // 完全阻止事件傳播
                      e.preventDefault();
                      e.stopPropagation();

                      // 使用 requestAnimationFrame 來確保 DOM 更新平滑
                      requestAnimationFrame(() => {
                        handleLoadMore();
                      });

                      return false; // 進一步阻止默認行為
                    }}
                    disabled={isLoading}
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-blue-300"
                  >
                    {isLoading ? '載入中...' : '載入更多'}
                </button>
                  <p className="text-xs text-gray-500 mt-1">
                    已顯示 {opportunities.length} / {searchResults?.total || '?'} 個機會
                  </p>
                  </div>
                )}
              </>
            )}
        </div>
      ) : (
        <div className="h-[600px] bg-white rounded-lg shadow">
          {isLoadingMap ? (
            <div className="h-full flex items-center justify-center bg-gray-100">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
                <p className="mt-2 text-gray-600">載入地圖中...</p>
              </div>
            </div>
          ) : mapError ? (
            <div className="h-full flex items-center justify-center bg-gray-100">
              <div className="text-center text-red-500">
                載入地圖數據時出錯
              </div>
            </div>
          ) : (
            <MapComponent
              opportunities={mapData?.opportunities || []}
              isLoading={isLoadingMap}
              enableClustering={true}
            />
            )}
          </div>
        )}
    </div>
  );
};

export default OpportunityList;