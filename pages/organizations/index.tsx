import { useState, useEffect } from 'react';
import { NextPage } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/router';
import { OrganizationType } from '../../models/enums/OrganizationType';

// 假資料，之後會從 API 獲取
const MOCK_ORGANIZATIONS = [
  {
    id: 'x7y8z9',
    name: '永續農業發展協會',
    slug: 'sustainable-agriculture-association',
    description: '致力於推廣有機農業和永續生活方式的非營利組織',
    type: OrganizationType.NGO,
    verified: true,
    location: {
      city: '台北市',
      district: '大安區',
      country: '台灣'
    },
    media: {
      logo: '/images/mock/org1-logo.jpg',
      coverImage: '/images/mock/org1-cover.jpg'
    },
    details: {
      foundedYear: 2010,
      teamSize: 15,
      focusAreas: ['有機農業', '環境教育', '社區支持型農業']
    },
    stats: {
      opportunities: 8,
      followers: 245
    }
  },
  {
    id: 'a1b2c3',
    name: '台灣生態旅遊協會',
    slug: 'taiwan-ecotourism-association',
    description: '推廣負責任旅遊和生態保育的專業組織',
    type: OrganizationType.NGO,
    verified: true,
    location: {
      city: '台北市',
      district: '中正區',
      country: '台灣'
    },
    media: {
      logo: '/images/mock/org2-logo.jpg',
      coverImage: '/images/mock/org2-cover.jpg'
    },
    details: {
      foundedYear: 2005,
      teamSize: 20,
      focusAreas: ['生態旅遊', '環境保育', '社區發展']
    },
    stats: {
      opportunities: 12,
      followers: 320
    }
  },
  {
    id: 'd4e5f6',
    name: '原住民文化保存基金會',
    slug: 'indigenous-culture-foundation',
    description: '致力於保存和推廣台灣原住民文化的基金會',
    type: OrganizationType.FOUNDATION,
    verified: true,
    location: {
      city: '台東縣',
      district: '台東市',
      country: '台灣'
    },
    media: {
      logo: '/images/mock/org3-logo.jpg',
      coverImage: '/images/mock/org3-cover.jpg'
    },
    details: {
      foundedYear: 2008,
      teamSize: 12,
      focusAreas: ['文化保存', '教育', '社區發展']
    },
    stats: {
      opportunities: 6,
      followers: 180
    }
  }
];

// 組織類型標籤顏色映射
const typeColorMap = {
  [OrganizationType.NGO]: 'bg-blue-100 text-blue-800',
  [OrganizationType.FOUNDATION]: 'bg-purple-100 text-purple-800',
  [OrganizationType.SOCIAL_ENTERPRISE]: 'bg-green-100 text-green-800',
  [OrganizationType.COOPERATIVE]: 'bg-yellow-100 text-yellow-800',
  [OrganizationType.COMMUNITY]: 'bg-indigo-100 text-indigo-800',
  [OrganizationType.EDUCATIONAL]: 'bg-red-100 text-red-800',
  [OrganizationType.GOVERNMENT]: 'bg-gray-100 text-gray-800',
  [OrganizationType.ASSOCIATION]: 'bg-orange-100 text-orange-800',
  [OrganizationType.RELIGIOUS]: 'bg-teal-100 text-teal-800',
  [OrganizationType.OTHER]: 'bg-gray-100 text-gray-800'
};

// 組織類型中文名稱映射
const typeNameMap = {
  [OrganizationType.NGO]: '非政府組織',
  [OrganizationType.FOUNDATION]: '基金會',
  [OrganizationType.SOCIAL_ENTERPRISE]: '社會企業',
  [OrganizationType.COOPERATIVE]: '合作社',
  [OrganizationType.COMMUNITY]: '社區組織',
  [OrganizationType.EDUCATIONAL]: '教育機構',
  [OrganizationType.GOVERNMENT]: '政府機構',
  [OrganizationType.ASSOCIATION]: '協會',
  [OrganizationType.RELIGIOUS]: '宗教組織',
  [OrganizationType.OTHER]: '其他組織'
};

