import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from 'next-auth/react';
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/router';
import { parseISO, format } from 'date-fns';

import AdminLayout from '@/components/layout/AdminLayout';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import EmptyState from '@/components/common/EmptyState';
import Pagination from '@/components/common/Pagination';
import FilterBar from '@/components/host/opportunities/FilterBar';
import ReasonDialog from '@/components/common/ReasonDialog';
import { OpportunityStatus } from '@/models/enums';
import { UserRole } from '@/models/enums/UserRole';
import { statusColorMap, statusLabelMap } from '@/components/opportunity/constants';
import StatusReasonBadge from '@/components/opportunity/StatusReasonBadge';
import { OpportunityMedia } from '@/lib/types/media';
import {
  requiresReason,
  getReasonConfig,
  statusTransitions,
  statusActions,
  StatusAction,
  getStatusUpdateMessage
} from '@/lib/opportunities/statusManager';
import StatusActionDropdown from '@/components/opportunity/StatusActionDropdown';

// 定義機會類型
interface Opportunity {
  _id: string;
  title: string;
  slug: string;
  status: OpportunityStatus;
  shortDescription?: string;
  createdAt: string;
  publishedAt?: string;
  media?: OpportunityMedia;
  stats?: {
    applications?: number;
    views?: number;
    bookmarks?: number;
  };
  hostId?: {
    name: string;
    _id: string;
  };
  statusHistory?: Array<{
    status: OpportunityStatus;
    reason?: string;
    changedBy?: string;
    changedAt: string;
  }>;
}

// 獲取選項類型
interface FetchOpportunitiesOptions {
  page?: number;
  limit?: number;
  status?: string | null;
  sort?: string;
  order?: string;
}

// 獲取所有機會列表
async function fetchOpportunities(options: FetchOpportunitiesOptions) {
  const { page = 1, limit = 10, status, sort = 'createdAt', order = 'desc' } = options;

  // 構建 URL 和查詢參數
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    all: 'true',
    sort,
    order
  });

  // 如果有狀態過濾，添加到參數中
  if (status) {
    params.append('status', status);
  } else {
    // 默認排除草稿狀態的機會
    params.append('excludeStatus', OpportunityStatus.DRAFT);
  }

  // 發送 API 請求
  const response = await fetch(`/api/opportunities?${params.toString()}`);

  if (!response.ok) {
    throw new Error('獲取機會列表失敗');
  }

  return response.json();
}

// 機會列表組件 Props 類型
interface OpportunitiesListProps {
  opportunities: Opportunity[];
  onEdit: (id: string) => void;
  onViewApplications: (id: string) => void;
  onDelete: (id: string) => void;
  onUpdateStatus: (id: string, newStatus: OpportunityStatus, currentStatus: OpportunityStatus, reason: string) => Promise<void>;
}

