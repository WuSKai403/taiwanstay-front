import { useState, useEffect } from 'react';
import { NextPage } from 'next';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import ProfileLayout from '@/components/layout/ProfileLayout';

const SettingsPage: NextPage = () => {
  const { data: session } = useSession();
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // 處理密碼變更
  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      setErrorMessage('新密碼與確認密碼不符');
      return;
    }

    if (newPassword.length < 8) {
      setErrorMessage('新密碼長度必須至少為8個字符');
      return;
    }

    setIsChangingPassword(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const response = await fetch('/api/users/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccessMessage('密碼已成功更新！');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setErrorMessage(data.message || '密碼更新失敗');
      }
    } catch (error) {
      setErrorMessage('密碼更新過程中發生錯誤');
      console.error('密碼更新錯誤:', error);
    } finally {
      setIsChangingPassword(false);
    }
  };

  // 處理刪除帳號確認
  const handleDeleteAccount = async () => {
    if (deleteConfirmation !== session?.user?.email) {
      setErrorMessage('請輸入正確的電子郵件地址以確認刪除');
      return;
    }

    setIsDeleting(true);
    setErrorMessage('');

    try {
      const response = await fetch('/api/users/delete-account', {
        method: 'DELETE',
      });

      if (response.ok) {
        // 刪除成功，登出用戶並導向首頁
        await signOut({ redirect: false });
        router.push('/');
      } else {
        const data = await response.json();
        setErrorMessage(data.message || '帳號刪除失敗');
        setIsDeleting(false);
      }
    } catch (error) {
      setErrorMessage('帳號刪除過程中發生錯誤');
      console.error('帳號刪除錯誤:', error);
      setIsDeleting(false);
    }
  };

  return (
    <ProfileLayout>
      <Head>
        <title>帳號設定 - TaiwanStay</title>
        <meta name="description" content="管理您的帳號設定和安全" />
      </Head>

      <div className="bg-white shadow-sm rounded-lg overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-2xl font-bold">帳號設定</h1>
          <p className="text-gray-600 mt-1">管理您的帳號設定和隱私選項</p>
        </div>

        <div className="p-6 space-y-8">
          {/* 密碼變更區塊 */}
          <div>
            <h2 className="text-lg font-medium text-gray-900 mb-4">更改密碼</h2>
            <div className="bg-gray-50 rounded-md p-6">
              {errorMessage && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-sm text-red-800">{errorMessage}</p>
                </div>
              )}

              {successMessage && (
                <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-md">
                  <p className="text-sm text-green-800">{successMessage}</p>
                </div>
              )}

              <form onSubmit={handlePasswordChange} className="space-y-4">
                <div>
                  <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700">
                    目前密碼
                  </label>
                  <input
                    type="password"
                    id="currentPassword"
                    name="currentPassword"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">
                    新密碼
                  </label>
                  <input
                    type="password"
                    id="newPassword"
                    name="newPassword"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    minLength={8}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    密碼必須至少包含8個字符
                  </p>
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                    確認新密碼
                  </label>
                  <input
                    type="password"
                    id="confirmPassword"
                    name="confirmPassword"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  />
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={isChangingPassword}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isChangingPassword ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        變更中...
                      </>
                    ) : (
                      '更改密碼'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* 隱私區塊 */}
          <div>
            <h2 className="text-lg font-medium text-gray-900 mb-4">隱私設定</h2>
            <div className="bg-gray-50 rounded-md p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-gray-900">公開個人資料</h3>
                  <p className="text-xs text-gray-500">允許其他用戶查看您的個人資料信息</p>
                </div>
                <button
                  type="button"
                  className="bg-primary-600 relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  <span className="sr-only">啟用設定</span>
                  <span
                    aria-hidden="true"
                    className="translate-x-5 pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200"
                  ></span>
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-gray-900">搜尋可見性</h3>
                  <p className="text-xs text-gray-500">允許其他用戶在搜尋中找到您</p>
                </div>
                <button
                  type="button"
                  className="bg-primary-600 relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  <span className="sr-only">啟用設定</span>
                  <span
                    aria-hidden="true"
                    className="translate-x-5 pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200"
                  ></span>
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-gray-900">第三方資料共享</h3>
                  <p className="text-xs text-gray-500">與合作夥伴共享您的使用數據</p>
                </div>
                <button
                  type="button"
                  className="bg-gray-200 relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  <span className="sr-only">啟用設定</span>
                  <span
                    aria-hidden="true"
                    className="translate-x-0 pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200"
                  ></span>
                </button>
              </div>
            </div>
          </div>

          {/* 登出所有裝置 */}
          <div>
            <h2 className="text-lg font-medium text-gray-900 mb-4">裝置管理</h2>
            <div className="bg-gray-50 rounded-md p-6">
              <p className="text-sm text-gray-600 mb-4">
                登出您所有已登入的裝置，包括此裝置。
              </p>
              <button
                type="button"
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                登出所有裝置
              </button>
            </div>
          </div>

          {/* 刪除帳號區塊 */}
          <div>
            <h2 className="text-lg font-medium text-gray-900 mb-4">刪除帳號</h2>
            <div className="bg-red-50 rounded-md p-6">
              <div className="mb-4">
                <h3 className="text-sm font-medium text-red-800 mb-1">警告：此操作無法撤銷</h3>
                <p className="text-sm text-gray-600">
                  刪除您的帳號將移除所有相關資料，包括您的個人資料、申請記錄和訊息歷史。
                  此操作無法撤銷，請謹慎操作。
                </p>
              </div>

              {!showDeleteConfirm ? (
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  刪除我的帳號
                </button>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm text-gray-700">
                    請輸入您的電子郵件地址 <span className="font-medium">{session?.user?.email}</span> 以確認刪除
                  </p>
                  <input
                    type="email"
                    value={deleteConfirmation}
                    onChange={(e) => setDeleteConfirmation(e.target.value)}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm"
                    placeholder="您的電子郵件地址"
                  />
                  <div className="flex space-x-3">
                    <button
                      type="button"
                      onClick={handleDeleteAccount}
                      disabled={isDeleting}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isDeleting ? '刪除中...' : '確認刪除帳號'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowDeleteConfirm(false);
                        setDeleteConfirmation('');
                        setErrorMessage('');
                      }}
                      className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                    >
                      取消
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </ProfileLayout>
  );
};

export default SettingsPage;