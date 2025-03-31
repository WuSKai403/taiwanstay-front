import React from 'react';
import { TypeFilterProps } from './types';

const TypeFilter: React.FC<TypeFilterProps> = ({ selectedType, onChange, disabled }) => {
  // 機會類型選項
  const opportunityTypes = [
    { value: '', label: '所有類型' },
    { value: 'FARMING', label: '農場體驗' },
    { value: 'GARDENING', label: '園藝工作' },
    { value: 'ANIMAL_CARE', label: '動物照顧' },
    { value: 'CONSTRUCTION', label: '建築工作' },
    { value: 'HOSPITALITY', label: '接待服務' },
    { value: 'COOKING', label: '烹飪工作' },
    { value: 'CLEANING', label: '清潔工作' },
    { value: 'CHILDCARE', label: '兒童照顧' },
    { value: 'ELDERLY_CARE', label: '老人照顧' },
    { value: 'TEACHING', label: '教學工作' },
    { value: 'LANGUAGE_EXCHANGE', label: '語言交流' },
    { value: 'CREATIVE', label: '創意工作' },
    { value: 'DIGITAL_NOMAD', label: '數位遊牧' },
    { value: 'TOURISM', label: '旅遊工作' },
    { value: 'OTHER', label: '其他機會' }
  ];

  return (
    <div>
      <label htmlFor="typeFilter" className="block text-sm font-medium text-gray-700 mb-1">
        工作類型
      </label>
      <select
        id="typeFilter"
        value={selectedType || ''}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
      >
        {opportunityTypes.map((type) => (
          <option key={type.value} value={type.value}>
            {type.label}
          </option>
        ))}
      </select>
    </div>
  );
};

export default TypeFilter;
