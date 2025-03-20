import { useState } from 'react';
import { TimeSlot } from '@/types/opportunity';
import { TimeSlotStatus } from '@/models/enums/TimeSlotStatus';
import { format } from 'date-fns';
import { zhTW } from 'date-fns/locale';
import { ChevronUpIcon, ChevronDownIcon } from '@heroicons/react/24/outline';

interface TimeSlotFilterProps {
  timeSlots: TimeSlot[];
  onFilterChange: (filteredSlots: TimeSlot[]) => void;
}

export default function TimeSlotFilter({ timeSlots, onFilterChange }: TimeSlotFilterProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [filters, setFilters] = useState({
    status: 'ALL',
    minCapacity: 1,
    minStay: 1,
    dateRange: {
      start: '',
      end: ''
    }
  });

  const handleFilterChange = (newFilters: typeof filters) => {
    setFilters(newFilters);

    let filteredSlots = [...timeSlots];

    // 狀態篩選
    if (newFilters.status !== 'ALL') {
      filteredSlots = filteredSlots.filter(slot => slot.status === newFilters.status);
    }

    // 容量篩選
    filteredSlots = filteredSlots.filter(slot =>
      slot.defaultCapacity - slot.confirmedCount >= newFilters.minCapacity
    );

    // 最短停留天數篩選
    filteredSlots = filteredSlots.filter(slot =>
      slot.minimumStay >= newFilters.minStay
    );

    // 日期範圍篩選
    if (newFilters.dateRange.start && newFilters.dateRange.end) {
      const startDate = new Date(newFilters.dateRange.start);
      const endDate = new Date(newFilters.dateRange.end);

      filteredSlots = filteredSlots.filter(slot => {
        const slotStart = new Date(slot.startDate);
        const slotEnd = new Date(slot.endDate);
        return slotStart <= endDate && slotEnd >= startDate;
      });
    }

    onFilterChange(filteredSlots);
  };

  return (
    <div className="filter-container bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">篩選時段</h3>
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="text-gray-500 hover:text-gray-700 focus:outline-none"
        >
          <ChevronUpIcon
            className={`w-5 h-5 transform transition-transform ${isCollapsed ? 'rotate-180' : ''}`}
          />
        </button>
      </div>

      <div className={`space-y-4 ${isCollapsed ? 'hidden' : ''}`}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              狀態
            </label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange({ ...filters, status: e.target.value })}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
            >
              <option value="ALL">全部</option>
              <option value={TimeSlotStatus.OPEN}>開放申請</option>
              <option value={TimeSlotStatus.FILLED}>即將滿額</option>
              <option value={TimeSlotStatus.CLOSED}>已關閉</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              最小剩餘容量
            </label>
            <input
              type="number"
              value={filters.minCapacity}
              onChange={(e) => handleFilterChange({
                ...filters,
                minCapacity: parseInt(e.target.value) || 1
              })}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
              min="0"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              最短停留天數
            </label>
            <input
              type="number"
              value={filters.minStay}
              onChange={(e) => handleFilterChange({
                ...filters,
                minStay: parseInt(e.target.value) || 1
              })}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
              min="1"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              日期範圍
            </label>
            <div className="flex space-x-2">
              <input
                type="date"
                value={filters.dateRange.start}
                onChange={(e) => handleFilterChange({
                  ...filters,
                  dateRange: { ...filters.dateRange, start: e.target.value }
                })}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                min={new Date().toISOString().split('T')[0]}
              />
              <input
                type="date"
                value={filters.dateRange.end}
                onChange={(e) => handleFilterChange({
                  ...filters,
                  dateRange: { ...filters.dateRange, end: e.target.value }
                })}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {Object.entries(filters).map(([key, value]) => {
            if (value && key !== 'dateRange') {
              return (
                <span
                  key={key}
                  className="inline-flex items-center px-2.5 py-1.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800"
                >
                  {key === 'status' ? `狀態: ${value}` :
                   key === 'minCapacity' ? `最小容量: ${value}` :
                   key === 'minStay' ? `最短停留: ${value}天` : ''}
                  <button
                    onClick={() => handleFilterChange({ ...filters, [key]: 'ALL' })}
                    className="ml-1 text-primary-600 hover:text-primary-800"
                  >
                    ×
                  </button>
                </span>
              );
            }
            return null;
          })}
        </div>

        <div className="text-sm text-gray-600">
          找到 {timeSlots.length} 個符合條件的時段
        </div>
      </div>
    </div>
  );
}