import { useState, useEffect } from 'react';
import { signIn, useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { GitHubIcon } from '../../components/icons';
import Layout from '../../components/layout/Layout';

export default function SignUp() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const { callbackUrl } = router.query;

  // 如果已登入，重定向到回調 URL 或首頁
  useEffect(() => {
    if (status === 'authenticated') {
      router.push((callbackUrl as string) || '/profile');
    }
  }, [status, router, callbackUrl]);

  // 處理 GitHub 註冊
  const handleGitHubSignUp = async () => {
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

  if (status === 'loading' || status === 'authenticated') {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <Layout title="註冊 - TaiwanStay">
      <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-gray-50">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">註冊新帳戶</h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            或{' '}
            <Link
              href="/auth/signin"
              className="font-medium text-primary-600 hover:text-primary-500"
            >
              登入現有帳戶
            </Link>
          </p>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
            <div className="space-y-6">
              <div>
                <button
                  onClick={handleGitHubSignUp}
                  disabled={isLoading}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gray-800 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                >
                  <GitHubIcon className="h-5 w-5 mr-2" />
                  使用 GitHub 註冊
                </button>
              </div>

              <div className="mt-6">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-gray-500">或使用電子郵件註冊</span>
                  </div>
                </div>

                <div className="mt-6">
                  <p className="text-center text-sm text-gray-500">
                    電子郵件註冊功能即將推出，敬請期待！
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}