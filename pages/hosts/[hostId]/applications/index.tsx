import { useState, useEffect, useCallback } from 'react';
import { NextPage, GetServerSideProps } from 'next';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import Head from 'next/head';
import Link from 'next/link';
import Image from 'next/image';
import { format } from 'date-fns';
import { zhTW } from 'date-fns/locale';
import { ApplicationStatus } from '@/models/enums/ApplicationStatus';
import { useQuery } from '@tanstack/react-query';
import HostLayout from '@/components/layout/HostLayout';
import { getSession } from 'next-auth/react';
import { statusNameMap, statusColorMap } from '@/constants/applicationStatus';

// 申請接口
interface Application {
  _id: string;
  status: ApplicationStatus;
  statusNote?: string;
  opportunityId: {
    _id: string;
    title: string;
    slug: string;
    type: string;
    location?: {
      city?: string;
      district?: string;
    };
    media?: {
      images?: Array<{
        url: string;
        alt?: string;
      }>;
    };
  };
  userId: {
    _id: string;
    name: string;
    profileImage?: string;
  };
  applicationDetails: {
    message: string;
    startMonth: string;
    endMonth?: string;
    duration: number;
  };
  communications: {
    lastMessageAt?: string;
    unreadHostMessages: number;
  };
  createdAt: string;
  updatedAt: string;
}

interface HostApplicationsPageProps {
  hostId: string;
}

