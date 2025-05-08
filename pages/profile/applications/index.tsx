import { useState, useEffect, useRef, useCallback } from 'react';
import { NextPage, GetServerSideProps } from 'next';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import Head from 'next/head';
import Link from 'next/link';
import Image from 'next/image';
import { format } from 'date-fns';
import { zhTW } from 'date-fns/locale';
import { ApplicationStatus } from '@/models/enums/ApplicationStatus';
import ProfileLayout from '@/components/layout/ProfileLayout';
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
  hostId: {
    _id: string;
    name: string;
    profileImage?: string;
  };
  applicationDetails: {
    message: string;
    startDate: string;
    endDate?: string;
    duration: number;
  };
  communications: {
    lastMessageAt?: string;
    unreadUserMessages: number;
  };
  createdAt: string;
  updatedAt: string;
}

// 更新狀態過濾器
type StatusFilterKey = 'all' | ApplicationStatus;

const statusFilters: {key: StatusFilterKey, label: string}[] = [
  { key: 'all', label: '全部' },
  { key: ApplicationStatus.DRAFT, label: '草稿' },
  { key: ApplicationStatus.PENDING, label: '待審核' },
  { key: ApplicationStatus.ACCEPTED, label: '已接受' },
  { key: ApplicationStatus.REJECTED, label: '已拒絕' },
  { key: ApplicationStatus.ACTIVE, label: '進行中' },
  { key: ApplicationStatus.COMPLETED, label: '已結束' }
];

