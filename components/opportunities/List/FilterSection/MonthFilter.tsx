import React, { useState } from 'react';
import { MonthFilterProps } from './types';

// 月份資料
const months = [
  { value: 1, label: '一月' },
  { value: 2, label: '二月' },
  { value: 3, label: '三月' },
  { value: 4, label: '四月' },
  { value: 5, label: '五月' },
  { value: 6, label: '六月' },
  { value: 7, label: '七月' },
  { value: 8, label: '八月' },
  { value: 9, label: '九月' },
  { value: 10, label: '十月' },
  { value: 11, label: '十一月' },
  { value: 12, label: '十二月' }
];

const MonthFilter: React.FC<MonthFilterProps> = ({ selectedMonths, onChange, disabled }) => {
  const [isOpen, setIsOpen] = useState(false);

  // 處理月份選擇
  const handleMonthToggle = (monthValue: number) => {
    if (selectedMonths.includes(monthValue)) {
      onChange(selectedMonths.filter(value => value !== monthValue));
    } else {
      onChange([...selectedMonths, monthValue].sort((a, b) => a - b));
    }
  };

  // 全選或清除選擇
  const handleSelectAll = (select: boolean) => {
    if (select) {
      onChange(months.map(month => month.value));
    } else {
      onChange([]);
    }
  };

  return (
    <div className="relative">
      <label htmlFor="monthFilter" className="block text-sm font-medium text-gray-700 mb-1">
        可工作月份
      </label>
      <div className="mt-1 relative">
        <button
          type="button"
          id="monthFilter"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
          className="block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-left"
        >
          {selectedMonths.length === 0
            ? '選擇月份'
            : selectedMonths.length === 12
            ? '所有月份'
            : `已選 ${selectedMonths.length} 個月份`}
        </button>

        {isOpen && (
          <div className="absolute z-10 mt-1 w-full bg-white shadow-lg rounded-md border border-gray-300 py-1">
            <div className="px-3 py-2 border-b border-gray-200 flex justify-between">
              <button
                type="button"
                className="text-sm text-blue-600 hover:text-blue-800"
                onClick={() => handleSelectAll(true)}
              >
                全選
              </button>
              <button
                type="button"
                className="text-sm text-red-600 hover:text-red-800"
                onClick={() => handleSelectAll(false)}
              >
                清除
              </button>
            </div>
            <div className="p-2 grid grid-cols-3 gap-2">
              {months.map(month => (
                <label
                  key={month.value}
                  className="flex items-center space-x-2 p-1 hover:bg-gray-50 rounded cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedMonths.includes(month.value)}
                    onChange={() => handleMonthToggle(month.value)}
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">{month.label}</span>
                </label>
              ))}
            </div>
          </div>
        )}
      </div>

      {selectedMonths.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {selectedMonths.map(monthValue => {
            const month = months.find(m => m.value === monthValue);
            return (
              <span
                key={monthValue}
                className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
              >
                {month?.label}
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => handleMonthToggle(monthValue)}
                  className="ml-1.5 inline-flex items-center justify-center h-4 w-4 rounded-full text-blue-400 hover:bg-blue-200 hover:text-blue-600 focus:outline-none"
                >
                  <span className="sr-only">移除</span>
                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MonthFilter;