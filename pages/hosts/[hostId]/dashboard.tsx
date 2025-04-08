import { useState, useEffect } from 'react';
import { GetServerSideProps } from 'next';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import Head from 'next/head';
import Link from 'next/link';
import HostLayout from '@/components/layout/HostLayout';
import { getSession } from 'next-auth/react';
import { HostStatus } from '@/models/enums/HostStatus';

// 數據卡片組件
const StatsCard = ({ title, value, description, isLoading, icon }: {
  title: string,
  value: number | string,
  description?: string,
  isLoading: boolean,
  icon?: React.ReactNode
}) => (
  <div className="bg-white p-6 rounded-lg shadow-sm">
    <div className="flex items-center justify-between">
      <div>
        <h3 className="text-gray-500 text-sm font-medium">{title}</h3>
        {isLoading ? (
          <div className="h-8 w-24 bg-gray-200 animate-pulse rounded mt-1"></div>
        ) : (
          <p className="text-2xl font-semibold mt-1">{value}</p>
        )}
        {description && <p className="text-gray-500 text-sm mt-1">{description}</p>}
      </div>
      {icon && <div className="text-gray-400">{icon}</div>}
    </div>
  </div>
);

// 主人儀表板頁面
interface HostDashboardProps {
  hostId: string;
}

