import { useState } from 'react';
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

// 假資料，之後會從 API 獲取
const MOCK_OPPORTUNITY = {
  id: 'a7b8c9',
  title: '有機農場志工',
  slug: 'organic-farm-volunteer',
  shortDescription: '在美麗的宜蘭有機農場體驗農耕生活，學習永續農業技術',
  description: `
    <p>我們的有機農場位於宜蘭三星鄉，是一個致力於推廣永續農業的小型家庭農場。我們種植各種有機蔬果，並實踐自然農法和永續生活方式。</p>

    <p>作為志工，你將有機會：</p>
    <ul>
      <li>學習有機耕作技術</li>
      <li>參與從播種到收穫的完整農業循環</li>
      <li>了解堆肥製作和土壤管理</li>
      <li>協助農產品加工和包裝</li>
      <li>參與當地農夫市集</li>
      <li>體驗台灣鄉村生活和文化</li>
    </ul>

    <p>我們歡迎對永續農業有熱情、願意學習的人加入我們。不需要農業經驗，但需要有良好的體力和積極的態度。</p>
  `,
  type: OpportunityType.FARMING,
  location: {
    address: '宜蘭縣三星鄉三星路七段123號',
    city: '宜蘭縣',
    district: '三星鄉',
    country: '台灣',
    coordinates: {
      type: 'Point',
      coordinates: [121.6782, 24.6682] // 經度, 緯度
    }
  },
  workDetails: {
    tasks: [
      '田間工作（播種、除草、收穫）',
      '堆肥製作和管理',
      '灌溉系統維護',
      '農產品清洗和包裝',
      '協助農夫市集銷售'
    ],
    skills: [
      '基本園藝知識（非必要）',
      '良好的體力',
      '團隊合作精神',
      '對永續農業的熱情'
    ],
    learningOpportunities: [
      '有機耕作技術',
      '永續生活方式',
      '食物保存方法',
      '社區支持型農業(CSA)運作模式'
    ],
    workHoursPerWeek: 25,
    workDaysPerWeek: 5,
    minimumStay: 14,
    maximumStay: 90,
    isOngoing: true,
    seasonality: {
      spring: true,
      summer: true,
      autumn: true,
      winter: false
    },
    physicalDemand: 'medium',
    languages: ['中文', '英文']
  },
  benefits: {
    accommodation: {
      provided: true,
      type: 'private_room',
      description: '提供簡單但舒適的獨立房間，共用衛浴'
    },
    meals: {
      provided: true,
      count: 3,
      description: '使用農場新鮮食材，提供三餐素食'
    },
    stipend: {
      provided: false
    },
    otherBenefits: [
      '免費Wi-Fi',
      '可使用農場腳踏車',
      '每週一天休假可安排附近景點旅遊',
      '可學習台灣傳統料理'
    ]
  },
  requirements: {
    minAge: 18,
    acceptsCouples: true,
    acceptsFamilies: false,
    acceptsPets: false,
    drivingLicenseRequired: false,
    otherRequirements: [
      '需能適應簡樸的鄉村生活',
      '對有機農業有基本了解或強烈興趣',
      '願意在戶外工作，不怕髒和累'
    ]
  },
  media: {
    coverImage: '/images/mock/farm1.jpg',
    gallery: [
      '/images/mock/farm2.jpg',
      '/images/mock/farm3.jpg',
      '/images/mock/farm4.jpg',
      '/images/mock/farm5.jpg'
    ]
  },
  host: {
    id: 'host1',
    name: '陳永續',
    profileImage: '/images/mock/host1.jpg',
    description: '有10年有機農業經驗的小農，致力於推廣永續生活方式',
    responseRate: 95,
    responseTime: '24小時內',
    verificationStatus: 'verified',
    memberSince: '2018-05-01',
    socialMedia: {
      facebook: 'https://facebook.com/sustainablefarm',
      instagram: 'https://instagram.com/sustainable_farm_tw',
      line: 'https://line.me/ti/p/sustainable_farm',
      website: 'https://sustainablefarm.tw'
    }
  },
  stats: {
    applications: 12,
    bookmarks: 45,
    views: 230
  }
};

interface OpportunityDetailProps {
  opportunity: typeof MOCK_OPPORTUNITY;
}

