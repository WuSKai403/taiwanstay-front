import { useState, useEffect } from 'react';
import { NextPage } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/router';
import { OpportunityType } from '../../models/enums/OpportunityType';
import Head from 'next/head';
import dynamic from 'next/dynamic';

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

// 假資料，之後會從 API 獲取
const MOCK_OPPORTUNITIES = [
  {
    id: '1',
    title: '有機農場志工',
    slug: 'organic-farm-volunteer',
    shortDescription: '在美麗的宜蘭有機農場體驗農耕生活，學習永續農業技術',
    type: OpportunityType.FARMING,
    location: {
      city: '宜蘭縣',
      district: '三星鄉'
    },
    media: {
      coverImage: '/images/mock/farm1.jpg'
    },
    details: {
      duration: '3-6個月',
      workHours: '每週25小時',
      accommodation: '提供住宿',
      meals: '提供三餐',
      requirements: ['基本體力', '喜愛戶外活動', '願意學習']
    },
    host: {
      name: '永續農業發展協會',
      slug: 'sustainable-agriculture-association',
      verified: true
    },
    stats: {
      views: 245,
      applications: 12,
      favorites: 35
    }
  },
  {
    id: '2',
    title: '山區民宿幫手',
    slug: 'mountain-hostel-helper',
    shortDescription: '在南投山區民宿協助接待客人、整理環境，體驗山居生活',
    type: OpportunityType.HOSPITALITY,
    location: {
      city: '南投縣',
      district: '信義鄉'
    },
    media: {
      coverImage: '/images/mock/hostel1.jpg'
    },
    details: {
      duration: '1-3個月',
      workHours: '每週20小時',
      accommodation: '提供住宿',
      meals: '提供早餐',
      requirements: ['服務熱忱', '基本英語溝通能力', '細心負責']
    },
    host: {
      name: '山區民宿',
      slug: 'mountain-hostel',
      verified: true
    },
    stats: {
      views: 189,
      applications: 8,
      favorites: 22
    }
  },
  {
    id: '3',
    title: '海邊咖啡廳工作',
    slug: 'beach-cafe-work',
    shortDescription: '在花蓮海邊咖啡廳協助製作飲品、接待客人，享受海景工作環境',
    type: OpportunityType.COOKING,
    location: {
      city: '花蓮縣',
      district: '豐濱鄉'
    },
    media: {
      coverImage: '/images/mock/cafe1.jpg'
    },
    details: {
      duration: '1-2個月',
      workHours: '每週30小時',
      accommodation: '提供住宿',
      meals: '提供三餐',
      requirements: ['咖啡製作經驗優先', '服務熱忱', '能獨立作業']
    },
    host: {
      name: '海邊咖啡',
      slug: 'beach-cafe',
      verified: false
    },
    stats: {
      views: 210,
      applications: 15,
      favorites: 28
    }
  }
];

// 動態導入地圖組件，避免 SSR 問題
const MapComponent = dynamic(() => import('../../components/MapComponent'), {
  ssr: false,
  loading: () => <div className="h-96 bg-gray-200 flex items-center justify-center">地圖載入中...</div>
});

