import '@/styles/globals.css';
import '../styles/components/TimeSlot.css';
import 'leaflet/dist/leaflet.css';
import { AppProps } from 'next/app';
import { SessionProvider } from 'next-auth/react';

export default function MyApp({
  Component,
  pageProps: { session, ...pageProps }
}: AppProps) {
  return (
    <SessionProvider session={session}>
      <Component {...pageProps} />
    </SessionProvider>
  );
}
