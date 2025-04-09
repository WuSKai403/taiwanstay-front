import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { UserRole } from '@/models/enums/UserRole';
import { HostStatus } from '@/models/enums/HostStatus';
import {
  CheckIcon,
  XMarkIcon,
  ClockIcon,
  NoSymbolIcon,
  ArrowLeftIcon,
  ArrowPathIcon,
  EyeIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import { zhTW } from 'date-fns/locale';
import mongoose from 'mongoose';

// 定義主辦方資料介面
interface IHost {
  _id: mongoose.Types.ObjectId | string;
  userId: mongoose.Types.ObjectId | string;
  name: string;
  slug: string;
  description: string;
  status: HostStatus;
  statusNote?: string;
  type: string;
  category: string;
  verified: boolean;
  verifiedAt?: Date;
  contactInfo: {
    email: string;
    phone?: string;
    website?: string;
    socialMedia?: {
      facebook?: string;
      instagram?: string;
      line?: string;
      [key: string]: string | undefined;
    };
  };
  location: {
    address: string;
    city: string;
    district?: string;
    zipCode?: string;
    country: string;
    coordinates?: {
      type: string;
      coordinates: number[];
    };
  };
  media?: {
    logo?: string;
    coverImage?: string;
    gallery?: string[];
    videos?: string[];
  };
  createdAt: Date;
  updatedAt: Date;
}

// 狀態標籤組件
const StatusBadge = ({ status }: { status: HostStatus }) => {
  const statusConfig = {
    [HostStatus.PENDING]: { text: '待審核', bgColor: 'bg-yellow-100', textColor: 'text-yellow-800' },
    [HostStatus.ACTIVE]: { text: '活躍中', bgColor: 'bg-green-100', textColor: 'text-green-800' },
    [HostStatus.INACTIVE]: { text: '暫停中', bgColor: 'bg-gray-100', textColor: 'text-gray-800' },
    [HostStatus.REJECTED]: { text: '已拒絕', bgColor: 'bg-red-100', textColor: 'text-red-800' },
    [HostStatus.SUSPENDED]: { text: '已暫停', bgColor: 'bg-purple-100', textColor: 'text-purple-800' }
  };

  const config = statusConfig[status] || { text: '未知', bgColor: 'bg-gray-100', textColor: 'text-gray-800' };

  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.bgColor} ${config.textColor}`}>
      {config.text}
    </span>
  );
};

export default function AdminHosts() {
  const router = useRouter();
  const { data: session, status: sessionStatus } = useSession();
  const [hosts, setHosts] = useState<IHost[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [filter, setFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);

  // 載入主辦方資料
  useEffect(() => {
    if (typeof window !== 'undefined' && session) {
      // 檢查用戶權限
      if (session?.user?.role !== UserRole.ADMIN && session?.user?.role !== UserRole.SUPER_ADMIN) {
        router.push('/');
        return;
      }

      fetchHosts();
    }
  }, [session, router, filter, searchTerm, currentPage]);

  const fetchHosts = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/admin/hosts?status=${filter}&search=${searchTerm}&page=${currentPage}`
      );
      if (response.ok) {
        const data = await response.json();
        setHosts(data.hosts);
        setTotalPages(data.totalPages);
      }
    } catch (error) {
      console.error('獲取主辦方資料失敗', error);
    } finally {
      setLoading(false);
    }
  };

  // 處理狀態更新
  const handleStatusUpdate = async (hostId: string, newStatus: HostStatus) => {
    if (!confirm(`確定要將主辦方狀態變更為${newStatus === HostStatus.ACTIVE ? '活躍' : newStatus === HostStatus.REJECTED ? '拒絕' : '暫停'}嗎？`)) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/hosts/${hostId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        // 更新狀態成功後重新獲取資料
        fetchHosts();
      } else {
        const errorData = await response.json();
        alert(`更新失敗: ${errorData.message}`);
      }
    } catch (error) {
      console.error('更新主辦方狀態失敗', error);
      alert('更新主辦方狀態時發生錯誤，請稍後再試。');
    }
  };

  // 處理搜尋
  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setCurrentPage(1); // 搜尋時重置為第一頁
  };

  // 處理登入狀態
  if (sessionStatus === 'loading') {
    return <div className="min-h-screen flex items-center justify-center">載入中...</div>;
  }

  if (!session || (session?.user?.role !== UserRole.ADMIN && session?.user?.role !== UserRole.SUPER_ADMIN)) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <h1 className="text-2xl font-bold mb-4">無權限訪問</h1>
        <p className="mb-6">您沒有管理員權限，無法訪問此頁面。</p>
        <Link href="/" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
          返回首頁
        </Link>
      </div>
    );
  }

  // 過濾主辦方列表
  const filteredHosts = filter === 'all' ? hosts : hosts.filter(host => host.status === filter);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <Link href="/admin" className="flex items-center text-gray-600 hover:text-gray-900">
              <ArrowLeftIcon className="h-4 w-4 mr-1" />
              返回管理後台
            </Link>
            <h1 className="text-3xl font-bold text-gray-900 mt-2">主辦方管理</h1>
          </div>
          <button
            onClick={fetchHosts}
            className="flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <ArrowPathIcon className="h-4 w-4 mr-2" />
            刷新資料
          </button>
        </div>

        {/* 過濾與搜尋 */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 space-y-4 sm:space-y-0">
          <div className="flex space-x-2">
            <button
              className={`px-4 py-2 rounded-md text-sm font-medium ${filter === 'all' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
              onClick={() => setFilter('all')}
            >
              全部
            </button>
            <button
              className={`px-4 py-2 rounded-md text-sm font-medium ${filter === HostStatus.PENDING ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
              onClick={() => setFilter(HostStatus.PENDING)}
            >
              待審核
            </button>
            <button
              className={`px-4 py-2 rounded-md text-sm font-medium ${filter === HostStatus.ACTIVE ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
              onClick={() => setFilter(HostStatus.ACTIVE)}
            >
              活躍中
            </button>
            <button
              className={`px-4 py-2 rounded-md text-sm font-medium ${filter === HostStatus.INACTIVE ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
              onClick={() => setFilter(HostStatus.INACTIVE)}
            >
              暫停中
            </button>
          </div>

          <form onSubmit={handleSearch} className="relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="搜尋主辦方名稱或電子郵件"
              className="w-64 px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
            <button
              type="submit"
              className="absolute right-0 top-0 h-full px-3 text-gray-500 hover:text-gray-700"
            >
              <MagnifyingGlassIcon className="h-5 w-5" />
            </button>
          </form>
        </div>

        {/* 主辦方資料表格 */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          {loading ? (
            <div className="p-8 flex justify-center">
              <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-600"></div>
            </div>
          ) : filteredHosts.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <p>無符合條件的主辦方資料</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      主辦方資訊
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      聯絡資料
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      申請日期
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      狀態
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      操作
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredHosts.map((host) => (
                    <tr key={host._id.toString()} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            {host.media?.logo ? (
                              <img
                                className="h-10 w-10 rounded-full object-cover"
                                src={host.media.logo}
                                alt={host.name}
                              />
                            ) : (
                              <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500">
                                {host.name.charAt(0).toUpperCase()}
                              </div>
                            )}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{host.name}</div>
                            <div className="text-sm text-gray-500">{host.contactInfo.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{host.contactInfo?.email}</div>
                        <div className="text-sm text-gray-500">{host.contactInfo?.phone || '無電話'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {format(new Date(host.createdAt), 'yyyy/MM/dd', { locale: zhTW })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <StatusBadge status={host.status} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          <Link href={`/admin/hosts/${host._id.toString()}`} className="text-blue-600 hover:text-blue-900">
                            <EyeIcon className="h-5 w-5" />
                          </Link>

                          {host.status === HostStatus.PENDING && (
                            <>
                              <button
                                onClick={() => handleStatusUpdate(host._id.toString(), HostStatus.ACTIVE)}
                                className="text-green-600 hover:text-green-900"
                              >
                                <CheckIcon className="h-5 w-5" />
                              </button>
                              <button
                                onClick={() => handleStatusUpdate(host._id.toString(), HostStatus.REJECTED)}
                                className="text-red-600 hover:text-red-900"
                              >
                                <XMarkIcon className="h-5 w-5" />
                              </button>
                            </>
                          )}

                          {host.status === HostStatus.ACTIVE && (
                            <button
                              onClick={() => handleStatusUpdate(host._id.toString(), HostStatus.INACTIVE)}
                              className="text-gray-600 hover:text-gray-900"
                            >
                              <NoSymbolIcon className="h-5 w-5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* 分頁控制 */}
        {totalPages > 1 && (
          <div className="mt-5 flex justify-between items-center">
            <div className="text-sm text-gray-700">
              顯示第 <span className="font-medium">{currentPage}</span> 頁，共 <span className="font-medium">{totalPages}</span> 頁
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className={`px-4 py-2 border rounded-md text-sm font-medium ${
                  currentPage === 1
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                上一頁
              </button>
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className={`px-4 py-2 border rounded-md text-sm font-medium ${
                  currentPage === totalPages
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                下一頁
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}