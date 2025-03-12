import { NextPage, GetServerSideProps } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import Head from 'next/head';
import { OpportunityType } from '../../models/enums/OpportunityType';
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
const MOCK_OPPORTUNITY = {
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
  }
};

// 動態導入地圖組件，避免 SSR 問題
const MapComponent = dynamic(() => import('../../components/MapComponent'), {
  ssr: false,
  loading: () => <div className="h-96 bg-gray-200 flex items-center justify-center">地圖載入中...</div>
});

// 修改機會列表頁面的組件
const OpportunitiesList: NextPage = () => {
  return (
    <>
      <Head>
        <title>機會列表 | TaiwanStay</title>
        <meta name="description" content="瀏覽台灣各地的志工機會" />
      </Head>

      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">機會列表</h1>

        {/* 這裡可以添加機會列表的內容 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="relative h-48">
              <Image
                src={MOCK_OPPORTUNITY.media.coverImage}
                alt={MOCK_OPPORTUNITY.title}
                fill
                style={{ objectFit: 'cover' }}
              />
            </div>
            <div className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className={`inline-block px-2 py-1 text-xs font-semibold rounded-full ${typeColorMap[MOCK_OPPORTUNITY.type]}`}>
                  {typeNameMap[MOCK_OPPORTUNITY.type]}
                </span>
                <span className="text-sm text-gray-600">
                  {MOCK_OPPORTUNITY.location.city}
                </span>
              </div>
              <h2 className="text-xl font-semibold mb-2">{MOCK_OPPORTUNITY.title}</h2>
              <p className="text-gray-600 mb-4 line-clamp-2">{MOCK_OPPORTUNITY.shortDescription}</p>
              <Link href={`/opportunities/${MOCK_OPPORTUNITY.slug}`} className="text-blue-600 font-semibold hover:text-blue-800">
                查看詳情
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export const getServerSideProps: GetServerSideProps = async () => {
  // 在實際應用中，這裡會從 API 獲取機會列表數據
  return {
    props: {}
  };
};

export default OpportunitiesList;