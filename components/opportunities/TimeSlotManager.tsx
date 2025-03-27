import { useState } from 'react';
import { TimeSlot, ICapacityOverride } from '@/types/opportunity';
import { TimeSlotStatus } from '@/models/enums/TimeSlotStatus';
import { format } from 'date-fns';
import { zhTW } from 'date-fns/locale';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { timeSlotSchema, TimeSlotFormData } from '@/lib/schemas/timeSlot';

interface TimeSlotManagerProps {
  opportunityId: string;
  timeSlots: TimeSlot[];
  onTimeSlotUpdate: (timeSlots: TimeSlot[]) => void;
}

interface EditingSlot extends Omit<TimeSlot, '_id'> {
  _id?: string;
}

export default function TimeSlotManager({ opportunityId, timeSlots, onTimeSlotUpdate }: TimeSlotManagerProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingSlot, setEditingSlot] = useState<EditingSlot | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      capacityOverrides: [],
    },
  });

  const onSubmit = async (data: TimeSlotFormData) => {
    setIsSubmitting(true);
    try {
      const url = editingSlot
        ? `/api/opportunities/${opportunityId}/timeslots/${editingSlot._id}`
        : `/api/opportunities/${opportunityId}/timeslots`;

      const method = editingSlot ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(editingSlot ? '更新時段失敗' : '新增時段失敗');
      }

      const newTimeSlot = await response.json();

      if (editingSlot) {
        onTimeSlotUpdate(timeSlots.map(slot =>
          slot._id === newTimeSlot._id ? newTimeSlot : slot
        ));
      } else {
      onTimeSlotUpdate([...timeSlots, newTimeSlot]);
      }

      reset();
      setEditingSlot(null);
      setIsAdding(false);
    } catch (error) {
      console.error('時段操作錯誤:', error);
      alert(editingSlot ? '更新時段失敗，請稍後再試' : '新增時段失敗，請稍後再試');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (timeSlotId: string) => {
    if (!confirm('確定要刪除這個時段嗎？')) return;

    try {
      const response = await fetch(`/api/opportunities/${opportunityId}/timeslots/${timeSlotId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('刪除時段失敗');
      }

      onTimeSlotUpdate(timeSlots.filter(slot => slot._id !== timeSlotId));
    } catch (error) {
      console.error('刪除時段錯誤:', error);
      alert('刪除時段失敗，請稍後再試');
    }
  };

  const handleEditClick = (slot: TimeSlot) => {
    setEditingSlot(slot);
    reset({
      startDate: format(new Date(slot.startDate), 'yyyy-MM-dd'),
      endDate: format(new Date(slot.endDate), 'yyyy-MM-dd'),
      defaultCapacity: slot.defaultCapacity,
      minimumStay: slot.minimumStay,
      description: slot.description || '',
      capacityOverrides: slot.capacityOverrides || [],
    });
  };

  return (
    <div className="space-y-6">
      {/* 新增/編輯時段表單 */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold mb-4">
          {editingSlot ? '編輯時段' : '新增時段'}
        </h3>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                開始日期
              </label>
              <input
                type="date"
                {...register('startDate')}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                min={new Date().toISOString().split('T')[0]}
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
                min={new Date().toISOString().split('T')[0]}
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
            {editingSlot && (
              <button
                type="button"
                onClick={() => {
                  setEditingSlot(null);
                  reset();
                }}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                取消
              </button>
            )}
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? '處理中...' : (editingSlot ? '更新時段' : '新增時段')}
            </button>
          </div>
        </form>
      </div>

      {/* 時段列表 */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold mb-4">現有時段</h3>
        <div className="space-y-4">
          {timeSlots.map((slot) => (
            <div
              key={slot._id}
              className="time-slot-card bg-white border border-gray-200 rounded-lg p-4"
            >
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      slot.status === TimeSlotStatus.OPEN ? 'bg-green-100 text-green-800' :
                      slot.status === TimeSlotStatus.CLOSED ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {slot.status === TimeSlotStatus.OPEN ? '開放申請' :
                       slot.status === TimeSlotStatus.CLOSED ? '已關閉' : '即將滿額'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">
                    {format(new Date(slot.startDate), 'yyyy/MM/dd', { locale: zhTW })} 至{' '}
                    {format(new Date(slot.endDate), 'yyyy/MM/dd', { locale: zhTW })}
                  </p>
                  <p className="text-sm text-gray-600">
                    容量: {slot.defaultCapacity} | 最短停留: {slot.minimumStay} 天
                  </p>
                  {slot.description && (
                    <p className="text-sm text-gray-600 mt-2">{slot.description}</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEditClick(slot)}
                    className="time-slot-button inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                  >
                    編輯
                  </button>
                  <button
                    onClick={() => handleDelete(slot._id)}
                    className="time-slot-button inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  >
                    刪除
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}