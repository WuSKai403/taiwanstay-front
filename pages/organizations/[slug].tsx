import { useState } from 'react';
import { NextPage, GetServerSideProps } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/router';
import Head from 'next/head';
import dynamic from 'next/dynamic';
import { OrganizationType } from '../../models/enums/OrganizationType';
import SocialMediaIcons from '../../components/SocialMediaIcons';

// 動態導入地圖組件，避免 SSR 問題
const MapComponent = dynamic(() => import('../../components/MapComponent'), {
  ssr: false,
  loading: () => <div className="h-96 bg-gray-200 flex items-center justify-center">地圖載入中...</div>
});

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

// 假資料，之後會從 API 獲取
const MOCK_ORGANIZATION = {
  id: 'x7y8z9',
  name: '永續農業發展協會',
  slug: 'sustainable-agriculture-association',
  description: '致力於推廣有機農業和永續生活方式的非營利組織',
  mission: '我們的使命是推廣永續農業實踐，支持小農發展，並促進人與土地的和諧關係。',
  vision: '我們期望建立一個更加永續、公平和健康的食物系統，讓每個人都能獲得健康的食物，同時保護環境和農業生態系統。',
  type: OrganizationType.NGO,
  verified: true,
  verifiedAt: '2020-05-15',
  contactInfo: {
    email: 'contact@sustainableag.org.tw',
    phone: '02-2345-6789',
    website: 'https://www.sustainableag.org.tw',
    socialMedia: {
      facebook: 'https://www.facebook.com/sustainableagtw',
      instagram: 'https://www.instagram.com/sustainableagtw'
    }
  },
  location: {
    address: '台北市大安區和平東路二段123號',
    city: '台北市',
    district: '大安區',
    zipCode: '106',
    country: '台灣',
    coordinates: {
      type: 'Point',
      coordinates: [121.5435, 25.0265] // 經度, 緯度
    }
  },
  media: {
    logo: '/images/mock/org1-logo.jpg',
    coverImage: '/images/mock/org1-cover.jpg',
    gallery: [
      '/images/mock/org1-gallery1.jpg',
      '/images/mock/org1-gallery2.jpg',
      '/images/mock/org1-gallery3.jpg',
      '/images/mock/org1-gallery4.jpg'
    ]
  },
  details: {
    foundedYear: 2010,
    teamSize: 15,
    languages: ['中文', '英文'],
    focusAreas: ['有機農業', '環境教育', '社區支持型農業', '食農教育', '永續發展'],
    registrationNumber: 'A123456789',
    legalStatus: '社團法人'
  },
  opportunities: [
    {
      id: 'opp1',
      title: '有機農場志工',
      slug: 'organic-farm-volunteer',
      shortDescription: '在宜蘭有機農場體驗農耕生活，學習永續農業技術',
      location: {
        city: '宜蘭縣',
        district: '三星鄉'
      },
      media: {
        coverImage: '/images/mock/farm1.jpg'
      }
    },
    {
      id: 'opp2',
      title: '食農教育講師助理',
      slug: 'food-education-assistant',
      shortDescription: '協助規劃和執行食農教育課程，向大眾推廣永續飲食理念',
      location: {
        city: '台北市',
        district: '大安區'
      },
      media: {
        coverImage: '/images/mock/education1.jpg'
      }
    },
    {
      id: 'opp3',
      title: '社區園圃維護志工',
      slug: 'community-garden-volunteer',
      shortDescription: '參與台北市社區園圃的日常維護和管理，推廣都市農耕',
      location: {
        city: '台北市',
        district: '松山區'
      },
      media: {
        coverImage: '/images/mock/garden1.jpg'
      }
    }
  ],
  stats: {
    opportunities: 8,
    followers: 245,
    reviews: 18,
    rating: 4.8
  }
};

interface OrganizationDetailProps {
  organization: typeof MOCK_ORGANIZATION;
}

