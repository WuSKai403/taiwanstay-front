import { NextPage } from 'next';
import { useRouter } from 'next/router';
import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import Head from 'next/head';

// 錯誤代碼映射表
const errorMessages: Record<string, string> = {
  'Configuration': '系統配置錯誤，請聯絡管理員',
  'AccessDenied': '您沒有權限訪問此頁面',
  'Verification': '驗證連結無效或已過期',
  'OAuthSignin': '第三方登入時發生錯誤',
  'OAuthCallback': '第三方登入回調錯誤',
  'OAuthCreateAccount': '無法使用第三方帳號創建用戶',
  'EmailCreateAccount': '無法使用電子郵件創建用戶',
  'Callback': '回調處理發生錯誤',
  'OAuthAccountNotLinked': '此電子郵件已經使用其他登入方式註冊',
  'EmailSignin': '發送電子郵件時出錯',
  'CredentialsSignin': '登入失敗，請確認您的電子郵件和密碼是否正確',
  'SessionRequired': '請先登入以訪問此頁面',
  'undefined': '發生未知錯誤，請重試', // 特別處理 undefined 錯誤
  'Default': '登入時發生錯誤'
};

const AuthErrorPage: NextPage = () => {
  const router = useRouter();
  const { error } = router.query;
  const [errorMessage, setErrorMessage] = useState<string>('');
  // 使用 useRef 防止無限渲染
  const initialRenderDone = useRef(false);

  useEffect(() => {
    // 防止循環重定向和無限渲染
    if (initialRenderDone.current) {
      return;
    }
    initialRenderDone.current = true;

    // 從URL中提取錯誤代碼
    let errorCode = '';
    if (error === undefined || error === 'undefined') {
      errorCode = 'undefined'; // 特殊處理 undefined
    } else if (typeof error === 'string') {
      errorCode = error;
    }

    // 查找對應的錯誤消息
    const message = errorMessages[errorCode] || errorMessages.Default;
    setErrorMessage(message);

    // 記錄錯誤以便調試
    console.log('認證錯誤:', { errorCode, message });

    // 修正 URL 以避免循環重定向
    // 如果 URL 中有 error=undefined，則移除查詢參數
    if (error === 'undefined' && typeof window !== 'undefined') {
      // 使用 replaceState 無聲更新 URL 而不觸發重定向
      window.history.replaceState(
        {},
        document.title,
        window.location.pathname
      );
    }
  }, [error]);

  return (
    <>
      <Head>
        <title>登入錯誤 - TaiwanStay</title>
      </Head>
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              登入失敗
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              {errorMessage}
            </p>
          </div>
          <div className="flex flex-col space-y-4">
            <Link
              href="/auth/signin"
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              返回登入頁面
            </Link>
            <Link
              href="/"
              className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              返回首頁
            </Link>
          </div>
        </div>
      </div>
    </>
  );
};

export default AuthErrorPage;