import { useState } from 'react';
import { NextPage, GetServerSideProps } from 'next';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import Head from 'next/head';
import Link from 'next/link';
import { OpportunityType } from '@/models/enums/OpportunityType';
import dbConnect from '@/lib/dbConnect';
import Layout from '@/components/layout/Layout';
import ApplicationForm from '@/components/application/ApplicationForm';

// 定義機會詳情接口
interface OpportunityDetail {
  id: string;
  publicId: string;
  title: string;
  slug: string;
  shortDescription: string;
  type: OpportunityType;
  host: {
    id: string;
    name: string;
  };
  hasTimeSlots: boolean;
  timeSlots?: {
    id: string;
    startMonth: string;
    endMonth: string;
    defaultCapacity: number;
    minimumStay: number;
    appliedCount: number;
    confirmedCount: number;
    status: string;
    description?: string;
    isFull: boolean;
  }[];
}

interface ApplyPageProps {
  opportunity: OpportunityDetail;
}

const ApplyPage: NextPage<ApplyPageProps> = ({ opportunity }) => {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [success, setSuccess] = useState(false);

  // 如果用戶未登入，顯示提示訊息
  if (status === 'unauthenticated') {
    return (
      <Layout title="需要登入 - TaiwanStay">
        <div className="min-h-screen flex flex-col justify-center items-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-md w-full space-y-8 text-center">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">需要登入</h2>
              <p className="mt-2 text-gray-600">
                請先登入後再繼續申請流程
              </p>
            </div>
            <div>
              <button
                onClick={() => router.push('/auth/signin')}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                前往登入
              </button>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  // 如果正在檢查登入狀態，顯示載入中
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  const handleSubmit = async (formData: any) => {
    try {
      console.log('原始表單資料:', JSON.stringify(formData, null, 2));

      // 格式轉換和調整
      const adaptedFormData = {
        ...formData,

        // 確保 languages 是正確的物件陣列格式
        languages: Array.isArray(formData.languages)
          ? formData.languages.map((lang: any) => {
              // 如果已經是物件，保持不變
              if (typeof lang === 'object' && lang !== null) {
                return {
                  language: lang.language || '中文',
                  level: lang.level || 'native'
                };
              }
              // 如果是字串，嘗試解析
              if (typeof lang === 'string') {
                const parts = lang.split('(');
                return {
                  language: parts[0].trim(),
                  level: parts.length > 1 ? parts[1].replace(')', '').trim() : 'native'
                };
              }
              return { language: '中文', level: 'native' };
            })
          : [{ language: '中文', level: 'native' }],

        // 更嚴格處理 dietaryRestrictions，確保它始終是物件格式
        dietaryRestrictions: (() => {
          // 創建一個標準結構的物件
          const defaultRestrictions = {
            type: [] as string[],
            otherDetails: '',
            vegetarianType: ''
          };

          // 如果沒有 dietaryRestrictions 或不是物件，返回預設值
          if (!formData.dietaryRestrictions || typeof formData.dietaryRestrictions !== 'object') {
            return defaultRestrictions;
          }

          // 如果是字串形式的物件，嘗試解析
          if (typeof formData.dietaryRestrictions === 'string') {
            try {
              const parsed = JSON.parse(formData.dietaryRestrictions);
              if (typeof parsed === 'object' && parsed !== null) {
                return {
                  type: Array.isArray(parsed.type) ? parsed.type :
                       (parsed.type ? [parsed.type] : []),
                  otherDetails: parsed.otherDetails || '',
                  vegetarianType: parsed.vegetarianType || ''
                };
              }
            } catch (e) {
              console.error('解析 dietaryRestrictions 失敗:', e);
              return defaultRestrictions;
            }
          }

          // 最常見的情況：是物件但需要確保所有字段格式正確
          return {
            // 確保 type 是字串陣列
            type: Array.isArray(formData.dietaryRestrictions.type)
              ? formData.dietaryRestrictions.type
              : (formData.dietaryRestrictions.type
                  ? [formData.dietaryRestrictions.type]
                  : []),
            otherDetails: formData.dietaryRestrictions.otherDetails || '',
            vegetarianType: formData.dietaryRestrictions.vegetarianType || ''
          };
        })(),

        // 處理 photoDescriptions 為普通 JavaScript 物件
        photoDescriptions: (formData.photoDescriptions && typeof formData.photoDescriptions === 'object' && !Array.isArray(formData.photoDescriptions))
          ? formData.photoDescriptions
          : {},

        // 處理 videoIntroduction 為物件格式
        videoIntroduction: formData.videoIntroduction
          ? (typeof formData.videoIntroduction === 'string'
              ? { url: formData.videoIntroduction }
              : formData.videoIntroduction)
          : null,

        // 確保其他必要欄位存在
        message: formData.message || '',
        termsAgreed: Boolean(formData.termsAgreed)
      };

      // 輸出最終提交的資料結構
      console.log('提交前最終資料檢查:', {
        'dietaryRestrictions': JSON.stringify(adaptedFormData.dietaryRestrictions),
        'dietaryRestrictions.type 類型': typeof adaptedFormData.dietaryRestrictions.type,
        'dietaryRestrictions.type 是否陣列': Array.isArray(adaptedFormData.dietaryRestrictions.type),
        'dietaryRestrictions.type 值': adaptedFormData.dietaryRestrictions.type,
        'languages 是否陣列': Array.isArray(adaptedFormData.languages),
        'languages 範例': adaptedFormData.languages[0],
        'photoDescriptions 類型': typeof adaptedFormData.photoDescriptions,
        'photoDescriptions 是否陣列': Array.isArray(adaptedFormData.photoDescriptions),
        'videoIntroduction 類型': typeof adaptedFormData.videoIntroduction
      });

      // 準備API請求資料
      const requestData = {
        opportunityId: opportunity.id,
        hostId: opportunity.host.id,
        timeSlotId: formData.timeSlotId,
        applicationDetails: adaptedFormData
      };

      console.log('API請求資料:', JSON.stringify(requestData, null, 2));

      // 驗證 dietaryRestrictions 是否為正確的物件結構
      const validateDietaryRestrictions = (data: any) => {
        const dr = data?.applicationDetails?.dietaryRestrictions;
        if (!dr) return false;
        if (typeof dr !== 'object' || Array.isArray(dr)) return false;
        if (!Array.isArray(dr.type)) return false;
        return true;
      };

      if (!validateDietaryRestrictions(requestData)) {
        console.error('dietaryRestrictions 格式驗證失敗，將嘗試修復：',
          requestData.applicationDetails.dietaryRestrictions);

        // 修復結構
        requestData.applicationDetails.dietaryRestrictions = {
          type: Array.isArray(requestData.applicationDetails.dietaryRestrictions?.type)
            ? requestData.applicationDetails.dietaryRestrictions.type
            : [],
          otherDetails: requestData.applicationDetails.dietaryRestrictions?.otherDetails || '',
          vegetarianType: requestData.applicationDetails.dietaryRestrictions?.vegetarianType || ''
        };

        console.log('修復後的 dietaryRestrictions:',
          JSON.stringify(requestData.applicationDetails.dietaryRestrictions));
      }

      const response = await fetch('/api/applications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestData)
      });

      // 輸出API回應
      let responseData;
      try {
        responseData = await response.json();
        console.log('API回應:', responseData);
      } catch (parseError) {
        console.error('解析API回應失敗:', parseError);
        responseData = { message: '無法解析API回應' };
      }

      if (!response.ok) {
        throw new Error(responseData.message || '申請提交失敗');
      }

      setSuccess(true);
      setTimeout(() => {
        router.push('/profile/applications');
      }, 2000);
    } catch (error: any) {
      console.error('申請提交錯誤:', error);
      throw new Error(error.message || '申請提交失敗');
    }
  };

  return (
    <Layout title={`申請 ${opportunity.title} - TaiwanStay`} description={`申請 ${opportunity.title} 的工作機會`}>
      <div className="bg-gray-50 min-h-screen">
        {/* 頁面標題 */}
        <div className="bg-primary-600 py-6 px-4 sm:px-6 lg:px-8 text-white">
          <div className="max-w-7xl mx-auto">
            <div className="mb-2">
              <Link href={`/opportunities/${opportunity.slug}`} className="inline-flex items-center text-white hover:text-gray-200 transition-colors">
                <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
                </svg>
                返回機會詳情
              </Link>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold">申請: {opportunity.title}</h1>
            <p className="mt-2 text-gray-200">主辦方: {opportunity.host.name}</p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          {success ? (
            <div className="bg-white shadow-sm rounded-lg p-8 text-center">
              <div className="mb-4 text-green-500">
                <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
              </div>
              <h2 className="text-2xl font-bold mb-2">申請已成功提交！</h2>
              <p className="text-gray-600 mb-6">主辦方將會審核您的申請，您可以在個人資料頁面查看申請狀態。</p>
              <div className="flex justify-center space-x-4">
                <Link href="/profile/applications" className="bg-primary-600 text-white px-6 py-2 rounded-md hover:bg-primary-700 transition-colors">
                  查看我的申請
                </Link>
                <Link href="/opportunities" className="bg-white text-primary-600 border border-primary-600 px-6 py-2 rounded-md hover:bg-primary-50 transition-colors">
                  瀏覽更多機會
                </Link>
              </div>
            </div>
          ) : (
            <ApplicationForm
              opportunity={opportunity}
              onSubmit={handleSubmit}
            />
          )}
        </div>
      </div>
    </Layout>
  );
};

export default ApplyPage;

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { slug } = context.params as { slug: string };

  try {
    // 檢查用戶是否已登入
    const session = await getServerSession(context.req, context.res, authOptions);

    if (!session || !session.user) {
      return {
        redirect: {
          destination: `/auth/signin?callbackUrl=${encodeURIComponent(`/opportunities/${slug}/apply`)}`,
          permanent: false,
        },
      };
    }

    await dbConnect();

    const protocol = context.req.headers.host?.includes('localhost') ? 'http' : 'https';
    const host = context.req.headers.host;
    const response = await fetch(`${protocol}://${host}/api/opportunities/${slug}`);

    if (!response.ok) {
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