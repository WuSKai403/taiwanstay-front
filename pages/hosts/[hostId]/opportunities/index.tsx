import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from 'next-auth/react';
import { connectToDatabase } from '@/lib/mongodb';
import Opportunity from '@/models/Opportunity';
import Host from '@/models/Host';
import Application from '@/models/Application';
import { OpportunityType } from '@/models/enums';
import { GetServerSideProps } from 'next';
import { useRouter } from 'next/router';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';

import HostLayout from '@/components/layout/HostLayout';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import EmptyState from '@/components/common/EmptyState';
import Pagination from '@/components/common/Pagination';
import { checkHostAccess } from '@/lib/middleware/authMiddleware';
import { OpportunityStatus } from '@/models/enums';

import OpportunityList from '@/components/host/opportunities/OpportunityList';
import FilterBar from '@/components/host/opportunities/FilterBar';
import OpportunityStats from '@/components/host/opportunities/OpportunityStats';

// 獲取主人機會列表
async function fetchHostOpportunities(hostId: string, options: any) {
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
  }

  // 發送 API 請求
  const response = await fetch(`/api/hosts/${hostId}/opportunities?${params.toString()}`);

  if (!response.ok) {
    throw new Error('獲取機會列表失敗');
  }

  return response.json();
}

const OpportunitiesPage = ({ hostId }: { hostId: string }) => {
  const router = useRouter();

  // 分頁和過濾狀態
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [status, setStatus] = useState<string | null>(null);
  const [sort, setSort] = useState('createdAt');
  const [order, setOrder] = useState('desc');

  // 使用 React Query 獲取數據
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['host-opportunities', hostId, page, limit, status, sort, order],
    queryFn: () => fetchHostOpportunities(hostId, { page, limit, status, sort, order }),
    placeholderData: 'keepPreviousData',
    staleTime: 1000 * 60 * 5, // 5分鐘
    refetchOnWindowFocus: false
  });

  // 處理創建新機會
  const handleCreateNew = () => {
    router.push(`/hosts/${hostId}/opportunities/new`);
  };

  // 處理編輯機會
  const handleEdit = (opportunityId: string) => {
    router.push(`/hosts/${hostId}/opportunities/${opportunityId}`);
  };

  // 處理查看機會詳情
  const handleView = (opportunityId: string) => {
    router.push(`/hosts/${hostId}/opportunities/${opportunityId}/view`);
  };

  // 處理查看申請
  const handleViewApplications = (opportunityId: string) => {
    router.push(`/hosts/${hostId}/applications?opportunityId=${opportunityId}`);
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
  const handleUpdateStatus = async (opportunityId: string, newStatus: OpportunityStatus, currentStatus: OpportunityStatus) => {
    try {
      const response = await fetch(`/api/opportunities/${opportunityId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (!response.ok) {
        throw new Error('更新機會狀態失敗');
      }

      // 重新獲取數據
      refetch();
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
    <HostLayout>
      <div className="p-4 md:p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">工作機會管理</h1>
          <button
            onClick={handleCreateNew}
            className="mt-2 md:mt-0 bg-primary text-white py-2 px-4 rounded-md hover:bg-primary-dark transition-colors"
          >
            + 新增工作機會
          </button>
        </div>

        {/* 統計摘要 */}
        {data && <OpportunityStats stats={data.stats || {}} />}

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
            description="您目前還沒有創建任何工作機會，點擊上方「新增工作機會」按鈕開始創建。"
            actionText="創建新機會"
            onAction={handleCreateNew}
          />
        )}

        {/* 機會列表 */}
        {!isLoading && data?.opportunities?.length > 0 && (
          <OpportunityList
            opportunities={data.opportunities}
            onEdit={handleEdit}
            onView={handleView}
            onViewApplications={handleViewApplications}
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
    </HostLayout>
  );
};

// 服務端權限檢查
export const getServerSideProps: GetServerSideProps = async (context) => {
  const { hostId } = context.params as { hostId: string };
  const session = await getSession(context);

  // 檢查訪問權限
  if (!session?.user) {
    return { redirect: { destination: '/auth/signin', permanent: false } };
  }

  // 確保用戶ID存在
  const userId = session.user.id;
  if (!userId) {
    return { redirect: { destination: '/auth/signin', permanent: false } };
  }

  // 使用服務端函數檢查是否有此主人的訪問權限
  const hasAccess = await checkHostAccess(userId, hostId);

  if (!hasAccess) {
    return { notFound: true };
  }

  return { props: { hostId } };
};

export default OpportunitiesPage;