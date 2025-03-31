import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { useRouter } from 'next/router';
import { debounce } from 'lodash';
import { SearchIcon } from '@/components/icons/Icons';

interface SearchSectionProps {
  initialValue: string;
  onSearch: (term: string) => void;
  isSearching?: boolean;
}

const SearchSection: React.FC<SearchSectionProps> = ({
  initialValue = '',
  onSearch,
  isSearching = false
}) => {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState(initialValue);

  // 初始化時從 props 獲取搜尋詞
  useEffect(() => {
    setSearchTerm(initialValue);
  }, [initialValue]);

  // 防抖搜尋函數（使用 useMemo 而非 useCallback 來創建）
  const debouncedSearch = useMemo(() => {
    const debouncedFn = debounce((value: string) => {
      onSearch(value);
    }, 500);

    return {
      execute: (value: string) => debouncedFn(value),
      flush: () => debouncedFn.flush()
    };
  }, [onSearch]);

  // 處理輸入變化
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    debouncedSearch.execute(value);
  };

  // 處理表單提交
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    debouncedSearch.flush(); // 立即執行防抖函數
    onSearch(searchTerm); // 確保立即執行
  };

  return (
    <form onSubmit={handleSubmit} className="mb-6">
      <div className="relative">
        <input
          type="text"
          value={searchTerm}
          onChange={handleInputChange}
          placeholder="搜尋工作機會..."
          className={`w-full px-4 py-3 pl-10 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            isSearching ? 'opacity-70' : ''
          }`}
          disabled={isSearching}
        />
        <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />

        {isSearching && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        )}
      </div>

      <button
        type="submit"
        className="mt-2 w-full md:w-auto px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-300"
        disabled={isSearching}
      >
        搜尋
      </button>
    </form>
  );
};

export default SearchSection;