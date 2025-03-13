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
  loading: () => <div className="h-96 bg-gray-200 flex items-center justify-center">地圖載入中...</div>
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
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    hasNextPage: false,
    hasPrevPage: false
  });
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
    } catch (err) {
      setError((err as Error).message);
      console.error('獲取機會列表錯誤:', err);
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
                  工作類型
                </label>
                <select
                  id="type"
                  name="type"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                  value={filters.type}
                  onChange={handleFilterChange}
                >
                  <option value="">所有類型</option>
                  {Object.values(OpportunityType).map((type) => (
                    <option key={type} value={type}>
                      {typeNameMap[type]}
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
                  <option value="台北市">台北市</option>
                  <option value="新北市">新北市</option>
                  <option value="桃園市">桃園市</option>
                  <option value="台中市">台中市</option>
                  <option value="台南市">台南市</option>
                  <option value="高雄市">高雄市</option>
                  <option value="宜蘭縣">宜蘭縣</option>
                  <option value="花蓮縣">花蓮縣</option>
                  <option value="台東縣">台東縣</option>
                  <option value="屏東縣">屏東縣</option>
                  <option value="南投縣">南投縣</option>
                  <option value="雲林縣">雲林縣</option>
                  <option value="嘉義縣">嘉義縣</option>
                  <option value="嘉義市">嘉義市</option>
                  <option value="新竹縣">新竹縣</option>
                  <option value="新竹市">新竹市</option>
                  <option value="苗栗縣">苗栗縣</option>
                  <option value="彰化縣">彰化縣</option>
                  <option value="澎湖縣">澎湖縣</option>
                  <option value="金門縣">金門縣</option>
                  <option value="連江縣">連江縣</option>
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

          {/* 機會列表 */}
          <div className="bg-white shadow-sm rounded-lg p-4">
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <p className="text-red-500">{error}</p>
                <button
                  onClick={fetchOpportunities}
                  className="mt-4 bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 transition-colors"
                >
                  重試
                </button>
              </div>
            ) : opportunities.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500">沒有找到符合條件的工作機會</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {opportunities.map((opportunity: Opportunity) => (
                  <Link
                    href={`/opportunities/${opportunity.slug}`}
                    key={opportunity.id}
                    className="block bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow"
                  >
                    <div className="relative h-48 bg-gray-200">
                      {opportunity.media && opportunity.media.images && opportunity.media.images[0] ? (
                        <Image
                          src={opportunity.media.images[0].url}
                          alt={opportunity.title}
                          layout="fill"
                          objectFit="cover"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                          <span className="text-gray-400">無圖片</span>
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <div className="flex items-center mb-2">
                        <span className={`text-xs font-medium px-2.5 py-0.5 rounded ${typeColorMap[opportunity.type as OpportunityType] || 'bg-gray-100 text-gray-800'}`}>
                          {typeNameMap[opportunity.type as OpportunityType] || '其他'}
                        </span>
                        <span className="ml-2 text-xs text-gray-500">
                          {opportunity.location?.city || opportunity.location?.region || '地點未指定'}
                        </span>
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">{opportunity.title}</h3>
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">{opportunity.shortDescription}</p>
                      <div className="flex items-center text-sm text-gray-500">
                        <span>主辦方: {opportunity.host?.name || '未指定'}</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}

            {/* 分頁控制 */}
            {!loading && !error && opportunities.length > 0 && (
              <div className="flex justify-center mt-8">
                <nav className="flex items-center">
                  <button
                    onClick={() => handlePageChange(pagination.currentPage - 1)}
                    disabled={!pagination.hasPrevPage}
                    className={`px-3 py-1 rounded-md mr-2 ${
                      pagination.hasPrevPage
                        ? 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                        : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    上一頁
                  </button>

                  <span className="text-gray-700">
                    第 {pagination.currentPage} 頁，共 {pagination.totalPages} 頁
                  </span>

                  <button
                    onClick={() => handlePageChange(pagination.currentPage + 1)}
                    disabled={!pagination.hasNextPage}
                    className={`px-3 py-1 rounded-md ml-2 ${
                      pagination.hasNextPage
                        ? 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                        : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    下一頁
                  </button>
                </nav>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default OpportunitiesPage;