const OrganizationDetail: NextPage<OrganizationDetailProps> = ({ organization }) => {
  const [activeTab, setActiveTab] = useState<'about' | 'opportunities'>('about');
  const router = useRouter();
  const { slug } = router.query;

  // 如果頁面正在加載中
  if (router.isFallback) {
    return <div className="container mx-auto px-4 py-8">載入中...</div>;
  }

  return (
    <>
      <Head>
        <title>{organization.name} | TaiwanStay</title>
        <meta name="description" content={organization.description} />
      </Head>

      <div className="container mx-auto px-4 py-8">
        {/* 返回按鈕 */}
        <div className="mb-6">
          <Link href="/organizations" className="inline-flex items-center text-blue-600 hover:text-blue-800">
            <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
            </svg>
            返回組織列表
          </Link>
        </div>

        {/* 封面圖片 */}
        <div className="relative h-64 md:h-80 rounded-lg overflow-hidden mb-8">
          {organization.media.coverImage && (
            <Image
              src={organization.media.coverImage}
              alt={organization.name}
              fill
              style={{ objectFit: 'cover' }}
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black opacity-60"></div>
          <div className="absolute bottom-0 left-0 p-6 flex items-end">
            <div className="bg-white rounded-full p-2 shadow-md mr-4">
              {organization.media.logo && (
                <div className="relative w-20 h-20 rounded-full overflow-hidden">
                  <Image
                    src={organization.media.logo}
                    alt={`${organization.name} logo`}
                    fill
                    style={{ objectFit: 'cover' }}
                  />
                </div>
              )}
            </div>
            <div className="text-white">
              <div className="flex items-center gap-2 mb-2">
                <span className={`inline-block px-3 py-1 text-xs font-semibold rounded-full ${typeColorMap[organization.type]}`}>
                  {typeNameMap[organization.type]}
                </span>
                {organization.verified && (
                  <span className="inline-flex items-center px-2 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full">
                    <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                    </svg>
                    已認證
                  </span>
                )}
              </div>
              <h2 className="text-xl font-bold mb-2 hover:text-blue-600">
                <Link href={`/organizations/${organization.id}-${organization.slug}`} className="hover:text-blue-600">
                  {organization.name}
                </Link>
              </h2>
            </div>
          </div>
        </div>

        {/* 標籤頁切換 */}
        <div className="border-b border-gray-200 mb-8">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('about')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'about'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              關於組織
            </button>
            <button
              onClick={() => setActiveTab('opportunities')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'opportunities'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              機會列表 ({organization.opportunities.length})
            </button>
          </nav>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 左側主要內容 */}
          <div className="lg:col-span-2">
            {activeTab === 'about' ? (
              <>
                {/* 組織描述 */}
                <div className="mb-8">
                  <h2 className="text-2xl font-bold mb-4">組織介紹</h2>
                  <p className="text-gray-700 mb-4">{organization.description}</p>

                  {organization.mission && (
                    <div className="mb-4">
                      <h3 className="text-lg font-semibold mb-2">我們的使命</h3>
                      <p className="text-gray-700">{organization.mission}</p>
                    </div>
                  )}

                  {organization.vision && (
                    <div>
                      <h3 className="text-lg font-semibold mb-2">我們的願景</h3>
                      <p className="text-gray-700">{organization.vision}</p>
                    </div>
                  )}
                </div>

                {/* 專注領域 */}
                {organization.details.focusAreas && organization.details.focusAreas.length > 0 && (
                  <div className="mb-8">
                    <h2 className="text-2xl font-bold mb-4">專注領域</h2>
                    <div className="flex flex-wrap gap-2">
                      {organization.details.focusAreas.map((area, index) => (
                        <span key={index} className="inline-block px-3 py-1 bg-gray-100 text-gray-800 text-sm rounded-full">
                          {area}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* 組織詳情 */}
                <div className="mb-8">
                  <h2 className="text-2xl font-bold mb-4">組織詳情</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="font-semibold text-lg mb-2">基本資訊</h3>
                      <div className="space-y-2">
                        <p className="flex items-center text-gray-700">
                          <svg className="w-5 h-5 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                          </svg>
                          成立於 {organization.details.foundedYear} 年
                        </p>
                        <p className="flex items-center text-gray-700">
                          <svg className="w-5 h-5 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
                          </svg>
                          {organization.details.teamSize} 人團隊
                        </p>
                        {organization.details.legalStatus && (
                          <p className="flex items-center text-gray-700">
                            <svg className="w-5 h-5 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
                            </svg>
                            {organization.details.legalStatus}
                          </p>
                        )}
                        {organization.details.registrationNumber && (
                          <p className="flex items-center text-gray-700">
                            <svg className="w-5 h-5 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                            </svg>
                            登記號碼: {organization.details.registrationNumber}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="font-semibold text-lg mb-2">聯絡資訊</h3>
                      <div className="space-y-2">
                        <p className="flex items-center text-gray-700">
                          <svg className="w-5 h-5 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                          </svg>
                          {organization.contactInfo.email}
                        </p>
                        {organization.contactInfo.phone && (
                          <p className="flex items-center text-gray-700">
                            <svg className="w-5 h-5 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path>
                            </svg>
                            {organization.contactInfo.phone}
                          </p>
                        )}
                        {organization.contactInfo.website && (
                          <p className="flex items-center text-gray-700">
                            <svg className="w-5 h-5 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"></path>
                            </svg>
                            <a href={organization.contactInfo.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                              {organization.contactInfo.website.replace(/^https?:\/\//, '')}
                            </a>
                          </p>
                        )}
                        <div className="flex items-center space-x-3 mt-2">
                          {organization.contactInfo.socialMedia && (
                            <SocialMediaIcons
                              links={organization.contactInfo.socialMedia}
                              size="md"
                            />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 地圖 */}
                <div className="mb-8">
                  <h2 className="text-2xl font-bold mb-4">位置</h2>
                  <p className="mb-4">{organization.location.address}</p>

                  {organization.location.coordinates && (
                    <div className="h-96 rounded-lg overflow-hidden">
                      <MapComponent
                        position={[
                          organization.location.coordinates.coordinates[1],
                          organization.location.coordinates.coordinates[0]
                        ]}
                      />
                    </div>
                  )}
                </div>

                {/* 圖片畫廊 */}
                {organization.media.gallery && organization.media.gallery.length > 0 && (
                  <div className="mb-8">
                    <h2 className="text-2xl font-bold mb-4">圖片集</h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {organization.media.gallery.map((image, index) => (
                        <div key={index} className="relative h-40 rounded-lg overflow-hidden">
                          <Image
                            src={image}
                            alt={`${organization.name} - 圖片 ${index + 1}`}
                            fill
                            style={{ objectFit: 'cover' }}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <>
                {/* 機會列表 */}
                <h2 className="text-2xl font-bold mb-6">機會列表</h2>

                {organization.opportunities.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {organization.opportunities.map((opportunity) => (
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
                        </div>

                        <div className="p-6">
                          <h3 className="text-xl font-bold mb-2 hover:text-blue-600">
                            <Link href={`/opportunities/${opportunity.slug}`} className="hover:text-blue-600">
                              {opportunity.title}
                            </Link>
                          </h3>

                          <p className="text-gray-600 mb-4">{opportunity.shortDescription}</p>

                          <div className="flex items-center text-gray-500 mb-4">
                            <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
                            </svg>
                            <span>{opportunity.location.city} {opportunity.location.district}</span>
                          </div>

                          <Link href={`/opportunities/${opportunity.slug}`} className="inline-block text-blue-600 font-semibold hover:text-blue-800">
                            查看詳情 →
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-gray-50 p-8 rounded-lg text-center">
                    <p className="text-gray-600">目前沒有可用的機會</p>
                  </div>
                )}
              </>
            )}
          </div>

          {/* 右側邊欄 */}
          <div className="lg:col-span-1">
            {/* 統計卡片 */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h3 className="font-semibold text-lg mb-4">組織統計</h3>

              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{organization.stats.opportunities}</div>
                  <div className="text-sm text-gray-600">機會數量</div>
                </div>

                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{organization.stats.followers}</div>
                  <div className="text-sm text-gray-600">追蹤者</div>
                </div>

                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{organization.stats.reviews}</div>
                  <div className="text-sm text-gray-600">評價數</div>
                </div>

                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{organization.stats.rating}</div>
                  <div className="text-sm text-gray-600">平均評分</div>
                </div>
              </div>
            </div>

            {/* 行動按鈕 */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <button className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition duration-200 mb-4">
                追蹤組織
              </button>

              <button className="w-full bg-white text-blue-600 border border-blue-600 py-3 rounded-lg font-semibold hover:bg-blue-50 transition duration-200">
                聯絡組織
              </button>
            </div>

            {/* 語言 */}
            {organization.details.languages && organization.details.languages.length > 0 && (
              <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                <h3 className="font-semibold text-lg mb-4">使用語言</h3>
                <div className="flex flex-wrap gap-2">
                  {organization.details.languages.map((language, index) => (
                    <span key={index} className="inline-block px-3 py-1 bg-gray-100 text-gray-800 text-sm rounded-full">
                      {language}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* 分享 */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="font-semibold text-lg mb-4">分享組織</h3>
              <div className="flex space-x-4">
                <button className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition duration-200">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" fillRule="evenodd" clipRule="evenodd"></path>
                  </svg>
                </button>

                <button className="p-2 bg-blue-400 text-white rounded-full hover:bg-blue-500 transition duration-200">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723 10.054 10.054 0 01-3.127 1.184 4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"></path>
                  </svg>
                </button>

                <button className="p-2 bg-green-500 text-white rounded-full hover:bg-green-600 transition duration-200">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M20 3H4a1 1 0 00-1 1v16a1 1 0 001 1h16a1 1 0 001-1V4a1 1 0 00-1-1zM8.339 18.337H5.667v-8.59h2.672v8.59zM7.003 8.574a1.548 1.548 0 110-3.096 1.548 1.548 0 010 3.096zm11.335 9.763h-2.669V14.16c0-.996-.018-2.277-1.388-2.277-1.39 0-1.601 1.086-1.601 2.207v4.248h-2.667v-8.59h2.56v1.174h.037c.355-.675 1.227-1.387 2.524-1.387 2.704 0 3.203 1.778 3.203 4.092v4.71z"></path>
                  </svg>
                </button>

                <button className="p-2 bg-gray-500 text-white rounded-full hover:bg-gray-600 transition duration-200">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M7.727 2.959A10 10 0 0120 11.999v.9a3.7 3.7 0 01-6.642 2.244 4.6 4.6 0 01-7.357-.205A4.7 4.7 0 014.999 9.999 4.7 4.7 0 019.7 5.3a4.74 4.74 0 013.68 1.759A3.736 3.736 0 0116.04 5.1a3.765 3.765 0 013.759 3.664A3.823 3.823 0 0120 9.9v-.001a8.5 8.5 0 00-1.654-5.043 8.5 8.5 0 00-4.942-3.012A8.59 8.59 0 0012 1.5a8.5 8.5 0 00-4.273 1.15zM5 10a3.3 3.3 0 003.3 3.3c.604 0 1.175-.17 1.657-.473A4.7 4.7 0 019.7 9.999a4.7 4.7 0 01.256-1.519A3.29 3.29 0 005 10zm7.004-3.3a3.3 3.3 0 100 6.6 3.3 3.3 0 000-6.6zm6.3 3.3c0 1.28-.734 2.41-1.825 2.982A3.635 3.635 0 0116.4 9.999a3.7 3.7 0 00-2.338-3.467 4.686 4.686 0 00-.362.768 3.3 3.3 0 012 3.023c0 .987-.435 1.874-1.115 2.482a4.604 4.604 0 001.12.197A2.3 2.3 0 0018.3 10z"></path>
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export const getServerSideProps: GetServerSideProps = async (context) => {
  // 從 URL 參數中提取 ID
  const { slug } = context.params as { slug: string };

  // 提取 ID 部分（格式為 id-slug）
  const id = slug.split('-')[0];

  // 在實際應用中，這裡會使用 ID 從 API 獲取數據
  // 例如: const organization = await fetchOrganizationById(id);

  // 目前使用假數據
  // 在實際應用中，應該檢查 ID 是否匹配
  const organization = MOCK_ORGANIZATION;

  // 如果找不到對應的組織，返回 404
  if (!organization) {
    return {
      notFound: true
    };
  }

  return {
    props: {
      organization
    }
  };
};

export default OrganizationDetail;