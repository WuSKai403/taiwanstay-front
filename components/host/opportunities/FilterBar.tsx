import React from 'react';
import { OpportunityStatus } from '@/models/enums';

interface FilterBarProps {
  onFilterChange: (status: string | null) => void;
  onSortChange: (sort: string, order: string) => void;
  currentStatus: string | null;
  currentSort: string;
  currentOrder: string;
}

const FilterBar: React.FC<FilterBarProps> = ({
  onFilterChange,
  onSortChange,
  currentStatus,
  currentSort,
  currentOrder,
}) => {
  // 定義排序選項
  const sortOptions = [
    { value: 'createdAt', label: '創建時間' },
    { value: 'publishedAt', label: '發布時間' },
    { value: 'title', label: '標題' },
    { value: 'applications', label: '申請數量' },
    { value: 'views', label: '查看數量' },
  ];

  // 切換排序順序
  const toggleOrder = () => {
    onSortChange(currentSort, currentOrder === 'desc' ? 'asc' : 'desc');
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* 狀態過濾 */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => onFilterChange(null)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              currentStatus === null
                ? 'bg-primary text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            全部
          </button>

          <button
            onClick={() => onFilterChange(OpportunityStatus.DRAFT)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              currentStatus === OpportunityStatus.DRAFT
                ? 'bg-primary text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            草稿
          </button>

          <button
            onClick={() => onFilterChange(OpportunityStatus.PENDING)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              currentStatus === OpportunityStatus.PENDING
                ? 'bg-primary text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            待審核
          </button>

          <button
            onClick={() => onFilterChange(OpportunityStatus.ACTIVE)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              currentStatus === OpportunityStatus.ACTIVE
                ? 'bg-primary text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            已上架
          </button>

          <button
            onClick={() => onFilterChange(OpportunityStatus.PAUSED)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              currentStatus === OpportunityStatus.PAUSED
                ? 'bg-primary text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            已暫停
          </button>

          <button
            onClick={() => onFilterChange(OpportunityStatus.ARCHIVED)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              currentStatus === OpportunityStatus.ARCHIVED
                ? 'bg-primary text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            已下架
          </button>
        </div>

        {/* 排序選項 */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">排序:</span>
          <select
            value={currentSort}
            onChange={(e) => onSortChange(e.target.value, currentOrder)}
            className="py-1.5 px-3 text-sm border border-gray-300 rounded-md bg-white focus:ring-2 focus:ring-primary focus:border-primary"
          >
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <button
            onClick={toggleOrder}
            className="p-1.5 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            {currentOrder === 'desc' ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default FilterBar;