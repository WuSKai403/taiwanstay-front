import React from 'react';
import { RegionFilterProps } from './types';

const RegionFilter: React.FC<RegionFilterProps> = ({ selectedRegion, onChange, disabled }) => {
  // 區域選項
  const regions = [
    { value: '', label: '所有區域' },
    { value: '北部', label: '北部' },
    { value: '中部', label: '中部' },
    { value: '南部', label: '南部' },
    { value: '東部', label: '東部' },
    { value: '離島', label: '離島' }
  ];

  return (
    <div>
      <label htmlFor="regionFilter" className="block text-sm font-medium text-gray-700 mb-1">
        區域
      </label>
      <select
        id="regionFilter"
        value={selectedRegion || ''}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
      >
        {regions.map((region) => (
          <option key={region.value} value={region.value}>
            {region.label}
          </option>
        ))}
      </select>
    </div>
  );
};

export default RegionFilter;