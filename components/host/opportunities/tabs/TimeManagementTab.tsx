import React, { useState, useEffect } from 'react';
import { Control, useFieldArray } from 'react-hook-form';
import { OpportunityFormData } from '../OpportunityForm';
import Button from '@/components/common/Button';

interface TimeManagementTabProps {
  control: Control<OpportunityFormData>;
  register: any;
  errors: any;
  watch: any;
  setValue?: any;
}

const TimeManagementTab: React.FC<TimeManagementTabProps> = ({
  control,
  register,
  errors,
  watch,
  setValue,
}) => {
  // 使用 useFieldArray 處理時間段
  const {
    fields: timeSlotFields,
    append: appendTimeSlot,
    remove: removeTimeSlot,
  } = useFieldArray({
    control,
    name: 'timeSlots',
  });

  // 初始化：設置 hasTimeSlots 為 true 並確保只有一個時間段
  useEffect(() => {
    setValue('hasTimeSlots', true);

    // 如果沒有時間段，添加一個默認的
    if (timeSlotFields.length === 0) {
      addNewTimeSlot();
    }

    // 如果有多個時間段但處於初始載入狀態，只保留一個
    if (timeSlotFields.length > 1 && timeSlotFields.every(field => !field.startDate)) {
      // 保留第一個，移除其他的
      for (let i = timeSlotFields.length - 1; i > 0; i--) {
        removeTimeSlot(i);
      }
    }
  }, []);

  // 添加新的時間段
  const addNewTimeSlot = () => {
    appendTimeSlot({
      startDate: '',
      endDate: '',
      defaultCapacity: 1,
      minimumStay: 7,
      description: '',
    });
  };

  return (
    <div className="space-y-8">
      {/* 時間段管理 */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">
            時間段管理 <span className="text-red-500">*</span>
          </h3>
        </div>

        <div className="mb-4">
          <p className="text-sm text-gray-600">
            時間段管理允許您創建有特定開始和結束日期的工作時間段，每個時間段都可以有自己的容量和最短停留要求。
            <span className="text-red-500 font-medium"> 這是必填項目，您必須至少設置一個時間段。</span>
          </p>
        </div>

        <div className="space-y-6">
          {timeSlotFields.map((field, index) => (
            <div key={field.id} className="border border-gray-200 p-4 rounded-md bg-gray-50">
              <div className="flex justify-between items-center mb-4">
                <h4 className="font-medium">時間段 #{index + 1}</h4>
                {timeSlotFields.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeTimeSlot(index)}
                  className="text-red-500 hover:text-red-700"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    開始日期 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    {...register(`timeSlots.${index}.startDate`, { required: '請選擇開始日期' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                  {errors.timeSlots?.[index]?.startDate && (
                    <p className="mt-1 text-sm text-red-600">{errors.timeSlots[index].startDate.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    結束日期 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    {...register(`timeSlots.${index}.endDate`, { required: '請選擇結束日期' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                  {errors.timeSlots?.[index]?.endDate && (
                    <p className="mt-1 text-sm text-red-600">{errors.timeSlots[index].endDate.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    人數容量 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    {...register(`timeSlots.${index}.defaultCapacity`, {
                      valueAsNumber: true,
                      required: '請輸入容量',
                      min: { value: 1, message: '容量至少為1人' }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    min={1}
                  />
                  {errors.timeSlots?.[index]?.defaultCapacity && (
                    <p className="mt-1 text-sm text-red-600">{errors.timeSlots[index].defaultCapacity.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    最短停留時間（天） <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    {...register(`timeSlots.${index}.minimumStay`, {
                      valueAsNumber: true,
                      required: '請輸入最短停留時間',
                      min: { value: 1, message: '最短停留時間至少為1天' }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    min={1}
                  />
                  {errors.timeSlots?.[index]?.minimumStay && (
                    <p className="mt-1 text-sm text-red-600">{errors.timeSlots[index].minimumStay.message}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  描述（選填）
                </label>
                <textarea
                  {...register(`timeSlots.${index}.description`)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  rows={3}
                  placeholder="描述這個時間段的特點，例如：「夏季批次，可體驗水果採收」"
                />
              </div>
            </div>
          ))}

          <Button
            type="button"
            variant="primary"
            onClick={addNewTimeSlot}
            className="mt-4"
          >
            添加時間段
          </Button>
        </div>
      </div>
    </div>
  );
};

export default TimeManagementTab;