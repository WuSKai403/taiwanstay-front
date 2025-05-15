import { useState } from 'react';
import { useRouter } from 'next/router';
import { GetServerSideProps } from 'next';
import { getSession } from 'next-auth/react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import AdminLayout from '@/components/layout/AdminLayout';
import { OpportunityStatus, OpportunityType } from '@/models/enums';
import { UserRole } from '@/models/enums/UserRole';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import Image from 'next/image';
import Link from 'next/link';
import AuthGuard from '@/components/auth/AuthGuard';
import { statusColorMap, statusLabelMap, typeNameMap } from '@/components/opportunity/constants';

// 定義機會詳情類型
interface OpportunityDetail {
  _id: string;
  title: string;
  slug: string;
  status: OpportunityStatus;
  description: string;
  shortDescription: string;
  createdAt: string;
  publishedAt?: string;
  location?: {
    city?: string;
    country?: string;
    address?: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
  workDetails?: {
    type?: string;
    duties?: string[];
    requirements?: string[];
    benefits?: string[];
    accommodation?: {
      provided: boolean;
      details?: string;
    };
    hours?: {
      perDay?: number;
      perWeek?: number;
      schedule?: string;
    };
  };
  hostId?: {
    _id: string;
    name: string;
    description?: string;
    contactEmail?: string;
    contactPhone?: string;
  };
  media?: {
    coverImage?: string;
    images?: string[];
  };
  stats?: {
    applications?: number;
    views?: number;
    bookmarks?: number;
  };
  rejectionReason?: string;
  type?: OpportunityType;
}

// 獲取機會詳情
async function fetchOpportunityDetail(id: string) {
  // 使用管理員專用的API來獲取機會詳情
  const response = await fetch(`/api/admin/opportunities/${id}`);
  if (!response.ok) {
    throw new Error('獲取機會詳情失敗');
  }
  const data = await response.json();

  // 檢查 API 回傳格式並提取 opportunity 數據
  if (data.success && data.opportunity) {
    return data.opportunity;
  } else {
    console.error('API回傳格式不正確:', data);
    throw new Error(data.message || '獲取機會詳情失敗');
  }
}

// 更新機會狀態
async function updateOpportunityStatus(id: string, status: OpportunityStatus, rejectionReason?: string) {
  const body: { status: OpportunityStatus; rejectionReason?: string } = { status };

  if (rejectionReason) {
    body.rejectionReason = rejectionReason;
  }

  const response = await fetch(`/api/opportunities/${id}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error('更新機會狀態失敗');
  }

  return response.json();
}

const OpportunityDetailPage = () => {
  const router = useRouter();
  const { id } = router.query;
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectionDialog, setShowRejectionDialog] = useState(false);
  const queryClient = useQueryClient();

  // 使用 React Query 獲取機會詳情
  const { data: opportunity, isLoading, error } = useQuery({
    queryKey: ['opportunity-detail', id],
    queryFn: () => fetchOpportunityDetail(id as string),
    enabled: !!id,
  });

  // 狀態更新 mutation
  const updateStatusMutation = useMutation({
    mutationFn: ({ status, reason }: { status: OpportunityStatus; reason?: string }) =>
      updateOpportunityStatus(id as string, status, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['opportunity-detail', id] });
      setShowRejectionDialog(false);
      setRejectionReason('');
    },
  });

  // 處理狀態更新
  const handleStatusUpdate = (status: OpportunityStatus) => {
    if (status === OpportunityStatus.REJECTED) {
      setShowRejectionDialog(true);
    } else {
      updateStatusMutation.mutate({ status });
    }
  };

  // 提交拒絕原因
  const handleSubmitRejection = () => {
    if (!rejectionReason.trim()) {
      alert('請提供拒絕原因');
      return;
    }

    updateStatusMutation.mutate({
      status: OpportunityStatus.REJECTED,
      reason: rejectionReason
    });
  };

  // 返回列表
  const handleBackToList = () => {
    router.push('/admin/opportunities');
  };

  // 查看申請
  const handleViewApplications = () => {
    router.push(`/admin/applications?opportunityId=${id}`);
  };

  // 格式化日期
  const formatDate = (dateString?: string) => {
    if (!dateString) return '未知';
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-TW', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // 加載中狀態
  if (isLoading) {
    return (
      <AdminLayout title="機會詳情">
        <div className="flex justify-center items-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      </AdminLayout>
    );
  }

  // 錯誤狀態
  if (error || !opportunity) {
    return (
      <AdminLayout title="機會詳情">
        <div className="bg-red-50 text-red-600 p-4 rounded-md my-4">
          獲取機會詳情失敗，請刷新頁面重試
        </div>
        <button
          onClick={handleBackToList}
          className="mt-4 px-4 py-2 bg-gray-100 text-gray-800 rounded-md hover:bg-gray-200"
        >
          返回列表
        </button>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="機會詳情">
      <div className="p-4 md:p-6">
        {/* 頂部操作欄 */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={handleBackToList}
              className="px-4 py-2 bg-gray-100 text-gray-800 rounded-md hover:bg-gray-200"
            >
              返回列表
            </button>

            <h1 className="text-2xl font-bold">{opportunity.title}</h1>

            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
              statusColorMap[opportunity.status as OpportunityStatus] || 'bg-gray-100 text-gray-800'
            }`}>
              {statusLabelMap[opportunity.status as OpportunityStatus] || opportunity.status}
            </span>
          </div>

          <div className="mt-4 md:mt-0 flex gap-2">
            {/* 申請管理按鈕 */}
            <button
              onClick={handleViewApplications}
              className="px-4 py-2 bg-blue-100 text-blue-800 rounded-md hover:bg-blue-200"
            >
              申請管理 ({opportunity.stats?.applications || 0})
            </button>

            {/* 根據當前狀態顯示不同的操作按鈕 */}
            {opportunity.status === OpportunityStatus.PENDING && (
              <>
                <button
                  onClick={() => handleStatusUpdate(OpportunityStatus.ACTIVE)}
                  className="px-4 py-2 bg-green-100 text-green-800 rounded-md hover:bg-green-200"
                >
                  批准上架
                </button>
                <button
                  onClick={() => handleStatusUpdate(OpportunityStatus.REJECTED)}
                  className="px-4 py-2 bg-red-100 text-red-800 rounded-md hover:bg-red-200"
                >
                  拒絕
                </button>
              </>
            )}

            {opportunity.status === OpportunityStatus.ACTIVE && (
              <button
                onClick={() => handleStatusUpdate(OpportunityStatus.PAUSED)}
                className="px-4 py-2 bg-yellow-100 text-yellow-800 rounded-md hover:bg-yellow-200"
              >
                暫停
              </button>
            )}

            {opportunity.status === OpportunityStatus.PAUSED && (
              <button
                onClick={() => handleStatusUpdate(OpportunityStatus.ACTIVE)}
                className="px-4 py-2 bg-green-100 text-green-800 rounded-md hover:bg-green-200"
              >
                恢復上架
              </button>
            )}

            {(opportunity.status === OpportunityStatus.ACTIVE ||
              opportunity.status === OpportunityStatus.PAUSED) && (
              <button
                onClick={() => handleStatusUpdate(OpportunityStatus.ARCHIVED)}
                className="px-4 py-2 bg-red-100 text-red-800 rounded-md hover:bg-red-200"
              >
                下架
              </button>
            )}
          </div>
        </div>

        {/* 拒絕對話框 */}
        {showRejectionDialog && (
          <div className="fixed inset-0 bg-gray-800 bg-opacity-75 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-lg w-full mx-4">
              <h2 className="text-lg font-semibold mb-4">拒絕原因</h2>
              <p className="text-gray-600 mb-4">請提供拒絕此機會的原因，這將會顯示給主辦方。</p>

              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md min-h-[120px]"
                placeholder="請輸入拒絕原因..."
              />

              <div className="flex justify-end gap-2 mt-4">
                <button
                  onClick={() => setShowRejectionDialog(false)}
                  className="px-4 py-2 bg-gray-100 text-gray-800 rounded-md hover:bg-gray-200"
                >
                  取消
                </button>
                <button
                  onClick={handleSubmitRejection}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                  disabled={updateStatusMutation.isPending}
                >
                  {updateStatusMutation.isPending ? '處理中...' : '提交'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 主內容區域 */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          {/* 基本信息 */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4 pb-2 border-b">基本信息</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-gray-600"><span className="font-medium">機會 ID:</span> {opportunity._id}</p>
                <p className="text-gray-600"><span className="font-medium">狀態:</span> {statusLabelMap[opportunity.status as OpportunityStatus]}</p>
                <p className="text-gray-600"><span className="font-medium">創建時間:</span> {formatDate(opportunity.createdAt)}</p>
                {opportunity.publishedAt && (
                  <p className="text-gray-600"><span className="font-medium">發布時間:</span> {formatDate(opportunity.publishedAt)}</p>
                )}
                <p className="text-gray-600"><span className="font-medium">瀏覽次數:</span> {opportunity.stats?.views || 0}</p>
                <p className="text-gray-600"><span className="font-medium">申請數量:</span> {opportunity.stats?.applications || 0}</p>
                <p className="text-gray-600"><span className="font-medium">收藏數量:</span> {opportunity.stats?.bookmarks || 0}</p>
                <p className="text-gray-600">
                  <span className="font-medium">機會類型：</span> {opportunity.type ? typeNameMap[opportunity.type as OpportunityType] || opportunity.type : '未指定'}
                </p>
              </div>

              <div>
                {opportunity.hostId && (
                  <div>
                    <p className="text-gray-600"><span className="font-medium">主辦方:</span> {opportunity.hostId.name}</p>
                    <p className="text-gray-600"><span className="font-medium">ID:</span> {opportunity.hostId._id}</p>
                    {opportunity.hostId.contactEmail && (
                      <p className="text-gray-600"><span className="font-medium">聯絡信箱:</span> {opportunity.hostId.contactEmail}</p>
                    )}
                    {opportunity.hostId.contactPhone && (
                      <p className="text-gray-600"><span className="font-medium">聯絡電話:</span> {opportunity.hostId.contactPhone}</p>
                    )}
                    {opportunity.hostId.description && (
                      <div className="mt-2">
                        <p className="font-medium text-gray-600">主辦方簡介:</p>
                        <p className="text-gray-600 whitespace-pre-line">{opportunity.hostId.description}</p>
                      </div>
                    )}
                    <div className="mt-2">
                      <Link
                        href={`/admin/hosts/${opportunity.hostId._id}`}
                        className="text-blue-600 hover:underline"
                      >
                        查看主辦方詳情
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {opportunity.status === OpportunityStatus.REJECTED && opportunity.rejectionReason && (
              <div className="mt-4 p-3 bg-red-50 text-red-800 rounded-md">
                <p className="font-medium">拒絕原因:</p>
                <p>{opportunity.rejectionReason}</p>
              </div>
            )}
          </div>

          {/* 機會描述 */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4 pb-2 border-b">機會描述</h2>

            {opportunity.shortDescription && (
              <div className="mb-4">
                <p className="font-medium text-gray-600">簡短描述:</p>
                <p className="text-gray-600">{opportunity.shortDescription}</p>
              </div>
            )}

            {opportunity.description && (
              <div>
                <p className="font-medium text-gray-600">詳細描述:</p>
                <div className="prose max-w-none text-gray-600 whitespace-pre-line">
                  {opportunity.description}
                </div>
              </div>
            )}
          </div>

          {/* 工作詳情 */}
          {opportunity.workDetails && (
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4 pb-2 border-b">工作詳情</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                {/* 工作職責 */}
                {opportunity.workDetails.duties && opportunity.workDetails.duties.length > 0 && (
                  <div>
                    <p className="font-medium text-gray-600 mb-2">工作職責:</p>
                    <ul className="list-disc list-inside text-gray-600">
                      {opportunity.workDetails.duties.map((duty: string, index: number) => (
                        <li key={index}>{duty}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* 工作要求 */}
                {opportunity.workDetails.requirements && opportunity.workDetails.requirements.length > 0 && (
                  <div>
                    <p className="font-medium text-gray-600 mb-2">工作要求:</p>
                    <ul className="list-disc list-inside text-gray-600">
                      {opportunity.workDetails.requirements.map((req: string, index: number) => (
                        <li key={index}>{req}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* 福利 */}
                {opportunity.workDetails.benefits && opportunity.workDetails.benefits.length > 0 && (
                  <div>
                    <p className="font-medium text-gray-600 mb-2">提供福利:</p>
                    <ul className="list-disc list-inside text-gray-600">
                      {opportunity.workDetails.benefits.map((benefit: string, index: number) => (
                        <li key={index}>{benefit}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* 工作時間 */}
                {opportunity.workDetails.hours && (
                  <div>
                    <p className="font-medium text-gray-600 mb-2">工作時間:</p>
                    <ul className="text-gray-600 space-y-1">
                      {opportunity.workDetails.hours.perDay && (
                        <li>每日時數: {opportunity.workDetails.hours.perDay} 小時</li>
                      )}
                      {opportunity.workDetails.hours.perWeek && (
                        <li>每週時數: {opportunity.workDetails.hours.perWeek} 小時</li>
                      )}
                      {opportunity.workDetails.hours.schedule && (
                        <li>排班方式: {opportunity.workDetails.hours.schedule}</li>
                      )}
                    </ul>
                  </div>
                )}

                {/* 住宿安排 */}
                {opportunity.workDetails.accommodation && (
                  <div>
                    <p className="font-medium text-gray-600 mb-2">住宿安排:</p>
                    <p className="text-gray-600">
                      {opportunity.workDetails.accommodation.provided ? '提供住宿' : '不提供住宿'}
                    </p>
                    {opportunity.workDetails.accommodation.details && (
                      <p className="text-gray-600 mt-1">{opportunity.workDetails.accommodation.details}</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 地點 */}
          {opportunity.location && (
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4 pb-2 border-b">工作地點</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  {opportunity.location.country && (
                    <p className="text-gray-600"><span className="font-medium">國家:</span> {opportunity.location.country}</p>
                  )}
                  {opportunity.location.city && (
                    <p className="text-gray-600"><span className="font-medium">城市:</span> {opportunity.location.city}</p>
                  )}
                  {opportunity.location.address && (
                    <p className="text-gray-600"><span className="font-medium">地址:</span> {opportunity.location.address}</p>
                  )}
                </div>

                {opportunity.location.coordinates && (
                  <div>
                    <p className="text-gray-600">
                      <span className="font-medium">座標:</span>
                      {opportunity.location.coordinates.lat}, {opportunity.location.coordinates.lng}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 媒體 */}
          {opportunity.media && (opportunity.media.coverImage || (opportunity.media.images && opportunity.media.images.length > 0)) && (
            <div>
              <h2 className="text-xl font-semibold mb-4 pb-2 border-b">媒體資源</h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {opportunity.media.coverImage && (
                  <div className="relative h-48 rounded-lg overflow-hidden">
                    <Image
                      src={opportunity.media.coverImage}
                      alt="封面圖片"
                      layout="fill"
                      objectFit="cover"
                    />
                    <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-1">
                      封面圖片
                    </div>
                  </div>
                )}

                {opportunity.media.images && opportunity.media.images.map((image: string, index: number) => (
                  <div key={index} className="relative h-48 rounded-lg overflow-hidden">
                    <Image
                      src={image}
                      alt={`機會圖片 ${index + 1}`}
                      layout="fill"
                      objectFit="cover"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getSession(context);

  // 檢查訪問權限
  if (!session?.user) {
    return { redirect: { destination: '/auth/login', permanent: false } };
  }

  // 確保用戶是管理員
  if (session.user.role !== UserRole.ADMIN && session.user.role !== UserRole.SUPER_ADMIN) {
    return { redirect: { destination: '/', permanent: false } };
  }

  return { props: {} };
};

export default OpportunityDetailPage;