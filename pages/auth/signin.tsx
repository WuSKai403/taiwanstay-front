import { useState, useEffect } from 'react';
import { signIn, useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { GitHubIcon } from '../../components/icons';
import Layout from '../../components/layout/Layout';
import Head from 'next/head';
import Image from 'next/image';

export default function SignIn() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { callbackUrl } = router.query;

  // 如果已登入，重定向到回調 URL 或首頁
  useEffect(() => {
    if (status === 'authenticated') {
      router.push((callbackUrl as string) || '/profile');
    }
  }, [status, router, callbackUrl]);

  // 處理電子郵件密碼登入
  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError(result.error);
      } else {
        router.push((callbackUrl as string) || '/profile');
      }
    } catch (error) {
      setError('登入過程中發生錯誤');
    } finally {
      setIsLoading(false);
    }
  };

  // 處理 GitHub 登入
  const handleGitHubSignIn = async () => {
    setIsLoading(true);
    try {
      await signIn('github', {
        callbackUrl: (callbackUrl as string) || '/profile',
        redirect: true
      });
    } catch (error) {
      console.error('登入錯誤:', error);
      setIsLoading(false);
    }
  };

  // 測試登入函數
  const handleTestLogin = async () => {
    const result = await signIn('credentials', {
      email: 'test@example.com',
      password: 'password',
      redirect: true,
      callbackUrl: callbackUrl as string || '/'
    });
  };

  if (status === 'loading' || status === 'authenticated') {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>登入 - TaiwanStay</title>
      </Head>

      <Layout title="登入 - TaiwanStay">
        <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-gray-50">
          <div className="sm:mx-auto sm:w-full sm:max-w-md">
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">登入您的帳戶</h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              或{' '}
              <Link
                href="/auth/signup"
                className="font-medium text-primary-600 hover:text-primary-500"
              >
                註冊新帳戶
              </Link>
            </p>
          </div>

          <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
            <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
              <form onSubmit={handleEmailSignIn} className="space-y-6">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    電子郵件
                  </label>
                  <div className="mt-1">
                    <input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                    密碼
                  </label>
                  <div className="mt-1">
                    <input
                      id="password"
                      name="password"
                      type="password"
                      autoComplete="current-password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                    />
                  </div>
                  <div className="mt-2 text-right">
                    <Link
                      href="/auth/forgot-password"
                      className="text-sm font-medium text-primary-600 hover:text-primary-500"
                    >
                      忘記密碼？
                    </Link>
                  </div>
                </div>

                {error && (
                  <div className="text-red-600 text-sm">{error}</div>
                )}

                <div>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                  >
                    {isLoading ? '登入中...' : '登入'}
                  </button>
                </div>
              </form>

              <div className="mt-6">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-gray-500">或使用其他方式登入</span>
                  </div>
                </div>

                <div className="mt-6">
                  <button
                    onClick={handleGitHubSignIn}
                    disabled={isLoading}
                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gray-800 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                  >
                    <GitHubIcon className="h-5 w-5 mr-2" />
                    使用 GitHub 登入
                  </button>
                </div>
              </div>

              {/* 開發環境測試登入按鈕 */}
              {process.env.NODE_ENV === 'development' && (
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-gray-50 text-gray-500">開發環境測試</span>
                  </div>
                </div>
              )}

              {process.env.NODE_ENV === 'development' && (
                <button
                  onClick={handleTestLogin}
                  className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2-1M4 7l2 1M4 7v2.5M12 21l-2-1m2 1l2-1m-2 1v-2.5M6 18l-2-1v-2.5M18 18l2-1v-2.5"></path>
                  </svg>
                  使用測試帳號登入
                </button>
              )}
            </div>
          </div>
        </div>
      </Layout>
    </>
  );
}