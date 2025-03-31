import { ReactNode, useState } from 'react';
import Head from 'next/head';
import Header from './Header';
import Footer from './Footer';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';

interface LayoutProps {
  children: ReactNode;
  title?: string;
  description?: string;
  showFooter?: boolean;
  showHeader?: boolean;
}

export default function Layout({
  children,
  title = 'TaiwanStay - 台灣以工換宿平台',
  description = '台灣首個專注於本地市場的以工換宿媒合平台，連接旅行者與台灣在地商家和主人',
  showFooter = true,
  showHeader = true
}: LayoutProps) {
  const { status } = useSession();
  const router = useRouter();
  const isLoading = status === 'loading' || router.isFallback;

  if (router.isFallback || isLoading) {
    return (
      <div className="h-screen w-screen flex justify-center items-center bg-neutral-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-neutral-50">
      <Head>
        <title>{title}</title>
        <meta name="description" content={description} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      {showHeader && <Header />}

      <main className="flex-grow">
        {children}
      </main>

      {showFooter && <Footer />}
    </div>
  );
}