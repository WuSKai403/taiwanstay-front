import { useState, useEffect } from 'react';
import { NextPage } from 'next';
import { useSession } from 'next-auth/react';
import Head from 'next/head';
import ProfileLayout from '@/components/layout/ProfileLayout';

// 通知設定類型
interface NotificationSettings {
  email: {
    applicationUpdates: boolean;
    marketingEmails: boolean;
    newOpportunities: boolean;
    securityAlerts: boolean;
  };
  push: {
    applicationUpdates: boolean;
    newMessages: boolean;
    newOpportunities: boolean;
  };
}

const NotificationsPage: NextPage = () => {
  const { data: session } = useSession();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [settings, setSettings] = useState<NotificationSettings>({
    email: {
      applicationUpdates: true,
      marketingEmails: false,
      newOpportunities: true,
      securityAlerts: true,
    },
    push: {
      applicationUpdates: true,
      newMessages: true,
      newOpportunities: false,
    }
  });

  useEffect(() => {
    const fetchNotificationSettings = async () => {
      setIsLoading(true);
      try {
        const response = await fetch('/api/users/notification-settings');
        if (response.ok) {
          const data = await response.json();
          if (data.settings) {
            setSettings(data.settings);
          }
        }
      } catch (error) {
        console.error('獲取通知設定失敗:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (session) {
      fetchNotificationSettings();
    }
  }, [session]);

  const handleToggle = (category: 'email' | 'push', setting: string) => {
    setSettings(prevSettings => ({
      ...prevSettings,
      [category]: {
        ...prevSettings[category],
        [setting]: !prevSettings[category][setting as keyof typeof prevSettings[typeof category]]
      }
    }));
  };

  const handleSaveSettings = async () => {
    setIsSaving(true);
    setSuccessMessage('');

    try {
      const response = await fetch('/api/users/notification-settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ settings }),
      });

      if (response.ok) {
        setSuccessMessage('通知設定已成功更新！');
        setTimeout(() => {
          setSuccessMessage('');
        }, 3000);
      } else {
        console.error('更新通知設定失敗');
      }
    } catch (error) {
      console.error('更新通知設定出錯:', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ProfileLayout>
      <Head>
        <title>通知設定 - TaiwanStay</title>
        <meta name="description" content="管理您的通知偏好設定" />
      </Head>

      <div className="bg-white shadow-sm rounded-lg overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-2xl font-bold">通知設定</h1>
          <p className="text-gray-600 mt-1">管理您希望接收的通知類型</p>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
          </div>
        ) : (
          <div className="p-6">
            {successMessage && (
              <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-md">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-green-800">{successMessage}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-8">
              {/* 電子郵件通知 */}
              <div>
                <h2 className="text-lg font-medium text-gray-900 mb-4">電子郵件通知</h2>
                <div className="bg-gray-50 rounded-md p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-medium text-gray-900">申請狀態更新</h3>
                      <p className="text-xs text-gray-500">當您的申請狀態有變化時收到通知</p>
                    </div>
                    <button
                      type="button"
                      className={`${
                        settings.email.applicationUpdates ? 'bg-primary-600' : 'bg-gray-200'
                      } relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500`}
                      onClick={() => handleToggle('email', 'applicationUpdates')}
                    >
                      <span className="sr-only">啟用通知</span>
                      <span
                        aria-hidden="true"
                        className={`${
                          settings.email.applicationUpdates ? 'translate-x-5' : 'translate-x-0'
                        } pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200`}
                      ></span>
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-medium text-gray-900">新工作機會</h3>
                      <p className="text-xs text-gray-500">當有符合您興趣的新工作機會時收到通知</p>
                    </div>
                    <button
                      type="button"
                      className={`${
                        settings.email.newOpportunities ? 'bg-primary-600' : 'bg-gray-200'
                      } relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500`}
                      onClick={() => handleToggle('email', 'newOpportunities')}
                    >
                      <span className="sr-only">啟用通知</span>
                      <span
                        aria-hidden="true"
                        className={`${
                          settings.email.newOpportunities ? 'translate-x-5' : 'translate-x-0'
                        } pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200`}
                      ></span>
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-medium text-gray-900">行銷郵件</h3>
                      <p className="text-xs text-gray-500">接收平台推廣和最新消息</p>
                    </div>
                    <button
                      type="button"
                      className={`${
                        settings.email.marketingEmails ? 'bg-primary-600' : 'bg-gray-200'
                      } relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500`}
                      onClick={() => handleToggle('email', 'marketingEmails')}
                    >
                      <span className="sr-only">啟用通知</span>
                      <span
                        aria-hidden="true"
                        className={`${
                          settings.email.marketingEmails ? 'translate-x-5' : 'translate-x-0'
                        } pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200`}
                      ></span>
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-medium text-gray-900">安全提醒</h3>
                      <p className="text-xs text-gray-500">收到帳號相關的安全警示</p>
                    </div>
                    <button
                      type="button"
                      className={`${
                        settings.email.securityAlerts ? 'bg-primary-600' : 'bg-gray-200'
                      } relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500`}
                      onClick={() => handleToggle('email', 'securityAlerts')}
                    >
                      <span className="sr-only">啟用通知</span>
                      <span
                        aria-hidden="true"
                        className={`${
                          settings.email.securityAlerts ? 'translate-x-5' : 'translate-x-0'
                        } pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200`}
                      ></span>
                    </button>
                  </div>
                </div>
              </div>

              {/* 推送通知 */}
              <div>
                <h2 className="text-lg font-medium text-gray-900 mb-4">推送通知</h2>
                <div className="bg-gray-50 rounded-md p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-medium text-gray-900">申請狀態更新</h3>
                      <p className="text-xs text-gray-500">當您的申請狀態有變化時收到通知</p>
                    </div>
                    <button
                      type="button"
                      className={`${
                        settings.push.applicationUpdates ? 'bg-primary-600' : 'bg-gray-200'
                      } relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500`}
                      onClick={() => handleToggle('push', 'applicationUpdates')}
                    >
                      <span className="sr-only">啟用通知</span>
                      <span
                        aria-hidden="true"
                        className={`${
                          settings.push.applicationUpdates ? 'translate-x-5' : 'translate-x-0'
                        } pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200`}
                      ></span>
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-medium text-gray-900">新訊息</h3>
                      <p className="text-xs text-gray-500">當您收到新訊息時通知</p>
                    </div>
                    <button
                      type="button"
                      className={`${
                        settings.push.newMessages ? 'bg-primary-600' : 'bg-gray-200'
                      } relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500`}
                      onClick={() => handleToggle('push', 'newMessages')}
                    >
                      <span className="sr-only">啟用通知</span>
                      <span
                        aria-hidden="true"
                        className={`${
                          settings.push.newMessages ? 'translate-x-5' : 'translate-x-0'
                        } pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200`}
                      ></span>
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-medium text-gray-900">新工作機會</h3>
                      <p className="text-xs text-gray-500">當有符合您興趣的新工作機會時收到通知</p>
                    </div>
                    <button
                      type="button"
                      className={`${
                        settings.push.newOpportunities ? 'bg-primary-600' : 'bg-gray-200'
                      } relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500`}
                      onClick={() => handleToggle('push', 'newOpportunities')}
                    >
                      <span className="sr-only">啟用通知</span>
                      <span
                        aria-hidden="true"
                        className={`${
                          settings.push.newOpportunities ? 'translate-x-5' : 'translate-x-0'
                        } pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200`}
                      ></span>
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleSaveSettings}
                  disabled={isSaving}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSaving ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      儲存中...
                    </>
                  ) : (
                    '儲存設定'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </ProfileLayout>
  );
};

export default NotificationsPage;