import { ReactNode } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import Layout from './Layout';

interface HostLayoutProps {
  children: ReactNode;
}

const HostLayout = ({ children }: HostLayoutProps) => {
  const router = useRouter();
  const { data: session } = useSession();
  const { hostId } = router.query;

  // 側邊欄導航項目
  const navItems = [
    { label: '主人資料', href: `/hosts/${hostId}` },
    { label: '工作機會管理', href: `/hosts/${hostId}/opportunities` },
    { label: '申請管理', href: `/hosts/${hostId}/applications` },
    { label: '時段管理', href: `/hosts/${hostId}/timeslots` },
    { label: '評價管理', href: `/hosts/${hostId}/reviews` },
    { label: '統計數據', href: `/hosts/${hostId}/stats` },
    { label: '設定', href: `/hosts/${hostId}/settings` },
  ];

  return (
    <Layout>
      <Head>
        <title>主人中心 - TaiwanStay</title>
        <meta name="description" content="管理您的主人資料和工作機會" />
      </Head>

      <div className="bg-gray-50 min-h-screen py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* 側邊欄 */}
            <div className="md:col-span-1">
              <div className="bg-white shadow-sm rounded-lg overflow-hidden">
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-12 w-12 rounded-full bg-primary-100 flex items-center justify-center">
                      <span className="text-primary-600 font-bold text-xl">
                        {session?.user?.name?.charAt(0) || 'H'}
                      </span>
                    </div>
                    <div className="ml-3">
                      <h2 className="text-lg font-semibold">{session?.user?.name || '主人'}</h2>
                      <p className="text-gray-600 text-sm truncate">{session?.user?.email || ''}</p>
                    </div>
                  </div>
                </div>
                <nav className="p-4">
                  <ul className="space-y-1">
                    {navItems.map((item) => (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          className={`block px-4 py-2 rounded-md ${
                            router.pathname === item.href ||
                            (router.pathname.includes(item.href.split('/').pop() as string) &&
                             item.href !== `/hosts/${hostId}`)
                              ? 'bg-primary-50 text-primary-600 font-medium'
                              : 'text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          {item.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </nav>
              </div>
            </div>

            {/* 主要內容 */}
            <div className="md:col-span-3">
              {children}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default HostLayout;