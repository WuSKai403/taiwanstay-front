import { useEffect, useState } from 'react';
import { GetServerSideProps } from 'next';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import Head from 'next/head';
import Link from 'next/link';
import Layout from '@/components/layout/Layout';
import AuthGuard from '@/components/auth/AuthGuard';
import { toast } from 'react-hot-toast';
import { HostStatus } from '@/models/enums/HostStatus';

// 主人資訊介面
interface HostInfo {
  _id: string;
  name: string;
  status: HostStatus;
  createdAt: string;
  applicationCount?: number;
  opportunityCount?: number;
}

export default function HostDashboard() {
  const router = useRouter();
  const { data: session, status: sessionStatus } = useSession();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hostInfo, setHostInfo] = useState<HostInfo | null>(null);

  // 獲取主人信息
  useEffect(() => {
    if (sessionStatus === 'authenticated') {
      fetchHostInfo();
    }
  }, [sessionStatus]);

  const fetchHostInfo = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/hosts/me');

      if (!response.ok) {
        if (response.status === 404) {
          // 用戶沒有主人資訊，設置為 null 即可
          setHostInfo(null);
          return;
        }
        throw new Error('獲取主人資訊失敗');
      }

      const data = await response.json();
      setHostInfo(data.host);
    } catch (err) {
      console.error('獲取主人資訊錯誤:', err);
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  // 開始申請流程
  const handleStartApplication = async () => {
    // 如果是被拒絕的主人，需要先調用 reapply API
    if (hostInfo && hostInfo.status === HostStatus.REJECTED) {
      try {
        const response = await fetch('/api/hosts/reapply', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          }
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || '重新申請失敗');
        }

        const data = await response.json();
        if (data.success) {
          toast.success('已將狀態更新為編輯中，可以重新提交申請');
          // 更新本地狀態
          setHostInfo(prev => prev ? { ...prev, status: HostStatus.EDITING } : null);
        } else {
          throw new Error(data.message || '重新申請失敗');
        }
      } catch (error) {
        console.error('重新申請失敗:', error);
        toast.error((error as Error).message || '重新申請失敗，請稍後再試');
        return; // 發生錯誤時不進行跳轉
      }
    }

    // 跳轉到註冊頁面
    router.push('/hosts/register');
  };

  // 根據主人狀態顯示不同的內容
  const renderContent = () => {
    if (loading) {
      return (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">正在載入...</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="text-center py-12">
          <div className="bg-red-50 p-4 rounded-lg inline-block">
            <p className="text-red-700">{error}</p>
            <button
              onClick={fetchHostInfo}
              className="mt-3 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
            >
              重試
            </button>
          </div>
        </div>
      );
    }

    // 未申請 - 顯示申請按鈕
    if (!hostInfo) {
      return (
        <div className="text-center py-12">
          <div className="max-w-md mx-auto bg-white p-8 rounded-lg shadow-sm">
            <h2 className="text-2xl font-bold mb-4">歡迎加入 TaiwanStay</h2>
            <p className="text-gray-600 mb-6">
              成為 TaiwanStay 的主人，您可以發布工作機會，接待來自世界各地的旅行者，交流文化和經驗。
            </p>
            <div className="space-y-4">
              <button
                onClick={handleStartApplication}
                className="w-full px-4 py-3 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
              >
                申請成為主人
              </button>
              <Link href="/about/hosts" className="block text-primary-600 hover:text-primary-800">
                了解更多關於成為主人的資訊
              </Link>
            </div>
          </div>
        </div>
      );
    }

    // 已申請 - 根據狀態顯示
    switch (hostInfo.status) {
      case HostStatus.PENDING:
        return (
          <div className="max-w-4xl mx-auto">
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-6 rounded-lg mb-6">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-6 w-6 text-yellow-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-yellow-800">主人申請審核中</h3>
                  <p className="mt-2 text-yellow-700">
                    您的主人申請已提交，目前正在審核中。審核通常需要 1-3 個工作日，請耐心等待。我們會透過電子郵件通知您審核結果。
                  </p>
                  <p className="mt-4 text-yellow-700">
                    申請日期: {hostInfo.createdAt ? new Date(hostInfo.createdAt).toLocaleDateString('zh-TW') : '未知'}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h2 className="text-xl font-bold mb-4">申請處理中</h2>
              <p className="text-gray-600">
                在審核期間，您可以預先了解主人功能和準備您的第一個工作機會。
              </p>
              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                <Link href="/guides/hosts" className="p-4 border border-gray-200 rounded-lg hover:border-primary-500 transition-colors">
                  <h3 className="font-medium mb-2">主人指南</h3>
                  <p className="text-gray-600 text-sm">了解如何有效利用主人功能，吸引優質的申請者。</p>
                </Link>
                <Link href="/guides/opportunities" className="p-4 border border-gray-200 rounded-lg hover:border-primary-500 transition-colors">
                  <h3 className="font-medium mb-2">工作機會指南</h3>
                  <p className="text-gray-600 text-sm">了解如何撰寫吸引人的工作機會描述和設置合適的條件。</p>
                </Link>
              </div>
            </div>
          </div>
        );

      case HostStatus.ACTIVE:
        return (
          <div className="max-w-4xl mx-auto">
            <div className="bg-green-50 border-l-4 border-green-400 p-4 rounded-lg mb-6">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-6 w-6 text-green-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-green-800">您的主人帳號已啟用</h3>
                  <p className="mt-2 text-green-700">
                    您現在可以使用所有主人功能，包括發布工作機會、管理申請等。
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">主人儀表板</h2>
                <Link href={`/hosts/${hostInfo._id}`} className="text-primary-600 hover:text-primary-800">
                  預覽公開頁面
                </Link>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-medium mb-1 text-gray-700">工作機會</h3>
                  <p className="text-2xl font-bold">{hostInfo.opportunityCount || 0}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-medium mb-1 text-gray-700">總申請數</h3>
                  <p className="text-2xl font-bold">{hostInfo.applicationCount || 0}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-medium mb-1 text-gray-700">主人評分</h3>
                  <div className="flex items-center">
                    <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    <span className="text-2xl font-bold ml-1">-</span>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Link href={`/hosts/${hostInfo._id}/dashboard`} className="p-4 border border-gray-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors">
                  <h3 className="font-medium mb-2">進入主人中心</h3>
                  <p className="text-gray-600 text-sm">管理您的主人資料、工作機會和申請。</p>
                </Link>
                <Link href={`/hosts/${hostInfo._id}/opportunities/new`} className="p-4 border border-gray-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors">
                  <h3 className="font-medium mb-2">新增工作機會</h3>
                  <p className="text-gray-600 text-sm">創建新的工作機會，吸引更多旅行者。</p>
                </Link>
                <Link href={`/hosts/${hostInfo._id}/applications`} className="p-4 border border-gray-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors">
                  <h3 className="font-medium mb-2">管理申請</h3>
                  <p className="text-gray-600 text-sm">查看和處理收到的工作申請。</p>
                </Link>
              </div>
            </div>
          </div>
        );

      case HostStatus.REJECTED:
        return (
          <div className="max-w-4xl mx-auto">
            <div className="bg-red-50 border-l-4 border-red-400 p-6 rounded-lg mb-6">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-6 w-6 text-red-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-red-800">申請未獲通過</h3>
                  <p className="mt-2 text-red-700">
                    很抱歉，您的主人申請未獲通過。這可能是因為資料不完整或不符合我們的要求。
                  </p>
                  <p className="mt-4 text-red-700">
                    您可以聯繫我們的客服了解詳情，或者重新提交申請。
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h2 className="text-xl font-bold mb-4">下一步</h2>
              <div className="space-y-4">
                <button
                  onClick={handleStartApplication}
                  className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
                >
                  重新申請
                </button>
                <Link href="/contact" className="ml-4 text-primary-600 hover:text-primary-800">
                  聯繫客服
                </Link>
              </div>
            </div>
          </div>
        );

      case HostStatus.INACTIVE:
      case HostStatus.SUSPENDED:
        return (
          <div className="max-w-4xl mx-auto">
            <div className="bg-gray-50 border-l-4 border-gray-400 p-6 rounded-lg mb-6">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-6 w-6 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-800">帳號已暫停</h3>
                  <p className="mt-2 text-gray-700">
                    您的主人帳號目前已被暫停。這可能是因為違反了平台規定或應您的要求暫停。
                  </p>
                  <p className="mt-4 text-gray-700">
                    請聯繫客服了解詳情或申請恢復帳號。
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h2 className="text-xl font-bold mb-4">需要協助？</h2>
              <Link href="/contact" className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors inline-block">
                聯繫客服
              </Link>
            </div>
          </div>
        );

      default:
        return (
          <div className="text-center py-12">
            <p className="text-gray-600">無法確定主人狀態，請重新整理頁面或聯繫客服。</p>
            <button
              onClick={fetchHostInfo}
              className="mt-3 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
            >
              重新載入
            </button>
          </div>
        );
    }
  };

  return (
    <Layout>
      <Head>
        <title>主人中心 - TaiwanStay</title>
        <meta name="description" content="管理您的主人資料和工作機會" />
      </Head>

      <div className="py-8 bg-gray-50 min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">主人中心</h1>
            <p className="mt-2 text-gray-600">管理您的主人資料、工作機會和申請</p>
          </div>

          <AuthGuard redirectTo="/auth/signin?callbackUrl=/hosts/dashboard">
            {renderContent()}
          </AuthGuard>
        </div>
      </div>
    </Layout>
  );
}