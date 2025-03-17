import { useEffect } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { GetServerSidePropsContext } from 'next';

export default function DevLogin() {
  const router = useRouter();
  const { callbackUrl } = router.query;

  useEffect(() => {
    // 自動以測試用戶身份登入
    signIn('credentials', {
      email: 'test@example.com',
      password: 'password',
      redirect: true,
      callbackUrl: callbackUrl as string || '/'
    });
  }, [callbackUrl]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100">
      <Head>
        <title>開發環境登入 - TaiwanStay</title>
      </Head>
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold text-center mb-6">開發環境自動登入</h1>
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
        </div>
        <p className="text-center mt-4 text-gray-600">正在以測試用戶身份登入...</p>
      </div>
    </div>
  );
}

// 確保此頁面僅在開發環境可用
export async function getServerSideProps(context: GetServerSidePropsContext) {
  if (process.env.NODE_ENV !== 'development') {
    return { notFound: true };
  }
  return { props: {} };
}