const HostApplicationsPage: NextPage<HostApplicationsPageProps> = ({ hostId }) => {
  const router = useRouter();
  const { data: session, status: sessionStatus } = useSession();

  const [activeTab, setActiveTab] = useState<ApplicationStatus | 'all'>('all');
  const [opportunityFilter, setOpportunityFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // 使用 React Query 管理資料獲取
  const {
    data,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['hostApplications', hostId, activeTab, opportunityFilter, searchQuery],
    queryFn: async () => {
      const queryParams = new URLSearchParams();

      if (activeTab !== 'all') {
        queryParams.append('status', activeTab);
      }

      if (opportunityFilter !== 'all') {
        queryParams.append('opportunityId', opportunityFilter);
      }

      if (searchQuery) {
        queryParams.append('search', searchQuery);
      }

      const response = await fetch(`/api/hosts/${hostId}/applications?${queryParams.toString()}`);

      if (!response.ok) {
        throw new Error('獲取申請列表失敗');
      }

      return await response.json();
    },
    enabled: !!hostId && sessionStatus === 'authenticated',
    refetchOnWindowFocus: false
  });

  // 處理申請狀態變更
  const handleStatusChange = async (applicationId: string, newStatus: ApplicationStatus) => {
    try {
      const response = await fetch(`/api/hosts/${hostId}/applications/${applicationId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status: newStatus
        })
      });

      if (!response.ok) {
        throw new Error('更新申請狀態失敗');
      }

      // 重新獲取申請列表
      refetch();
    } catch (err) {
      console.error('更新申請狀態錯誤:', err);
      alert((err as Error).message);
    }
  };

  // 處理搜尋提交
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    refetch();
  };

  // 如果用戶未登入或正在加載，顯示載入中
  if (sessionStatus === 'loading') {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  // 如果用戶未登入，重定向到登入頁面
  if (sessionStatus === 'unauthenticated') {
    router.push('/auth/signin');
    return null;
  }

  const applications = data?.data?.applications || [];
  const opportunities = data?.data?.opportunities || [];

  return (
    <HostLayout>
      <Head>
        <title>申請管理 - TaiwanStay</title>
        <meta name="description" content="管理您的工作機會申請" />
      </Head>

      <div className="bg-white shadow-sm rounded-lg overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-2xl font-bold">申請管理</h1>
          <p className="text-gray-600 mt-1">管理用戶的工作機會申請和審核申請狀態</p>
        </div>

        {/* 搜尋和篩選 */}
        <div className="p-6 border-b border-gray-200 bg-gray-50">
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            {/* 搜尋框 */}
            <div className="flex-1">
              <form onSubmit={handleSearchSubmit} className="flex">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="搜尋申請者姓名..."
                  className="flex-1 border border-gray-300 rounded-l-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <button
                  type="submit"
                  className="bg-primary-600 text-white px-4 py-2 rounded-r-md hover:bg-primary-700 transition-colors"
                >
                  搜尋
                </button>
              </form>
            </div>

            {/* 機會篩選 */}
            <div className="md:w-1/3">
              <select
                value={opportunityFilter}
                onChange={(e) => setOpportunityFilter(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="all">全部工作機會</option>
                {opportunities.map((opportunity: any) => (
                  <option key={opportunity._id} value={opportunity._id}>
                    {opportunity.title}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* 標籤導航 */}
        <div className="border-b border-gray-200">
          <nav className="flex overflow-x-auto">
            <button
              onClick={() => setActiveTab('all')}
              className={`py-4 px-6 font-medium text-sm border-b-2 whitespace-nowrap ${
                activeTab === 'all'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              全部
            </button>
            {Object.values(ApplicationStatus).map((status) => (
              <button
                key={status}
                onClick={() => setActiveTab(status)}
                className={`py-4 px-6 font-medium text-sm border-b-2 whitespace-nowrap ${
                  activeTab === status
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {statusNameMap[status]}
              </button>
            ))}
          </nav>
        </div>

        {/* 申請列表 */}
        <div className="p-6">
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-red-500">{(error as Error).message}</p>
              <button
                onClick={() => refetch()}
                className="mt-4 bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 transition-colors"
              >
                重試
              </button>
            </div>
          ) : applications.length === 0 ? (
            <div className="text-center py-12">
              <svg className="w-16 h-16 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
              </svg>
              <h3 className="mt-2 text-lg font-medium text-gray-900">沒有申請記錄</h3>
              <p className="mt-1 text-gray-500">目前沒有符合條件的申請</p>
            </div>
          ) : (
            <div className="space-y-6">
              {applications.map((application: Application) => (
                <div key={application._id} className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                  <div className="p-6">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
                      <div className="flex items-center mb-2 md:mb-0">
                        <div className="relative h-12 w-12 rounded-full overflow-hidden mr-4">
                          {application.userId?.profileImage ? (
                            <Image
                              src={application.userId.profileImage}
                              alt={application.userId.name}
                              fill
                              sizes="48px"
                              style={{ objectFit: 'cover' }}
                            />
                          ) : (
                            <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                              <span className="text-gray-500 text-xl font-bold">
                                {application.userId?.name?.charAt(0) || '?'}
                              </span>
                            </div>
                          )}
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg">{application.userId?.name}</h3>
                          <div className="flex items-center mt-1">
                            <span className={`text-xs px-2 py-1 rounded-full ${statusColorMap[application.status]}`}>
                              {statusNameMap[application.status]}
                            </span>
                            <span className="text-xs text-gray-500 ml-2">
                              {format(new Date(application.createdAt), 'yyyy 年 MM 月 dd 日', { locale: zhTW })}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Link
                          href={`/hosts/${hostId}/applications/${application._id}`}
                          className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 transition-colors"
                        >
                          查看詳情
                        </Link>

                        {application.status === ApplicationStatus.PENDING && (
                          <>
                            <button
                              onClick={() => handleStatusChange(application._id, ApplicationStatus.PENDING)}
                              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                            >
                              開始審核
                            </button>
                          </>
                        )}

                        {application.status === ApplicationStatus.PENDING && (
                          <>
                            <button
                              onClick={() => handleStatusChange(application._id, ApplicationStatus.ACCEPTED)}
                              className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
                            >
                              接受
                            </button>
                            <button
                              onClick={() => handleStatusChange(application._id, ApplicationStatus.REJECTED)}
                              className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
                            >
                              拒絕
                            </button>
                          </>
                        )}

                        {application.communications.unreadHostMessages > 0 && (
                          <div className="bg-red-500 text-white px-2 py-1 rounded-full text-xs ml-2">
                            {application.communications.unreadHostMessages} 則新訊息
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="mt-4 border-t border-gray-200 pt-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <h4 className="text-sm font-medium text-gray-500">工作機會</h4>
                          <p className="mt-1">{application.opportunityId.title}</p>
                          <p className="text-sm text-gray-500 mt-1">
                            {application.opportunityId.location?.city} {application.opportunityId.location?.district}
                          </p>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-gray-500">申請期間</h4>
                          <p className="mt-1">
                            {format(new Date(application.applicationDetails.startMonth), 'yyyy 年 MM 月', { locale: zhTW })}
                            {application.applicationDetails.endMonth && (
                              <>
                                {' - '}
                                {format(new Date(application.applicationDetails.endMonth), 'yyyy 年 MM 月', { locale: zhTW })}
                              </>
                            )}
                          </p>
                          <p className="text-sm text-gray-500 mt-1">
                            {application.applicationDetails.duration} 天
                          </p>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-gray-500">最後更新</h4>
                          <p className="mt-1">
                            {format(new Date(application.updatedAt), 'yyyy 年 MM 月 dd 日', { locale: zhTW })}
                          </p>
                          {application.communications.lastMessageAt && (
                            <p className="text-sm text-gray-500 mt-1">
                              最後訊息: {format(new Date(application.communications.lastMessageAt), 'MM/dd HH:mm', { locale: zhTW })}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </HostLayout>
  );
};

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getSession(context);

  // 檢查用戶是否登入
  if (!session) {
    return {
      redirect: {
        destination: '/auth/signin',
        permanent: false,
      },
    };
  }

  const hostId = context.params?.hostId as string;

  // 檢查用戶是否為該主人
  try {
    const response = await fetch(`${process.env.NEXTAUTH_URL}/api/hosts/${hostId}/validate`, {
      headers: {
        cookie: context.req.headers.cookie || '',
      },
    });

    if (!response.ok) {
      return {
        redirect: {
          destination: '/profile',
          permanent: false,
        },
      };
    }
  } catch (error) {
    console.error('驗證主人權限錯誤:', error);
    return {
      redirect: {
        destination: '/profile',
        permanent: false,
      },
    };
  }

  return {
    props: {
      hostId,
    },
  };
};

export default HostApplicationsPage;