import { useState } from 'react';
import { TimeSlot, ICapacityOverride } from '@/types/opportunity';
import { TimeSlotStatus } from '@/models/enums/TimeSlotStatus';
import { format } from 'date-fns';
import { zhTW } from 'date-fns/locale';

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
  const [formData, setFormData] = useState<Omit<TimeSlot, '_id' | 'appliedCount' | 'confirmedCount' | 'status'>>({
    startDate: '',
    endDate: '',
    defaultCapacity: 1,
    minimumStay: 14,
    description: '',
    capacityOverrides: []
  });

  const handleAdd = async () => {
    try {
      const response = await fetch(`/api/opportunities/${opportunityId}/timeslots`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('新增時段失敗');
      }

      const newTimeSlot = await response.json();
      onTimeSlotUpdate([...timeSlots, newTimeSlot]);
      setIsAdding(false);
      setFormData({
        startDate: '',
        endDate: '',
        defaultCapacity: 1,
        minimumStay: 14,
        description: '',
        capacityOverrides: []
      });
    } catch (error) {
      console.error('新增時段錯誤:', error);
      alert('新增時段失敗，請稍後再試');
    }
  };

  const handleEdit = async () => {
    if (!editingSlot) return;

    try {
      const response = await fetch(`/api/opportunities/${opportunityId}/timeslots/${editingSlot._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('更新時段失敗');
      }

      const updatedSlot = await response.json();
      onTimeSlotUpdate(timeSlots.map(slot =>
        slot._id === updatedSlot._id ? updatedSlot : slot
      ));
      setEditingSlot(null);
      setFormData({
        startDate: '',
        endDate: '',
        defaultCapacity: 1,
        minimumStay: 14,
        description: '',
        capacityOverrides: []
      });
    } catch (error) {
      console.error('更新時段錯誤:', error);
      alert('更新時段失敗，請稍後再試');
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
    setFormData({
      startDate: format(new Date(slot.startDate), 'yyyy-MM-dd'),
      endDate: format(new Date(slot.endDate), 'yyyy-MM-dd'),
      defaultCapacity: slot.defaultCapacity,
      minimumStay: slot.minimumStay,
      description: slot.description || '',
      capacityOverrides: slot.capacityOverrides || []
    });
  };

  return (
    <div className="space-y-6">
      {/* 新增時段表單 */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold mb-4">新增時段</h3>
        <form onSubmit={handleAdd} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                開始日期
              </label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                結束日期
              </label>
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                min={formData.startDate}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                預設容量
              </label>
              <input
                type="number"
                value={formData.defaultCapacity}
                onChange={(e) => setFormData({ ...formData, defaultCapacity: parseInt(e.target.value) })}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                min="1"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                最短停留天數
              </label>
              <input
                type="number"
                value={formData.minimumStay}
                onChange={(e) => setFormData({ ...formData, minimumStay: parseInt(e.target.value) })}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                min="1"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              描述
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
              rows={3}
            />
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              className="time-slot-button inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              新增時段
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