const ApplicationsPage: NextPage = () => {
  const router = useRouter();
  const { data: session, status: sessionStatus } = useSession();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [activeTab, setActiveTab] = useState<StatusFilterKey>('all');

  // 獲取申請列表
  const fetchApplications = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/applications${activeTab !== 'all' ? `?status=${activeTab}` : ''}`);

      if (!response.ok) {
        throw new Error('獲取申請列表失敗');
      }

      const data = await response.json();
      setApplications(data.data.applications);
    } catch (err) {
      setError((err as Error).message);
      console.error('獲取申請列表錯誤:', err);
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  // 當用戶登入狀態或標籤變化時獲取數據
  useEffect(() => {
    if (sessionStatus === 'authenticated') {
      fetchApplications();
    }
  }, [sessionStatus, fetchApplications]);

  // 如果用戶未登入，重定向到登入頁面
  useEffect(() => {
    if (sessionStatus === 'unauthenticated') {
      router.push('/auth/signin?callbackUrl=/profile/applications');
    }
  }, [sessionStatus, router]);

  // 處理申請狀態變更
  const handleStatusChange = async (applicationId: string, newStatus: ApplicationStatus) => {
    try {
      const confirmed = window.confirm(`確定要將申請狀態更改為「${statusNameMap[newStatus]}」嗎？`);

      if (!confirmed) return;

      const response = await fetch(`/api/applications/${applicationId}`, {
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
      fetchApplications();
    } catch (err) {
      console.error('更新申請狀態錯誤:', err);
      alert((err as Error).message);
    }
  };

  // 如果用戶未登入或正在加載，顯示載入中
  if (sessionStatus === 'loading' || sessionStatus === 'unauthenticated') {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <ProfileLayout>
      <Head>
        <title>我的申請 - TaiwanStay</title>
        <meta name="description" content="管理您的工作機會申請" />
      </Head>

      <div className="bg-white shadow-sm rounded-lg overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-2xl font-bold">我的申請</h1>
          <p className="text-gray-600 mt-1">管理您的工作機會申請和查看申請狀態</p>
        </div>

        {/* 標籤導航 */}
        <div className="border-b border-gray-200">
          <nav className="flex overflow-x-auto">
            {statusFilters.map((filter) => (
              <button
                key={filter.key}
                onClick={() => setActiveTab(filter.key as StatusFilterKey)}
                className={`py-4 px-6 font-medium text-sm border-b-2 whitespace-nowrap ${
                  activeTab === filter.key
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </nav>
        </div>

        {/* 申請列表 */}
        <div className="p-6">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-red-500">{error}</p>
              <button
                onClick={fetchApplications}
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
              <p className="mt-1 text-gray-500">您還沒有申請任何工作機會</p>
              <div className="mt-6">
                <Link href="/opportunities" className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 transition-colors">
                  瀏覽工作機會
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {applications.map((application) => (
                <div key={application._id} className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                  <div className="p-6">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
                      <div className="flex items-center mb-2 md:mb-0">
                        <div className="relative h-12 w-12 rounded-full overflow-hidden mr-4">
                          {application.hostId.profileImage ? (
                            <Image
                              src={application.hostId.profileImage}
                              alt={application.hostId.name}
                              layout="fill"
                              objectFit="cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                              <span className="text-gray-500 text-xl font-bold">
                                {application.hostId.name.charAt(0)}
                              </span>
                            </div>
                          )}
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold">
                            <Link href={`/opportunities/${application.opportunityId.slug}`} className="hover:text-primary-600">
                              {application.opportunityId.title}
                            </Link>
                          </h3>
                          <p className="text-gray-600 text-sm">
                            主辦方: {application.hostId.name}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-col items-start md:items-end">
                        <span className={`inline-block px-3 py-1 text-xs font-semibold rounded-full ${statusColorMap[application.status]}`}>
                          {statusNameMap[application.status]}
                        </span>
                        <span className="text-gray-500 text-sm mt-1">
                          申請於 {format(new Date(application.createdAt), 'yyyy年MM月dd日', { locale: zhTW })}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div>
                        <p className="text-sm text-gray-500">預計開始日期</p>
                        <p className="font-medium">
                          {format(new Date(application.applicationDetails.startDate), 'yyyy年MM月', { locale: zhTW })}
                        </p>
                      </div>
                      {application.applicationDetails.endDate && (
                        <div>
                          <p className="text-sm text-gray-500">預計結束日期</p>
                          <p className="font-medium">
                            {format(new Date(application.applicationDetails.endDate), 'yyyy年MM月', { locale: zhTW })}
                          </p>
                        </div>
                      )}
                      <div>
                        <p className="text-sm text-gray-500">停留時間</p>
                        <p className="font-medium">{application.applicationDetails.duration} 天</p>
                      </div>
                    </div>

                    {application.communications.unreadUserMessages > 0 && (
                      <div className="mb-4 bg-yellow-50 p-2 rounded-md">
                        <p className="text-yellow-800 text-sm flex items-center">
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path>
                          </svg>
                          您有 {application.communications.unreadUserMessages} 條未讀訊息
                        </p>
                      </div>
                    )}

                    <div className="flex flex-wrap gap-2 mt-4">
                      <Link href={`/profile/applications/${application._id}`} className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 transition-colors">
                        查看詳情
                      </Link>

                      {application.status === ApplicationStatus.PENDING && (
                        <button
                          onClick={() => handleStatusChange(application._id, ApplicationStatus.COMPLETED)}
                          className="bg-white text-gray-700 border border-gray-300 px-4 py-2 rounded-md hover:bg-gray-50 transition-colors"
                        >
                          撤回申請
                        </button>
                      )}

                      {application.status === ApplicationStatus.ACCEPTED && (
                        <button
                          onClick={() => handleStatusChange(application._id, ApplicationStatus.ACTIVE)}
                          className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
                        >
                          確認參與
                        </button>
                      )}

                      {application.status === ApplicationStatus.ACCEPTED && (
                        <button
                          onClick={() => handleStatusChange(application._id, ApplicationStatus.COMPLETED)}
                          className="bg-white text-gray-700 border border-gray-300 px-4 py-2 rounded-md hover:bg-gray-50 transition-colors"
                        >
                          婉拒邀請
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </ProfileLayout>
  );
};

export default ApplicationsPage;