// 機會列表組件
const OpportunitiesList: React.FC<OpportunitiesListProps> = ({
  opportunities,
  onEdit,
  onViewApplications,
  onDelete,
  onUpdateStatus
}) => {
  const [reasonDialog, setReasonDialog] = useState<{
    isOpen: boolean;
    opportunityId: string;
    currentStatus: OpportunityStatus;
    newStatus: OpportunityStatus;
    config: ReturnType<typeof getReasonConfig>;
  } | null>(null);

  // 獲取可用的狀態操作
  const getAvailableActions = (currentStatus: OpportunityStatus): StatusAction[] => {
    // 從 statusTransitions 中獲取可能的下一個狀態
    const possibleNextStates = statusTransitions[currentStatus]?.possibleNextStates || [];

    // 從 statusActions 中獲取當前狀態的所有操作
    const allActions = statusActions[currentStatus] || [];

    // 過濾出有效的狀態轉換操作：
    // 1. 必須有目標狀態（排除儲存操作）
    // 2. 目標狀態必須在允許的轉換列表中
    return allActions.filter(action =>
      action.targetStatus !== null &&
      possibleNextStates.includes(action.targetStatus)
    );
  };

  const handleStatusUpdate = (
    opportunityId: string,
    newStatus: OpportunityStatus,
    currentStatus: OpportunityStatus
  ) => {
    const config = getReasonConfig(currentStatus, newStatus);
    if (requiresReason(currentStatus, newStatus)) {
      setReasonDialog({
        isOpen: true,
        opportunityId,
        currentStatus,
        newStatus,
        config
      });
    } else {
      onUpdateStatus(opportunityId, newStatus, currentStatus, '');
    }
  };

  const renderStatusBadge = (status: OpportunityStatus) => {
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColorMap[status]}`}>
        {statusLabelMap[status]}
      </span>
    );
  };

  return (
    <>
      <div className="space-y-4">
        {opportunities.map((opportunity) => (
          <div
            key={opportunity._id}
            className="bg-white rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition-shadow"
          >
            <div className="p-4">
              <div className="flex justify-between items-start">
                <h3 className="text-lg font-medium text-gray-900 mb-1">
                  {opportunity.title}
                </h3>
                {renderStatusBadge(opportunity.status)}
              </div>

              <p className="text-gray-600 text-sm mb-2 line-clamp-2">
                {opportunity.shortDescription || '無描述'}
              </p>

              {/* 狀態原因顯示 - 使用StatusReasonBadge */}
              {(opportunity.status === OpportunityStatus.REJECTED ||
                opportunity.status === OpportunityStatus.PAUSED) && (
                <div className="my-2">
                  <StatusReasonBadge
                    opportunity={opportunity}
                    showLabel={false}
                  />
                </div>
              )}

              <div className="flex flex-wrap gap-4 text-sm text-gray-500 mt-3">
                <span>主辦方: {opportunity.hostId?.name || '未知主辦方'}</span>
                <span>申請數: {opportunity.stats?.applications || 0}</span>
                <span>查看數: {opportunity.stats?.views || 0}</span>
              </div>

              <div className="flex flex-wrap gap-2 mt-4">
                <button
                  onClick={() => onEdit(opportunity._id)}
                  className="px-3 py-1.5 bg-gray-100 text-gray-800 text-sm rounded-md hover:bg-gray-200 transition-colors"
                >
                  查看詳情
                </button>

                <button
                  onClick={() => onViewApplications(opportunity._id)}
                  className="px-3 py-1.5 bg-blue-100 text-blue-800 text-sm rounded-md hover:bg-blue-200 transition-colors"
                >
                  查看申請
                </button>

                {/* 使用新的狀態操作下拉選單 */}
                <StatusActionDropdown
                  currentStatus={opportunity.status as OpportunityStatus}
                  onStatusUpdate={(newStatus, reason) =>
                    onUpdateStatus(opportunity._id, newStatus, opportunity.status as OpportunityStatus, reason || '')
                  }
                  showSaveAction={false}
                  userRole={UserRole.ADMIN}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 理由對話框 */}
      {reasonDialog && (
        <ReasonDialog
          isOpen={reasonDialog.isOpen}
          onClose={() => setReasonDialog(null)}
          onConfirm={(reason) => {
            onUpdateStatus(
              reasonDialog.opportunityId,
              reasonDialog.newStatus,
              reasonDialog.currentStatus,
              reason
            );
            setReasonDialog(null);
          }}
          title={reasonDialog.config.reasonTitle || '請輸入原因'}
          placeholder={reasonDialog.config.reasonPlaceholder}
          isRequired={true}
        />
      )}
    </>
  );
};

const AdminOpportunitiesPage = () => {
  const router = useRouter();

  // 分頁和過濾狀態
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [status, setStatus] = useState<string | null>(null);
  const [sort, setSort] = useState('createdAt');
  const [order, setOrder] = useState('desc');

  // 使用 React Query 獲取數據
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['admin-opportunities', page, limit, status, sort, order],
    queryFn: () => fetchOpportunities({ page, limit, status, sort, order }),
    staleTime: 1000 * 60 * 5, // 5分鐘
    refetchOnWindowFocus: false
  });

  // 處理編輯機會
  const handleEdit = (opportunityId: string) => {
    router.push(`/admin/opportunities/${opportunityId}`);
  };

  // 處理查看申請
  const handleViewApplications = (opportunityId: string) => {
    router.push(`/admin/applications?opportunityId=${opportunityId}`);
  };

  // 處理刪除機會
  const handleDelete = async (opportunityId: string) => {
    if (window.confirm('確定要刪除此機會嗎？這個操作無法撤銷。')) {
      try {
        const response = await fetch(`/api/opportunities/${opportunityId}`, {
          method: 'DELETE'
        });

        if (!response.ok) {
          throw new Error('刪除機會失敗');
        }

        // 重新獲取數據
        refetch();
      } catch (error) {
        console.error('刪除機會時出錯:', error);
        alert('刪除機會失敗，請稍後再試');
      }
    }
  };

  // 處理更新機會狀態
  const handleUpdateStatus = async (
    opportunityId: string,
    newStatus: OpportunityStatus,
    currentStatus: OpportunityStatus,
    reason: string
  ) => {
    try {
      const response = await fetch(`/api/admin/opportunities/${opportunityId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus, reason })
      });

      if (!response.ok) {
        throw new Error('更新機會狀態失敗');
      }

      // 重新獲取數據
      await refetch();

      // 顯示狀態更新訊息
      alert(getStatusUpdateMessage(newStatus));
    } catch (error) {
      console.error('更新機會狀態時出錯:', error);
      alert('更新機會狀態失敗，請稍後再試');
    }
  };

  // 處理過濾變更
  const handleFilterChange = (newStatus: string | null) => {
    setStatus(newStatus);
    setPage(1); // 重置頁碼
  };

  // 處理排序變更
  const handleSortChange = (newSort: string, newOrder: string) => {
    setSort(newSort);
    setOrder(newOrder);
  };

  // 渲染內容
  return (
    <AdminLayout title="機會管理">
      <div className="p-4 md:p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">工作機會管理</h1>
        </div>

        {/* 過濾工具欄 */}
        <FilterBar
          onFilterChange={handleFilterChange}
          onSortChange={handleSortChange}
          currentStatus={status}
          currentSort={sort}
          currentOrder={order}
        />

        {/* 加載中狀態 */}
        {isLoading && (
          <div className="flex justify-center items-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        )}

        {/* 錯誤狀態 */}
        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-md my-4">
            獲取機會列表失敗，請刷新頁面重試
          </div>
        )}

        {/* 空數據狀態 */}
        {!isLoading && data?.opportunities?.length === 0 && (
          <EmptyState
            title="暫無工作機會"
            description="系統中目前沒有任何工作機會"
            actionText="返回首頁"
            onAction={() => router.push('/admin')}
          />
        )}

        {/* 機會列表 */}
        {!isLoading && data?.opportunities?.length > 0 && (
          <OpportunitiesList
            opportunities={data.opportunities}
            onEdit={handleEdit}
            onViewApplications={handleViewApplications}
            onDelete={handleDelete}
            onUpdateStatus={handleUpdateStatus}
          />
        )}

        {/* 分頁 */}
        {data?.pagination && data.pagination.total > limit && (
          <Pagination
            currentPage={page}
            totalPages={data.pagination.pages}
            onPageChange={setPage}
            totalItems={data.pagination.total}
            pageSize={limit}
            onPageSizeChange={setLimit}
            className="mt-6"
          />
        )}
      </div>
    </AdminLayout>
  );
};

// 服務端權限檢查
export async function getServerSideProps(context: any) {
  const session = await getSession(context);

  // 檢查訪問權限
  if (!session?.user) {
    return { redirect: { destination: '/auth/signin', permanent: false } };
  }

  // 確保用戶是管理員
  if (session.user.role !== UserRole.ADMIN && session.user.role !== UserRole.SUPER_ADMIN) {
    return { redirect: { destination: '/', permanent: false } };
  }

  return { props: {} };
}

export default AdminOpportunitiesPage;
