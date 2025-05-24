import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { OpportunityFormData, OpportunityCreateFormData, OpportunityUpdateFormData, OpportunitySearchParams } from '@/lib/schemas/opportunity';
import { OpportunityStatus } from '@/models/enums';
import {
  isValidStatusTransition,
  getStatusUpdateMessage,
  getNextAllowedStates,
  canEditOpportunity,
  statusDescriptions
} from '@/lib/opportunities/statusManager';

const OPPORTUNITIES_QUERY_KEY = 'opportunities';
const OPPORTUNITY_QUERY_KEY = 'opportunity';

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
      // 防止直接在 update API 中修改狀態
      const { status, ...updateData } = data;

      const response = await fetch(`/api/opportunities/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || '更新機會失敗');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [OPPORTUNITIES_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [OPPORTUNITY_QUERY_KEY, id] });
    },
  });
}

// 更新機會狀態 (Host版)
export function useUpdateOpportunityStatus(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ status, reason }: { status: OpportunityStatus; reason?: string }) => {
      const response = await fetch(`/api/opportunities/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status, reason }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || '更新機會狀態失敗');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [OPPORTUNITIES_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [OPPORTUNITY_QUERY_KEY, id] });
    },
  });
}

// 更新機會狀態 (Admin版)
export function useAdminUpdateOpportunityStatus(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ status, reason }: { status: OpportunityStatus; reason?: string }) => {
      const response = await fetch(`/api/admin/opportunities/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status, reason }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || '管理員更新機會狀態失敗');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [OPPORTUNITIES_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [OPPORTUNITY_QUERY_KEY, id] });
    },
  });
}

// 管理員更新機會內容
export function useAdminUpdateOpportunity(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: OpportunityUpdateFormData) => {
      // 防止直接在 update API 中修改狀態
      const { status, ...updateData } = data;

      const response = await fetch(`/api/admin/opportunities/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || '管理員更新機會失敗');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [OPPORTUNITIES_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [OPPORTUNITY_QUERY_KEY, id] });
    },
  });
}

// 在 OpportunityList 組件中使用的狀態管理動作
export function useOpportunityStatusActions() {
  const queryClient = useQueryClient();

  const onUpdateStatus = async (id: string, newStatus: OpportunityStatus, currentStatus: OpportunityStatus, reason?: string) => {
    // 檢查狀態轉換是否有效
    if (!isValidStatusTransition(currentStatus, newStatus)) {
      throw new Error('狀態轉換無效');
    }

    // 建立一個臨時的 mutation 用於此次操作
    const response = await fetch(`/api/opportunities/${id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status: newStatus, reason }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || '更新狀態失敗');
    }

    // 更新查詢緩存
    queryClient.invalidateQueries({ queryKey: [OPPORTUNITIES_QUERY_KEY] });
    queryClient.invalidateQueries({ queryKey: [OPPORTUNITY_QUERY_KEY, id] });

    return response.json();
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