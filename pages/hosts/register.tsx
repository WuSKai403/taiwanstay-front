'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import Head from 'next/head';
import Layout from '@/components/layout/Layout';
import { HostType } from '@/models/enums/HostType';
import { HostRegisterProvider } from '@/components/host/context/HostRegisterContext';
import HostRegisterWizard from '@/components/host/HostRegisterWizard';
import AuthGuard from '@/components/auth/AuthGuard';
import { toast } from 'react-hot-toast';
import { HostRegisterFormData } from '@/lib/schemas/host';
import { HostStatus } from '@/models/enums/HostStatus';

export default function HostRegister() {
  const router = useRouter();
  const { data: session, status: sessionStatus } = useSession();
  const [isLoading, setIsLoading] = useState(true);
  const [hasHostId, setHasHostId] = useState(false);
  const [hostStatus, setHostStatus] = useState<string | null>(null);

  // 檢查用戶是否已經是主人或已提交申請
  useEffect(() => {
    if (sessionStatus === 'authenticated' && session?.user?.id) {
      // 先嘗試從session中獲取hostId和status
      if (session?.user?.hostId) {
        setHasHostId(true);

        // 如果session中有hostStatus，直接使用
        if (session?.user?.hostStatus) {
          setHostStatus(session.user.hostStatus);
          setIsLoading(false);
        } else {
          // 否則獲取主人信息
          fetch('/api/hosts/me')
            .then(res => {
              if (res.ok) {
                return res.json();
              } else if (res.status === 404) {
                return { success: false, message: '未找到主人信息' };
              }
              throw new Error('獲取主人信息失敗');
            })
            .then(data => {
              if (data.success && data.host?.status) {
                setHostStatus(data.host.status);
              }
            })
            .catch(error => {
              console.error('獲取主人狀態錯誤:', error);
            })
            .finally(() => {
              setIsLoading(false);
            });
        }
      } else {
        // 如果session中沒有hostId，嘗試使用profile API
        fetch('/api/user/profile')
          .then(res => res.json())
          .then(data => {
            if (data.profile?.hostId) {
              setHasHostId(true);
              return fetch('/api/hosts/me')
                .then(res => {
                  if (res.ok) {
                    return res.json();
                  }
                  throw new Error('獲取主人信息失敗');
                })
                .then(hostData => {
                  if (hostData.success && hostData.host?.status) {
                    setHostStatus(hostData.host.status);
                  }
                });
            }
          })
          .catch(error => console.error('檢查用戶資料錯誤:', error))
          .finally(() => setIsLoading(false));
      }
    } else if (sessionStatus !== 'loading') {
      setIsLoading(false);
    }
  }, [sessionStatus, session]);

  // 處理已有主人ID的情況
  useEffect(() => {
    if (!isLoading && hasHostId && hostStatus) {
      // 根據主人狀態進行不同處理
      switch (hostStatus) {
        case HostStatus.PENDING:
          toast.custom((t) => (
            <div className="bg-blue-50 px-6 py-4 rounded-lg shadow-md border-l-4 border-blue-400">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-blue-700">您已提交主人申請，正在審核中</p>
                </div>
              </div>
            </div>
          ));
          router.replace(`/hosts/${session?.user?.hostId}/dashboard`);
          break;
        case HostStatus.ACTIVE:
          toast.success('您已經是註冊主人');
          router.replace(`/hosts/${session?.user?.hostId}/dashboard`);
          break;
        case HostStatus.EDITING:
          // 重新申請中，允許進入編輯流程，不進行跳轉
          toast.success('請繼續完成您的主人申請資料');
          break; // 不跳轉，允許進入編輯流程
        case HostStatus.REJECTED:
          toast.error('您的主人申請已被拒絕，請聯繫客服瞭解詳情');
          router.replace(`/hosts/${session?.user?.hostId}/dashboard`);
          break;
        case HostStatus.INACTIVE:
        case HostStatus.SUSPENDED:
          toast.error('您的主人帳號已被暫停');
          router.replace(`/hosts/${session?.user?.hostId}/dashboard`);
          break;
        default:
          // 未知狀態，重定向到主人儀表板頁面讓其處理
          router.replace(`/hosts/${session?.user?.hostId}/dashboard`);
      }
    }
  }, [isLoading, hasHostId, hostStatus, router]);

  // 加載中
  if (isLoading) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  // 如果用戶已有主人ID但不是處於EDITING狀態，返回空，等待重定向
  if (hasHostId && hostStatus && hostStatus !== HostStatus.EDITING) {
    return null;
  }

  return (
    <Layout>
      <Head>
        <title>成為主人 - TaiwanStay</title>
        <meta name="description" content="註冊成為 TaiwanStay 的主人，提供工作換宿機會" />
      </Head>

      <div className="bg-gray-50 py-12">
        <AuthGuard redirectTo="/auth/signin?callbackUrl=/hosts/register">
          <HostRegisterProvider>
            <HostRegisterWizard />
          </HostRegisterProvider>
        </AuthGuard>
      </div>
    </Layout>
  );
}
