import { useState, useEffect } from 'react';
import { NextPage } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/router';
import { OpportunityType } from '../../models/enums/OpportunityType';
import Head from 'next/head';
import dynamic from 'next/dynamic';
import Layout from '../../components/layout/Layout';

// 機會類型標籤顏色映射
const typeColorMap = {
  [OpportunityType.FARMING]: 'bg-green-100 text-green-800',
  [OpportunityType.GARDENING]: 'bg-green-100 text-green-800',
  [OpportunityType.ANIMAL_CARE]: 'bg-yellow-100 text-yellow-800',
  [OpportunityType.CONSTRUCTION]: 'bg-orange-100 text-orange-800',
  [OpportunityType.HOSPITALITY]: 'bg-yellow-100 text-yellow-800',
  [OpportunityType.COOKING]: 'bg-red-100 text-red-800',
  [OpportunityType.CLEANING]: 'bg-blue-100 text-blue-800',
  [OpportunityType.CHILDCARE]: 'bg-pink-100 text-pink-800',
  [OpportunityType.ELDERLY_CARE]: 'bg-purple-100 text-purple-800',
  [OpportunityType.TEACHING]: 'bg-red-100 text-red-800',
  [OpportunityType.LANGUAGE_EXCHANGE]: 'bg-purple-100 text-purple-800',
  [OpportunityType.CREATIVE]: 'bg-indigo-100 text-indigo-800',
  [OpportunityType.DIGITAL_NOMAD]: 'bg-blue-100 text-blue-800',
  [OpportunityType.ADMINISTRATION]: 'bg-gray-100 text-gray-800',
  [OpportunityType.MAINTENANCE]: 'bg-gray-100 text-gray-800',
  [OpportunityType.TOURISM]: 'bg-blue-100 text-blue-800',
  [OpportunityType.CONSERVATION]: 'bg-blue-100 text-blue-800',
  [OpportunityType.COMMUNITY]: 'bg-indigo-100 text-indigo-800',
  [OpportunityType.EVENT]: 'bg-purple-100 text-purple-800',
  [OpportunityType.OTHER]: 'bg-gray-100 text-gray-800'
};

// 機會類型中文名稱映射
const typeNameMap = {
  [OpportunityType.FARMING]: '農場體驗',
  [OpportunityType.GARDENING]: '園藝工作',
  [OpportunityType.ANIMAL_CARE]: '動物照顧',
  [OpportunityType.CONSTRUCTION]: '建築工作',
  [OpportunityType.HOSPITALITY]: '接待服務',
  [OpportunityType.COOKING]: '烹飪工作',
  [OpportunityType.CLEANING]: '清潔工作',
  [OpportunityType.CHILDCARE]: '兒童照顧',
  [OpportunityType.ELDERLY_CARE]: '老人照顧',
  [OpportunityType.TEACHING]: '教學工作',
  [OpportunityType.LANGUAGE_EXCHANGE]: '語言交流',
  [OpportunityType.CREATIVE]: '創意工作',
  [OpportunityType.DIGITAL_NOMAD]: '數位遊牧',
  [OpportunityType.ADMINISTRATION]: '行政工作',
  [OpportunityType.MAINTENANCE]: '維修工作',
  [OpportunityType.TOURISM]: '旅遊工作',
  [OpportunityType.CONSERVATION]: '保育工作',
  [OpportunityType.COMMUNITY]: '社區工作',
  [OpportunityType.EVENT]: '活動工作',
  [OpportunityType.OTHER]: '其他機會'
};

// 動態導入地圖組件，避免 SSR 問題
const MapComponent = dynamic(() => import('../../components/MapComponent'), {
  ssr: false,
  loading: () => <div className="h-[600px] bg-gray-200 flex items-center justify-center">地圖載入中...</div>
});

// 定義機會類型接口
interface Opportunity {
  id: string;
  title: string;
  slug: string;
  shortDescription?: string;
  type: OpportunityType;
  status: string;
  location?: {
    city?: string;
    region?: string;
    coordinates?: [number, number];
  };
  media?: {
    images?: Array<{
      url: string;
      alt?: string;
    }>;
  };
  host?: {
    id?: string;
    name?: string;
    description?: string;
  };
  createdAt?: string;
  updatedAt?: string;
}

