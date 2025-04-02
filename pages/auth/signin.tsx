import { useState, useEffect } from 'react';
import { signIn, useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Link from 'next/link';
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
      router.push(callbackUrl ? decodeURIComponent(callbackUrl as string) : '/');
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
        router.push(callbackUrl ? decodeURIComponent(callbackUrl as string) : '/');
      }
    } catch (error) {
      setError('登入時發生錯誤');
    } finally {
      setIsLoading(false);
    }
  };

  // 處理第三方登入
  const handleProviderSignIn = async (provider: string) => {
    setIsLoading(true);
    try {
      await signIn(provider, {
        callbackUrl: callbackUrl ? decodeURIComponent(callbackUrl as string) : '/',
        redirect: true
      });
    } catch (error) {
      console.error(`${provider} 登入錯誤:`, error);
      setIsLoading(false);
    }
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

                <div className="mt-6 space-y-3">
                  {/* Google 登入 */}
                  <button
                    onClick={() => handleProviderSignIn('google')}
                    disabled={isLoading}
                    className="w-full flex justify-center items-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                  >
                    <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <g transform="matrix(1, 0, 0, 1, 27.009001, -39.238998)">
                        <path fill="#4285F4" d="M -3.264 51.509 C -3.264 50.719 -3.334 49.969 -3.454 49.239 L -14.754 49.239 L -14.754 53.749 L -8.284 53.749 C -8.574 55.229 -9.424 56.479 -10.684 57.329 L -10.684 60.329 L -6.824 60.329 C -4.564 58.239 -3.264 55.159 -3.264 51.509 Z"/>
                        <path fill="#34A853" d="M -14.754 63.239 C -11.514 63.239 -8.804 62.159 -6.824 60.329 L -10.684 57.329 C -11.764 58.049 -13.134 58.489 -14.754 58.489 C -17.884 58.489 -20.534 56.379 -21.484 53.529 L -25.464 53.529 L -25.464 56.619 C -23.494 60.539 -19.444 63.239 -14.754 63.239 Z"/>
                        <path fill="#FBBC05" d="M -21.484 53.529 C -21.734 52.809 -21.864 52.039 -21.864 51.239 C -21.864 50.439 -21.724 49.669 -21.484 48.949 L -21.484 45.859 L -25.464 45.859 C -26.284 47.479 -26.754 49.299 -26.754 51.239 C -26.754 53.179 -26.284 54.999 -25.464 56.619 L -21.484 53.529 Z"/>
                        <path fill="#EA4335" d="M -14.754 43.989 C -12.984 43.989 -11.404 44.599 -10.154 45.789 L -6.734 42.369 C -8.804 40.429 -11.514 39.239 -14.754 39.239 C -19.444 39.239 -23.494 41.939 -25.464 45.859 L -21.484 48.949 C -20.534 46.099 -17.884 43.989 -14.754 43.989 Z"/>
                      </g>
                    </svg>
                    使用 Google 登入
                  </button>

                  {/* Facebook 登入 */}
                  <button
                    onClick={() => handleProviderSignIn('facebook')}
                    disabled={isLoading}
                    className="w-full flex justify-center items-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-white bg-[#1877F2] hover:bg-[#166FE5] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1877F2]"
                  >
                    <svg className="h-5 w-5 mr-2" fill="white" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                    </svg>
                    使用 Facebook 登入
                  </button>

                  {/* Apple 登入 */}
                  <button
                    onClick={() => handleProviderSignIn('apple')}
                    disabled={isLoading}
                    className="w-full flex justify-center items-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-white bg-black hover:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900"
                  >
                    <svg className="h-5 w-5 mr-2" fill="white" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701"/>
                    </svg>
                    使用 Apple 登入
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    </>
  );
}