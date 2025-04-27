import { ReactNode, useState, useEffect } from 'react';
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
  const [expandedItems, setExpandedItems] = useState<string[]>(['opportunities']);

  // 切換展開狀態
  const toggleExpanded = (key: string) => {
    if (expandedItems.includes(key)) {
      setExpandedItems(expandedItems.filter(item => item !== key));
    } else {
      setExpandedItems([...expandedItems, key]);
    }
  };

  // 側邊欄導航項目 - 根據新的流程圖更新
  const navItems = [
    {
      key: 'dashboard',
      label: '儀表板',
      href: `/hosts/${hostId}/dashboard`,
      icon: (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"></path>
        </svg>
      ),
      children: []
    },
    {
      key: 'profile',
      label: '主人資料',
      href: `/hosts/${hostId}/profile`,
      icon: (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
        </svg>
      ),
      children: []
    },
    {
      key: 'opportunities',
      label: '工作機會管理',
      href: `/hosts/${hostId}/opportunities`,
      icon: (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
        </svg>
      ),
      children: [
        {
          key: 'opportunities-list',
          label: '機會列表',
          href: `/hosts/${hostId}/opportunities`,
          icon: (
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 10h16M4 14h16M4 18h16"></path>
            </svg>
          )
        },
        {
          key: 'opportunities-new',
          label: '新增機會',
          href: `/hosts/${hostId}/opportunities/new/edit`,
          icon: (
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
            </svg>
          )
        }
      ]
    },
    {
      key: 'applications',
      label: '申請管理',
      href: `/hosts/${hostId}/applications`,
      icon: (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
        </svg>
      ),
      children: []
    },
    {
      key: 'reviews',
      label: '評價管理',
      href: `/hosts/${hostId}/reviews`,
      icon: (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"></path>
        </svg>
      ),
      children: []
    },
    {
      key: 'stats',
      label: '統計數據',
      href: `/hosts/${hostId}/stats`,
      icon: (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
        </svg>
      ),
      children: []
    },
    {
      key: 'settings',
      label: '設定',
      href: `/hosts/${hostId}/settings`,
      icon: (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
        </svg>
      ),
      children: []
    },
  ];

  // 檢查當前路徑是否匹配導航項目
  const isPathActive = (path: string) => {
    // 基本路徑匹配
    if (router.pathname === path) return true;

    // 特殊情況：主人資料頁面
    if (path === `/hosts/${hostId}/profile` &&
       (router.pathname === `/hosts/${hostId}/profile` || router.pathname === `/hosts/${hostId}`)) return true;

    return false;
  };

  // 檢查子路徑是否匹配
  const isChildPathActive = (path: string) => {
    return router.pathname === path ||
           router.asPath.startsWith(path) ||
           (path.includes('new/edit') && router.pathname.includes('new/edit'));
  };

  // 判斷主菜單項是否應該被高亮顯示
  const shouldHighlightParent = (item: any) => {
    // 如果當前路徑與主菜單項路徑匹配
    if (isPathActive(item.href)) return true;

    // 如果當前路徑與任何子項匹配
    if (item.children && item.children.length > 0) {
      return item.children.some((child: any) => isChildPathActive(child.href));
    }

    // 特殊情況處理
    if (item.key === 'opportunities' && router.pathname.includes('opportunities')) {
      return true;
    }

    return false;
  };

  // 自動展開包含當前路徑的菜單
  useEffect(() => {
    if (!router.isReady) return;

    const currentPath = router.pathname;

    navItems.forEach(item => {
      if (item.children && item.children.length > 0) {
        const hasActiveChild = item.children.some(child =>
          currentPath === child.href || currentPath.includes(item.key)
        );
        if (hasActiveChild && !expandedItems.includes(item.key)) {
          setExpandedItems(prev => [...prev, item.key]);
        }
      }
    });
  }, [router.isReady, router.pathname, expandedItems, navItems]);

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
                      <li key={item.key} className="mb-2">
                        {/* 主菜單項 */}
                        <div>
                          <Link
                            href={item.href}
                            className={`flex items-center px-4 py-2 rounded-md ${
                              shouldHighlightParent(item)
                                ? 'bg-primary-50 text-primary-600 font-medium'
                                : 'text-gray-700 hover:bg-gray-50'
                            }`}
                            onClick={item.children.length > 0 ? (e) => {
                              if (item.children.length > 0) {
                                e.preventDefault();
                                toggleExpanded(item.key);
                              }
                            } : undefined}
                          >
                            <span className="mr-3">{item.icon}</span>
                            {item.label}
                            {item.children.length > 0 && (
                              <svg
                                className={`ml-auto h-5 w-5 transform transition-transform ${expandedItems.includes(item.key) ? 'rotate-90' : ''}`}
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                              </svg>
                            )}
                          </Link>
                        </div>

                        {/* 子菜單項 */}
                        {item.children.length > 0 && expandedItems.includes(item.key) && (
                          <ul className="mt-1 pl-8 space-y-1">
                            {item.children.map((child: any) => (
                              <li key={child.key}>
                                <Link
                                  href={child.href}
                                  className={`flex items-center px-4 py-2 text-sm rounded-md ${
                                    isChildPathActive(child.href)
                                      ? 'bg-primary-50 text-primary-600 font-medium'
                                      : 'text-gray-700 hover:bg-gray-50'
                                  }`}
                                >
                                  <span className="mr-2">{child.icon}</span>
                                  {child.label}
                                </Link>
                              </li>
                            ))}
                          </ul>
                        )}
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