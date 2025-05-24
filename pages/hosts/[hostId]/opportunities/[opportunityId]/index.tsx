import { useState, useEffect } from 'react';
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
import { OpportunityDetail } from '@/components/opportunity/constants';
import { getLatestStatusReason, hasStatusReason } from '@/utils/opportunityUtils';
import StatusReasonBadge from '@/components/opportunity/StatusReasonBadge';

// 獲取機會詳情
async function fetchOpportunity(opportunityId: string) {
  if (opportunityId === 'new') return null;

  try {
    console.log(`開始獲取機會詳情，ID: ${opportunityId}`);

    // 嘗試使用不同的API調用方式
    const fetchUrl = `/api/opportunities/${opportunityId}?includeAll=true`;
    console.log(`API請求URL: ${fetchUrl}`);

    const response = await fetch(fetchUrl);
    console.log(`API響應狀態碼: ${response.status}`);

    if (!response.ok) {
      console.error(`API響應錯誤: ${response.status} ${response.statusText}`);
      throw new Error(`獲取機會詳情失敗: ${response.status}`);
    }

    const data = await response.json();
    console.log('獲取到的原始機會詳情:', data);

    // 檢查關鍵字段是否存在
    console.log('數據結構檢查:',{
      hasOpportunity: !!data.opportunity,
      dataType: typeof data,
      topLevelKeys: Object.keys(data),
      status: data.opportunity ? data.opportunity.status : '未找到狀態',
      hasStatusHistory: data.opportunity ? !!data.opportunity.statusHistory : false,
      hasRejectedStatus: data.opportunity ? data.opportunity.statusHistory?.some((h: { status: string }) => h.status === OpportunityStatus.REJECTED) : false
    });

    // 確保返回正確的 opportunity 對象，而不是整個 API 響應
    if (!data.opportunity) {
      console.error('API 回應中缺少 opportunity 對象');
      throw new Error('API 回應格式不正確，缺少 opportunity 數據');
    }

    return data.opportunity;
  } catch (error) {
    console.error('獲取機會詳情時出錯:', error);
    throw error;
  }
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

  // 在數據加載後檢查和處理
  useEffect(() => {
    if (opportunity) {
      console.log('機會數據加載成功，類型:', typeof opportunity);
      console.log('機會數據詳情:', opportunity);

      // 檢查關鍵欄位
      if ('status' in opportunity) {
        console.log('機會狀態:', opportunity.status);
        if (opportunity.status === OpportunityStatus.REJECTED) {
          const rejectionReason = getLatestStatusReason(opportunity.statusHistory, OpportunityStatus.REJECTED);
          console.log('這是被拒絕的機會，拒絕原因:', rejectionReason || '無');
        }
      } else {
        console.error('錯誤: 機會對象缺少 status 屬性');
        console.log('機會對象可用屬性:', Object.keys(opportunity));
      }
    }
  }, [opportunity]);

  // 提交機會更新
  const mutation = useMutation({
    mutationFn: async (data: OpportunityFormData & { submitForReview?: boolean }) => {
      const url = isNewOpportunity
        ? '/api/opportunities'
        : `/api/opportunities/${opportunityId}`;

      const method = isNewOpportunity ? 'POST' : 'PUT';

      // 從數據中提取是否需要送審的標記，然後從API數據中移除
      const shouldSubmitForReview = data.submitForReview === true;
      const apiData: any = { ...data };
      delete apiData.submitForReview;

      // 如果有狀態字段，確保將其刪除，防止API錯誤
      delete apiData.status;
      delete apiData.statusHistory;

      console.log('提交的機會資料 (不含狀態):', apiData);
      console.log('操作類型:', shouldSubmitForReview ? '重新送審' : '僅儲存');

      // 先儲存機會內容
      const saveResponse = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(apiData),
      });

      if (!saveResponse.ok) {
        console.error('儲存失敗:', await saveResponse.json());
        throw new Error('儲存機會失敗');
      }

      const saveResult = await saveResponse.json();

      // 如果是從拒絕狀態進行編輯，且用戶選擇重新送審，才更新狀態
      if (!isNewOpportunity && opportunity && opportunity.status === OpportunityStatus.REJECTED && shouldSubmitForReview) {
        console.log('檢測到機會處於拒絕狀態，且用戶選擇重新送審，使用狀態API更改為待審核狀態');

        // 使用專門的狀態更新API
        const statusResponse = await fetch(`/api/opportunities/${opportunityId}/status`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ status: OpportunityStatus.PENDING }),
        });

        if (!statusResponse.ok) {
          console.error('狀態更新失敗:', await statusResponse.json());
          // 雖然內容已更新，但狀態更新失敗，仍然返回內容更新結果
          return saveResult;
        }

        // 狀態已更新，合併兩個結果
        const statusResult = await statusResponse.json();
        return {
          ...saveResult,
          status: statusResult.opportunity.status,
          needRedirect: true // 標記需要重定向
        };
      }

      return saveResult;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['opportunity', opportunityId] });
      queryClient.invalidateQueries({ queryKey: ['host-opportunities', hostId] });

      if (isNewOpportunity) {
        router.push(`/hosts/${hostId}/opportunities/${data.opportunity?._id || data._id}`);
      } else if (data.needRedirect) {
        // 只有當明確標記需要重定向時（即重新送審時）才重定向並顯示提示
        router.push(`/hosts/${hostId}/opportunities`);
        alert('已重新送出審核！');
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

  // 表單提交處理 - 機會狀態不會被重設為PENDING
  const onSubmit = async (data: OpportunityFormData) => {
    try {
      // 傳遞submitForReview=false標記，表示這是僅儲存操作
      await mutation.mutateAsync({...data, submitForReview: false});
    } catch (error) {
      console.error('提交表單時出錯:', error);
    }
  };

  // 送出審核處理 - 機會狀態會被重設為PENDING
  const onSubmitForReview = async (data: OpportunityFormData) => {
    try {
      // 傳遞submitForReview=true標記，表示這是送審操作
      await mutation.mutateAsync({...data, submitForReview: true});
    } catch (error) {
      console.error('送出審核時出錯:', error);
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
        {/* 如果數據加載中，顯示加載狀態 */}
        {isLoading ? (
          <div className="flex justify-center items-center py-10">
            <LoadingSpinner size="lg" />
          </div>
        ) : error ? (
          // 如果有錯誤，顯示錯誤訊息
          <div className="bg-red-50 text-red-600 p-4 rounded-md mb-6">
            <h3 className="font-bold mb-2">獲取機會詳情失敗</h3>
            <p>{error instanceof Error ? error.message : '未知錯誤'}</p>
            <button
              onClick={() => router.push(`/hosts/${hostId}/opportunities`)}
              className="mt-4 px-4 py-2 bg-gray-100 text-gray-800 rounded-md hover:bg-gray-200"
            >
              返回列表
            </button>
          </div>
        ) : (
          // 如果成功加載數據，顯示表單
          <>
            {/* 檢查是否是被拒絕的機會，顯示拒絕原因 */}
            {opportunity && 'status' in opportunity && opportunity.status === OpportunityStatus.REJECTED && (
              <div className="mb-6">
                <StatusReasonBadge
                  opportunity={opportunity}
                  showLabel={true}
                  className="mt-2"
                />
              </div>
            )}

            {/* 額外的數據檢查提示，僅在開發環境顯示 */}
            {process.env.NODE_ENV !== 'production' && opportunity && typeof opportunity === 'object' && (
              <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
                <h3 className="font-medium text-blue-800 mb-1">數據診斷</h3>
                <p className="text-blue-700">
                  收到數據類型: {typeof opportunity}<br />
                  包含屬性: {Object.keys(opportunity).join(', ')}<br />
                  狀態: {opportunity.status || '未知'}<br />
                  拒絕原因: {getLatestStatusReason(opportunity.statusHistory, OpportunityStatus.REJECTED) || '無'}
                </p>
              </div>
            )}

            {/* 表單組件 */}
            <OpportunityForm
              initialData={opportunity as OpportunityFormData}
              isNewOpportunity={isNewOpportunity}
              onSubmit={onSubmit}
              onSubmitForReview={onSubmitForReview}
              onPublish={handlePublish}
              onPreview={handlePreview}
              onCancel={handleCancel}
              isSubmitting={mutation.isPending}
              isPublishing={publishMutation.isPending}
              opportunity={opportunity}
            />
          </>
        )}
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