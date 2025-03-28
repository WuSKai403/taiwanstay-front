import '@/styles/globals.css';
import '../styles/components/TimeSlot.css';
import 'leaflet/dist/leaflet.css';
import { AppProps } from 'next/app';
import { SessionProvider } from 'next-auth/react';
import QueryProvider from '@/components/providers/QueryProvider';

export default function App({
  Component,
  pageProps: { session, ...pageProps }
}: AppProps) {
  return (
    <SessionProvider session={session}>
      <QueryProvider>
        <Component {...pageProps} />
      </QueryProvider>
    </SessionProvider>
  );
}
