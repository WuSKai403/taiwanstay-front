import React, { useState } from 'react';
import { useRouter } from 'next/router';
import TypeFilter from '@/components/opportunities/List/FilterSection/TypeFilter';
import RegionFilter from '@/components/opportunities/List/FilterSection/RegionFilter';
import MonthFilter from '@/components/opportunities/List/FilterSection/MonthFilter';
import SortFilter from '@/components/opportunities/List/FilterSection/SortFilter';
import { useOpportunityStore } from '@/store/opportunities';
import { TypeFilterProps, RegionFilterProps, MonthFilterProps, SortFilterProps } from './types';

const FilterSection: React.FC = () => {
  const router = useRouter();
  const [isFiltering, setIsFiltering] = useState(false);

  // 從 store 獲取過濾相關方法
  const filters = useOpportunityStore((state: any) => state.searchFilters);
  const setSearchFilters = useOpportunityStore((state: any) => state.setSearchFilters);

  // 處理過濾器變更
  const handleFilterChange = (name: string, value: string | number[] | null) => {
    setIsFiltering(true);

    // 更新 store 中的過濾條件
    setSearchFilters({ [name]: value, page: 1 });

    // 更新 URL 參數
    const query = { ...router.query, [name]: value, page: '1' };
    if (!value || (Array.isArray(value) && value.length === 0)) {
      delete query[name];
    }

    router.push(
      { pathname: router.pathname, query },
      undefined,
      { shallow: true }
    ).finally(() => {
      setIsFiltering(false);
    });
  };

  return (
    <div className="mb-8">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <TypeFilter
          selectedType={filters.type}
          onChange={(value: string) => handleFilterChange('type', value)}
          disabled={isFiltering}
        />

        <RegionFilter
          selectedRegion={filters.region}
          onChange={(value: string) => handleFilterChange('region', value)}
          disabled={isFiltering}
        />

        <MonthFilter
          selectedMonths={filters.availableMonths || []}
          onChange={(value: number[]) => handleFilterChange('availableMonths', value)}
          disabled={isFiltering}
        />

        <SortFilter
          selectedSort={filters.sort as string}
          onChange={(value: string) => handleFilterChange('sort', value)}
          disabled={isFiltering}
        />
      </div>

      {isFiltering && (
        <div className="mt-4 flex items-center justify-center">
          <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-blue-500 mr-2"></div>
          <span className="text-gray-600">正在套用過濾條件...</span>
        </div>
      )}
    </div>
  );
};

export default FilterSection;