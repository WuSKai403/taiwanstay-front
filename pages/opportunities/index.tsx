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

  // 獲取機會列表
  const fetchOpportunities = async () => {
    setLoading(true);
    try {
      // 構建查詢參數
      const params = new URLSearchParams();

      // 添加分頁參數
      params.append('page', pagination.currentPage.toString());
      params.append('limit', '10');

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

      // 標記初始載入完成
      setInitialLoadComplete(true);
    } catch (err) {
      setError((err as Error).message);
      console.error('獲取機會列表錯誤:', err);
      setInitialLoadComplete(true); // 即使出錯也標記為完成
    } finally {
      setLoading(false);
    }
  };

  // 當依賴項變化時獲取數據
  useEffect(() => {
    if (router.isReady) {
      fetchOpportunities();
    }
  }, [pagination.currentPage, searchTerm, filters, sortOption, router.isReady]);

  // 處理搜尋
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();

    // 重置頁碼
    setPagination(prev => ({ ...prev, currentPage: 1 }));

    // 更新URL查詢參數
    const query = { ...router.query, search: searchTerm, page: '1' };
    router.push({
      pathname: router.pathname,
      query
    }, undefined, { shallow: true });
  };

  // 處理篩選
  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;

    // 更新篩選條件
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));

    // 重置頁碼
    setPagination(prev => ({ ...prev, currentPage: 1 }));

    // 更新URL查詢參數
    const query = { ...router.query, [name]: value, page: '1' };
    router.push({
      pathname: router.pathname,
      query
    }, undefined, { shallow: true });
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

  // 處理視圖模式切換
  const handleViewModeChange = (mode: 'list' | 'map') => {
    setViewMode(mode);
  };

  // 將機會數據轉換為地圖標記
  const opportunityMarkers = opportunities
    .filter(opp => opp.location?.coordinates)
    .map(opp => ({
      id: opp.id,
      position: [
        opp.location!.coordinates![1],
        opp.location!.coordinates![0]
      ] as [number, number],
      title: opp.title,
      popupContent: (
        `<div class="text-center">
          <h3 class="font-semibold">${opp.title}</h3>
          <p class="text-sm text-gray-600">${opp.location?.city || ''}</p>
          <a href="/opportunities/${opp.slug}" class="text-primary-600 hover:underline text-sm">查看詳情</a>
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
                  <div className="h-[600px]">
                    <MapComponent
                      position={mapCenter}
                      markers={opportunityMarkers}
                      zoom={8}
                      height="600px"
                      enableClustering={true}
                      onMarkerClick={(id) => {
                        const opportunity = opportunities.find(opp => opp.id === id);
                        if (opportunity) {
                          router.push(`/opportunities/${opportunity.slug}`);
                        }
                      }}
                    />
                  </div>
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