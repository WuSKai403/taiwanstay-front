import { useState, useEffect } from 'react';
import { NextPage, GetServerSideProps } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/router';
import Head from 'next/head';
import dynamic from 'next/dynamic';
import { OpportunityType } from '../../models/enums/OpportunityType';
import SocialMediaIcons from '../../components/SocialMediaIcons';
import { connectToDatabase } from '../../lib/mongodb';
import { Opportunity } from '../../models/index';
import { useSession } from 'next-auth/react';
import Layout from '../../components/layout/Layout';

// 動態導入地圖組件，避免 SSR 問題
const MapComponent = dynamic(() => import('../../components/MapComponent'), {
  ssr: false,
  loading: () => <div className="h-96 bg-gray-200 flex items-center justify-center">地圖載入中...</div>
});

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

// 定義機會詳情接口
interface OpportunityDetail {
  id: string;
  publicId: string;
  title: string;
  slug: string;
  shortDescription: string;
  description: string;
  type: OpportunityType;
  status: string;
  location: {
    address?: string;
    city?: string;
    district?: string;
    region?: string;
    country?: string;
    coordinates?: {
      type: string;
      coordinates: [number, number]; // 經度, 緯度
    };
  };
  workDetails: {
    tasks?: string[];
    skills?: string[];
    learningOpportunities?: string[];
    physicalDemand?: 'low' | 'medium' | 'high';
    languages?: string[];
  };
  workTimeSettings?: {
    workHoursPerDay?: number;
    workDaysPerWeek?: number;
    minimumStay?: number;
    maximumStay?: number;
    startDate?: string;
    endDate?: string;
    isOngoing?: boolean;
    seasonality?: {
      spring?: boolean;
      summer?: boolean;
      autumn?: boolean;
      winter?: boolean;
    };
  };
  benefits: {
    accommodation: {
      provided: boolean;
      type?: 'private_room' | 'shared_room' | 'dormitory' | 'camping' | 'other';
      description?: string;
    };
    meals: {
      provided: boolean;
      count?: number;
      description?: string;
    };
    stipend?: {
      provided: boolean;
      amount?: number;
      currency?: string;
      frequency?: string;
    };
    otherBenefits?: string[];
  };
  requirements: {
    minAge?: number;
    acceptsCouples?: boolean;
    acceptsFamilies?: boolean;
    acceptsPets?: boolean;
    drivingLicenseRequired?: boolean;
    otherRequirements?: string[];
  };
  media: {
    images?: Array<{
      url: string;
      alt?: string;
    }>;
  };
  host: {
    id: string;
    name: string;
    profileImage?: string;
    description?: string;
    responseRate?: number;
    responseTime?: string;
    verificationStatus?: string;
    memberSince?: string;
    socialMedia?: {
      facebook?: string;
      instagram?: string;
      line?: string;
      website?: string;
      twitter?: string;
      youtube?: string;
      linkedin?: string;
    };
    contactPhone?: string;
  };
  stats: {
    applications: number;
    bookmarks: number;
    views: number;
  };
  createdAt?: string;
  updatedAt?: string;
}

interface OpportunityDetailProps {
  opportunity: OpportunityDetail;
}