const OrganizationsPage: NextPage = () => {
  const [organizations, setOrganizations] = useState(MOCK_ORGANIZATIONS);
  const [filters, setFilters] = useState({
    type: '',
    location: '',
    focusArea: ''
  });
  const [searchTerm, setSearchTerm] = useState('');
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

  // 應用篩選器
  useEffect(() => {
    // 實際應用中這裡會調用 API 進行篩選
    console.log('篩選條件:', filters);
  }, [filters]);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">探索組織</h1>

      {/* 搜尋與篩選區 */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-grow">
            <input
              type="text"
              placeholder="搜尋組織..."
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">組織類型</label>
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
            <label htmlFor="focusArea" className="block text-sm font-medium text-gray-700 mb-1">專注領域</label>
            <select
              id="focusArea"
              name="focusArea"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={filters.focusArea}
              onChange={handleFilterChange}
            >
              <option value="">所有領域</option>
              <option value="agriculture">農業</option>
              <option value="environment">環境</option>
              <option value="education">教育</option>
              <option value="culture">文化</option>
              <option value="community">社區</option>
              <option value="tourism">旅遊</option>
            </select>
          </div>
        </div>
      </div>

      {/* 組織列表 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {organizations.map((organization) => (
          <div key={organization.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition duration-200">
            <div className="relative h-48">
              <div className="absolute inset-0 bg-gray-200">
                {organization.media.coverImage && (
                  <Image
                    src={organization.media.coverImage}
                    alt={organization.name}
                    layout="fill"
                    objectFit="cover"
                  />
                )}
              </div>
              <div className="absolute top-4 left-4">
                <span className={`inline-block px-3 py-1 text-xs font-semibold rounded-full ${typeColorMap[organization.type]}`}>
                  {typeNameMap[organization.type]}
                </span>
              </div>
              {organization.verified && (
                <div className="absolute top-4 right-4">
                  <span className="inline-flex items-center px-2 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full">
                    <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                    </svg>
                    已認證
                  </span>
                </div>
              )}
              <div className="absolute bottom-4 left-4">
                <div className="bg-white rounded-full p-2 shadow-md">
                  {organization.media.logo && (
                    <div className="relative w-12 h-12 rounded-full overflow-hidden">
                      <Image
                        src={organization.media.logo}
                        alt={`${organization.name} logo`}
                        layout="fill"
                        objectFit="cover"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="p-6">
              <h2 className="text-xl font-bold mb-2 hover:text-blue-600">
                <Link href={`/organizations/${organization.id}-${organization.slug}`}>
                  {organization.name}
                </Link>
              </h2>

              <p className="text-gray-600 mb-4">{organization.description}</p>

              <div className="flex items-center text-gray-500 mb-4">
                <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
                </svg>
                <span>{organization.location.city} {organization.location.district}</span>
              </div>

              {organization.details.focusAreas && (
                <div className="mb-4">
                  <div className="flex flex-wrap gap-2">
                    {organization.details.focusAreas.map((area, index) => (
                      <span key={index} className="inline-block px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full">
                        {area}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex flex-wrap gap-y-2">
                <div className="w-1/2 flex items-center text-gray-500">
                  <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                  </svg>
                  <span>{organization.stats.opportunities} 個機會</span>
                </div>

                <div className="w-1/2 flex items-center text-gray-500">
                  <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path>
                  </svg>
                  <span>{organization.stats.followers} 位追蹤者</span>
                </div>

                <div className="w-1/2 flex items-center text-gray-500">
                  <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                  </svg>
                  <span>成立於 {organization.details.foundedYear} 年</span>
                </div>

                <div className="w-1/2 flex items-center text-gray-500">
                  <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
                  </svg>
                  <span>{organization.details.teamSize} 人團隊</span>
                </div>
              </div>

              <div className="mt-6">
                <Link href={`/organizations/${organization.id}-${organization.slug}`} className="block w-full text-center bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition duration-200">
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
          <a href="#" className="px-4 py-2 border border-gray-300 bg-white text-gray-700 rounded-l-md hover:bg-gray-50">
            上一頁
          </a>
          <a href="#" className="px-4 py-2 border-t border-b border-gray-300 bg-blue-50 text-blue-700">
            1
          </a>
          <a href="#" className="px-4 py-2 border-t border-b border-gray-300 bg-white text-gray-700 hover:bg-gray-50">
            2
          </a>
          <a href="#" className="px-4 py-2 border-t border-b border-gray-300 bg-white text-gray-700 hover:bg-gray-50">
            3
          </a>
          <a href="#" className="px-4 py-2 border border-gray-300 bg-white text-gray-700 rounded-r-md hover:bg-gray-50">
            下一頁
          </a>
        </nav>
      </div>
    </div>
  );
};

export default OrganizationsPage;