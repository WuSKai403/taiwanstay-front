import { useState } from 'react';
import { TimeSlot } from '@/types/opportunity';
import { TimeSlotStatus } from '@/models/enums/TimeSlotStatus';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, subMonths, addMonths, isSameDay } from 'date-fns';
import { zhTW } from 'date-fns/locale';

interface TimeSlotCalendarProps {
  timeSlots: TimeSlot[];
  onTimeSlotClick: (timeSlot: TimeSlot) => void;
}

export default function TimeSlotCalendar({ timeSlots, onTimeSlotClick }: TimeSlotCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

  // 獲取當前月份的開始和結束日期
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);

  // 獲取日曆中的所有日期
  const getDaysInMonth = (date: Date) => {
    return eachDayOfInterval({ start: monthStart, end: monthEnd });
  };

  // 獲取當前月份的所有時段
  const getTimeSlotsForDate = (date: Date) => {
    return timeSlots.filter(slot => {
      const slotStart = new Date(slot.startDate);
      const slotEnd = new Date(slot.endDate);
      return date >= slotStart && date <= slotEnd;
    });
  };

  // 獲取時段狀態的顏色
  const getStatusColor = (status: TimeSlotStatus) => {
    switch (status) {
      case TimeSlotStatus.OPEN:
        return 'bg-green-100 text-green-800';
      case TimeSlotStatus.FILLED:
        return 'bg-yellow-100 text-yellow-800';
      case TimeSlotStatus.CLOSED:
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // 獲取時段狀態的文字
  const getStatusText = (status: TimeSlotStatus) => {
    switch (status) {
      case TimeSlotStatus.OPEN:
        return '開放申請';
      case TimeSlotStatus.FILLED:
        return '即將滿額';
      case TimeSlotStatus.CLOSED:
        return '已關閉';
      default:
        return '未知';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">日曆視圖</h3>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setCurrentDate(subMonths(currentDate, 1))}
            className="time-slot-button p-2 rounded-full hover:bg-gray-100"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <span className="text-sm font-medium">
            {format(currentDate, 'yyyy年MM月', { locale: zhTW })}
          </span>
          <button
            onClick={() => setCurrentDate(addMonths(currentDate, 1))}
            className="time-slot-button p-2 rounded-full hover:bg-gray-100"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1">
        {['日', '一', '二', '三', '四', '五', '六'].map((day) => (
          <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {getDaysInMonth(currentDate).map((date: Date, index: number) => {
          const dayTimeSlots = getTimeSlotsForDate(date);
          const isToday = isSameDay(date, new Date());
          const isCurrentMonth = isSameMonth(date, currentDate);

          return (
            <div
              key={index}
              className={`calendar-day relative min-h-[100px] p-2 border rounded-lg ${
                isToday ? 'bg-primary-50 border-primary-200' :
                isCurrentMonth ? 'bg-white border-gray-200' :
                'bg-gray-50 border-gray-100'
              }`}
            >
              <div className="text-sm font-medium mb-1">
                {format(date, 'd')}
              </div>
              <div className="space-y-1">
                {dayTimeSlots.map((slot) => (
                  <div
                    key={slot._id}
                    onClick={() => onTimeSlotClick(slot)}
                    className={`text-xs p-1 rounded cursor-pointer ${
                      getStatusColor(slot.status)
                    }`}
                  >
                    <div className="font-medium">
                      {format(new Date(slot.startDate), 'HH:mm')} - {format(new Date(slot.endDate), 'HH:mm')}
                    </div>
                    <div className="text-xs opacity-75">
                      剩餘: {slot.defaultCapacity - slot.confirmedCount}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <div className="flex items-center">
          <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
          <span className="text-sm text-gray-600">開放</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 rounded-full bg-yellow-500 mr-2"></div>
          <span className="text-sm text-gray-600">即將滿額</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 rounded-full bg-red-500 mr-2"></div>
          <span className="text-sm text-gray-600">已滿</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 rounded-full bg-gray-500 mr-2"></div>
          <span className="text-sm text-gray-600">已關閉</span>
        </div>
      </div>
    </div>
  );
}