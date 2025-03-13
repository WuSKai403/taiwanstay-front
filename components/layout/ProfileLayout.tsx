import { ReactNode } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import Layout from './Layout';

interface ProfileLayoutProps {
  children: ReactNode;
}

const ProfileLayout = ({ children }: ProfileLayoutProps) => {
  const router = useRouter();
  const { data: session } = useSession();

  // 側邊欄導航項目
  const navItems = [
    { label: '個人資料', href: '/profile' },
    { label: '我的申請', href: '/profile/applications' },
    { label: '我的收藏', href: '/profile/bookmarks' },
    { label: '通知設定', href: '/profile/notifications' },
    { label: '帳號設定', href: '/profile/settings' },
  ];

  return (
    <Layout>
      <Head>
        <title>個人資料 - TaiwanStay</title>
        <meta name="description" content="管理您的個人資料和申請" />
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
                        {session?.user?.name?.charAt(0) || 'U'}
                      </span>
                    </div>
                    <div className="ml-3">
                      <h2 className="text-lg font-semibold">{session?.user?.name || '用戶'}</h2>
                      <p className="text-gray-600 text-sm">{session?.user?.email || ''}</p>
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
                            (item.href !== '/profile' && router.pathname.startsWith(item.href))
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

export default ProfileLayout;