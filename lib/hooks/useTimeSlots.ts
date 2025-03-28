import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { TimeSlot, TimeSlotFormData } from '@/lib/schemas/timeSlot';

// 獲取時段列表
export const useTimeSlots = (opportunityId: string) => {
  return useQuery({
    queryKey: ['timeSlots', opportunityId],
    queryFn: async () => {
      const response = await fetch(`/api/opportunities/${opportunityId}/timeslots`);
      if (!response.ok) {
        throw new Error('獲取時段列表失敗');
      }
      return response.json();
    }
  });
};

// 創建時段
export const useCreateTimeSlot = (opportunityId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: TimeSlotFormData) => {
      const response = await fetch(`/api/opportunities/${opportunityId}/timeslots`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        throw new Error('創建時段失敗');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timeSlots', opportunityId] });
    },
  });
};

// 更新時段
export const useUpdateTimeSlot = (opportunityId: string, timeSlotId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: TimeSlotFormData) => {
      const response = await fetch(`/api/opportunities/${opportunityId}/timeslots/${timeSlotId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        throw new Error('更新時段失敗');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timeSlots', opportunityId] });
    },
  });
};

// 刪除時段
export const useDeleteTimeSlot = (opportunityId: string, timeSlotId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/opportunities/${opportunityId}/timeslots/${timeSlotId}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('刪除時段失敗');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timeSlots', opportunityId] });
    },
  });
};