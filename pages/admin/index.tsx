import { useState, useEffect } from 'react';
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
  XMarkIcon,
  ArrowDownIcon,
  ArrowUpIcon
} from '@heroicons/react/24/outline';
import AdminLayout from '@/components/layout/AdminLayout';

// classNames 函數：合併條件式的 className 字符串
function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

// 側邊欄導航項目
const sidebarItems = [
  { name: '儀表板', href: '/admin', icon: ChartPieIcon, active: true },
  { name: '申請管理', href: '/admin/applications', icon: ClipboardDocumentCheckIcon },
  { name: '主辦方管理', href: '/admin/hosts', icon: BriefcaseIcon },
  { name: '用戶管理', href: '/admin/users', icon: UserIcon },
  { name: '機會管理', href: '/admin/opportunities', icon: Squares2X2Icon },
  { name: '系統設定', href: '/admin/settings', icon: Cog6ToothIcon }
];

// 統計卡片組件
interface StatisticCardProps {
  title: string;
  value: number;
  previousValue: number;
  icon: React.ElementType;
}

function StatisticCard({ title, value, previousValue, icon: Icon }: StatisticCardProps) {
  const changePercentage = previousValue ? ((value - previousValue) / previousValue) * 100 : 0;
  const isIncrease = changePercentage >= 0;

  return (
    <div className="bg-white overflow-hidden shadow rounded-lg">
      <div className="p-5">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <Icon className="h-6 w-6 text-gray-400" aria-hidden="true" />
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 truncate">{title}</dt>
              <dd>
                <div className="text-lg font-medium text-gray-900">{value}</div>
              </dd>
            </dl>
          </div>
        </div>
      </div>
      <div className="bg-gray-50 px-5 py-3">
        <div className="text-sm">
          <span className="font-medium text-gray-600">與前期相比: </span>
          <span className={`font-medium ${isIncrease ? 'text-green-600' : 'text-red-600'}`}>
            {isIncrease ? (
              <ArrowUpIcon className="inline h-4 w-4" />
            ) : (
              <ArrowDownIcon className="inline h-4 w-4" />
            )}
            {Math.abs(changePercentage).toFixed(2)}%
          </span>
        </div>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [statistics, setStatistics] = useState({
    users: { current: 0, previous: 0 },
    opportunities: { current: 0, previous: 0 },
    applications: { current: 0, previous: 0 },
    hosts: { current: 0, previous: 0 },
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);

  // 獲取統計數據
  useEffect(() => {
    const fetchStatistics = async () => {
      try {
        setIsLoading(true);
        // 這裡應當有真實的 API 調用，現在用模擬數據
        // const response = await fetch('/api/admin/statistics');
        // const data = await response.json();

        // Mocked data
        const data = {
          users: { current: 2456, previous: 2100 },
          opportunities: { current: 178, previous: 150 },
          applications: { current: 540, previous: 600 },
          hosts: { current: 32, previous: 28 },
        };

        setStatistics(data);
        setIsLoading(false);
      } catch (error) {
        console.error('Failed to fetch statistics:', error);
        setError('無法獲取統計數據');
        setIsLoading(false);
      }
    };

    fetchStatistics();
  }, []);

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
  if (status === 'loading' || isLoading) {
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

  return (
    <>
      <Head>
        <title>管理中心 - TaiwanStay</title>
        <meta name="description" content="TaiwanStay 管理中心" />
      </Head>

      <AdminLayout title="儀表板">
        {error ? (
          <div className="bg-red-50 p-4 rounded-md">
            <div className="flex">
              <div className="text-red-700">
                <p className="text-sm">{error}</p>
              </div>
            </div>
          </div>
        ) : (
          <div>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              <StatisticCard
                title="用戶總數"
                value={statistics.users.current}
                previousValue={statistics.users.previous}
                icon={UserIcon}
              />
              <StatisticCard
                title="機會總數"
                value={statistics.opportunities.current}
                previousValue={statistics.opportunities.previous}
                icon={Squares2X2Icon}
              />
              <StatisticCard
                title="申請總數"
                value={statistics.applications.current}
                previousValue={statistics.applications.previous}
                icon={ClipboardDocumentCheckIcon}
              />
              <StatisticCard
                title="主辦方總數"
                value={statistics.hosts.current}
                previousValue={statistics.hosts.previous}
                icon={BriefcaseIcon}
              />
            </div>

            <div className="mt-8">
              <h2 className="text-lg font-medium text-gray-900">最近活動</h2>
              <div className="mt-4 bg-white shadow overflow-hidden sm:rounded-md">
                <ul className="divide-y divide-gray-200">
                  {/* 示例活動項目 */}
                  {[1, 2, 3, 4, 5].map((item) => (
                    <li key={item}>
                      <div className="px-4 py-4 sm:px-6">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-blue-600 truncate">
                            新用戶註冊: User_{item}
                          </p>
                          <div className="ml-2 flex-shrink-0 flex">
                            <p className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                              {item} 小時前
                            </p>
                          </div>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}
      </AdminLayout>
    </>
  );
}