const OpportunityDetail: NextPage<OpportunityDetailProps> = ({ opportunity }) => {
  const [activeTab, setActiveTab] = useState<'description' | 'requirements' | 'host'>('description');
  const router = useRouter();
  const { slug } = router.query;

  // 如果頁面正在加載中
  if (router.isFallback) {
    return <div className="container mx-auto px-4 py-8">載入中...</div>;
  }

  return (
    <>
      <Head>
        <title>{opportunity.title} | TaiwanStay</title>
        <meta name="description" content={opportunity.shortDescription} />
      </Head>

      <div className="container mx-auto px-4 py-8">
        {/* 返回按鈕 */}
        <div className="mb-6">
          <Link href="/opportunities" className="inline-flex items-center text-blue-600 hover:text-blue-800">
            <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
            </svg>
            返回機會列表
          </Link>
        </div>

        {/* 標題區 */}
        <div className="mb-8">
          <div className="flex flex-wrap items-center gap-3 mb-2">
            <span className={`inline-block px-3 py-1 text-sm font-semibold rounded-full ${typeColorMap[opportunity.type]}`}>
              {typeNameMap[opportunity.type]}
            </span>
            <span className="text-gray-600">
              <svg className="w-5 h-5 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
              </svg>
              {opportunity.location.city} {opportunity.location.district}
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold">{opportunity.title}</h1>
          <p className="text-xl text-gray-600 mt-2">{opportunity.shortDescription}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 左側主要內容 */}
          <div className="lg:col-span-2">
            {/* 封面圖片 */}
            <div className="relative h-96 rounded-lg overflow-hidden mb-8">
              {opportunity.media.coverImage && (
                <Image
                  src={opportunity.media.coverImage}
                  alt={opportunity.title}
                  fill
                  style={{ objectFit: 'cover' }}
                />
              )}
            </div>

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
                    每週 {opportunity.workDetails.workHoursPerWeek} 小時
                  </p>
                  <p className="flex items-center">
                    <svg className="w-5 h-5 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                    </svg>
                    每週 {opportunity.workDetails.workDaysPerWeek} 天
                  </p>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-lg mb-2">停留時間</h3>
                  <p className="flex items-center mb-2">
                    <svg className="w-5 h-5 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                    </svg>
                    最少 {opportunity.workDetails.minimumStay} 天
                  </p>
                  {opportunity.workDetails.maximumStay && (
                    <p className="flex items-center">
                      <svg className="w-5 h-5 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                      </svg>
                      最多 {opportunity.workDetails.maximumStay} 天
                    </p>
                  )}
                </div>
              </div>

              {/* 工作任務 */}
              {opportunity.workDetails.tasks && opportunity.workDetails.tasks.length > 0 && (
                <div className="mb-6">
                  <h3 className="font-semibold text-lg mb-2">工作任務</h3>
                  <ul className="list-disc pl-5 space-y-1">
                    {opportunity.workDetails.tasks.map((task, index) => (
                      <li key={index}>{task}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* 福利 */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold mb-4">提供的福利</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {/* 住宿 */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-lg mb-2">住宿</h3>
                  {opportunity.benefits.accommodation.provided ? (
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
                  {opportunity.benefits.meals.provided ? (
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
            </div>

            {/* 地圖 */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold mb-4">位置</h2>
              <p className="mb-4">{opportunity.location.address || `${opportunity.location.city} ${opportunity.location.district}`}</p>

              {opportunity.location.coordinates && (
                <div className="h-96 rounded-lg overflow-hidden">
                  <MapComponent
                    position={[
                      opportunity.location.coordinates.coordinates[1],
                      opportunity.location.coordinates.coordinates[0]
                    ]}
                    title={opportunity.title}
                  />
                </div>
              )}
            </div>

            {/* 圖片畫廊 */}
            {opportunity.media.gallery && opportunity.media.gallery.length > 0 && (
              <div className="mb-8">
                <h2 className="text-2xl font-bold mb-4">圖片集</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {opportunity.media.gallery.map((image, index) => (
                    <div key={index} className="relative h-40 rounded-lg overflow-hidden">
                      <Image
                        src={image}
                        alt={`${opportunity.title} - 圖片 ${index + 1}`}
                        fill
                        style={{ objectFit: 'cover' }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 右側邊欄 */}
          <div className="lg:col-span-1">
            {/* 申請卡片 */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-6 sticky top-6">
              <div className="flex items-center justify-between mb-4">
                <div className="text-2xl font-bold">免費申請</div>
                <div className="text-gray-600">
                  <span className="font-semibold">{opportunity.stats.applications}</span> 人已申請
                </div>
              </div>

              <button className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition duration-200 mb-4">
                申請此機會
              </button>

              <button className="w-full bg-white text-blue-600 border border-blue-600 py-3 rounded-lg font-semibold hover:bg-blue-50 transition duration-200 mb-6 flex items-center justify-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"></path>
                </svg>
                收藏
              </button>

              {/* 主辦方資訊 */}
              <div className="border-t border-gray-200 pt-6">
                <h3 className="font-semibold text-lg mb-4">主辦方</h3>
                <div className="flex items-center mb-4">
                  <div className="relative w-12 h-12 rounded-full overflow-hidden mr-4">
                    {opportunity.host.profileImage && (
                      <Image
                        src={opportunity.host.profileImage}
                        alt={opportunity.host.name}
                        fill
                        style={{ objectFit: 'cover' }}
                      />
                    )}
                  </div>
                  <div>
                    <div className="font-semibold">{opportunity.host.name}</div>
                    <div className="text-sm text-gray-600">會員自 {new Date(opportunity.host.memberSince).getFullYear()} 年</div>
                  </div>
                </div>

                <p className="text-gray-600 mb-4">{opportunity.host.description}</p>

                {opportunity.host.socialMedia && (
                  <div className="mb-4">
                    <SocialMediaIcons links={opportunity.host.socialMedia} size="md" />
                  </div>
                )}

                <button className="w-full bg-white text-blue-600 border border-blue-600 py-2 rounded-lg font-semibold hover:bg-blue-50 transition duration-200">
                  聯絡主辦方
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
  // 從 URL 參數中提取 slug
  const { slug } = context.params as { slug: string };

  // 提取 publicId 部分（格式為 {publicId}-{slug}）
  const publicId = slug.split('-')[0];

  // 連接到數據庫
  await connectToDatabase();

  try {
    // 使用 publicId 查詢機會
    const opportunity = await Opportunity.findOne({ publicId }).populate('hostId');

    // 如果找不到對應的機會，返回 404
    if (!opportunity) {
      return {
        notFound: true
      };
    }

    // 將 MongoDB 文檔轉換為普通 JavaScript 對象
    const serializedOpportunity = JSON.parse(JSON.stringify(opportunity));

    return {
      props: {
        opportunity: serializedOpportunity
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