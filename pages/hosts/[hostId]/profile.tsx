import { useState, useEffect } from 'react';
import { GetServerSideProps } from 'next';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import Head from 'next/head';
import { getSession } from 'next-auth/react';

import HostLayout from '@/components/layout/HostLayout';
import LoadingSpinner from '@/components/common/LoadingSpinner';

// 主人資料頁面
interface HostProfileProps {
  hostId: string;
}

const HostProfile = ({ hostId }: HostProfileProps) => {
  const router = useRouter();
  const { data: session, status: sessionStatus } = useSession();

  const [hostData, setHostData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 獲取主人資料
  useEffect(() => {
    const fetchHostData = async () => {
      if (sessionStatus !== 'authenticated') return;

      try {
        setIsLoading(true);
        // 獲取主人資料
        const hostResponse = await fetch(`/api/hosts/${hostId}`);
        if (!hostResponse.ok) throw new Error('獲取主人資料失敗');

        const hostData = await hostResponse.json();
        setHostData(hostData.host);
      } catch (err) {
        console.error('獲取數據錯誤:', err);
        setError((err as Error).message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchHostData();
  }, [hostId, sessionStatus]);

  return (
    <HostLayout>
      <Head>
        <title>主人資料 - TaiwanStay</title>
        <meta name="description" content="管理您的主人個人資料" />
      </Head>

      <div className="bg-white shadow-sm rounded-lg overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-2xl font-bold">主人資料</h1>
          <p className="text-gray-600 mt-1">管理您的主人個人資料和聯絡資訊</p>
        </div>

        {isLoading ? (
          <div className="p-6 flex justify-center">
            <LoadingSpinner size="lg" />
          </div>
        ) : error ? (
          <div className="p-6 bg-red-50 text-red-600">
            {error}
          </div>
        ) : hostData ? (
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h2 className="text-lg font-semibold mb-4">基本資訊</h2>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">主人名稱</h3>
                    <p className="mt-1">{hostData.name || '未設定'}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">電子郵件</h3>
                    <p className="mt-1">{hostData.email || '未設定'}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">電話</h3>
                    <p className="mt-1">{hostData.phone || '未設定'}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">地址</h3>
                    <p className="mt-1">{hostData.address || '未設定'}</p>
                  </div>
                </div>
              </div>
              <div>
                <h2 className="text-lg font-semibold mb-4">主人介紹</h2>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">簡介</h3>
                    <p className="mt-1 whitespace-pre-line">{hostData.description || '未設定'}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 flex justify-end">
              <button
                onClick={() => router.push(`/hosts/${hostId}/settings`)}
                className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-md"
              >
                編輯資料
              </button>
            </div>
          </div>
        ) : (
          <div className="p-6 text-gray-500">沒有找到主人資料</div>
        )}
      </div>
    </HostLayout>
  );
};

export const getServerSideProps: GetServerSideProps = async (context) => {
  try {
    const { hostId } = context.params as { hostId: string };
    const session = await getSession(context);

    // 檢查是否登入
    if (!session) {
      console.log('未登入，重定向到登入頁面');
      return {
        redirect: {
          destination: '/auth/signin?callbackUrl=' + encodeURIComponent(`/hosts/${hostId}/profile`),
          permanent: false,
        },
      };
    }

    // 記錄 session 信息以便於調試
    console.log('訪問 profile 頁面，用戶信息：', {
      userId: session.user.id,
      userHostId: session.user.hostId,
      requestedHostId: hostId
    });

    // 檢查 session 是否包含必要的主人信息
    if (!session.user.hostId) {
      console.log('用戶沒有主人身份，重定向到用戶資料頁面');
      return {
        redirect: {
          destination: '/profile',
          permanent: false,
        },
      };
    }

    // 檢查用戶是否為該主人的擁有者 (放寬條件，只做基本安全性檢查)
    if (session.user.hostId !== hostId) {
      console.log(`身份不匹配：用戶 hostId (${session.user.hostId}) 不等於請求的 hostId (${hostId})`);

      // 臨時解決方案：允許繼續訪問，但記錄警告
      /*
      return {
        redirect: {
          destination: '/profile',
          permanent: false,
        },
      };
      */

      // 替代方案：重定向到用戶自己的主人頁面
      return {
        redirect: {
          destination: `/hosts/${session.user.hostId}/profile`,
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
    console.error('獲取主人資料頁面失敗:', error);
    return {
      notFound: true,
    };
  }
};

export default HostProfile;