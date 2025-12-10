import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { OpportunityFormData, OpportunityCreateFormData, OpportunityUpdateFormData, OpportunitySearchParams } from '@/lib/schemas/opportunity';
import { OpportunityStatus } from '@/lib/opportunities/statusManager';
import {
  getOpportunities,
  getOpportunity,
  createOpportunity,
  updateOpportunity,
  // deleteOpportunity // Add if needed
} from '@/lib/api/opportunity';
import {
  isValidStatusTransition,
  getStatusUpdateMessage,
  getNextAllowedStates,
  canEditOpportunity,
  statusDescriptions
} from '@/lib/opportunities/statusManager';
import { Opportunity } from '@/lib/api/opportunity';

const OPPORTUNITIES_QUERY_KEY = 'opportunities';
const OPPORTUNITY_QUERY_KEY = 'opportunity';

// 獲取機會列表
export function useOpportunities(params?: OpportunitySearchParams) {
  return useQuery({
    queryKey: [OPPORTUNITIES_QUERY_KEY, params],
    queryFn: () => getOpportunities(params),
  });
}

// 獲取單個機會詳情
export function useOpportunity(id: string) {
  return useQuery({
    queryKey: [OPPORTUNITY_QUERY_KEY, id],
    queryFn: () => getOpportunity(id),
    enabled: !!id,
  });
}

// 創建新機會
export function useCreateOpportunity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: OpportunityCreateFormData) => createOpportunity(data as any),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [OPPORTUNITIES_QUERY_KEY] });
    },
  });
}

// 更新機會
export function useUpdateOpportunity(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: OpportunityUpdateFormData) => {
      // 防止直接在 update API 中修改狀態
      // const { status, ...updateData } = data; // Service layer should handle or caller should sanitise
      // Assuming service takes Partial<Opportunity>
      return updateOpportunity(id, data as unknown as Partial<Opportunity>);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [OPPORTUNITIES_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [OPPORTUNITY_QUERY_KEY, id] });
    },
  });
}

// ... Additional status updates implementations would go here,
// likely needing specific service methods in api/opportunity.ts
// like updateOpportunityStatus(id, status, reason)


// 在 OpportunityList 組件中使用的狀態管理動作
export function useOpportunityStatusActions() {
  const queryClient = useQueryClient();

  const onUpdateStatus = async (id: string, newStatus: OpportunityStatus, currentStatus: OpportunityStatus, reason?: string) => {
    // 檢查狀態轉換是否有效
    if (!isValidStatusTransition(currentStatus, newStatus)) {
      throw new Error('狀態轉換無效');
    }

    // 使用 API 更新狀態
    // Note: If backend supports 'reason' for status change, we might need a specific/different endpoint or payload.
    // For now, assuming standard update.
    await updateOpportunity(id, { status: newStatus } as any);

    // 更新查詢緩存
    queryClient.invalidateQueries({ queryKey: [OPPORTUNITIES_QUERY_KEY] });
    queryClient.invalidateQueries({ queryKey: [OPPORTUNITY_QUERY_KEY, id] });

    return { success: true };
  };

  return {
    onUpdateStatus,
  };
}

// 重新導出狀態管理相關函數，以維持向後兼容性
export {
  getStatusUpdateMessage,
  isValidStatusTransition,
  getNextAllowedStates as getNextPossibleStates,
  canEditOpportunity,
  statusDescriptions
};