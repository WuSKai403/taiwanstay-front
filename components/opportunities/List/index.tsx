import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import dynamic from 'next/dynamic';

// 引入 hooks
import { useOpportunitySearch, useInfiniteOpportunitySearch } from '@/lib/hooks/useOpportunitySearch';
import { useMapOpportunities } from '@/lib/hooks/useMapOpportunities';
import { useOpportunityStore } from '@/store/opportunities';

// 引入組件
import OpportunityCard from './OpportunityCard';
import FilterSection from './FilterSection';
import SearchSection from './SearchSection';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import ErrorMessage from '@/components/common/ErrorMessage';

// 常量
const VIEW_TRANSITION_DELAY = 300; // 視圖轉換延遲，毫秒

// 動態導入地圖組件
const MapComponent = dynamic(() => import('@/components/MapComponent'), {
  ssr: false,
  loading: () => <div className="h-[600px] bg-gray-100 animate-pulse" />
});

// 視圖切換組件
const ViewToggle: React.FC<{
  viewMode: 'list' | 'map',
  onChange: (mode: 'list' | 'map') => void,
  isTransitioning: boolean
}> = ({ viewMode, onChange, isTransitioning }) => (
  <div className="flex space-x-2">
    <button
      onClick={() => onChange('list')}
      disabled={isTransitioning || viewMode === 'list'}
      className={`px-3 py-1.5 rounded text-sm font-medium transition-colors duration-200 flex items-center ${
        viewMode === 'list'
          ? 'bg-blue-100 text-blue-700'
          : 'text-gray-600 hover:bg-gray-100'
      }`}
    >
      <svg className="w-4 h-4 mr-1" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M4 6H20M4 12H20M4 18H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      </svg>
      列表視圖
    </button>
    <button
      onClick={() => onChange('map')}
      disabled={isTransitioning || viewMode === 'map'}
      className={`px-3 py-1.5 rounded text-sm font-medium transition-colors duration-200 flex items-center ${
        viewMode === 'map'
          ? 'bg-blue-100 text-blue-700'
          : 'text-gray-600 hover:bg-gray-100'
      }`}
    >
      <svg className="w-4 h-4 mr-1" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M9 20L3 17V5L9 8M9 20V8M9 20L15 17M15 17L21 20V8L15 5M15 17V5M9 8L15 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
      地圖視圖
    </button>
  </div>
);

const OpportunityList: React.FC = () => {
  const router = useRouter();
  const [isTransitioning, setIsTransitioning] = useState(false);

  // 從 store 獲取狀態
  const viewMode = useOpportunityStore((state: any) => state.viewMode);
  const setViewMode = useOpportunityStore((state: any) => state.setViewMode);
  const filters = useOpportunityStore((state: any) => state.searchFilters);
  const setSearchFilters = useOpportunityStore((state: any) => state.setSearchFilters);
  const isSearching = useOpportunityStore((state: any) => state.isSearching);
  const setIsSearching = useOpportunityStore((state: any) => state.setIsSearching);

  // 使用搜尋 hook
  const {
    data: searchData,
    isLoading,
    error
  } = useOpportunitySearch(filters);

  // 使用無限加載 hook（用於列表視圖）
  const {
    data: infiniteData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage
  } = useInfiniteOpportunitySearch({
    search: filters.search,
    type: filters.type,
    region: filters.region,
    city: filters.city,
    duration: filters.availableMonths?.join(','),
    sort: filters.sort as 'newest' | 'oldest',
    limit: filters.limit
  });

  // 使用地圖數據 hook
  const {
    data: mapData,
    isLoading: isLoadingMap,
  } = useMapOpportunities({
    type: filters.type,
    region: filters.region,
    city: filters.city
  });

  // 處理視圖切換
  const handleViewModeChange = useCallback((mode: 'list' | 'map') => {
    if (viewMode === mode) return;
    setIsTransitioning(true);

    // 延遲切換以允許動畫效果
    setTimeout(() => {
      setViewMode(mode);
      setIsTransitioning(false);

      // 更新 URL 參數
      const query = { ...router.query, view: mode };
      router.push({ pathname: router.pathname, query }, undefined, { shallow: true });
    }, VIEW_TRANSITION_DELAY);
  }, [viewMode, setViewMode, router]);

  // 初始同步 URL 參數
  useEffect(() => {
    // 從 URL 設置視圖模式
    if (router.query.view && (router.query.view === 'list' || router.query.view === 'map')) {
      setViewMode(router.query.view);
    }
  }, [router.query.view, setViewMode]);

  // 獲取當前顯示的機會列表
  const opportunities = infiniteData?.pages.flatMap(page => page.opportunities) || [];

  // 處理加載更多
  const handleLoadMore = () => {
    if (!isFetchingNextPage) {
      fetchNextPage();
    }
  };

  // 渲染機會列表
  const renderOpportunityList = () => {
    if (isLoading || isSearching) {
      return <LoadingSpinner message="載入機會中..." />;
    }

    if (error) {
      return <ErrorMessage message="載入機會時發生錯誤" error={error} />;
    }

    if (!opportunities.length) {
      return (
        <div className="text-center py-12">
          <p className="text-xl text-gray-500">沒有找到符合條件的機會</p>
          <button
            onClick={() => setSearchFilters({ search: '', type: '', region: '', city: '', availableMonths: [] })}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            清除篩選條件
          </button>
        </div>
      );
    }

    return (
      <>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {opportunities.map(opportunity => (
            <OpportunityCard key={opportunity._id} opportunity={opportunity} />
          ))}
        </div>

        {hasNextPage && (
          <div className="mt-8 text-center">
            <button
              onClick={handleLoadMore}
              disabled={isFetchingNextPage}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-blue-300"
            >
              {isFetchingNextPage ? '載入中...' : '載入更多'}
            </button>
          </div>
        )}
      </>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* 頂部工具列 */}
      <div className="mb-8 space-y-4">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
          <SearchSection
            initialValue={filters.search || ''}
            onSearch={(term) => {
              setIsSearching(true);
              setSearchFilters({ search: term, page: 1 });
              setTimeout(() => setIsSearching(false), 500);
            }}
            isSearching={isSearching}
          />
          <ViewToggle
            viewMode={viewMode}
            onChange={handleViewModeChange}
            isTransitioning={isTransitioning}
          />
        </div>

        <FilterSection />
      </div>

      {/* 搜索結果數量顯示 */}
      {!isLoading && !error && searchData && (
        <div className="mb-6">
          <p className="text-gray-600">
            找到 <span className="font-semibold">{searchData.total}</span> 個符合條件的機會
          </p>
        </div>
      )}

      {/* 主內容區域 */}
      <div className={`transition-opacity duration-300 ${isTransitioning ? 'opacity-0' : 'opacity-100'}`}>
        {viewMode === 'list' ? (
          renderOpportunityList()
        ) : (
          <div className="h-[700px] rounded-lg overflow-hidden">
            <MapComponent
              filters={{
                type: filters.type,
                region: filters.region,
                city: filters.city
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default OpportunityList;