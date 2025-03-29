import { useState, useEffect, useMemo } from 'react';
import { NextPage, GetServerSideProps, GetStaticPaths, GetStaticProps } from 'next';
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
import TimeSlotFilter from '../../components/opportunities/TimeSlotFilter';
import TimeSlotCalendar from '../../components/opportunities/TimeSlotCalendar';
import TimeSlotManager from '../../components/opportunities/TimeSlotManager';
import TimeSlotDisplay from '@/components/opportunities/TimeSlotDisplay';

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

// 添加 TimeSlot 介面
interface TimeSlot {
  id: string;
  startDate: string | Date;
  endDate: string | Date;
  defaultCapacity: number;
  minimumStay: number;
  appliedCount: number;
  confirmedCount: number;
  status: string;
  description?: string;
}

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
  hasTimeSlots?: boolean;
  timeSlots?: TimeSlot[];
  createdAt?: string;
  updatedAt?: string;
}

interface OpportunityDetailProps {
  opportunity: OpportunityDetail;
}

const OpportunityDetail: NextPage<OpportunityDetailProps> = ({ opportunity }) => {
  const [activeTab, setActiveTab] = useState<'description' | 'requirements' | 'host' | 'timeslots'>('description');
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
          console.log('檢查書籤狀態:', {
            opportunityId: opportunity.id,
            sessionStatus: status,
            userId: session?.user?.id
          });

          const response = await fetch(`/api/bookmarks?opportunityId=${opportunity.id}`);
          if (!response.ok) {
            const errorData = await response.json();
            console.error('書籤檢查失敗:', {
              status: response.status,
              error: errorData
            });
            setError(errorData.error || '檢查收藏狀態失敗');
            return;
          }

          const data = await response.json();
          setIsBookmarked(data.isBookmarked);
        } catch (err) {
          console.error('檢查收藏狀態失敗:', err);
          setError('檢查收藏狀態時發生錯誤');
        }
      }
    };

    checkBookmarkStatus();
  }, [status, opportunity?.id, session]);

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

  // 修改地圖相關部分
  const mapPosition = useMemo(() => {
    if (opportunity.location?.coordinates?.coordinates) {
      const [lng, lat] = opportunity.location.coordinates.coordinates;
      return [lat, lng] as [number, number];
    }
    return undefined;
  }, [opportunity.location]);

  // 如果頁面正在生成中
  if (router.isFallback) {
    return (
      <Layout>
        <div className="min-h-screen flex justify-center items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
        </div>
      </Layout>
    );
  }

  // 如果沒有機會資料
  if (!opportunity) {
    return (
      <Layout>
        <div className="min-h-screen flex justify-center items-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">找不到此機會</h1>
            <Link href="/opportunities" className="text-primary-600 hover:text-primary-700">
              返回機會列表
            </Link>
          </div>
        </div>
      </Layout>
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

                <div className="p-6">
                  {/* 1. 基本資訊 */}
                  <div className="prose max-w-none mb-8">
                    <h2 className="text-2xl font-bold mb-4">{opportunity.title}</h2>
                    {opportunity.description && (
                      <div dangerouslySetInnerHTML={{ __html: opportunity.description }} />
                    )}
                  </div>

                  {/* 2. 時段資訊 */}
                  {opportunity.hasTimeSlots && opportunity.timeSlots && opportunity.timeSlots.length > 0 && (
                    <div className="mb-8">
                      <h3 className="text-xl font-bold mb-4">可申請時段</h3>
                      <TimeSlotDisplay
                        startDate={opportunity.timeSlots[0].startDate}
                        endDate={opportunity.timeSlots[opportunity.timeSlots.length - 1].endDate}
                        defaultCapacity={opportunity.timeSlots[0].defaultCapacity}
                        minimumStay={opportunity.timeSlots[0].minimumStay}
                        appliedCount={opportunity.timeSlots.reduce((total, slot) => total + slot.appliedCount, 0)}
                      />
                    </div>
                  )}

                  {/* 3. 工作詳情 */}
                  <div className="mb-8">
                    <h3 className="text-xl font-bold mb-4">工作詳情</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="font-semibold text-lg mb-2">工作時間</h4>
                        <p className="flex items-center mb-2">
                          <span className="text-gray-600 mr-2">每日工時：</span>
                          <span>{opportunity.workTimeSettings?.workHoursPerDay || '未指定'} 小時</span>
                        </p>
                        <p className="flex items-center">
                          <span className="text-gray-600 mr-2">每週工作：</span>
                          <span>{opportunity.workTimeSettings?.workDaysPerWeek || '未指定'} 天</span>
                        </p>
                      </div>

                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="font-semibold text-lg mb-2">提供福利</h4>
                        <div className="space-y-2">
                          <p className="flex items-center">
                            <span className="text-gray-600 mr-2">住宿：</span>
                            <span>{opportunity.benefits?.accommodation?.provided ? '提供' : '不提供'}</span>
                          </p>
                          <p className="flex items-center">
                            <span className="text-gray-600 mr-2">餐食：</span>
                            <span>{opportunity.benefits?.meals?.provided ? `提供 (${opportunity.benefits.meals.count}餐)` : '不提供'}</span>
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 4. 主辦方資訊 */}
                  <div className="mb-8">
                    <h3 className="text-xl font-bold mb-4">主辦方資訊</h3>
                    <div className="flex items-center mb-4">
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
                        <h4 className="text-lg font-semibold">{opportunity.host?.name}</h4>
                        {opportunity.host?.description && (
                          <p className="text-gray-600 mt-1">{opportunity.host.description}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* 5. 位置資訊 */}
                  {opportunity.location?.coordinates?.coordinates && (
                    <div className="mt-6">
                      <h3 className="text-lg font-semibold mb-4">位置</h3>
                      <div className="h-96 relative rounded-lg overflow-hidden">
                        <MapComponent
                          position={mapPosition}
                          zoom={15}
                          showZoomControl
                          showFullscreenControl
                          showLocationControl
                          filters={{
                            type: opportunity.type,
                            region: opportunity.location?.region,
                            city: opportunity.location?.city
                          }}
                        />
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

                {/* 時段摘要 */}
                {opportunity.hasTimeSlots && opportunity.timeSlots && opportunity.timeSlots.length > 0 && (
                  <div className="border-t border-gray-200 pt-4 mb-4">
                    <h3 className="font-semibold text-lg mb-2">可用時段</h3>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {opportunity.timeSlots
                        .filter(slot => slot.status === 'OPEN')
                        .map(slot => (
                          <div key={slot.id} className="bg-gray-50 p-3 rounded-md border border-gray-200">
                            <p className="text-sm font-medium">
                              {new Date(slot.startDate).toLocaleDateString('zh-TW')} 至 {new Date(slot.endDate).toLocaleDateString('zh-TW')}
                            </p>
                            <div className="flex justify-between items-center mt-1 text-xs text-gray-600">
                              <span>最短 {slot.minimumStay} 天</span>
                              <span>剩餘 {slot.defaultCapacity - slot.confirmedCount} 名額</span>
                            </div>
                          </div>
                        ))}
                    </div>
                    <div className="mt-2 text-center">
                      <Link href="#available-timeslots" className="text-primary-600 hover:text-primary-700 text-sm font-medium">
                        查看所有時段
                      </Link>
                    </div>
                  </div>
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

export const getStaticPaths: GetStaticPaths = async () => {
  let db;
  try {
    const conn = await connectToDatabase();
    db = conn.db;

    const opportunities = await db.collection('opportunities')
      .find(
        { status: 'ACTIVE' },
        {
          projection: { slug: 1 }
        }
      )
      .toArray();

    return {
      paths: opportunities.map((opp) => ({
        params: { slug: opp.slug }
      })),
      fallback: true // 改為 true 以支援增量靜態生成
    };
  } catch (error) {
    console.error('生成靜態路徑失敗:', error);
    return {
      paths: [],
      fallback: true
    };
  }
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const { slug } = params as { slug: string };
  let db;

  try {
    const conn = await connectToDatabase();
    db = conn.db;

    const opportunity = await db.collection('opportunities').findOne(
      { slug },
      {
        projection: {
          _id: 1,
          title: 1,
          slug: 1,
          shortDescription: 1,
          description: 1,
          type: 1,
          status: 1,
          location: 1,
          workDetails: 1,
          workTimeSettings: 1,
          benefits: 1,
          requirements: 1,
          media: 1,
          host: 1,
          stats: 1,
          hasTimeSlots: 1,
          timeSlots: 1,
          createdAt: 1,
          updatedAt: 1
        }
      }
    );

    if (!opportunity) {
      return { notFound: true };
    }

    const { _id, ...rest } = opportunity;

    return {
      props: {
        opportunity: {
          ...JSON.parse(JSON.stringify(rest)),
          id: _id.toString()
        }
      },
      revalidate: 60
    };
  } catch (error) {
    console.error('獲取機會詳情失敗:', error);
    return { notFound: true };
  }
};

export default OpportunityDetail;