const OpportunitiesPage: NextPage = () => {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    type: '',
    location: '',
    duration: '',
    accommodation: ''
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOption, setSortOption] = useState('newest'); // 排序選項
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list'); // 視圖模式：列表或地圖
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    hasNextPage: false,
    hasPrevPage: false
  });
  const [initialLoadComplete, setInitialLoadComplete] = useState(false); // 追蹤初始載入是否完成
  const router = useRouter();

  // 從URL查詢參數中獲取初始值
  useEffect(() => {
    const { query } = router;

    // 設置初始搜索詞
    if (query.search) {
      setSearchTerm(query.search as string);
    }

    // 設置初始篩選條件
    const initialFilters = { ...filters };
    if (query.type) initialFilters.type = query.type as string;
    if (query.location) initialFilters.location = query.location as string;
    if (query.duration) initialFilters.duration = query.duration as string;
    if (query.accommodation) initialFilters.accommodation = query.accommodation as string;
    setFilters(initialFilters);

    // 設置初始排序選項
    if (query.sort) {
      setSortOption(query.sort as string);
    }

    // 設置初始頁碼
    const page = query.page ? parseInt(query.page as string) : 1;
    setPagination(prev => ({ ...prev, currentPage: page }));
  }, [router.isReady]);

  // 重構資料獲取邏輯，創建一個通用的函數來處理不同視圖的資料獲取
  const fetchOpportunitiesData = async (viewType: 'list' | 'map', currentPage: number = 1) => {
    setLoading(true);
    setError('');

    try {
      // 構建查詢參數
      const params = new URLSearchParams();

      // 根據視圖類型設置分頁參數
      if (viewType === 'list') {
        params.append('page', currentPage.toString());
        params.append('limit', '10');
      } else {
        // 地圖視圖模式下獲取所有機會
        params.append('page', '1');
        params.append('limit', '1000'); // 增加限制以確保獲取所有機會
        console.log('地圖視圖模式：獲取所有機會數據');
      }

      // 添加搜索參數
      if (searchTerm) {
        params.append('search', searchTerm);
      }

      // 添加篩選參數
      if (filters.type) params.append('type', filters.type);
      if (filters.location) params.append('location', filters.location);
      if (filters.duration) params.append('duration', filters.duration);
      if (filters.accommodation) params.append('accommodation', filters.accommodation);

      // 添加排序參數
      if (sortOption === 'newest') {
        params.append('sort', 'createdAt');
        params.append('order', 'desc');
      } else if (sortOption === 'oldest') {
        params.append('sort', 'createdAt');
        params.append('order', 'asc');
      } else if (sortOption === 'popular') {
        params.append('sort', 'stats.views');
        params.append('order', 'desc');
      }

      // 發送請求
      const response = await fetch(`/api/opportunities?${params.toString()}`);

      if (!response.ok) {
        throw new Error('獲取機會列表失敗');
      }

      const data = await response.json();

      // 更新狀態
      setOpportunities(data.opportunities);
      setPagination({
        currentPage: data.pagination.currentPage,
        totalPages: data.pagination.totalPages,
        totalItems: data.pagination.totalItems,
        hasNextPage: data.pagination.hasNextPage,
        hasPrevPage: data.pagination.hasPrevPage
      });

      // 標記初始載入完成 - 無論是否有資料都標記為完成
      setInitialLoadComplete(true);

      return data;
    } catch (err) {
      setError((err as Error).message);
      console.error('獲取機會列表錯誤:', err);
      // 即使出錯也標記為完成
      setInitialLoadComplete(true);
      // 確保在出錯時清空機會列表，避免顯示舊數據
      setOpportunities([]);

      return null;
    } finally {
      setLoading(false);
    }
  };

  // 更新篩選條件的通用函數
  const updateFilters = (newFilters: Partial<typeof filters>, newSearchTerm?: string) => {
    console.log('更新篩選條件:', newFilters, '搜尋詞:', newSearchTerm);

    // 創建新的篩選條件對象
    const updatedFilters = newFilters ? { ...filters, ...newFilters } : filters;

    // 創建新的搜尋詞
    const updatedSearchTerm = newSearchTerm !== undefined ? newSearchTerm : searchTerm;

    // 構建查詢參數
    const query: Record<string, string> = { ...router.query as Record<string, string> };

    // 更新篩選條件參數
    Object.entries(newFilters || {}).forEach(([key, value]) => {
      if (value) {
        query[key] = value;
      } else if (query[key]) {
        delete query[key];
      }
    });

    // 更新搜尋詞參數
    if (newSearchTerm !== undefined) {
      if (newSearchTerm) {
        query.search = newSearchTerm;
      } else if (query.search) {
        delete query.search;
      }
    }

    // 更新 URL (不觸發數據獲取，由 useEffect 處理)
    router.push({
      pathname: router.pathname,
      query
    }, undefined, { shallow: true });

    // 更新狀態
    setFilters(updatedFilters);
    if (newSearchTerm !== undefined) {
      setSearchTerm(updatedSearchTerm);
    }

    // 設置載入狀態
    setLoading(true);
    setInitialLoadComplete(false);
  };

  // 簡化後的 fetchOpportunities 函數
  const fetchOpportunities = () => {
    console.log('獲取機會數據，當前視圖:', viewMode, '篩選條件:', filters, '搜尋詞:', searchTerm);
    return fetchOpportunitiesData(viewMode, pagination.currentPage);
  };

  // 當依賴項變化時獲取數據 - 修改為同時處理列表和地圖視圖
  useEffect(() => {
    if (router.isReady) {
      console.log('依賴項變化，獲取數據，當前視圖:', viewMode);
      // 只有在非視圖切換導致的狀態變化時才獲取數據
      // 視圖切換時的數據獲取已經在 handleViewModeChange 中處理
      fetchOpportunitiesData(viewMode, pagination.currentPage);
    }
  }, [pagination.currentPage, searchTerm, filters, sortOption, router.isReady]);

  // 處理搜尋
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    updateFilters({}, searchTerm);
  };

  // 處理篩選
  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    updateFilters({ [name]: value });
  };

  // 處理排序
  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;

    // 更新排序選項
    setSortOption(value);

    // 更新URL查詢參數
    const query = { ...router.query, sort: value };
    router.push({
      pathname: router.pathname,
      query
    }, undefined, { shallow: true });
  };

  // 處理頁碼變化
  const handlePageChange = (newPage: number) => {
    // 更新頁碼
    setPagination(prev => ({ ...prev, currentPage: newPage }));

    // 更新URL查詢參數
    const query = { ...router.query, page: newPage.toString() };
    router.push({
      pathname: router.pathname,
      query
    }, undefined, { shallow: true });
  };

  // 處理視圖模式切換 - 簡化邏輯，不再在這裡獲取數據
  const handleViewModeChange = (mode: 'list' | 'map') => {
    console.log('切換視圖模式:', mode);

    // 如果當前視圖與目標視圖不同，則需要重新獲取數據
    if (mode !== viewMode) {
      // 設置載入狀態
      setLoading(true);
      setInitialLoadComplete(false);

      // 直接設置視圖模式
      setViewMode(mode);

      // 如果切換到地圖視圖，重置分頁到第一頁並立即獲取所有數據
      if (mode === 'map') {
        // 重置分頁到第一頁
        setPagination(prev => ({ ...prev, currentPage: 1 }));

        // 立即獲取地圖視圖的所有數據
        fetchOpportunitiesData('map', 1);
      } else if (mode === 'list') {
        // 切換到列表視圖時，獲取當前頁的數據
        fetchOpportunitiesData('list', pagination.currentPage);
      }
    }
  };

  // 清除所有篩選的函數
  const clearAllFilters = () => {
    console.log('清除所有篩選');

    // 更新篩選條件和搜尋詞
    updateFilters({
      type: '',
      location: '',
      duration: '',
      accommodation: ''
    }, '');
  };

  // 將機會數據轉換為地圖標記
  const opportunityMarkers = opportunities
    .filter(opp => opp.location?.coordinates)
    .map(opp => ({
      id: opp.id,
      slug: opp.slug,
      position: [
        opp.location!.coordinates![1],
        opp.location!.coordinates![0]
      ] as [number, number],
      title: opp.title,
      type: opp.type,
      popupContent: (
        `<div class="p-4">
          <h3 class="font-semibold text-base mb-2">${opp.title}</h3>
          ${opp.location?.city ? `<p class="text-sm text-gray-600 mb-2">${opp.location.city}</p>` : ''}
          ${opp.shortDescription ?
            `<p class="text-sm text-gray-600 mb-3">${opp.shortDescription.substring(0, 100)}${opp.shortDescription.length > 100 ? '...' : ''}</p>`
            : ''}
          <div class="flex justify-center">
            <a href="/opportunities/${opp.slug}" class="inline-block border border-primary-600 text-primary-600 text-xs px-4 py-1.5 rounded hover:bg-gray-50 hover:text-primary-700 hover:border-primary-700 transition-colors">
              查看詳情
            </a>
          </div>
        </div>`
      )
    }));

  // 計算地圖中心點（所有機會的平均位置）
  const mapCenter = opportunityMarkers.length > 0
    ? [
        opportunityMarkers.reduce((sum, marker) => sum + marker.position[0], 0) / opportunityMarkers.length,
        opportunityMarkers.reduce((sum, marker) => sum + marker.position[1], 0) / opportunityMarkers.length
      ] as [number, number]
    : [23.6978, 120.9605] as [number, number]; // 台灣中心點

  return (
    <Layout title="探索工作機會 - TaiwanStay" description="探索台灣各地的工作換宿機會，體驗不同的生活方式">
      <div className="bg-gray-50 min-h-screen">
        {/* 頁面標題 */}
        <div className="bg-primary-600 py-12 px-4 sm:px-6 lg:px-8 text-white">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-3xl font-bold">探索工作機會</h1>
            <p className="mt-2 text-lg">發現台灣各地的工作換宿機會，體驗不同的生活方式</p>
          </div>
        </div>

        {/* 搜尋和篩選區 */}
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="bg-white shadow-sm rounded-lg p-4 mb-6">
            <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
              <div className="flex-grow">
                <input
                  type="text"
                  placeholder="搜尋工作機會..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <button
                type="submit"
                className="bg-primary-600 text-white px-6 py-2 rounded-md hover:bg-primary-700 transition-colors"
              >
                搜尋
              </button>
            </form>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
              <div>
                <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">
                  機會類型
                </label>
                <select
                  id="type"
                  name="type"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                  value={filters.type}
                  onChange={handleFilterChange}
                >
                  <option value="">所有類型</option>
                  {Object.entries(typeNameMap).map(([type, name]) => (
                    <option key={type} value={type}>
                      {name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
                  地點
                </label>
                <select
                  id="location"
                  name="location"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                  value={filters.location}
                  onChange={handleFilterChange}
                >
                  <option value="">所有地點</option>
                  <option value="north">北部</option>
                  <option value="central">中部</option>
                  <option value="south">南部</option>
                  <option value="east">東部</option>
                  <option value="islands">離島</option>
                </select>
              </div>

              <div>
                <label htmlFor="duration" className="block text-sm font-medium text-gray-700 mb-1">
                  時間長度
                </label>
                <select
                  id="duration"
                  name="duration"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                  value={filters.duration}
                  onChange={handleFilterChange}
                >
                  <option value="">所有時間</option>
                  <option value="short">短期 (1-4週)</option>
                  <option value="medium">中期 (1-3個月)</option>
                  <option value="long">長期 (3個月以上)</option>
                </select>
              </div>

              <div>
                <label htmlFor="sort" className="block text-sm font-medium text-gray-700 mb-1">
                  排序方式
                </label>
                <select
                  id="sort"
                  name="sort"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                  value={sortOption}
                  onChange={handleSortChange}
                >
                  <option value="newest">最新發布</option>
                  <option value="oldest">最早發布</option>
                  <option value="popular">最受歡迎</option>
                </select>
              </div>
            </div>
          </div>

          {/* 視圖切換按鈕 */}
          <div className="flex justify-between items-center mb-6">
            <div className="text-gray-700">
              {!initialLoadComplete || loading ? (
                <span className="inline-flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-primary-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  載入中...
                </span>
              ) : (
                <>共找到 <span className="font-semibold">{pagination.totalItems}</span> 個機會</>
              )}
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => handleViewModeChange('list')}
                className={`px-4 py-2 rounded-md ${
                  viewMode === 'list'
                    ? 'bg-primary-600 text-white'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 inline-block mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
                列表視圖
              </button>
              <button
                onClick={() => handleViewModeChange('map')}
                className={`px-4 py-2 rounded-md ${
                  viewMode === 'map'
                    ? 'bg-primary-600 text-white'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 inline-block mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
                地圖視圖
              </button>
            </div>
          </div>

          {/* 內容區域 - 根據視圖模式顯示不同內容 */}
          {!initialLoadComplete || loading ? (
            <div className="flex flex-col justify-center items-center py-12 bg-white rounded-lg shadow-sm">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500 mb-4"></div>
              <p className="text-gray-600">正在載入機會資料...</p>
            </div>
          ) : error ? (
            <div className="bg-red-50 p-4 rounded-md text-red-800">
              <p>{error}</p>
            </div>
          ) : (
            <>
              {/* 列表視圖 */}
              {viewMode === 'list' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {opportunities.map((opportunity) => (
                    <Link key={opportunity.id} href={`/opportunities/${opportunity.slug}`}>
                      <div className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                        <div className="relative h-48">
                          {opportunity.media?.images && opportunity.media.images.length > 0 ? (
                            <Image
                              src={opportunity.media.images[0].url}
                              alt={opportunity.media.images[0].alt || opportunity.title}
                              fill
                              style={{ objectFit: 'cover' }}
                            />
                          ) : (
                            <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                              <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                              </svg>
                            </div>
                          )}
                          <div className="absolute top-2 left-2">
                            <span className={`inline-block px-2 py-1 text-xs font-semibold rounded-md ${typeColorMap[opportunity.type]}`}>
                              {typeNameMap[opportunity.type]}
                            </span>
                          </div>
                        </div>
                        <div className="p-4">
                          <h3 className="text-lg font-semibold text-gray-900 mb-1">{opportunity.title}</h3>
                          {opportunity.shortDescription && (
                            <p className="text-gray-600 text-sm mb-3 line-clamp-2">{opportunity.shortDescription}</p>
                          )}
                          <div className="flex items-center text-gray-500 text-sm">
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
                            </svg>
                            <span>{opportunity.location?.city || '地點未指定'}</span>
                          </div>
                          {opportunity.host && (
                            <div className="flex items-center text-gray-500 text-sm mt-1">
                              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                              </svg>
                              <span>{opportunity.host.name}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}

              {/* 地圖視圖 */}
              {viewMode === 'map' && (
                <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                  {/* 添加當前篩選條件提示 */}
                  {(filters.type || filters.location || filters.duration || filters.accommodation || searchTerm) && (
                    <div className="p-3 bg-blue-50 border-b border-blue-100">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-medium text-blue-700">當前篩選:</span>
                        {searchTerm && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            搜尋: {searchTerm}
                          </span>
                        )}
                        {filters.type && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            類型: {typeNameMap[filters.type as keyof typeof typeNameMap]}
                          </span>
                        )}
                        {filters.location && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            地區: {
                            filters.location === 'north' ? '北部' :
                            filters.location === 'central' ? '中部' :
                            filters.location === 'south' ? '南部' :
                            filters.location === 'east' ? '東部' :
                            filters.location === 'islands' ? '離島' : filters.location
                          }
                          </span>
                        )}
                        {filters.duration && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                            時間: {
                            filters.duration === 'short' ? '短期 (1-4週)' :
                            filters.duration === 'medium' ? '中期 (1-3個月)' :
                            filters.duration === 'long' ? '長期 (3個月以上)' : filters.duration
                          }
                          </span>
                        )}
                        {filters.accommodation && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            住宿: {
                            filters.accommodation === 'provided' ? '提供住宿' :
                            filters.accommodation === 'not_provided' ? '不提供住宿' : filters.accommodation
                          }
                          </span>
                        )}
                        <button
                          onClick={clearAllFilters}
                          className="ml-auto text-xs text-blue-600 hover:text-blue-800 font-medium"
                        >
                          清除所有篩選
                        </button>
                      </div>
                    </div>
                  )}

                  {/* 顯示地圖上的機會數量 */}
                  <div className="p-2 bg-gray-50 border-b border-gray-100 text-sm text-gray-600">
                    地圖上顯示 <span className="font-semibold">{opportunityMarkers.length}</span> 個機會位置
                    {opportunityMarkers.length < opportunities.length && (
                      <span className="ml-1 text-yellow-600">
                        （部分機會因缺少位置資訊而未顯示）
                      </span>
                    )}
                  </div>

                  {/* 當沒有結果時顯示提示訊息 */}
                  {opportunityMarkers.length === 0 && !loading && initialLoadComplete && (
                    <div className="p-4 bg-yellow-50 border-b border-yellow-100">
                      <div className="flex items-center">
                        <svg className="h-5 w-5 text-yellow-400 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        <span className="text-sm font-medium text-yellow-700">
                          沒有找到符合條件的機會。請嘗試調整篩選條件或清除篩選。
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="h-[600px] relative">
                    {/* 只有在資料完全載入後才顯示地圖 */}
                    <MapComponent
                      position={mapCenter}
                      markers={opportunityMarkers}
                      zoom={7}
                      height="600px"
                      enableClustering={true}
                      showZoomControl={true}
                      showLocationControl={false}
                      dataFullyLoaded={!loading && initialLoadComplete}
                      onMarkerClick={(id) => {
                        // 點擊標記時不做任何跳轉，只顯示彈窗
                        // 用戶需要點擊彈窗中的"查看詳情"按鈕才會跳轉
                        console.log('標記點擊:', id);
                      }}
                    />
                  </div>

                  {/* 地圖說明 - 只有在有標記時顯示 */}
                  {opportunityMarkers.length > 0 && (
                    <div className="p-4 border-t border-gray-200">
                      <h3 className="text-lg font-semibold mb-2">地圖說明</h3>
                      <p className="text-sm text-gray-600 mb-2">
                        地圖上的標記代表各種工作機會的位置。數字表示該位置有多少個機會。
                      </p>
                      <div className="flex items-center mt-2">
                        <div className="w-6 h-6 mr-2 relative">
                          <div style={{
                            width: '24px',
                            height: '24px',
                            backgroundColor: '#FFFFFF',
                            borderRadius: '50%',
                            boxShadow: '0 2px 5px rgba(0,0,0,0.3)',
                            border: '2px solid #2563EB'
                          }}></div>
                        </div>
                        <span className="text-sm text-gray-700">單一機會</span>
                      </div>
                      <div className="flex items-center mt-2">
                        <div className="w-6 h-6 mr-2 relative">
                          <div style={{
                            width: '24px',
                            height: '24px',
                            backgroundColor: '#FFFFFF',
                            borderRadius: '50%',
                            boxShadow: '0 2px 5px rgba(0,0,0,0.3)',
                            border: '2px solid #2563EB',
                            position: 'relative'
                          }}>
                            <div style={{
                              position: 'absolute',
                              top: '-6px',
                              right: '-6px',
                              backgroundColor: '#2563EB',
                              color: 'white',
                              borderRadius: '50%',
                              width: '18px',
                              height: '18px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '11px',
                              fontWeight: 'bold',
                              border: '1.5px solid white'
                            }}>3</div>
                          </div>
                        </div>
                        <span className="text-sm text-gray-700">多個機會</span>
                      </div>
                    </div>
                  )}

                  {/* 當沒有結果時顯示建議 */}
                  {opportunityMarkers.length === 0 && !loading && initialLoadComplete && (
                    <div className="p-4 border-t border-gray-200">
                      <h3 className="text-lg font-semibold mb-2">找不到符合條件的機會</h3>
                      <p className="text-sm text-gray-600 mb-4">
                        目前沒有符合您篩選條件的工作機會。以下是一些建議：
                      </p>
                      <ul className="list-disc pl-5 text-sm text-gray-600 space-y-2">
                        <li>嘗試減少篩選條件的數量</li>
                        <li>使用更廣泛的搜尋詞</li>
                        <li>選擇不同的地區或機會類型</li>
                        <li>清除所有篩選條件，查看所有可用機會</li>
                      </ul>
                      <button
                        onClick={clearAllFilters}
                        className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                      >
                        清除所有篩選
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* 分頁 */}
              {pagination.totalPages > 1 && (
                <div className="flex justify-center mt-8">
                  <nav className="flex items-center space-x-2">
                    <button
                      onClick={() => handlePageChange(pagination.currentPage - 1)}
                      disabled={!pagination.hasPrevPage}
                      className={`px-3 py-1 rounded-md ${
                        pagination.hasPrevPage
                          ? 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                          : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      上一頁
                    </button>
                    {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((page) => (
                      <button
                        key={page}
                        onClick={() => handlePageChange(page)}
                        className={`px-3 py-1 rounded-md ${
                          page === pagination.currentPage
                            ? 'bg-primary-600 text-white'
                            : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                    <button
                      onClick={() => handlePageChange(pagination.currentPage + 1)}
                      disabled={!pagination.hasNextPage}
                      className={`px-3 py-1 rounded-md ${
                        pagination.hasNextPage
                          ? 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                          : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      下一頁
                    </button>
                  </nav>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default OpportunitiesPage;