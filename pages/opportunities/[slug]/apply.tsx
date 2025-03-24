import { useState } from 'react';
import { NextPage, GetServerSideProps } from 'next';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
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
    startDate: string;
    endDate: string;
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
      const response = await fetch('/api/applications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          opportunityId: opportunity.id,
          applicationDetails: formData
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || '申請提交失敗');
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