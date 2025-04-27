import { ReactNode, useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import Head from 'next/head';
import { UserRole } from '@/models/enums/UserRole';
import {
  UserIcon,
  Squares2X2Icon,
  BriefcaseIcon,
  ClipboardDocumentCheckIcon,
  BellIcon,
  ChartPieIcon,
  Cog6ToothIcon,
  UserCircleIcon,
  Bars3Icon,
  XMarkIcon
} from '@heroicons/react/24/outline';

// classNames 函數：合併條件式的 className 字符串
function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

// 側邊欄導航項目
const sidebarItems = [
  { name: '儀表板', href: '/admin', icon: ChartPieIcon, currentPath: '/admin' },
  { name: '申請管理', href: '/admin/applications', icon: ClipboardDocumentCheckIcon, currentPath: '/admin/applications' },
  { name: '主辦方管理', href: '/admin/hosts', icon: BriefcaseIcon, currentPath: '/admin/hosts' },
  { name: '用戶管理', href: '/admin/users', icon: UserIcon, currentPath: '/admin/users' },
  { name: '機會管理', href: '/admin/opportunities', icon: Squares2X2Icon, currentPath: '/admin/opportunities' },
  { name: '系統設定', href: '/admin/settings', icon: Cog6ToothIcon, currentPath: '/admin/settings' }
];

interface AdminLayoutProps {
  children: ReactNode;
  title?: string;
  description?: string;
}

export default function AdminLayout({ children, title = '管理中心', description = 'TaiwanStay 管理中心' }: AdminLayoutProps) {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);

  // 權限檢查
  useEffect(() => {
    if (status === 'authenticated' &&
        session?.user?.role !== UserRole.ADMIN &&
        session?.user?.role !== UserRole.SUPER_ADMIN) {
      router.push('/');
    }
  }, [session, status, router]);

  // 登出
  const handleLogout = () => {
    router.push('/api/auth/signout');
  };

  // 載入中狀態
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="w-16 h-16 border-t-4 border-blue-600 border-solid rounded-full animate-spin"></div>
      </div>
    );
  }

  // 權限不足
  if (!session || (session?.user?.role !== UserRole.ADMIN && session?.user?.role !== UserRole.SUPER_ADMIN)) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100">
        <h1 className="text-2xl font-bold mb-4">無權限訪問</h1>
        <p className="mb-6">您沒有管理員權限，無法訪問管理中心。</p>
        <Link href="/" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">返回首頁</Link>
      </div>
    );
  }

  // 當前路徑
  const currentPath = router.pathname;

  return (
    <>
      <Head>
        <title>{title} - TaiwanStay</title>
        <meta name="description" content={description} />
      </Head>

      <div className="h-screen flex overflow-hidden bg-gray-100">
        {/* 移動端側邊欄 */}
        <div className={`fixed inset-0 flex z-40 lg:hidden ${showMobileSidebar ? '' : 'hidden'}`} role="dialog" aria-modal="true">
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75" aria-hidden="true" onClick={() => setShowMobileSidebar(false)}></div>
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white focus:outline-none">
            <div className="absolute top-0 right-0 -mr-12 pt-2">
              <button
                type="button"
                className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                onClick={() => setShowMobileSidebar(false)}
              >
                <span className="sr-only">關閉側邊欄</span>
                <XMarkIcon className="h-6 w-6 text-white" aria-hidden="true" />
              </button>
            </div>
            <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
              <div className="flex-shrink-0 flex items-center px-4">
                <span className="text-2xl font-bold text-blue-600">TaiwanStay</span>
              </div>
              <nav className="mt-5 px-2 space-y-1">
                {sidebarItems.map((item) => (
                  <Link key={item.name} href={item.href} className={classNames(
                    currentPath === item.currentPath
                      ? 'bg-gray-100 text-gray-900'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
                    'group flex items-center px-2 py-2 text-base font-medium rounded-md'
                  )}>
                    <item.icon
                      className={classNames(
                        currentPath === item.currentPath ? 'text-gray-500' : 'text-gray-400 group-hover:text-gray-500',
                        'mr-4 h-6 w-6'
                      )}
                      aria-hidden="true"
                    />
                    {item.name}
                  </Link>
                ))}
              </nav>
            </div>
            <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
              <button
                onClick={handleLogout}
                className="flex-shrink-0 group block w-full flex items-center"
              >
                <div className="flex-shrink-0">
                  <UserCircleIcon className="h-10 w-10 text-gray-400" />
                </div>
                <div className="ml-3">
                  <p className="text-base font-medium text-gray-700 group-hover:text-gray-900">
                    {session.user.name}
                  </p>
                  <p className="text-sm font-medium text-gray-500 group-hover:text-gray-700">
                    登出
                  </p>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* 桌面端側邊欄 */}
        <div className="hidden lg:flex lg:flex-shrink-0">
          <div className="flex flex-col w-64">
            <div className="flex-1 flex flex-col min-h-0 border-r border-gray-200 bg-white">
              <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
                <div className="flex items-center flex-shrink-0 px-4">
                  <span className="text-2xl font-bold text-blue-600">TaiwanStay</span>
                </div>
                <nav className="mt-5 flex-1 px-2 bg-white space-y-1">
                  {sidebarItems.map((item) => (
                    <Link key={item.name} href={item.href} className={classNames(
                      currentPath === item.currentPath
                        ? 'bg-gray-100 text-gray-900'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
                      'group flex items-center px-2 py-2 text-sm font-medium rounded-md'
                    )}>
                      <item.icon
                        className={classNames(
                          currentPath === item.currentPath ? 'text-gray-500' : 'text-gray-400 group-hover:text-gray-500',
                          'mr-3 flex-shrink-0 h-6 w-6'
                        )}
                        aria-hidden="true"
                      />
                      {item.name}
                    </Link>
                  ))}
                </nav>
              </div>
              <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
                <button
                  onClick={handleLogout}
                  className="flex-shrink-0 w-full group block"
                >
                  <div className="flex items-center">
                    <div>
                      <UserCircleIcon className="h-9 w-9 text-gray-400" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-700 group-hover:text-gray-900">
                        {session.user.name}
                      </p>
                      <p className="text-xs font-medium text-gray-500 group-hover:text-gray-700">
                        登出
                      </p>
                    </div>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 主內容區域 */}
        <div className="flex flex-col w-0 flex-1 overflow-hidden">
          <div className="relative z-10 flex-shrink-0 flex h-16 bg-white shadow">
            <button
              type="button"
              className="px-4 border-r border-gray-200 text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 lg:hidden"
              onClick={() => setShowMobileSidebar(true)}
            >
              <span className="sr-only">打開側邊欄</span>
              <Bars3Icon className="h-6 w-6" aria-hidden="true" />
            </button>
            <div className="flex-1 px-4 flex justify-between">
              <div className="flex-1 flex">
                <h1 className="text-xl font-semibold text-gray-900 my-auto">{title}</h1>
              </div>
              <div className="ml-4 flex items-center md:ml-6">
                <button
                  type="button"
                  className="bg-white p-1 rounded-full text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <span className="sr-only">查看通知</span>
                  <BellIcon className="h-6 w-6" aria-hidden="true" />
                </button>
              </div>
            </div>
          </div>

          <main className="flex-1 relative overflow-y-auto focus:outline-none">
            <div className="py-6">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
                {children}
              </div>
            </div>
          </main>
        </div>
      </div>
    </>
  );
}