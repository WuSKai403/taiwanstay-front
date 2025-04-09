import '@/styles/globals.css';
import '../styles/components/TimeSlot.css';
import 'leaflet/dist/leaflet.css';
import { AppProps } from 'next/app';
import { SessionProvider, useSession } from 'next-auth/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { UserRole } from '@/models/enums/UserRole';

// 定義 AuthRedirect 組件的 props 類型
interface AuthRedirectProps {
  Component: React.ComponentType<any>;
  pageProps: any;
}

// 創建一個內部組件來處理重定向邏輯
function AuthRedirect({ Component, pageProps }: AuthRedirectProps) {
  const router = useRouter();

  // 這裡可以安全使用 useSession，因為這個組件在 SessionProvider 內部
  const { data: session, status } = useSession();

  // 管理員自動轉導邏輯
  useEffect(() => {
    if (status === 'authenticated' &&
        (session?.user?.role === UserRole.ADMIN ||
         session?.user?.role === UserRole.SUPER_ADMIN) &&
        router.pathname === '/') {
      router.push('/admin');
    }
  }, [session, status, router]);

  return <Component {...pageProps} />;
}

export default function App({
  Component,
  pageProps: { session, ...pageProps }
}: AppProps) {
  // 確保QueryClient在每個請求中初始化一次
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        refetchOnWindowFocus: false,
        retry: false,
        staleTime: 1000 * 60 * 5, // 5 minutes
      },
    },
  }));

  // 懶加載 DevTools 以避免 SSR 問題
  const [showDevtools, setShowDevtools] = useState(false);

  useEffect(() => {
    // 確保只在客戶端和開發環境下載入
    if (process.env.NODE_ENV !== 'production') {
      setShowDevtools(true);
    }
  }, []);

  return (
    <SessionProvider session={session}>
      <QueryClientProvider client={queryClient}>
        <AuthRedirect Component={Component} pageProps={pageProps} />
        {showDevtools && (
          <div suppressHydrationWarning>
            {typeof window !== 'undefined' && process.env.NODE_ENV !== 'production' && (
              <DynamicDevtools />
            )}
          </div>
        )}
      </QueryClientProvider>
    </SessionProvider>
  );
}

// 動態導入 DevTools 組件以避免服務端渲染問題
function DynamicDevtools() {
  const [DevtoolsComponent, setDevtoolsComponent] = useState<any>(null);

  useEffect(() => {
    const loadDevtools = async () => {
      try {
        const { ReactQueryDevtools } = await import('@tanstack/react-query-devtools');
        setDevtoolsComponent(() => ReactQueryDevtools);
      } catch (error) {
        console.error('無法載入 React Query DevTools:', error);
      }
    };

    loadDevtools();
  }, []);

  return DevtoolsComponent ? <DevtoolsComponent initialIsOpen={false} /> : null;
}
