import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { OpportunityFormData, OpportunityCreateFormData, OpportunityUpdateFormData, OpportunitySearchParams } from '@/lib/schemas/opportunity';
import { OpportunityStatus } from '@/models/enums';

const OPPORTUNITIES_QUERY_KEY = 'opportunities';
const OPPORTUNITY_QUERY_KEY = 'opportunity';

// 機會狀態流轉規則
export const statusTransitions = {
  [OpportunityStatus.DRAFT]: {
    canEdit: true,
    possibleNextStates: [OpportunityStatus.PENDING],
    requiredAction: '送審', // 需要在編輯頁面內提交審核
  },
  [OpportunityStatus.PENDING]: {
    canEdit: false,
    possibleNextStates: [OpportunityStatus.DRAFT, OpportunityStatus.ACTIVE, OpportunityStatus.REJECTED],
    requiredAction: '等待審核', // 由管理員審核
  },
  [OpportunityStatus.ACTIVE]: {
    canEdit: 'limited', // 限制編輯
    possibleNextStates: [OpportunityStatus.PAUSED, OpportunityStatus.ARCHIVED, OpportunityStatus.FILLED, OpportunityStatus.EXPIRED],
  },
  [OpportunityStatus.PAUSED]: {
    canEdit: 'limited',
    possibleNextStates: [OpportunityStatus.ACTIVE, OpportunityStatus.ARCHIVED],
  },
  [OpportunityStatus.EXPIRED]: {
    canEdit: 'limited',
    possibleNextStates: [OpportunityStatus.DRAFT, OpportunityStatus.ARCHIVED],
  },
  [OpportunityStatus.FILLED]: {
    canEdit: 'limited',
    possibleNextStates: [OpportunityStatus.ACTIVE, OpportunityStatus.ARCHIVED],
  },
  [OpportunityStatus.REJECTED]: {
    canEdit: true,
    possibleNextStates: [OpportunityStatus.DRAFT],
  },
  [OpportunityStatus.ARCHIVED]: {
    canEdit: false,
    possibleNextStates: [OpportunityStatus.DRAFT],
  },
};

// 狀態說明文字
export const statusDescriptions = {
  [OpportunityStatus.DRAFT]: '草稿狀態下可編輯所有內容，需編輯完成後送審',
  [OpportunityStatus.PENDING]: '審核中，等待平台審核通過後上架',
  [OpportunityStatus.ACTIVE]: '已上架，對外開放瀏覽與申請',
  [OpportunityStatus.PAUSED]: '暫時不開放申請，但工作機會仍可被瀏覽',
  [OpportunityStatus.EXPIRED]: '已超過設定的結束日期自動下架',
  [OpportunityStatus.FILLED]: '已達到招募人數上限自動暫停',
  [OpportunityStatus.REJECTED]: '未通過平台審核，請查看拒絕原因並修改後重新送審',
  [OpportunityStatus.ARCHIVED]: '已手動下架，不再對外顯示',
};

// 判斷當前狀態是否允許編輯
export function canEditOpportunity(status: OpportunityStatus): boolean | 'limited' {
  const editStatus = statusTransitions[status]?.canEdit;
  if (editStatus === 'limited') {
    return 'limited';
  }
  return !!editStatus;
}

// 獲取當前狀態可轉換的下一個狀態
export function getNextPossibleStates(status: OpportunityStatus): OpportunityStatus[] {
  return statusTransitions[status]?.possibleNextStates || [];
}

// 檢查狀態轉換是否有效
export function isValidStatusTransition(currentStatus: OpportunityStatus, newStatus: OpportunityStatus): boolean {
  return getNextPossibleStates(currentStatus).includes(newStatus);
}

// 獲取機會列表
export function useOpportunities(params?: OpportunitySearchParams) {
  return useQuery({
    queryKey: [OPPORTUNITIES_QUERY_KEY, params],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined) {
            searchParams.append(key, JSON.stringify(value));
          }
        });
      }
      const response = await fetch(`/api/opportunities?${searchParams.toString()}`);
      if (!response.ok) {
        throw new Error('獲取機會列表失敗');
      }
      return response.json();
    },
  });
}

// 獲取單個機會詳情
export function useOpportunity(id: string) {
  return useQuery({
    queryKey: [OPPORTUNITY_QUERY_KEY, id],
    queryFn: async () => {
      const response = await fetch(`/api/opportunities/${id}`);
      if (!response.ok) {
        throw new Error('獲取機會詳情失敗');
      }
      return response.json();
    },
    enabled: !!id,
  });
}

// 創建新機會
export function useCreateOpportunity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: OpportunityCreateFormData) => {
      const response = await fetch('/api/opportunities', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        throw new Error('創建機會失敗');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [OPPORTUNITIES_QUERY_KEY] });
    },
  });
}

// 更新機會
export function useUpdateOpportunity(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: OpportunityUpdateFormData) => {
      const response = await fetch(`/api/opportunities/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        throw new Error('更新機會失敗');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [OPPORTUNITIES_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [OPPORTUNITY_QUERY_KEY, id] });
    },
  });
}

// 更新機會狀態
export function useUpdateOpportunityStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: OpportunityStatus }) => {
      const response = await fetch(`/api/opportunities/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || '更新狀態失敗');
      }

      return response.json();
    },
    onSuccess: (data, variables) => {
      // 更新列表和詳情頁的資料
      queryClient.invalidateQueries({ queryKey: [OPPORTUNITIES_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [OPPORTUNITY_QUERY_KEY, variables.id] });
    },
  });
}

// 在 OpportunityList 組件中使用的狀態管理動作
export function useOpportunityStatusActions() {
  const updateStatusMutation = useUpdateOpportunityStatus();

  const onUpdateStatus = async (id: string, newStatus: OpportunityStatus, currentStatus: OpportunityStatus) => {
    // 檢查狀態轉換是否有效
    if (!isValidStatusTransition(currentStatus, newStatus)) {
      throw new Error('狀態轉換無效');
    }

    return updateStatusMutation.mutateAsync({ id, status: newStatus });
  };

  return {
    onUpdateStatus,
    isUpdating: updateStatusMutation.isPending,
  };
}

// 獲取狀態更新成功後的提示訊息
export function getStatusUpdateMessage(newStatus: OpportunityStatus): string {
  switch (newStatus) {
    case OpportunityStatus.DRAFT:
      return '已撤回為草稿狀態，您可以繼續編輯';
    case OpportunityStatus.PENDING:
      return '已送出審核，請等待管理員審核';
    case OpportunityStatus.ACTIVE:
      return '已成功上架，現在對外開放申請';
    case OpportunityStatus.PAUSED:
      return '已暫停招募，申請者將無法提交新申請';
    case OpportunityStatus.ARCHIVED:
      return '已下架機會，不再對外顯示';
    case OpportunityStatus.REJECTED:
      return '機會未通過審核，請查看原因';
    case OpportunityStatus.FILLED:
      return '機會已達招募人數上限';
    case OpportunityStatus.EXPIRED:
      return '機會已過期';
    default:
      return '狀態已更新';
  }
}