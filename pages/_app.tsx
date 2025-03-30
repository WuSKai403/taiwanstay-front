import '@/styles/globals.css';
import '../styles/components/TimeSlot.css';
import 'leaflet/dist/leaflet.css';
import { AppProps } from 'next/app';
import { SessionProvider } from 'next-auth/react';
import QueryProvider from '@/components/providers/QueryProvider';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

// 創建一個 client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: false,
      staleTime: 1000 * 60 * 5, // 5 minutes
    },
  },
});

export default function App({
  Component,
  pageProps: { session, ...pageProps }
}: AppProps) {
  return (
    <SessionProvider session={session}>
      <QueryClientProvider client={queryClient}>
        <QueryProvider>
          <Component {...pageProps} />
        </QueryProvider>
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    </SessionProvider>
  );
}
