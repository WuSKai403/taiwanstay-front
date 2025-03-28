import { useState } from 'react';
import { TimeSlot } from '@/lib/schemas/timeSlot';
import { format } from 'date-fns';
import { zhTW } from 'date-fns/locale';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { timeSlotSchema, TimeSlotFormData } from '@/lib/schemas/timeSlot';
import { useTimeSlots, useCreateTimeSlot, useUpdateTimeSlot, useDeleteTimeSlot } from '@/lib/hooks/useTimeSlots';

interface TimeSlotManagerProps {
  opportunityId: string;
}

type EditingSlot = TimeSlot;

export default function TimeSlotManager({ opportunityId }: TimeSlotManagerProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingSlot, setEditingSlot] = useState<EditingSlot | null>(null);

  const { data: timeSlots, isLoading, error } = useTimeSlots(opportunityId);
  const createTimeSlot = useCreateTimeSlot(opportunityId);
  const updateTimeSlot = useUpdateTimeSlot(opportunityId, editingSlot?._id || '');
  const deleteTimeSlot = useDeleteTimeSlot(opportunityId, editingSlot?._id || '');

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<TimeSlotFormData>({
    resolver: zodResolver(timeSlotSchema),
    defaultValues: {
      startDate: '',
      endDate: '',
      defaultCapacity: 1,
      minimumStay: 14,
      description: '',
    },
  });

  const onSubmit = async (data: TimeSlotFormData) => {
    try {
      if (editingSlot) {
        await updateTimeSlot.mutateAsync(data);
      } else {
        await createTimeSlot.mutateAsync(data);
      }
      reset();
      setEditingSlot(null);
      setIsAdding(false);
    } catch (error) {
      console.error('時段操作錯誤:', error);
      alert(editingSlot ? '更新時段失敗，請稍後再試' : '新增時段失敗，請稍後再試');
    }
  };

  const handleDelete = async () => {
    if (!editingSlot) return;
    try {
      await deleteTimeSlot.mutateAsync();
      setEditingSlot(null);
    } catch (error) {
      console.error('刪除時段錯誤:', error);
      alert('刪除時段失敗，請稍後再試');
    }
  };

  if (isLoading) return <div>載入中...</div>;
  if (error) return <div>載入失敗</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-medium">時段管理</h2>
        <button
          onClick={() => setIsAdding(true)}
          className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
        >
          新增時段
        </button>
      </div>

      {/* 時段列表 */}
      <div className="space-y-4">
        {timeSlots?.map((slot: TimeSlot) => (
          <div
            key={slot._id}
            className="p-4 border rounded-lg hover:bg-gray-50"
          >
            <div className="flex justify-between items-start">
              <div>
                <p className="font-medium">
                  {format(new Date(slot.startDate), 'yyyy/MM/dd', { locale: zhTW })} -
                  {format(new Date(slot.endDate), 'yyyy/MM/dd', { locale: zhTW })}
                </p>
                <p className="text-sm text-gray-600">
                  預設容量: {slot.defaultCapacity} | 最短停留: {slot.minimumStay} 天
                </p>
                {slot.description && (
                  <p className="text-sm text-gray-600 mt-1">{slot.description}</p>
                )}
              </div>
              <div className="space-x-2">
                <button
                  onClick={() => setEditingSlot(slot)}
                  className="text-blue-500 hover:text-blue-600"
                >
                  編輯
                </button>
                <button
                  onClick={() => setEditingSlot(slot)}
                  className="text-red-500 hover:text-red-600"
                >
                  刪除
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 新增/編輯表單 */}
      {(isAdding || editingSlot) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg w-full max-w-md">
            <h3 className="text-lg font-medium mb-4">
              {editingSlot ? '編輯時段' : '新增時段'}
            </h3>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  開始日期
                </label>
                <input
                  type="date"
                  {...register('startDate')}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                />
                {errors.startDate && (
                  <p className="mt-1 text-sm text-red-600">{errors.startDate.message}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  結束日期
                </label>
                <input
                  type="date"
                  {...register('endDate')}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                />
                {errors.endDate && (
                  <p className="mt-1 text-sm text-red-600">{errors.endDate.message}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  預設容量
                </label>
                <input
                  type="number"
                  {...register('defaultCapacity', { valueAsNumber: true })}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  min="1"
                />
                {errors.defaultCapacity && (
                  <p className="mt-1 text-sm text-red-600">{errors.defaultCapacity.message}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  最短停留天數
                </label>
                <input
                  type="number"
                  {...register('minimumStay', { valueAsNumber: true })}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  min="1"
                />
                {errors.minimumStay && (
                  <p className="mt-1 text-sm text-red-600">{errors.minimumStay.message}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  描述
                </label>
                <textarea
                  {...register('description')}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  rows={3}
                />
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsAdding(false);
                    setEditingSlot(null);
                    reset();
                  }}
                  className="px-4 py-2 text-gray-700 hover:text-gray-900"
                >
                  取消
                </button>
                {editingSlot && (
                  <button
                    type="button"
                    onClick={handleDelete}
                    className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
                  >
                    刪除
                  </button>
                )}
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                >
                  {editingSlot ? '更新' : '新增'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}