const OpportunityDetail: NextPage<OpportunityDetailProps> = ({ opportunity }) => {
  const [activeTab, setActiveTab] = useState<'description' | 'requirements' | 'host'>('description');
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const { data: session, status } = useSession();
  const { slug } = router.query;

  // 檢查用戶是否已收藏此機會
  useEffect(() => {
    const checkBookmarkStatus = async () => {
      if (status === 'authenticated' && opportunity?.id) {
        try {
          const response = await fetch(`/api/bookmarks?opportunityId=${opportunity.id}`);
          if (response.ok) {
            const data = await response.json();
            setIsBookmarked(data.isBookmarked);
          }
        } catch (err) {
          console.error('檢查收藏狀態失敗:', err);
        }
      }
    };

    checkBookmarkStatus();
  }, [status, opportunity?.id]);

  // 更新瀏覽次數
  useEffect(() => {
    const updateViewCount = async () => {
      if (opportunity?.id) {
        try {
          await fetch(`/api/opportunities/${opportunity.id}/view`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            }
          });
        } catch (err) {
          console.error('更新瀏覽次數失敗:', err);
        }
      }
    };

    updateViewCount();
  }, [opportunity?.id]);

  // 處理收藏/取消收藏
  const handleBookmark = async () => {
    if (status !== 'authenticated') {
      // 如果用戶未登入，重定向到登入頁面
      router.push(`/auth/signin?callbackUrl=${encodeURIComponent(router.asPath)}`);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/bookmarks', {
        method: isBookmarked ? 'DELETE' : 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          opportunityId: opportunity.id
        })
      });

      if (response.ok) {
        setIsBookmarked(!isBookmarked);
      } else {
        const data = await response.json();
        setError(data.message || '操作失敗');
      }
    } catch (err) {
      setError((err as Error).message || '操作失敗');
      console.error('收藏操作失敗:', err);
    } finally {
      setLoading(false);
    }
  };

  // 處理申請
  const handleApply = () => {
    if (status !== 'authenticated') {
      // 如果用戶未登入，重定向到登入頁面
      router.push(`/auth/signin?callbackUrl=${encodeURIComponent(router.asPath)}`);
      return;
    }

    // 重定向到申請頁面
    router.push(`/opportunities/${slug}/apply`);
  };

  // 如果頁面正在加載中
  if (router.isFallback) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <Layout title={`${opportunity.title} - TaiwanStay`} description={opportunity.shortDescription}>
      <div className="bg-gray-50 min-h-screen">
        {/* 頁面標題 */}
        <div className="bg-primary-600 py-8 px-4 sm:px-6 lg:px-8 text-white">
          <div className="max-w-7xl mx-auto">
            <div className="mb-2">
              <Link href="/opportunities" className="inline-flex items-center text-white hover:text-gray-200 transition-colors">
                <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
                </svg>
                返回機會列表
              </Link>
            </div>
            <div className="flex flex-wrap items-center gap-3 mb-2">
              <span className={`inline-block px-3 py-1 text-sm font-semibold rounded-full ${typeColorMap[opportunity.type as OpportunityType] || 'bg-gray-100 text-gray-800'}`}>
                {typeNameMap[opportunity.type as OpportunityType] || '其他'}
              </span>
              <span className="text-gray-200">
                <svg className="w-5 h-5 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
                </svg>
                {opportunity.location?.city || opportunity.location?.region || ''} {opportunity.location?.district || ''}
              </span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold">{opportunity.title}</h1>
            <p className="text-xl text-gray-200 mt-2">{opportunity.shortDescription}</p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* 左側主要內容 */}
            <div className="lg:col-span-2">
              {/* 封面圖片 */}
              <div className="bg-white shadow-sm rounded-lg overflow-hidden mb-8">
                <div className="relative h-96">
                  {opportunity.media?.images && opportunity.media.images[0] ? (
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

                {/* 標籤導航 */}
                <div className="border-b border-gray-200">
                  <nav className="flex -mb-px">
                    <button
                      onClick={() => setActiveTab('description')}
                      className={`py-4 px-6 font-medium text-sm border-b-2 ${
                        activeTab === 'description'
                          ? 'border-primary-500 text-primary-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      機會詳情
                    </button>
                    <button
                      onClick={() => setActiveTab('requirements')}
                      className={`py-4 px-6 font-medium text-sm border-b-2 ${
                        activeTab === 'requirements'
                          ? 'border-primary-500 text-primary-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      要求與福利
                    </button>
                    <button
                      onClick={() => setActiveTab('host')}
                      className={`py-4 px-6 font-medium text-sm border-b-2 ${
                        activeTab === 'host'
                          ? 'border-primary-500 text-primary-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      主辦方資訊
                    </button>
                  </nav>
                </div>

                {/* 內容區域 */}
                <div className="p-6">
                  {activeTab === 'description' && (
                    <div>
                      {/* 詳細描述 */}
                      <div className="mb-8">
                        <h2 className="text-2xl font-bold mb-4">關於這個機會</h2>
                        <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: opportunity.description }} />
                      </div>

                      {/* 工作詳情 */}
                      <div className="mb-8">
                        <h2 className="text-2xl font-bold mb-4">工作詳情</h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                          <div className="bg-gray-50 p-4 rounded-lg">
                            <h3 className="font-semibold text-lg mb-2">工作時間</h3>
                            <p className="flex items-center mb-2">
                              <svg className="w-5 h-5 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                              </svg>
                              每日 {opportunity.workTimeSettings?.workHoursPerDay || '未指定'} 小時
                            </p>
                            <p className="flex items-center">
                              <svg className="w-5 h-5 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                              </svg>
                              每週 {opportunity.workTimeSettings?.workDaysPerWeek || '未指定'} 天
                            </p>
                          </div>

                          <div className="bg-gray-50 p-4 rounded-lg">
                            <h3 className="font-semibold text-lg mb-2">停留時間</h3>
                            <p className="flex items-center mb-2">
                              <svg className="w-5 h-5 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                              </svg>
                              最少 {opportunity.workTimeSettings?.minimumStay || '未指定'} 天
                            </p>
                            {opportunity.workTimeSettings?.maximumStay && (
                              <p className="flex items-center">
                                <svg className="w-5 h-5 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                                </svg>
                                最多 {opportunity.workTimeSettings.maximumStay} 天
                              </p>
                            )}
                          </div>
                        </div>

                        {/* 工作任務 */}
                        {opportunity.workDetails?.tasks && opportunity.workDetails.tasks.length > 0 && (
                          <div className="mb-6">
                            <h3 className="font-semibold text-lg mb-2">工作任務</h3>
                            <ul className="list-disc pl-5 space-y-1">
                              {opportunity.workDetails.tasks.map((task, index) => (
                                <li key={index}>{task}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* 學習機會 */}
                        {opportunity.workDetails?.learningOpportunities && opportunity.workDetails.learningOpportunities.length > 0 && (
                          <div className="mb-6">
                            <h3 className="font-semibold text-lg mb-2">學習機會</h3>
                            <ul className="list-disc pl-5 space-y-1">
                              {opportunity.workDetails.learningOpportunities.map((item, index) => (
                                <li key={index}>{item}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* 語言要求 */}
                        {opportunity.workDetails?.languages && opportunity.workDetails.languages.length > 0 && (
                          <div className="mb-6">
                            <h3 className="font-semibold text-lg mb-2">語言要求</h3>
                            <div className="flex flex-wrap gap-2">
                              {opportunity.workDetails.languages.map((language, index) => (
                                <span key={index} className="inline-block px-3 py-1 bg-blue-50 text-blue-700 text-sm rounded-full">
                                  {language}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* 地圖區域 */}
                      {opportunity.location?.coordinates && (
                        <div className="mt-6 bg-white rounded-lg shadow-md p-4">
                          <h3 className="text-xl font-semibold mb-4">位置</h3>
                          <div className="h-[400px] rounded-lg overflow-hidden">
                            <MapComponent
                              position={[
                                opportunity.location.coordinates.coordinates[1],
                                opportunity.location.coordinates.coordinates[0]
                              ]}
                              markers={[
                                {
                                  id: opportunity.id,
                                  position: [
                                    opportunity.location.coordinates.coordinates[1],
                                    opportunity.location.coordinates.coordinates[0]
                                  ],
                                  title: opportunity.title,
                                  type: opportunity.type,
                                  popupContent: `
                                    <div class="p-4">
                                      <h3 class="font-semibold text-base mb-2 text-gray-800">${opportunity.title}</h3>
                                      <p class="text-sm text-gray-600 mb-2">${opportunity.location.address || ''}</p>
                                    </div>
                                  `
                                }
                              ]}
                              zoom={14}
                              height="400px"
                              showZoomControl={true}
                              showLocationControl={true}
                              enableClustering={true}
                            />
                          </div>
                          <div className="mt-4 flex flex-wrap gap-2">
                            <a
                              href={`https://www.google.com/maps/search/?api=1&query=${opportunity.location.coordinates.coordinates[1]},${opportunity.location.coordinates.coordinates[0]}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                              </svg>
                              在 Google 地圖中查看
                            </a>
                            <button
                              onClick={() => {
                                if (opportunity.location.address) {
                                  navigator.clipboard.writeText(opportunity.location.address);
                                  alert('地址已複製到剪貼簿');
                                }
                              }}
                              className="inline-flex items-center px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M8 2a1 1 0 000 2h2a1 1 0 100-2H8z" />
                                <path d="M3 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v6h-4.586l1.293-1.293a1 1 0 00-1.414-1.414l-3 3a1 1 0 000 1.414l3 3a1 1 0 001.414-1.414L10.414 13H15v3a2 2 0 01-2 2H5a2 2 0 01-2-2V5zM15 11h2a1 1 0 110 2h-2v-2z" />
                              </svg>
                              複製地址
                            </button>
                          </div>
                        </div>
                      )}

                      {/* 圖片畫廊 */}
                      {opportunity.media?.images && opportunity.media.images.length > 1 && (
                        <div className="mb-8">
                          <h2 className="text-2xl font-bold mb-4">圖片集</h2>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {opportunity.media.images.slice(1).map((image, index) => (
                              <div key={index} className="relative h-40 rounded-lg overflow-hidden">
                                <Image
                                  src={image.url}
                                  alt={image.alt || `${opportunity.title} - 圖片 ${index + 1}`}
                                  layout="fill"
                                  objectFit="cover"
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {activeTab === 'requirements' && (
                    <div>
                      {/* 福利 */}
                      <div className="mb-8">
                        <h2 className="text-2xl font-bold mb-4">提供的福利</h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                          {/* 住宿 */}
                          <div className="bg-gray-50 p-4 rounded-lg">
                            <h3 className="font-semibold text-lg mb-2">住宿</h3>
                            {opportunity.benefits?.accommodation?.provided ? (
                              <>
                                <p className="flex items-center text-green-600 mb-2">
                                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                                  </svg>
                                  提供住宿
                                </p>
                                {opportunity.benefits.accommodation.type && (
                                  <p className="ml-7">
                                    {opportunity.benefits.accommodation.type === 'private_room' && '獨立房間'}
                                    {opportunity.benefits.accommodation.type === 'shared_room' && '共享房間'}
                                    {opportunity.benefits.accommodation.type === 'dormitory' && '宿舍'}
                                    {opportunity.benefits.accommodation.type === 'camping' && '露營'}
                                    {opportunity.benefits.accommodation.type === 'other' && '其他'}
                                  </p>
                                )}
                                {opportunity.benefits.accommodation.description && (
                                  <p className="ml-7 text-gray-600 mt-1">{opportunity.benefits.accommodation.description}</p>
                                )}
                              </>
                            ) : (
                              <p className="flex items-center text-red-600">
                                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                                </svg>
                                不提供住宿
                              </p>
                            )}
                          </div>

                          {/* 餐食 */}
                          <div className="bg-gray-50 p-4 rounded-lg">
                            <h3 className="font-semibold text-lg mb-2">餐食</h3>
                            {opportunity.benefits?.meals?.provided ? (
                              <>
                                <p className="flex items-center text-green-600 mb-2">
                                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                                  </svg>
                                  提供餐食
                                </p>
                                {opportunity.benefits.meals.count && (
                                  <p className="ml-7">每天 {opportunity.benefits.meals.count} 餐</p>
                                )}
                                {opportunity.benefits.meals.description && (
                                  <p className="ml-7 text-gray-600 mt-1">{opportunity.benefits.meals.description}</p>
                                )}
                              </>
                            ) : (
                              <p className="flex items-center text-red-600">
                                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                                </svg>
                                不提供餐食
                              </p>
                            )}
                          </div>
                        </div>

                        {/* 其他福利 */}
                        {opportunity.benefits?.otherBenefits && opportunity.benefits.otherBenefits.length > 0 && (
                          <div className="mb-6">
                            <h3 className="font-semibold text-lg mb-2">其他福利</h3>
                            <ul className="list-disc pl-5 space-y-1">
                              {opportunity.benefits.otherBenefits.map((benefit, index) => (
                                <li key={index}>{benefit}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>

                      {/* 要求 */}
                      <div className="mb-8">
                        <h2 className="text-2xl font-bold mb-4">申請要求</h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                          <div className="bg-gray-50 p-4 rounded-lg">
                            <h3 className="font-semibold text-lg mb-2">基本要求</h3>
                            <ul className="space-y-2">
                              {opportunity.requirements?.minAge && (
                                <li className="flex items-center">
                                  <svg className="w-5 h-5 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                                  </svg>
                                  最低年齡: {opportunity.requirements.minAge} 歲
                                </li>
                              )}
                              <li className="flex items-center">
                                <svg className="w-5 h-5 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path>
                                </svg>
                                接受情侶: {opportunity.requirements?.acceptsCouples ? '是' : '否'}
                              </li>
                              <li className="flex items-center">
                                <svg className="w-5 h-5 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
                                </svg>
                                接受家庭: {opportunity.requirements?.acceptsFamilies ? '是' : '否'}
                              </li>
                              <li className="flex items-center">
                                <svg className="w-5 h-5 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path>
                                </svg>
                                接受寵物: {opportunity.requirements?.acceptsPets ? '是' : '否'}
                              </li>
                              <li className="flex items-center">
                                <svg className="w-5 h-5 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
                                </svg>
                                需要駕照: {opportunity.requirements?.drivingLicenseRequired ? '是' : '否'}
                              </li>
                            </ul>
                          </div>

                          {/* 其他要求 */}
                          {opportunity.requirements?.otherRequirements && opportunity.requirements.otherRequirements.length > 0 && (
                            <div className="bg-gray-50 p-4 rounded-lg">
                              <h3 className="font-semibold text-lg mb-2">其他要求</h3>
                              <ul className="list-disc pl-5 space-y-1">
                                {opportunity.requirements.otherRequirements.map((req, index) => (
                                  <li key={index}>{req}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'host' && (
                    <div>
                      {/* 主辦方資訊 */}
                      <div className="mb-8">
                        <h2 className="text-2xl font-bold mb-4">關於主辦方</h2>

                        <div className="flex items-center mb-6">
                          <div className="relative w-16 h-16 rounded-full overflow-hidden mr-4">
                            {opportunity.host?.profileImage ? (
                              <Image
                                src={opportunity.host.profileImage}
                                alt={opportunity.host.name}
                                layout="fill"
                                objectFit="cover"
                              />
                            ) : (
                              <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                                <span className="text-gray-500 text-xl font-bold">
                                  {opportunity.host?.name?.charAt(0) || '?'}
                                </span>
                              </div>
                            )}
                          </div>
                          <div>
                            <h3 className="text-xl font-semibold">{opportunity.host?.name}</h3>
                            {opportunity.host?.memberSince && (
                              <p className="text-gray-600">
                                會員自 {new Date(opportunity.host.memberSince).getFullYear()} 年
                              </p>
                            )}
                            {opportunity.host?.verificationStatus === 'verified' && (
                              <p className="text-green-600 flex items-center mt-1">
                                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                                </svg>
                                已認證
                              </p>
                            )}
                          </div>
                        </div>

                        {opportunity.host?.description && (
                          <div className="mb-6">
                            <h3 className="font-semibold text-lg mb-2">主辦方介紹</h3>
                            <p className="text-gray-700">{opportunity.host.description}</p>
                          </div>
                        )}

                        {opportunity.host?.responseRate && (
                          <div className="mb-6">
                            <h3 className="font-semibold text-lg mb-2">回應資訊</h3>
                            <p className="flex items-center mb-2">
                              <svg className="w-5 h-5 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                              </svg>
                              回應率: {opportunity.host.responseRate}%
                            </p>
                            {opportunity.host?.responseTime && (
                              <p className="flex items-center">
                                <svg className="w-5 h-5 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                </svg>
                                回應時間: {opportunity.host.responseTime}
                              </p>
                            )}
                          </div>
                        )}

                        {opportunity.host?.socialMedia && Object.values(opportunity.host.socialMedia).some(value => value) && (
                          <div className="mb-6">
                            <h3 className="font-semibold text-lg mb-2">社群媒體</h3>
                            <SocialMediaIcons links={opportunity.host.socialMedia} size="md" />
                          </div>
                        )}

                        <div className="mt-6">
                          <button
                            onClick={() => router.push(`/messages/new?hostId=${opportunity.host?.id}`)}
                            className="bg-primary-600 text-white px-6 py-2 rounded-md hover:bg-primary-700 transition-colors"
                          >
                            聯絡主辦方
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* 右側邊欄 */}
            <div className="lg:col-span-1">
              {/* 申請卡片 */}
              <div className="bg-white rounded-lg shadow-sm p-6 mb-6 sticky top-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="text-2xl font-bold">免費申請</div>
                  <div className="text-gray-600">
                    <span className="font-semibold">{opportunity.stats?.applications || 0}</span> 人已申請
                  </div>
                </div>

                <button
                  onClick={handleApply}
                  className="w-full bg-primary-600 text-white py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors mb-4"
                  disabled={loading}
                >
                  {loading ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      處理中...
                    </span>
                  ) : (
                    '申請此機會'
                  )}
                </button>

                <button
                  onClick={handleBookmark}
                  className={`w-full py-3 rounded-lg font-semibold transition-colors mb-6 flex items-center justify-center
                    ${isBookmarked
                      ? 'bg-gray-100 text-primary-600 hover:bg-gray-200'
                      : 'bg-white text-primary-600 border border-primary-600 hover:bg-primary-50'
                    }`}
                  disabled={loading}
                >
                  {isBookmarked ? (
                    <>
                      <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                        <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z"></path>
                      </svg>
                      已收藏
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"></path>
                      </svg>
                      收藏
                    </>
                  )}
                </button>

                {error && (
                  <div className="text-red-500 text-sm mb-4 text-center">{error}</div>
                )}

                {/* 統計資訊 */}
                <div className="border-t border-gray-200 pt-4">
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div>
                      <div className="text-gray-500 text-sm">瀏覽</div>
                      <div className="font-semibold">{opportunity.stats?.views || 0}</div>
                    </div>
                    <div>
                      <div className="text-gray-500 text-sm">申請</div>
                      <div className="font-semibold">{opportunity.stats?.applications || 0}</div>
                    </div>
                    <div>
                      <div className="text-gray-500 text-sm">收藏</div>
                      <div className="font-semibold">{opportunity.stats?.bookmarks || 0}</div>
                    </div>
                  </div>
                </div>

                {/* 分享按鈕 */}
                <div className="border-t border-gray-200 pt-4 mt-4">
                  <h3 className="font-semibold text-lg mb-2">分享此機會</h3>
                  <div className="flex space-x-2">
                    <button className="bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700 transition-colors">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                      </svg>
                    </button>
                    <button className="bg-blue-400 text-white p-2 rounded-full hover:bg-blue-500 transition-colors">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723 10.054 10.054 0 01-3.127 1.184 4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-1.042-.133-2.052-.382-3.016z"></path>
                      </svg>
                    </button>
                    <button className="bg-green-500 text-white p-2 rounded-full hover:bg-green-600 transition-colors">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                      </svg>
                    </button>
                    <button className="bg-green-600 text-white p-2 rounded-full hover:bg-green-700 transition-colors">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
                      </svg>
                    </button>
                  </div>
                </div>

                {/* 安全提示 */}
                <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                  <h3 className="font-semibold text-lg mb-2">安全提示</h3>
                  <ul className="space-y-2 text-gray-700">
                    <li className="flex items-start">
                      <svg className="w-5 h-5 mr-2 text-yellow-500 mt-0.5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"></path>
                      </svg>
                      在申請前，請先與主辦方充分溝通，了解工作內容和期望
                    </li>
                    <li className="flex items-start">
                      <svg className="w-5 h-5 mr-2 text-yellow-500 mt-0.5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"></path>
                      </svg>
                      請勿在平台外進行金錢交易
                    </li>
                    <li className="flex items-start">
                      <svg className="w-5 h-5 mr-2 text-yellow-500 mt-0.5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"></path>
                      </svg>
                      如遇任何問題，請立即聯繫平台客服
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 聯絡按鈕 */}
      <div className="fixed bottom-6 right-6 flex flex-col space-y-2">
        {/* WhatsApp 按鈕 */}
        {opportunity.host?.contactPhone && (
          <a href={`https://wa.me/${opportunity.host.contactPhone.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="bg-green-600 text-white p-2 rounded-full hover:bg-green-700 transition-colors">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
            </svg>
          </a>
        )}
      </div>
    </Layout>
  );
};

export const getServerSideProps: GetServerSideProps = async (context) => {
  // 從 URL 參數中提取 slug
  const { slug } = context.params as { slug: string };

  try {
    // 連接到數據庫
    await connectToDatabase();

    // 發送 API 請求獲取機會詳情
    const protocol = context.req.headers.host?.includes('localhost') ? 'http' : 'https';
    const host = context.req.headers.host;
    const response = await fetch(`${protocol}://${host}/api/opportunities/${slug}`);

    if (!response.ok) {
      // 如果 API 返回錯誤，返回 404 頁面
      return {
        notFound: true
      };
    }

    const data = await response.json();

    return {
      props: {
        opportunity: data.opportunity
      }
    };
  } catch (error) {
    console.error('獲取機會詳情失敗:', error);
    return {
      notFound: true
    };
  }
};

export default OpportunityDetail;