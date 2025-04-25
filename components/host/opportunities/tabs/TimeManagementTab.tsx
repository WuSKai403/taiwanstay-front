import React, { useState } from 'react';
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
  const [isOngoing, setIsOngoing] = useState(watch('workTimeSettings.isOngoing') || false);
  const hasTimeSlots = watch('hasTimeSlots') || false;

  // 使用 useFieldArray 處理時間段
  const {
    fields: timeSlotFields,
    append: appendTimeSlot,
    remove: removeTimeSlot,
  } = useFieldArray({
    control,
    name: 'timeSlots',
  });

  // 處理切換是否正在進行中
  const handleOngoingChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.checked;
    setIsOngoing(newValue);
    setValue('workTimeSettings.isOngoing', newValue);

    // 如果勾選"正在進行中"，清空開始和結束日期
    if (newValue) {
      setValue('workTimeSettings.startDate', '');
      setValue('workTimeSettings.endDate', '');
    }
  };

  // 處理切換是否有時間段
  const handleTimeSlotsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.checked;
    setValue('hasTimeSlots', newValue);

    // 如果不使用時間段，清空現有時間段
    if (!newValue) {
      setValue('timeSlots', []);
    }
  };

  // 添加新的時間段
  const addNewTimeSlot = () => {
    appendTimeSlot({
      startMonth: '',
      endMonth: '',
      defaultCapacity: 1,
      minimumStay: 7,
      description: '',
    });
  };

  return (
    <div className="space-y-8">
      {/* 工作時間設置 */}
      <div className="border-b pb-6">
        <h3 className="text-lg font-semibold mb-4">工作時間設置</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              每天工作時間（小時）
            </label>
            <input
              type="number"
              {...register('workTimeSettings.workHoursPerDay', { valueAsNumber: true })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="例如：8"
              min={1}
              max={24}
            />
            {errors.workTimeSettings?.workHoursPerDay && (
              <p className="mt-1 text-sm text-red-600">{errors.workTimeSettings.workHoursPerDay.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              每週工作天數
            </label>
            <input
              type="number"
              {...register('workTimeSettings.workDaysPerWeek', { valueAsNumber: true })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="例如：5"
              min={1}
              max={7}
            />
            {errors.workTimeSettings?.workDaysPerWeek && (
              <p className="mt-1 text-sm text-red-600">{errors.workTimeSettings.workDaysPerWeek.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              最短停留時間（天）
            </label>
            <input
              type="number"
              {...register('workTimeSettings.minimumStay', { valueAsNumber: true })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="例如：30"
              min={1}
            />
            {errors.workTimeSettings?.minimumStay && (
              <p className="mt-1 text-sm text-red-600">{errors.workTimeSettings.minimumStay.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              最長停留時間（天，選填）
            </label>
            <input
              type="number"
              {...register('workTimeSettings.maximumStay', { valueAsNumber: true })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="例如：90"
              min={1}
            />
            {errors.workTimeSettings?.maximumStay && (
              <p className="mt-1 text-sm text-red-600">{errors.workTimeSettings.maximumStay.message}</p>
            )}
          </div>
        </div>

        {/* 時間設置 */}
        <div className="mb-6">
          <div className="flex items-center mb-4">
            <input
              type="checkbox"
              id="isOngoing"
              checked={isOngoing}
              onChange={handleOngoingChange}
              className="h-4 w-4 text-primary-500 rounded"
            />
            <label htmlFor="isOngoing" className="ml-2 text-sm font-medium text-gray-700">
              這是一個持續進行的機會（沒有固定的開始/結束日期）
            </label>
          </div>

          {!isOngoing && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  開始日期
                </label>
                <input
                  type="date"
                  {...register('workTimeSettings.startDate')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
                {errors.workTimeSettings?.startDate && (
                  <p className="mt-1 text-sm text-red-600">{errors.workTimeSettings.startDate.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  結束日期
                </label>
                <input
                  type="date"
                  {...register('workTimeSettings.endDate')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
                {errors.workTimeSettings?.endDate && (
                  <p className="mt-1 text-sm text-red-600">{errors.workTimeSettings.endDate.message}</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* 季節性 */}
        <div>
          <h4 className="text-md font-medium mb-2">可工作季節 (選填)</h4>
          <p className="text-sm text-gray-500 mb-3">選擇這個機會在哪些季節可用</p>

          <div className="flex flex-wrap gap-4">
            <label className="inline-flex items-center">
              <input
                type="checkbox"
                {...register('workTimeSettings.seasonality.spring')}
                className="h-4 w-4 text-primary-500 rounded"
              />
              <span className="ml-2">春季</span>
            </label>

            <label className="inline-flex items-center">
              <input
                type="checkbox"
                {...register('workTimeSettings.seasonality.summer')}
                className="h-4 w-4 text-primary-500 rounded"
              />
              <span className="ml-2">夏季</span>
            </label>

            <label className="inline-flex items-center">
              <input
                type="checkbox"
                {...register('workTimeSettings.seasonality.autumn')}
                className="h-4 w-4 text-primary-500 rounded"
              />
              <span className="ml-2">秋季</span>
            </label>

            <label className="inline-flex items-center">
              <input
                type="checkbox"
                {...register('workTimeSettings.seasonality.winter')}
                className="h-4 w-4 text-primary-500 rounded"
              />
              <span className="ml-2">冬季</span>
            </label>
          </div>
        </div>
      </div>

      {/* 時間段管理 */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">時間段管理</h3>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="hasTimeSlots"
              checked={hasTimeSlots}
              onChange={handleTimeSlotsChange}
              className="h-4 w-4 text-primary-500 rounded"
            />
            <label htmlFor="hasTimeSlots" className="ml-2 text-sm font-medium text-gray-700">
              使用時間段管理
            </label>
          </div>
        </div>

        {hasTimeSlots && (
          <div className="space-y-6">
            <p className="text-sm text-gray-600">
              時間段管理允許您創建多個有特定開始和結束日期的工作時間段，每個時間段都可以有自己的容量和描述。
            </p>

            {timeSlotFields.map((field, index) => (
              <div key={field.id} className="border border-gray-200 p-4 rounded-md bg-gray-50">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="font-medium">時間段 #{index + 1}</h4>
                  <button
                    type="button"
                    onClick={() => removeTimeSlot(index)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      開始月份
                    </label>
                    <select
                      {...register(`timeSlots.${index}.startMonth`)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    >
                      <option value="">請選擇月份</option>
                      <option value="01">一月</option>
                      <option value="02">二月</option>
                      <option value="03">三月</option>
                      <option value="04">四月</option>
                      <option value="05">五月</option>
                      <option value="06">六月</option>
                      <option value="07">七月</option>
                      <option value="08">八月</option>
                      <option value="09">九月</option>
                      <option value="10">十月</option>
                      <option value="11">十一月</option>
                      <option value="12">十二月</option>
                    </select>
                    {errors.timeSlots?.[index]?.startMonth && (
                      <p className="mt-1 text-sm text-red-600">{errors.timeSlots[index].startMonth.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      結束月份
                    </label>
                    <select
                      {...register(`timeSlots.${index}.endMonth`)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    >
                      <option value="">請選擇月份</option>
                      <option value="01">一月</option>
                      <option value="02">二月</option>
                      <option value="03">三月</option>
                      <option value="04">四月</option>
                      <option value="05">五月</option>
                      <option value="06">六月</option>
                      <option value="07">七月</option>
                      <option value="08">八月</option>
                      <option value="09">九月</option>
                      <option value="10">十月</option>
                      <option value="11">十一月</option>
                      <option value="12">十二月</option>
                    </select>
                    {errors.timeSlots?.[index]?.endMonth && (
                      <p className="mt-1 text-sm text-red-600">{errors.timeSlots[index].endMonth.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      默認容量（人數）
                    </label>
                    <input
                      type="number"
                      {...register(`timeSlots.${index}.defaultCapacity`, { valueAsNumber: true })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      min={1}
                    />
                    {errors.timeSlots?.[index]?.defaultCapacity && (
                      <p className="mt-1 text-sm text-red-600">{errors.timeSlots[index].defaultCapacity.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      最短停留時間（天）
                    </label>
                    <input
                      type="number"
                      {...register(`timeSlots.${index}.minimumStay`, { valueAsNumber: true })}
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
                    placeholder="描述這個時間段的特點"
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
        )}
      </div>
    </div>
  );
};

export default TimeManagementTab;