const OpportunitiesPage: NextPage = () => {
  const [opportunities, setOpportunities] = useState(MOCK_OPPORTUNITIES);
  const [filters, setFilters] = useState({
    type: '',
    location: '',
    duration: '',
    accommodation: ''
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOption, setSortOption] = useState('newest'); // 排序選項
  const router = useRouter();

  // 處理搜尋
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // 實際應用中這裡會調用 API 進行搜尋
    console.log('搜尋:', searchTerm);
  };

  // 處理篩選
  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // 處理排序
  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setSortOption(value);
  };

  // 應用篩選器和排序
  useEffect(() => {
    // 實際應用中這裡會調用 API 進行篩選和排序
    console.log('篩選條件:', filters);
    console.log('排序方式:', sortOption);

    // 模擬排序功能
    let sortedOpportunities = [...MOCK_OPPORTUNITIES];

    switch (sortOption) {
      case 'newest':
        // 假設有創建日期，這裡只是示範
        // 實際應用中會根據創建日期排序
        break;
      case 'popular':
        // 根據瀏覽次數排序
        sortedOpportunities.sort((a, b) => b.stats.views - a.stats.views);
        break;
      case 'applications':
        // 根據申請人數排序
        sortedOpportunities.sort((a, b) => b.stats.applications - a.stats.applications);
        break;
      case 'favorites':
        // 根據收藏數排序
        sortedOpportunities.sort((a, b) => b.stats.favorites - a.stats.favorites);
        break;
      default:
        break;
    }

    setOpportunities(sortedOpportunities);
  }, [filters, sortOption]);

  return (
    <>
      <Head>
        <title>機會列表 | TaiwanStay</title>
        <meta name="description" content="瀏覽台灣各地的工作換宿機會" />
      </Head>

      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">探索機會</h1>

        {/* 搜尋與篩選區 */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-grow">
              <input
                type="text"
                placeholder="搜尋機會..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button
              type="submit"
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition duration-200"
            >
              搜尋
            </button>
          </form>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">機會類型</label>
              <select
                id="type"
                name="type"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={filters.type}
                onChange={handleFilterChange}
              >
                <option value="">所有類型</option>
                {Object.entries(typeNameMap).map(([key, value]) => (
                  <option key={key} value={key}>{value}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">地點</label>
              <select
                id="location"
                name="location"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={filters.location}
                onChange={handleFilterChange}
              >
                <option value="">所有地點</option>
                <option value="taipei">台北市</option>
                <option value="taichung">台中市</option>
                <option value="kaohsiung">高雄市</option>
                <option value="hualien">花蓮縣</option>
                <option value="taitung">台東縣</option>
                <option value="yilan">宜蘭縣</option>
              </select>
            </div>

            <div>
              <label htmlFor="duration" className="block text-sm font-medium text-gray-700 mb-1">時間長度</label>
              <select
                id="duration"
                name="duration"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={filters.duration}
                onChange={handleFilterChange}
              >
                <option value="">所有時間</option>
                <option value="short">短期 (1個月以下)</option>
                <option value="medium">中期 (1-3個月)</option>
                <option value="long">長期 (3個月以上)</option>
              </select>
            </div>

            <div>
              <label htmlFor="accommodation" className="block text-sm font-medium text-gray-700 mb-1">住宿與餐食</label>
              <select
                id="accommodation"
                name="accommodation"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={filters.accommodation}
                onChange={handleFilterChange}
              >
                <option value="">所有選項</option>
                <option value="accommodation">提供住宿</option>
                <option value="meals">提供餐食</option>
                <option value="both">提供住宿和餐食</option>
              </select>
            </div>

            <div>
              <label htmlFor="sort" className="block text-sm font-medium text-gray-700 mb-1">排序方式</label>
              <select
                id="sort"
                name="sort"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={sortOption}
                onChange={handleSortChange}
              >
                <option value="newest">最新發布</option>
                <option value="popular">熱門程度</option>
                <option value="applications">申請人數</option>
                <option value="favorites">收藏數量</option>
              </select>
            </div>
          </div>
        </div>

        {/* 結果統計與排序選項 */}
        <div className="flex justify-between items-center mb-6">
          <p className="text-gray-600">找到 {opportunities.length} 個符合條件的機會</p>
          <div className="flex items-center">
            <span className="text-gray-600 mr-2">排序：</span>
            <select
              className="px-3 py-1 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={sortOption}
              onChange={handleSortChange}
            >
              <option value="newest">最新發布</option>
              <option value="popular">熱門程度</option>
              <option value="applications">申請人數</option>
              <option value="favorites">收藏數量</option>
            </select>
          </div>
        </div>

        {/* 機會列表 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {opportunities.map((opportunity) => (
            <div key={opportunity.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition duration-200">
              <div className="relative h-48">
                {opportunity.media.coverImage && (
                  <Image
                    src={opportunity.media.coverImage}
                    alt={opportunity.title}
                    fill
                    style={{ objectFit: 'cover' }}
                  />
                )}
                <div className="absolute top-4 left-4">
                  <span className={`inline-block px-3 py-1 text-xs font-semibold rounded-full ${typeColorMap[opportunity.type]}`}>
                    {typeNameMap[opportunity.type]}
                  </span>
                </div>
                {opportunity.host.verified && (
                  <div className="absolute top-4 right-4">
                    <span className="inline-flex items-center px-2 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full">
                      <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                      </svg>
                      已認證主辦方
                    </span>
                  </div>
                )}
              </div>

              <div className="p-6">
                <h2 className="text-xl font-bold mb-2 hover:text-blue-600">
                  <Link href={`/opportunities/${opportunity.slug}`}>
                    {opportunity.title}
                  </Link>
                </h2>

                <p className="text-gray-600 mb-4 line-clamp-2">{opportunity.shortDescription}</p>

                <div className="flex items-center text-gray-500 mb-4">
                  <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
                  </svg>
                  <span>{opportunity.location.city} {opportunity.location.district}</span>
                </div>

                <div className="mb-4">
                  <div className="flex flex-wrap gap-2">
                    {opportunity.details.accommodation && (
                      <span className="inline-block px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-full">
                        {opportunity.details.accommodation}
                      </span>
                    )}
                    {opportunity.details.meals && (
                      <span className="inline-block px-2 py-1 bg-green-50 text-green-700 text-xs rounded-full">
                        {opportunity.details.meals}
                      </span>
                    )}
                    {opportunity.details.duration && (
                      <span className="inline-block px-2 py-1 bg-purple-50 text-purple-700 text-xs rounded-full">
                        {opportunity.details.duration}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap gap-y-2">
                  <div className="w-1/2 flex items-center text-gray-500">
                    <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    <span>{opportunity.details.workHours}</span>
                  </div>

                  <div className="w-1/2 flex items-center text-gray-500">
                    <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                    </svg>
                    <span>{opportunity.stats.views} 次瀏覽</span>
                  </div>

                  <div className="w-1/2 flex items-center text-gray-500">
                    <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                    </svg>
                    <span>{opportunity.stats.applications} 人申請</span>
                  </div>

                  <div className="w-1/2 flex items-center text-gray-500">
                    <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
                    </svg>
                    <span>主辦方: {opportunity.host.name}</span>
                  </div>
                </div>

                <div className="mt-6">
                  <Link href={`/opportunities/${opportunity.slug}`} className="block w-full text-center bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition duration-200">
                    查看詳情
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* 分頁 */}
        <div className="mt-8 flex justify-center">
          <nav className="inline-flex rounded-md shadow">
            <Link href="#" className="px-4 py-2 border border-gray-300 bg-white text-gray-700 rounded-l-md hover:bg-gray-50">
              上一頁
            </Link>
            <Link href="#" className="px-4 py-2 border-t border-b border-gray-300 bg-blue-50 text-blue-700">
              1
            </Link>
            <Link href="#" className="px-4 py-2 border-t border-b border-gray-300 bg-white text-gray-700 hover:bg-gray-50">
              2
            </Link>
            <Link href="#" className="px-4 py-2 border-t border-b border-gray-300 bg-white text-gray-700 hover:bg-gray-50">
              3
            </Link>
            <Link href="#" className="px-4 py-2 border border-gray-300 bg-white text-gray-700 rounded-r-md hover:bg-gray-50">
              下一頁
            </Link>
          </nav>
        </div>
      </div>
    </>
  );
};

export default OpportunitiesPage;