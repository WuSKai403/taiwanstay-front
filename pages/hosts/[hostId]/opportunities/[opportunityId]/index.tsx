import { useState } from 'react';
import { useRouter } from 'next/router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { GetServerSideProps } from 'next';
import { getSession } from 'next-auth/react';

import HostLayout from '@/components/layout/HostLayout';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { checkHostAccess } from '@/lib/middleware/authMiddleware';
import { OpportunityStatus } from '@/models/enums';
import OpportunityForm from '@/components/host/opportunities/OpportunityForm';
import { OpportunityFormData } from '@/components/host/opportunities/OpportunityForm';

// 獲取機會詳情
async function fetchOpportunity(opportunityId: string) {
  if (opportunityId === 'new') return null;

  const response = await fetch(`/api/opportunities/${opportunityId}`);
  if (!response.ok) {
    throw new Error('獲取機會詳情失敗');
  }
  return response.json();
}

// 頁面組件
const OpportunityDetailPage = ({ hostId, opportunityId }: { hostId: string, opportunityId: string }) => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const isNewOpportunity = opportunityId === 'new';

  // 獲取機會詳情
  const { data: opportunity, isLoading, error } = useQuery({
    queryKey: ['opportunity', opportunityId],
    queryFn: () => fetchOpportunity(opportunityId),
    enabled: !isNewOpportunity,
    refetchOnWindowFocus: false,
  });

  // 提交機會更新
  const mutation = useMutation({
    mutationFn: (data: OpportunityFormData) => {
      const url = isNewOpportunity
        ? '/api/opportunities'
        : `/api/opportunities/${opportunityId}`;

      const method = isNewOpportunity ? 'POST' : 'PUT';

      return fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      }).then(response => {
        if (!response.ok) {
          throw new Error('儲存機會失敗');
        }
        return response.json();
      });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['opportunity', opportunityId] });
      queryClient.invalidateQueries({ queryKey: ['host-opportunities', hostId] });
      if (isNewOpportunity) {
        router.push(`/hosts/${hostId}/opportunities/${data._id}`);
      }
    },
  });

  // 機會發布
  const publishMutation = useMutation({
    mutationFn: () => {
      return fetch(`/api/opportunities/${opportunityId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: OpportunityStatus.ACTIVE }),
      }).then(response => {
        if (!response.ok) {
          throw new Error('發布機會失敗');
        }
        return response.json();
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['opportunity', opportunityId] });
      queryClient.invalidateQueries({ queryKey: ['host-opportunities', hostId] });
    },
  });

  // 表單提交處理
  const onSubmit = async (data: OpportunityFormData) => {
    try {
      await mutation.mutateAsync(data);
    } catch (error) {
      console.error('提交表單時出錯:', error);
    }
  };

  // 發布機會
  const handlePublish = async () => {
    try {
      await publishMutation.mutateAsync();
    } catch (error) {
      console.error('發布機會時出錯:', error);
    }
  };

  // 預覽機會
  const handlePreview = (opportunitySlug: string) => {
    window.open(`/opportunities/${opportunitySlug}`, '_blank');
  };

  // 返回列表
  const handleCancel = () => {
    router.push(`/hosts/${hostId}/opportunities`);
  };

  // 渲染內容
  if (isLoading) {
    return (
      <HostLayout>
        <div className="flex justify-center items-center min-h-screen">
          <LoadingSpinner size="lg" />
        </div>
      </HostLayout>
    );
  }

  if (error && !isNewOpportunity) {
    return (
      <HostLayout>
        <div className="p-6">
          <div className="bg-red-50 text-red-600 p-4 rounded-md">
            獲取機會詳情失敗，請刷新頁面重試
          </div>
          <button
            onClick={() => router.back()}
            className="mt-4 bg-gray-100 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-200 transition-colors"
          >
            返回
          </button>
        </div>
      </HostLayout>
    );
  }

  return (
    <HostLayout>
      <div className="p-4 md:p-6">
        <OpportunityForm
          initialData={opportunity as OpportunityFormData}
          isNewOpportunity={isNewOpportunity}
          onSubmit={onSubmit}
          onPublish={handlePublish}
          onPreview={handlePreview}
          onCancel={handleCancel}
          isSubmitting={mutation.isPending}
          isPublishing={publishMutation.isPending}
          opportunity={opportunity}
        />
      </div>
    </HostLayout>
  );
};

// 服務端權限檢查
export const getServerSideProps: GetServerSideProps = async (context) => {
  const { hostId, opportunityId } = context.params as { hostId: string; opportunityId: string };
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

  return { props: { hostId, opportunityId } };
};

export default OpportunityDetailPage;