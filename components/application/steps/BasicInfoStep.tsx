import React, { useState, useEffect } from 'react';
import { UseFormRegister, Control, UseFormWatch, UseFormSetValue, FieldErrors, FieldError } from 'react-hook-form';
import { monthSelectionSchema, timeSlotSchema, type ApplicationFormData, type MonthSelection, type TimeSlot } from '@/lib/schemas/application';
import FormField from '@/components/ui/FormField';
import {
  parseYearMonth,
  formatYearMonth,
  calculateDaysBetweenMonths,
  isMonthAvailable,
  generateMonthRange,
  validateMonthSelection,
  formatDateRange
} from '@/lib/utils/dateUtils';

interface BasicInfoStepProps {
  register: UseFormRegister<ApplicationFormData>;
  control: Control<ApplicationFormData>;
  watch: UseFormWatch<ApplicationFormData>;
  setValue: UseFormSetValue<ApplicationFormData>;
  errors: FieldErrors<ApplicationFormData>;
  selectedMonths: MonthSelection[];
  setSelectedMonths: React.Dispatch<React.SetStateAction<MonthSelection[]>>;
  opportunity: {
    id: string;
    timeSlots?: TimeSlot[];
  };
  onMonthsChange?: (months: MonthSelection[]) => void;
}

const BasicInfoStep: React.FC<BasicInfoStepProps> = ({
  register,
  control,
  watch,
  setValue,
  errors,
  selectedMonths,
  setSelectedMonths,
  opportunity,
  onMonthsChange
}) => {
  const [dateRangeDisplay, setDateRangeDisplay] = useState('');
  const [totalDays, setTotalDays] = useState(0);
  const [validationError, setValidationError] = useState<string>();
  const [currentYear, setCurrentYear] = useState(2025);

  const generateMonthsForYear = (year: number): MonthSelection[] => {
    const months: MonthSelection[] = [];
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth();

    for (let month = 0; month < 12; month++) {
      const yearMonthStr = formatYearMonth(year, month);
      const existingMonth = selectedMonths.find(m => m.yearMonthStr === yearMonthStr);

      // 判斷月份是否可用：
      // 1. 如果是過去的年份，全部不可用
      // 2. 如果是當前年份，只有當前月份之後的可用
      // 3. 如果是未來年份，需要檢查是否在可用時段內
      const isPastMonth = year < currentYear || (year === currentYear && month < currentMonth);
      const isAvailableTimeSlot = isMonthAvailable(yearMonthStr, opportunity.timeSlots || []);

      months.push({
        year,
        month,
        yearMonthStr,
        isSelected: existingMonth ? existingMonth.isSelected : false,
        isAvailable: !isPastMonth && isAvailableTimeSlot
      });
    }
    return months;
  };

  const [displayedMonths, setDisplayedMonths] = useState<MonthSelection[]>(
    generateMonthsForYear(currentYear)
  );

  useEffect(() => {
    setDisplayedMonths(generateMonthsForYear(currentYear));
  }, [currentYear, selectedMonths]);

  const handleMonthSelect = (index: number) => {
    if (!displayedMonths[index] || !displayedMonths[index].isAvailable) return;

    const updatedMonths = [...displayedMonths];
    const currentMonth = updatedMonths[index];

    // 找出當前已選擇的月份索引
    const selectedIndices = updatedMonths
      .map((month, i) => month.isSelected ? i : -1)
      .filter(i => i !== -1)
      .sort((a, b) => a - b);

    // 如果沒有選中的月份，直接選中當前月份
    if (selectedIndices.length === 0) {
      currentMonth.isSelected = true;
    } else {
      const minIndex = Math.min(...selectedIndices);
      const maxIndex = Math.max(...selectedIndices);

      // 如果點擊的是已選中的月份
      if (currentMonth.isSelected) {
        // 如果點擊的是最後一個月份，只取消該月份
        if (index === maxIndex) {
          currentMonth.isSelected = false;
        }
        // 如果點擊的是第一個月份，只取消該月份
        else if (index === minIndex) {
          currentMonth.isSelected = false;
        }
        // 如果點擊的是中間的月份，取消該月份及其後的所有月份
        else {
          for (let i = index; i <= maxIndex; i++) {
            updatedMonths[i].isSelected = false;
          }
        }
      } else {
        // 如果點擊的月份在已選範圍之前
        if (index < minIndex) {
          for (let i = index; i < minIndex; i++) {
            if (updatedMonths[i].isAvailable) {
              updatedMonths[i].isSelected = true;
            }
          }
        }
        // 如果點擊的月份在已選範圍之後
        else if (index > maxIndex) {
          for (let i = maxIndex + 1; i <= index; i++) {
            if (updatedMonths[i].isAvailable) {
              updatedMonths[i].isSelected = true;
            }
          }
        }
      }
    }

    setDisplayedMonths(updatedMonths);

    // 更新所有年份的月份狀態
    const allSelectedMonths = selectedMonths.map(month => {
      const matchingMonth = updatedMonths.find(m => m.yearMonthStr === month.yearMonthStr);
      return matchingMonth || month;
    });

    // 找出選中的月份並排序
    const selectedMonthsList = allSelectedMonths
      .filter(month => month.isSelected)
      .sort((a, b) => {
        if (a.year !== b.year) return a.year - b.year;
        return a.month - b.month;
      });

    if (selectedMonthsList.length > 0) {
      const firstMonth = selectedMonthsList[0];
      const lastMonth = selectedMonthsList[selectedMonthsList.length - 1];

      // 更新表單值
      setValue('startMonth', firstMonth.yearMonthStr);
      setValue('endMonth', lastMonth.yearMonthStr);
      setValue('availableMonths', selectedMonthsList.map(m => m.yearMonthStr));

      // 更新日期範圍顯示
      const startDate = new Date(firstMonth.year, firstMonth.month, 1);
      const endDate = new Date(lastMonth.year, lastMonth.month + 1, 0); // 取得月份最後一天
      const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

      setDateRangeDisplay(
        `${firstMonth.year}/${firstMonth.month + 1}/1 ~ ${lastMonth.year}/${lastMonth.month + 1}/${endDate.getDate()}`
      );
      setTotalDays(days);
      setValue('duration', days);
    } else {
      // 清除相關欄位
      setValue('startMonth', '');
      setValue('endMonth', '');
      setValue('availableMonths', []);
      setValue('duration', 0);
      setDateRangeDisplay('');
      setTotalDays(0);
    }

    // 更新父組件的月份狀態
    setSelectedMonths(allSelectedMonths);
    if (onMonthsChange) {
      onMonthsChange(allSelectedMonths);
    }
  };

  const handleYearChange = (increment: number) => {
    setCurrentYear(prev => prev + increment);
  };

  return (
    <div className="space-y-6">
      {/* 月份選擇區域 */}
      <div>
        <h3 className="text-lg font-medium mb-4">選擇月份</h3>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          {/* 年份選擇 */}
          <div className="flex items-center justify-between mb-4">
            <button
              type="button"
              onClick={() => handleYearChange(-1)}
              className="p-2 text-gray-600 hover:text-primary-600 disabled:text-gray-300"
              disabled={currentYear <= new Date().getFullYear()}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <span className="text-lg font-medium">{currentYear}年</span>
            <button
              type="button"
              onClick={() => handleYearChange(1)}
              className="p-2 text-gray-600 hover:text-primary-600 disabled:text-gray-300"
              disabled={currentYear >= new Date().getFullYear() + 2}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* 月份網格 */}
          <div className="grid grid-cols-4 gap-2">
            {displayedMonths.map((month, index) => (
              <button
                key={month.yearMonthStr}
                type="button"
                onClick={() => handleMonthSelect(index)}
                disabled={!month.isAvailable}
                className={`
                  py-2 px-3 text-sm rounded-md transition-all duration-200
                  ${month.isSelected
                    ? 'bg-primary-600 text-white border-2 border-primary-600'
                    : month.isAvailable
                      ? 'bg-white hover:bg-gray-50 border border-gray-300 hover:border-primary-500 hover:text-primary-600'
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200'
                  }
                `}
              >
                {month.month + 1}月
              </button>
            ))}
          </div>
        </div>
        {validationError && (
          <p className="mt-2 text-red-600 text-sm">{validationError}</p>
        )}
      </div>

      {/* 選擇的時間範圍顯示 */}
      {dateRangeDisplay && (
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-medium mb-2">選擇的時間範圍</h4>
          <p>{dateRangeDisplay}</p>
          <p className="mt-1 text-gray-600">總計 {totalDays} 天</p>
        </div>
      )}

      {/* 駕駛執照類型 */}
      <FormField
        label="駕駛執照類型"
        error={errors.drivingLicense as FieldError | FieldErrors<any> | undefined}
      >
        <div className="mt-2 space-y-2">
          <div className="flex flex-wrap gap-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                {...register('drivingLicense.motorcycle')}
                className="form-checkbox"
              />
              <span className="ml-2">機車</span>
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                {...register('drivingLicense.car')}
                className="form-checkbox"
              />
              <span className="ml-2">汽車</span>
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                {...register('drivingLicense.none')}
                className="form-checkbox"
              />
              <span className="ml-2">無駕照</span>
            </label>
          </div>
          <div className="mt-2">
            <label className="flex items-center">
              <input
                type="checkbox"
                {...register('drivingLicense.other.enabled')}
                className="form-checkbox"
              />
              <span className="ml-2">其他</span>
            </label>
            {watch('drivingLicense.other.enabled') && (
              <input
                type="text"
                {...register('drivingLicense.other.details')}
                placeholder="請說明其他駕照類型"
                className="mt-2 form-input"
              />
            )}
          </div>
        </div>
      </FormField>
    </div>
  );
};

export default BasicInfoStep;