const HostDashboard = ({ hostId }: HostDashboardProps) => {
  const router = useRouter();
  const { data: session, status: sessionStatus } = useSession();

  const [hostData, setHostData] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 獲取主人資料和統計數據
  useEffect(() => {
    const fetchData = async () => {
      if (sessionStatus !== 'authenticated') return;

      try {
        setIsLoading(true);
        // 獲取主人資料
        const hostResponse = await fetch(`/api/hosts/${hostId}`);
        if (!hostResponse.ok) throw new Error('獲取主人資料失敗');

        const hostData = await hostResponse.json();
        setHostData(hostData.host);

        // 獲取統計數據
        const statsResponse = await fetch(`/api/hosts/${hostId}/stats`);
        if (statsResponse.ok) {
          const statsData = await statsResponse.json();
          setStats(statsData.data);
        }
      } catch (err) {
        console.error('獲取數據錯誤:', err);
        setError((err as Error).message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [hostId, sessionStatus]);

  // 根據主人狀態顯示不同提示
  const renderStatusMessage = () => {
    if (!hostData) return null;

    switch (hostData.status) {
      case HostStatus.PENDING:
        return (
          <div className="bg-yellow-50 p-4 rounded-lg border-l-4 border-yellow-400 mb-6">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">等待審核中</h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <p>您的主人申請正在審核中，審核通過後即可發布工作機會。</p>
                </div>
              </div>
            </div>
          </div>
        );
      case HostStatus.INACTIVE:
        return (
          <div className="bg-gray-50 p-4 rounded-lg border-l-4 border-gray-400 mb-6">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-gray-800">帳號已暫停</h3>
                <div className="mt-2 text-sm text-gray-700">
                  <p>您的主人帳號目前已暫停，無法發布新的工作機會。</p>
                </div>
              </div>
            </div>
          </div>
        );
      case HostStatus.REJECTED:
        return (
          <div className="bg-red-50 p-4 rounded-lg border-l-4 border-red-400 mb-6">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">申請已拒絕</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>很遺憾，您的主人申請未能通過審核。如有疑問，請聯繫客服。</p>
                </div>
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  // 主人狀態標籤
  const getStatusBadge = () => {
    if (!hostData) return null;

    const statusMap: Record<string, { label: string, className: string }> = {
      PENDING: { label: '審核中', className: 'bg-yellow-100 text-yellow-800' },
      ACTIVE: { label: '已啟用', className: 'bg-green-100 text-green-800' },
      INACTIVE: { label: '已暫停', className: 'bg-gray-100 text-gray-800' },
      REJECTED: { label: '已拒絕', className: 'bg-red-100 text-red-800' },
      SUSPENDED: { label: '已封禁', className: 'bg-red-100 text-red-800' }
    };

    const status = statusMap[hostData.status] || { label: '未知', className: 'bg-gray-100 text-gray-800' };

    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${status.className}`}>
        {status.label}
      </span>
    );
  };

  return (
    <HostLayout>
      <Head>
        <title>主人中心 - TaiwanStay</title>
        <meta name="description" content="管理您的主人資料和工作機會" />
      </Head>

      {error ? (
        <div className="bg-red-50 p-4 rounded-lg">
          <p className="text-red-800">{error}</p>
        </div>
      ) : (
        <>
          {/* 主人資料概述 */}
          <div className="bg-white shadow-sm rounded-lg overflow-hidden mb-6">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center">
                    <h1 className="text-2xl font-bold">主人中心</h1>
                    {getStatusBadge()}
                  </div>
                  <p className="text-gray-600 mt-1">
                    管理您的主人資料、工作機會和申請
                  </p>
                </div>
                <div>
                  <Link href={`/hosts/${hostId}/settings`} className="text-primary-600 hover:text-primary-700">
                    編輯資料
                  </Link>
                </div>
              </div>
            </div>

            {/* 狀態通知 */}
            {renderStatusMessage()}

            {/* 統計卡片 */}
            <div className="p-6">
              <h2 className="text-lg font-semibold mb-4">數據概覽</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatsCard
                  title="工作機會"
                  value={stats?.opportunityCount || 0}
                  description="已發布的工作機會數量"
                  isLoading={isLoading}
                  icon={
                    <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                    </svg>
                  }
                />
                <StatsCard
                  title="申請數量"
                  value={stats?.applicationCount || 0}
                  description="收到的申請總數"
                  isLoading={isLoading}
                  icon={
                    <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
                    </svg>
                  }
                />
                <StatsCard
                  title="待處理申請"
                  value={stats?.pendingApplicationCount || 0}
                  description="等待您處理的申請"
                  isLoading={isLoading}
                  icon={
                    <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                  }
                />
              </div>
            </div>
          </div>

          {/* 快速操作 */}
          <div className="bg-white shadow-sm rounded-lg overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold">快速操作</h2>
              <p className="text-gray-600 mt-1">常用的管理功能</p>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Link href={`/hosts/${hostId}/opportunities/create`} className="block p-4 rounded-lg border border-gray-200 hover:border-primary-500 hover:bg-primary-50 transition-colors">
                  <div className="flex items-center">
                    <div className="h-10 w-10 rounded-md bg-primary-100 flex items-center justify-center mr-3">
                      <svg className="h-6 w-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-medium">新增工作機會</h3>
                      <p className="text-sm text-gray-600">建立新的工作機會</p>
                    </div>
                  </div>
                </Link>
                <Link href={`/hosts/${hostId}/applications`} className="block p-4 rounded-lg border border-gray-200 hover:border-primary-500 hover:bg-primary-50 transition-colors">
                  <div className="flex items-center">
                    <div className="h-10 w-10 rounded-md bg-primary-100 flex items-center justify-center mr-3">
                      <svg className="h-6 w-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-medium">管理申請</h3>
                      <p className="text-sm text-gray-600">處理用戶的工作申請</p>
                    </div>
                  </div>
                </Link>
                <Link href={`/hosts/${hostId}`} className="block p-4 rounded-lg border border-gray-200 hover:border-primary-500 hover:bg-primary-50 transition-colors">
                  <div className="flex items-center">
                    <div className="h-10 w-10 rounded-md bg-primary-100 flex items-center justify-center mr-3">
                      <svg className="h-6 w-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-medium">預覽主人頁面</h3>
                      <p className="text-sm text-gray-600">查看用戶看到的頁面</p>
                    </div>
                  </div>
                </Link>
              </div>
            </div>
          </div>
        </>
      )}
    </HostLayout>
  );
};

export const getServerSideProps: GetServerSideProps = async (context) => {
  try {
    const { hostId } = context.params as { hostId: string };
    const session = await getSession(context);

    // 檢查是否登入
    if (!session) {
      return {
        redirect: {
          destination: '/auth/signin?callbackUrl=' + encodeURIComponent(`/hosts/${hostId}/dashboard`),
          permanent: false,
        },
      };
    }

    // 檢查用戶是否為該主人的擁有者
    if (session.user.hostId !== hostId) {
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
  } catch (error) {
    console.error('獲取主人儀表板失敗:', error);
    return {
      notFound: true,
    };
  }
};

export default HostDashboard;