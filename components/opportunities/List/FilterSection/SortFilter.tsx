import React from 'react';
import { SortFilterProps } from './types';

const SortFilter: React.FC<SortFilterProps> = ({ selectedSort, onChange, disabled }) => {
  // 排序選項
  const sortOptions = [
    { value: 'newest', label: '最新發布' },
    { value: 'oldest', label: '最早發布' },
    { value: 'popularity', label: '熱門程度' },
    { value: 'duration', label: '工作時長' }
  ];

  return (
    <div>
      <label htmlFor="sortFilter" className="block text-sm font-medium text-gray-700 mb-1">
        排序方式
      </label>
      <select
        id="sortFilter"
        value={selectedSort}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
      >
        {sortOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
};

export default SortFilter;