import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import { MapMarker } from '@/components/hooks/useMapMarkers';
import { SearchIcon, ListIcon, MapIcon } from '@/components/icons/Icons';

// 定義 API 返回的機會類型
interface ApiOpportunity {
  id: string;
  title: string;
  slug: string;
  shortDescription?: string;
  description?: string;
  type: string;
  status: string;
  location?: {
    city?: string;
    region?: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
  media?: {
    images?: Array<{
      url: string;
      alt?: string;
    }>;
  };
  workTimeSettings?: {
    minimumStay?: number;
    maximumStay?: number;
    workHoursPerDay?: number;
    workDaysPerWeek?: number;
  };
  createdAt?: string;
  updatedAt?: string;
}

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

interface OpportunityListProps {
  initialOpportunities: ApiOpportunity[];
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
  const [opportunities, setOpportunities] = useState<ApiOpportunity[]>(initialOpportunities);
  const [allMapOpportunities, setAllMapOpportunities] = useState<ApiOpportunity[]>([]);
  const [pagination, setPagination] = useState(initialPagination);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    type: '',
    location: '',
    duration: '',
    accommodation: ''
  });
  const [sortBy, setSortBy] = useState('newest');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isMapDataLoaded, setIsMapDataLoaded] = useState(false);

  // 當切換到地圖視圖時，獲取所有機會
  useEffect(() => {
    const fetchAllOpportunities = async () => {
      if (viewMode === 'map' && !isMapDataLoaded) {
        setIsLoading(true);
        try {
          const response = await fetch('/api/opportunities?limit=1000');
          const data = await response.json();
          console.log('API 回傳的完整資料:', data);

          // 確保資料是陣列格式
          const opportunitiesArray = Array.isArray(data.opportunities) ? data.opportunities :
                                   Array.isArray(data) ? data : [];

          console.log('處理後的機會資料:', opportunitiesArray);

          // 檢查坐標格式
          opportunitiesArray.forEach((opp: ApiOpportunity, index: number) => {
            console.log(`機會 ${index + 1} 的位置資料:`, {
              title: opp.title,
              location: opp.location,
              coordinates: opp.location?.coordinates,
              lat: opp.location?.coordinates?.lat,
              lng: opp.location?.coordinates?.lng
            });
          });

          setAllMapOpportunities(opportunitiesArray);
          setIsMapDataLoaded(true);
        } catch (error) {
          console.error('獲取所有機會失敗:', error);
          setError('無法載入地圖資料');
          setIsMapDataLoaded(true);
          setAllMapOpportunities([]);
        } finally {
          setIsLoading(false);
        }
      }
    };

    fetchAllOpportunities();
  }, [viewMode, isMapDataLoaded]);

  // 更新 URL 查詢參數
  useEffect(() => {
    const query = {
      ...router.query,
      page: pagination.currentPage.toString(),
      search: searchTerm,
      ...filters,
      sort: sortBy
    };

    // 移除空值
    Object.keys(query).forEach(key => {
      if (!query[key as keyof typeof query]) {
        delete query[key as keyof typeof query];
      }
    });

    router.push({ pathname: router.pathname, query }, undefined, { shallow: true });
  }, [router, pagination.currentPage, searchTerm, filters, sortBy]);

  // 處理搜索
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  };

  // 處理篩選器變化
  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  };

  // 處理視圖模式切換
  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode);
  };

  // 處理排序變化
  const handleSortChange = (value: string) => {
    setSortBy(value);
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  };

  // 處理分頁
  const handlePageChange = (page: number) => {
    setPagination(prev => ({ ...prev, currentPage: page }));
  };

  // 使用 useMemo 優化地圖標記的計算
  const mapMarkers = useMemo(() => {
    const opportunitiesToShow = viewMode === 'map' ? allMapOpportunities : opportunities;

    // 確保資料是陣列
    if (!Array.isArray(opportunitiesToShow)) {
      console.error('機會資料不是陣列:', opportunitiesToShow);
      return [];
    }

    console.log('開始計算地圖標記，機會數量:', opportunitiesToShow.length);

    const validMarkers = opportunitiesToShow
      .filter(opportunity => {
        const coordinates = opportunity?.location?.coordinates;
        console.log('處理機會的坐標:', {
          title: opportunity?.title,
          coordinates,
          lat: coordinates?.lat,
          lng: coordinates?.lng
        });

        const hasValidCoordinates = coordinates &&
                                  typeof coordinates.lat === 'number' && !isNaN(coordinates.lat) &&
                                  typeof coordinates.lng === 'number' && !isNaN(coordinates.lng);

        if (!hasValidCoordinates) {
          console.log('過濾掉無效座標的機會:', {
            title: opportunity?.title,
            reason: !coordinates ? '無坐標' : '坐標格式無效'
          });
        }

        return hasValidCoordinates;
      })
      .map(opportunity => {
        const lat = opportunity.location!.coordinates!.lat;
        const lng = opportunity.location!.coordinates!.lng;
        console.log('建立標記:', {
          title: opportunity.title,
          position: [lat, lng],
          id: opportunity.id
        });

        return {
          id: opportunity.id,
          position: [lat, lng] as [number, number],
          title: opportunity.title,
          type: opportunity.type,
          count: 1,
          slug: opportunity.slug,
          popupContent: `
            <div class="p-4">
              <h3 class="font-semibold text-base mb-2">${opportunity.title}</h3>
              ${opportunity.location?.city ? `<p class="text-sm text-gray-600 mb-2">${opportunity.location.city}</p>` : ''}
              ${opportunity.shortDescription ?
                `<p class="text-sm text-gray-600 mb-3">${opportunity.shortDescription.substring(0, 100)}${opportunity.shortDescription.length > 100 ? '...' : ''}</p>`
                : ''}
              <div class="flex justify-center">
                <a href="/opportunities/${opportunity.slug}" class="inline-block border border-primary-600 text-primary-600 text-xs px-4 py-1.5 rounded hover:bg-gray-50 hover:text-primary-700 hover:border-primary-700 transition-colors">
                  查看詳情
                </a>
              </div>
            </div>`
        };
      });

    console.log('有效標記數量:', validMarkers.length);
    return validMarkers;
  }, [viewMode === 'map' ? allMapOpportunities : opportunities]);

  // 使用 useMemo 優化地圖中心點的計算
  const mapCenter = useMemo(() => {
    const defaultCenter: [number, number] = [23.5, 121];
    if (mapMarkers.length === 0) {
      console.log('使用預設中心點:', defaultCenter);
      return defaultCenter;
    }

    const validMarkers = mapMarkers.filter(marker =>
      !isNaN(marker.position[0]) && !isNaN(marker.position[1])
    );

    if (validMarkers.length === 0) {
      console.log('沒有有效標記，使用預設中心點');
      return defaultCenter;
    }

    const sumLat = validMarkers.reduce((sum, marker) => sum + marker.position[0], 0);
    const sumLng = validMarkers.reduce((sum, marker) => sum + marker.position[1], 0);
    const avgLat = sumLat / validMarkers.length;
    const avgLng = sumLng / validMarkers.length;

    console.log('計算的地圖中心點:', [avgLat, avgLng]);
    return [avgLat, avgLng] as [number, number];
  }, [mapMarkers]);

  return (
    <div className="space-y-6">
      {/* 搜索和篩選器 */}
      <div className="bg-white p-4 rounded-lg shadow">
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="flex gap-4">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="搜索工作機會..."
              className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              搜索
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <select
              value={filters.type}
              onChange={(e) => handleFilterChange('type', e.target.value)}
              className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">所有類型</option>
              <option value="FARMING">農場體驗</option>
              <option value="GARDENING">園藝工作</option>
              <option value="ANIMAL_CARE">動物照顧</option>
              {/* 添加其他類型選項 */}
            </select>
            <select
              value={filters.location}
              onChange={(e) => handleFilterChange('location', e.target.value)}
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
              <option value="popular">最受歡迎</option>
            </select>
          </div>
        </form>
      </div>

      {/* 視圖模式切換 */}
      <div className="flex justify-end space-x-2">
        <button
          onClick={() => handleViewModeChange('list')}
          className={`px-4 py-2 rounded-lg ${
            viewMode === 'list'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          列表視圖
        </button>
        <button
          onClick={() => handleViewModeChange('map')}
          className={`px-4 py-2 rounded-lg ${
            viewMode === 'map'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          地圖視圖
        </button>
      </div>

      {/* 機會列表或地圖 */}
      {viewMode === 'list' ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {opportunities.map((opportunity) => (
              <Link
                key={opportunity.id}
                href={`/opportunities/${opportunity.slug}`}
                className="block bg-white rounded-lg shadow hover:shadow-md transition-shadow"
              >
                <div className="relative h-48">
                  <Image
                    src={opportunity.media?.images?.[0]?.url || '/images/placeholder.jpg'}
                    alt={opportunity.title}
                    fill
                    className="object-cover rounded-t-lg"
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
                  <p className="text-gray-600 text-sm mb-4">
                    {opportunity.shortDescription || opportunity.description || ''}
                  </p>
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
            ))}
          </div>

          {/* 分頁控制 - 只在列表視圖且有多頁時顯示 */}
          {pagination.totalPages > 1 && (
            <div className="flex justify-center mt-8">
              <nav className="flex items-center space-x-2">
                <button
                  onClick={() => handlePageChange(pagination.currentPage - 1)}
                  disabled={!pagination.hasPrevPage}
                  className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  上一頁
                </button>
                <span className="px-4 py-2">
                  第 {pagination.currentPage} 頁，共 {pagination.totalPages} 頁
                </span>
                <button
                  onClick={() => handlePageChange(pagination.currentPage + 1)}
                  disabled={!pagination.hasNextPage}
                  className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  下一頁
                </button>
              </nav>
            </div>
          )}
        </>
      ) : (
        <div className="h-[600px] relative">
          <MapComponent
            key="map-view"
            position={mapCenter}
            markers={mapMarkers}
            zoom={7}
            height="100%"
            enableClustering={true}
            showZoomControl={true}
            showFullscreenControl={true}
            showLocationControl={true}
            dataFullyLoaded={true}
            onMarkerClick={(id) => {
              console.log('標記點擊:', id);
              const opportunity = allMapOpportunities.find(o => o.id === id);
              if (opportunity) {
                router.push(`/opportunities/${opportunity.slug}`);
              }
            }}
          />
          {isLoading && (
            <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default OpportunityList;