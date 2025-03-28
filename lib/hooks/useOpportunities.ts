import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { OpportunityFormData, OpportunityCreateFormData, OpportunityUpdateFormData, OpportunitySearchParams } from '@/lib/schemas/opportunity';

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

// 刪除機會
export function useDeleteOpportunity(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/opportunities/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('刪除機會失敗');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [OPPORTUNITIES_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [OPPORTUNITY_QUERY_KEY, id] });
    },
  });
}