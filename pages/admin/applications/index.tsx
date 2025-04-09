import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { UserRole } from '@/models/enums/UserRole';
import { ApplicationStatus } from '@/models/enums/ApplicationStatus';
import {
  UserIcon,
  FolderIcon,
  CheckIcon,
  XMarkIcon,
  EyeIcon,
  ArrowLeftIcon,
  ArrowPathIcon,
  DocumentTextIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import { zhTW } from 'date-fns/locale';
import { IApplication } from '@/models/Application';
import mongoose from "mongoose";

// 定義類型
interface IUser {
  _id: string;
  name?: string;
  email?: string;
  image?: string;
  role?: UserRole;
}

interface IHost {
  _id: string;
  name?: string;
}

interface IOpportunity {
  _id: string;
  title?: string;
}

// 使用類型取代而不是擴展來避免衝突
interface ApplicationWithRelations {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  hostId?: mongoose.Types.ObjectId;
  opportunityId?: mongoose.Types.ObjectId;
  status: ApplicationStatus;
  applicationDetails?: {
    startMonth?: string;
    endMonth?: string;
    duration?: number;
    [key: string]: any;
  };
  user?: IUser;
  host?: IHost;
  opportunity?: IOpportunity;
  createdAt: Date;
  updatedAt: Date;
  [key: string]: any;
}

interface StatusConfig {
  text: string;
  bgColor: string;
  textColor: string;
}

// 顏色和文字狀態映射
const statusColorMap = {
  [ApplicationStatus.PENDING]: {
    bg: 'bg-yellow-100',
    text: 'text-yellow-800',
    label: '待審核',
  },
  [ApplicationStatus.ACCEPTED]: {
    bg: 'bg-green-100',
    text: 'text-green-800',
    label: '已接受',
  },
  [ApplicationStatus.REJECTED]: {
    bg: 'bg-red-100',
    text: 'text-red-800',
    label: '已拒絕',
  },
  [ApplicationStatus.ACTIVE]: {
    bg: 'bg-blue-100',
    text: 'text-blue-800',
    label: '進行中',
  },
  [ApplicationStatus.COMPLETED]: {
    bg: 'bg-purple-100',
    text: 'text-purple-800',
    label: '已完成',
  },
  [ApplicationStatus.DRAFT]: {
    bg: 'bg-gray-100',
    text: 'text-gray-800',
    label: '草稿',
  },
};

// 顯示申請狀態的組件
const StatusBadge = ({ status }: { status: ApplicationStatus }) => {
  const { bg, text, label } = statusColorMap[status] || {
    bg: 'bg-gray-100',
    text: 'text-gray-800',
    label: '未知狀態',
  };

  return (
    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${bg} ${text}`}>
      {label}
    </span>
  );
};

export default function AdminApplications() {
  const router = useRouter();
  const { data: session, status: sessionStatus } = useSession();
  const [applications, setApplications] = useState<ApplicationWithRelations[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [filter, setFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);

  // 載入申請資料
  useEffect(() => {
    if (typeof window !== 'undefined' && session) {
      // 檢查用戶權限
      if (session?.user?.role !== UserRole.ADMIN && session?.user?.role !== UserRole.SUPER_ADMIN) {
        router.push('/');
        return;
      }

      fetchApplications();
    }
  }, [session, router, filter, searchTerm, currentPage]);

  const fetchApplications = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/admin/applications?status=${filter}&search=${searchTerm}&page=${currentPage}`
      );
      if (response.ok) {
        const data = await response.json();
        setApplications(data.applications);
        setTotalPages(data.totalPages);
      }
    } catch (error) {
      console.error('獲取申請資料失敗', error);
    } finally {
      setLoading(false);
    }
  };

  // 處理狀態更新
  const handleStatusUpdate = async (applicationId: string, newStatus: ApplicationStatus) => {
    const statusTexts: Record<ApplicationStatus, string> = {
      [ApplicationStatus.ACCEPTED]: '接受',
      [ApplicationStatus.REJECTED]: '拒絕',
      [ApplicationStatus.DRAFT]: '設為草稿',
      [ApplicationStatus.PENDING]: '設為待審核',
      [ApplicationStatus.ACTIVE]: '設為進行中',
      [ApplicationStatus.COMPLETED]: '設為已完成',
    };

    if (!confirm(`確定要${statusTexts[newStatus]}此申請嗎？`)) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/applications/${applicationId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        // 更新狀態成功後重新獲取資料
        fetchApplications();
      } else {
        const errorData = await response.json();
        alert(`更新失敗: ${errorData.message}`);
      }
    } catch (error) {
      console.error('更新申請狀態失敗', error);
      alert('更新申請狀態時發生錯誤，請稍後再試。');
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

  // 過濾申請列表
  const filteredApplications = filter === 'all'
    ? applications
    : applications.filter(application => application.status === filter as ApplicationStatus);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <Link href="/admin" className="flex items-center text-gray-600 hover:text-gray-900">
              <ArrowLeftIcon className="h-4 w-4 mr-1" />
              返回管理後台
            </Link>
            <h1 className="text-3xl font-bold text-gray-900 mt-2">申請管理</h1>
          </div>
          <button
            onClick={fetchApplications}
            className="flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <ArrowPathIcon className="h-4 w-4 mr-2" />
            刷新資料
          </button>
        </div>

        {/* 過濾與搜尋 */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 space-y-4 sm:space-y-0">
          <div className="flex flex-wrap gap-2">
            <button
              className={`px-4 py-2 rounded-md text-sm font-medium ${filter === 'all' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
              onClick={() => setFilter('all')}
            >
              全部
            </button>
            <button
              className={`px-4 py-2 rounded-md text-sm font-medium ${filter === ApplicationStatus.PENDING ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
              onClick={() => setFilter(ApplicationStatus.PENDING)}
            >
              待審核
            </button>
            <button
              className={`px-4 py-2 rounded-md text-sm font-medium ${filter === ApplicationStatus.ACCEPTED ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
              onClick={() => setFilter(ApplicationStatus.ACCEPTED)}
            >
              已接受
            </button>
            <button
              className={`px-4 py-2 rounded-md text-sm font-medium ${filter === ApplicationStatus.REJECTED ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
              onClick={() => setFilter(ApplicationStatus.REJECTED)}
            >
              已拒絕
            </button>
            <button
              className={`px-4 py-2 rounded-md text-sm font-medium ${filter === ApplicationStatus.ACTIVE ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
              onClick={() => setFilter(ApplicationStatus.ACTIVE)}
            >
              進行中
            </button>
          </div>

          <form onSubmit={handleSearch} className="relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="搜尋申請者或主辦方"
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

        {/* 申請資料表格 */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          {loading ? (
            <div className="p-8 flex justify-center">
              <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-600"></div>
            </div>
          ) : filteredApplications.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <p>無符合條件的申請資料</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      申請者資訊
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      主辦方資訊
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      時間
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
                  {filteredApplications.map((application) => (
                    <tr key={application._id.toString()} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            {application.user?.image ? (
                              <img
                                className="h-10 w-10 rounded-full object-cover"
                                src={application.user.image}
                                alt={application.user.name || ''}
                              />
                            ) : (
                              <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500">
                                <UserIcon className="h-6 w-6" />
                              </div>
                            )}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{application.user?.name || '未知用戶'}</div>
                            <div className="text-sm text-gray-500">{application.user?.email || '無郵箱'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{application.host?.name || '未知主辦方'}</div>
                        <div className="text-sm text-gray-500">{application.opportunity?.title || '未知機會'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          <div className="flex items-center">
                            <DocumentTextIcon className="h-4 w-4 mr-1 text-gray-400" />
                            {application.applicationDetails?.startMonth?.replace('-', '/')}
                            {application.applicationDetails?.endMonth && ` - ${application.applicationDetails.endMonth.replace('-', '/')}`}
                          </div>
                        </div>
                        <div className="text-sm text-gray-500">
                          {application.applicationDetails?.duration} 天
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <StatusBadge status={application.status} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          <Link href={`/admin/applications/${application._id}`} className="text-blue-600 hover:text-blue-900">
                            <EyeIcon className="h-5 w-5" />
                          </Link>

                          {application.status === ApplicationStatus.PENDING && (
                            <>
                              <button
                                onClick={() => handleStatusUpdate(application._id.toString(), ApplicationStatus.ACCEPTED)}
                                className="text-green-600 hover:text-green-900"
                              >
                                <CheckIcon className="h-5 w-5" />
                              </button>
                              <button
                                onClick={() => handleStatusUpdate(application._id.toString(), ApplicationStatus.REJECTED)}
                                className="text-red-600 hover:text-red-900"
                              >
                                <XMarkIcon className="h-5 w-5" />
                              </button>
                            </>
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