import { useState, useEffect, useCallback } from 'react';
import { GetServerSideProps } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import Layout from '@/components/layout/Layout';
import { connectToDatabase } from '@/lib/mongodb';
import Host from '@/models/Host';

// 主辦方類型定義
interface HostType {
  _id: string;
  name: string;
  description: string;
  profileImage?: string;
  location: {
    city?: string;
    district?: string;
    address?: string;
  };
  contactEmail?: string;
  contactPhone?: string;
  website?: string;
  socialMedia?: {
    facebook?: string;
    instagram?: string;
    line?: string;
  };
  rating?: {
    average: number;
    count: number;
  };
  opportunityCount?: number;
  createdAt: string;
}

// 過濾器類型定義
interface Filters {
  city?: string;
  type?: string;
  rating?: number;
}

// 主頁面組件
export default function HostsPage({ initialHosts, cities }: { initialHosts: HostType[], cities: string[] }) {
  const [hosts, setHosts] = useState<HostType[]>(initialHosts);
  const [filters, setFilters] = useState<Filters>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);

  // 處理過濾器變更
  const handleFilterChange = (filterName: string, value: string | number | undefined) => {
    setFilters(prev => {
      const newFilters = { ...prev, [filterName]: value };
      // 如果值為空，則刪除該過濾器
      if (value === undefined || value === '') {
        delete newFilters[filterName as keyof Filters];
      }
      return newFilters;
    });
  };

  // 處理搜尋
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchHosts();
  };

  // 獲取主辦方數據
  const fetchHosts = useCallback(async () => {
    setLoading(true);
    try {
      // 構建查詢參數
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (filters.city) params.append('city', filters.city);
      if (filters.type) params.append('type', filters.type);
      if (filters.rating) params.append('minRating', filters.rating.toString());

      const response = await fetch(`/api/hosts?${params.toString()}`);
      if (!response.ok) throw new Error('獲取主辦方失敗');

      const data = await response.json();
      setHosts(data.hosts);
    } catch (error) {
      console.error('獲取主辦方錯誤:', error);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, filters]);

  // 當過濾器或搜尋詞變更時獲取數據
  useEffect(() => {
    fetchHosts();
  }, [fetchHosts]);

  return (
    <Layout>
      <div className="bg-gray-50 min-h-screen py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
              探索台灣的主辦方
            </h1>
            <p className="mt-3 max-w-2xl mx-auto text-xl text-gray-500 sm:mt-4">
              找到提供工作換宿機會的主辦方，了解他們的故事和提供的機會
            </p>
          </div>

          {/* 搜尋和過濾區域 */}
          <div className="mt-10 bg-white shadow rounded-lg p-6">
            <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <label htmlFor="search" className="sr-only">搜尋主辦方</label>
                <div className="relative rounded-md shadow-sm">
                  <input
                    type="text"
                    name="search"
                    id="search"
                    className="focus:ring-primary-500 focus:border-primary-500 block w-full pl-4 pr-12 sm:text-sm border-gray-300 rounded-md"
                    placeholder="搜尋主辦方名稱或描述"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                    <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
              </div>
              <div className="w-full md:w-48">
                <label htmlFor="city" className="sr-only">城市</label>
                <select
                  id="city"
                  name="city"
                  className="focus:ring-primary-500 focus:border-primary-500 block w-full py-2 pl-3 pr-10 text-base border-gray-300 rounded-md"
                  value={filters.city || ''}
                  onChange={(e) => handleFilterChange('city', e.target.value || undefined)}
                >
                  <option value="">所有城市</option>
                  {cities.map((city) => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
              </div>
              <div className="w-full md:w-48">
                <label htmlFor="rating" className="sr-only">最低評分</label>
                <select
                  id="rating"
                  name="rating"
                  className="focus:ring-primary-500 focus:border-primary-500 block w-full py-2 pl-3 pr-10 text-base border-gray-300 rounded-md"
                  value={filters.rating || ''}
                  onChange={(e) => handleFilterChange('rating', e.target.value ? Number(e.target.value) : undefined)}
                >
                  <option value="">所有評分</option>
                  <option value="4">4星以上</option>
                  <option value="3">3星以上</option>
                  <option value="2">2星以上</option>
                </select>
              </div>
              <button
                type="submit"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                搜尋
              </button>
            </form>
          </div>

          {/* 主辦方列表 */}
          <div className="mt-8">
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
              </div>
            ) : hosts.length === 0 ? (
              <div className="text-center py-12">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">沒有找到主辦方</h3>
                <p className="mt-1 text-sm text-gray-500">請嘗試其他搜尋條件</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {hosts.map((host) => (
                  <Link key={host._id} href={`/hosts/${host._id}`} className="block">
                    <div className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow">
                      <div className="relative h-48 w-full">
                        {host.profileImage ? (
                          <Image
                            src={host.profileImage}
                            alt={host.name}
                            layout="fill"
                            objectFit="cover"
                          />
                        ) : (
                          <div className="h-full w-full bg-gray-200 flex items-center justify-center">
                            <span className="text-gray-500 text-2xl font-bold">
                              {host.name.charAt(0)}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="px-4 py-5 sm:p-6">
                        <h3 className="text-lg font-medium text-gray-900 truncate">{host.name}</h3>
                        <div className="flex items-center mt-1">
                          <div className="flex items-center">
                            {[0, 1, 2, 3, 4].map((rating) => (
                              <svg
                                key={rating}
                                className={`h-5 w-5 ${
                                  rating < Math.floor(host.rating?.average || 0)
                                    ? 'text-yellow-400'
                                    : 'text-gray-300'
                                }`}
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                                aria-hidden="true"
                              >
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                            ))}
                          </div>
                          <p className="ml-1 text-sm text-gray-500">
                            {host.rating?.average.toFixed(1) || '無評分'} ({host.rating?.count || 0} 評價)
                          </p>
                        </div>
                        <p className="mt-2 text-sm text-gray-500 line-clamp-2">{host.description}</p>
                        <div className="mt-4 flex items-center text-sm text-gray-500">
                          <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                          </svg>
                          <span>{host.location.city || '未指定'}{host.location.district ? `, ${host.location.district}` : ''}</span>
                        </div>
                        <div className="mt-2 flex items-center text-sm text-gray-500">
                          <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 7a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z" />
                          </svg>
                          <span>{host.opportunityCount || 0} 個機會</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}

export const getServerSideProps: GetServerSideProps = async () => {
  try {
    await connectToDatabase();

    // 獲取主辦方列表
    const hosts = await Host.find({})
      .sort({ createdAt: -1 })
      .limit(12)
      .lean();

    // 獲取所有城市
    const allCities = await Host.distinct('location.city');
    const cities = allCities.filter(city => city && city.trim() !== '');

    return {
      props: {
        initialHosts: JSON.parse(JSON.stringify(hosts)),
        cities: JSON.parse(JSON.stringify(cities))
      }
    };
  } catch (error) {
    console.error('獲取主辦方列表失敗:', error);
    return {
      props: {
        initialHosts: [],
        cities: []
      }
    };
  }
}