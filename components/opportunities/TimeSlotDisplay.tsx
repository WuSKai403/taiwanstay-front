import { useState } from 'react';
import { format, isValid, parseISO } from 'date-fns';
import { zhTW } from 'date-fns/locale';

interface TimeSlotDisplayProps {
  startDate: string | Date;
  endDate: string | Date;
  defaultCapacity: number;
  minimumStay: number;
  appliedCount: number;
}

const TimeSlotDisplay: React.FC<TimeSlotDisplayProps> = ({
  startDate,
  endDate,
  defaultCapacity,
  minimumStay,
  appliedCount,
}) => {
  const start = typeof startDate === 'string' ? parseISO(startDate) : startDate;
  const end = typeof endDate === 'string' ? parseISO(endDate) : endDate;

  if (!isValid(start) || !isValid(end)) {
    return null;
  }

  const startYear = start.getFullYear();
  const endYear = end.getFullYear();
  const startMonth = start.getMonth();
  const endMonth = end.getMonth();

  const [currentYear, setCurrentYear] = useState(startYear);

  // 檢查年份是否可選
  const canGoPrev = currentYear > startYear;
  const canGoNext = currentYear < endYear;

  // 生成當前年份的月份顯示
  const generateMonthsForYear = (year: number) => {
    return Array.from({ length: 12 }, (_, index) => {
      const isAvailable =
        (year === startYear && index >= startMonth) ||
        (year === endYear && index <= endMonth) ||
        (year > startYear && year < endYear);

      return {
        month: index + 1,
        available: isAvailable,
        disabled:
          (year === startYear && index < startMonth) ||
          (year === endYear && index > endMonth) ||
          year < startYear ||
          year > endYear
      };
    });
  };

  const months = generateMonthsForYear(currentYear);

  return (
    <div className="bg-white rounded-lg shadow-sm p-3">
      {/* 年份選擇器 */}
      <div className="flex justify-between items-center mb-3">
        <button
          onClick={() => setCurrentYear(prev => prev - 1)}
          disabled={!canGoPrev}
          className={`p-1 rounded ${
            canGoPrev
              ? 'text-gray-600 hover:bg-gray-100'
              : 'text-gray-300 cursor-not-allowed'
          }`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <span className="text-sm font-medium">{currentYear} 年</span>
        <button
          onClick={() => setCurrentYear(prev => prev + 1)}
          disabled={!canGoNext}
          className={`p-1 rounded ${
            canGoNext
              ? 'text-gray-600 hover:bg-gray-100'
              : 'text-gray-300 cursor-not-allowed'
          }`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* 月份顯示 */}
      <div className="grid grid-cols-4 gap-1.5">
        {months.map((month, index) => (
          <div
            key={index}
            className={`text-center py-1.5 px-1 rounded text-xs ${
              month.disabled
                ? 'text-gray-300 bg-gray-50'
                : month.available
                ? 'text-primary-600 bg-primary-50 font-medium'
                : 'text-gray-500 bg-gray-100'
            }`}
          >
            {month.month}月
          </div>
        ))}
      </div>

      {/* 補充資訊 */}
      <div className="mt-3 grid grid-cols-3 gap-2 text-xs border-t border-gray-100 pt-3">
        <div>
          <div className="text-gray-500">最短停留</div>
          <div className="font-medium mt-0.5">{minimumStay} 天</div>
        </div>
        <div>
          <div className="text-gray-500">總名額</div>
          <div className="font-medium mt-0.5">{defaultCapacity} 位</div>
        </div>
        <div>
          <div className="text-gray-500">已申請人數</div>
          <div className="font-medium mt-0.5">{appliedCount} 位</div>
        </div>
      </div>
    </div>
  );
};

export default TimeSlotDisplay;