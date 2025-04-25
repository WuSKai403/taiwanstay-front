import React from 'react';
import { Control, useFieldArray } from 'react-hook-form';
import { OpportunityFormData } from '../OpportunityForm';

interface DetailInfoTabProps {
  control: Control<OpportunityFormData>;
  register: any;
  errors: any;
  watch: any;
  setValue?: any;
}

const DetailInfoTab: React.FC<DetailInfoTabProps> = ({
  control,
  register,
  errors,
  watch,
}) => {
  // 使用 useFieldArray 處理任務列表
  const {
    fields: taskFields,
    append: appendTask,
    remove: removeTask,
  } = useFieldArray({
    control,
    name: 'workDetails.tasks',
  } as any);

  // 使用 useFieldArray 處理技能列表
  const {
    fields: skillFields,
    append: appendSkill,
    remove: removeSkill,
  } = useFieldArray({
    control,
    name: 'workDetails.skills',
  } as any);

  // 使用 useFieldArray 處理學習機會列表
  const {
    fields: learningFields,
    append: appendLearning,
    remove: removeLearning,
  } = useFieldArray({
    control,
    name: 'workDetails.learningOpportunities',
  } as any);

  // 使用 useFieldArray 處理語言列表
  const {
    fields: languageFields,
    append: appendLanguage,
    remove: removeLanguage,
  } = useFieldArray({
    control,
    name: 'workDetails.languages',
  } as any);

  return (
    <div className="space-y-8">
      {/* 工作任務 */}
      <div className="border-b pb-6">
        <h3 className="text-lg font-semibold mb-4">工作任務</h3>
        <div className="space-y-4">
          {taskFields.map((field, index) => (
            <div key={field.id} className="flex items-center gap-2">
              <input
                type="text"
                {...register(`workDetails.tasks.${index}`)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
                placeholder="請描述工作任務"
              />
              <button
                type="button"
                onClick={() => removeTask(index)}
                className="p-2 text-red-500 hover:text-red-700"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => appendTask('') as any}
            className="flex items-center text-primary-500 hover:text-primary-700"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            添加工作任務
          </button>
          {errors.workDetails?.tasks && (
            <p className="mt-1 text-sm text-red-600">{errors.workDetails.tasks.message}</p>
          )}
        </div>
      </div>

      {/* 所需技能 */}
      <div className="border-b pb-6">
        <h3 className="text-lg font-semibold mb-4">所需技能 (選填)</h3>
        <div className="space-y-4">
          {skillFields.map((field, index) => (
            <div key={field.id} className="flex items-center gap-2">
              <input
                type="text"
                {...register(`workDetails.skills.${index}`)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
                placeholder="請描述所需技能"
              />
              <button
                type="button"
                onClick={() => removeSkill(index)}
                className="p-2 text-red-500 hover:text-red-700"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => appendSkill('') as any}
            className="flex items-center text-primary-500 hover:text-primary-700"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            添加技能
          </button>
        </div>
      </div>

      {/* 學習機會 */}
      <div className="border-b pb-6">
        <h3 className="text-lg font-semibold mb-4">學習機會 (選填)</h3>
        <div className="space-y-4">
          {learningFields.map((field, index) => (
            <div key={field.id} className="flex items-center gap-2">
              <input
                type="text"
                {...register(`workDetails.learningOpportunities.${index}`)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
                placeholder="請描述學習機會"
              />
              <button
                type="button"
                onClick={() => removeLearning(index)}
                className="p-2 text-red-500 hover:text-red-700"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => appendLearning('') as any}
            className="flex items-center text-primary-500 hover:text-primary-700"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            添加學習機會
          </button>
        </div>
      </div>

      {/* 體力需求 */}
      <div className="border-b pb-6">
        <h3 className="text-lg font-semibold mb-4">體力需求</h3>
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            選擇體力需求程度
          </label>
          <div className="flex items-center space-x-4">
            <label className="inline-flex items-center">
              <input
                type="radio"
                {...register('workDetails.physicalDemand')}
                value="low"
                className="form-radio h-4 w-4 text-primary-500"
              />
              <span className="ml-2">低</span>
            </label>
            <label className="inline-flex items-center">
              <input
                type="radio"
                {...register('workDetails.physicalDemand')}
                value="medium"
                className="form-radio h-4 w-4 text-primary-500"
              />
              <span className="ml-2">中</span>
            </label>
            <label className="inline-flex items-center">
              <input
                type="radio"
                {...register('workDetails.physicalDemand')}
                value="high"
                className="form-radio h-4 w-4 text-primary-500"
              />
              <span className="ml-2">高</span>
            </label>
          </div>
        </div>
      </div>

      {/* 語言要求 */}
      <div className="border-b pb-6">
        <h3 className="text-lg font-semibold mb-4">語言要求 (選填)</h3>
        <div className="space-y-4">
          {languageFields.map((field, index) => (
            <div key={field.id} className="flex items-center gap-2">
              <input
                type="text"
                {...register(`workDetails.languages.${index}`)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
                placeholder="請描述語言要求"
              />
              <button
                type="button"
                onClick={() => removeLanguage(index)}
                className="p-2 text-red-500 hover:text-red-700"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => appendLanguage('') as any}
            className="flex items-center text-primary-500 hover:text-primary-700"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            添加語言要求
          </button>
        </div>
      </div>

      {/* 福利與補償 */}
      <div className="border-b pb-6">
        <h3 className="text-lg font-semibold mb-4">福利與補償</h3>

        {/* 住宿 */}
        <div className="mb-4">
          <div className="flex items-center mb-2">
            <input
              type="checkbox"
              id="accommodationProvided"
              {...register('benefits.accommodation.provided')}
              className="h-4 w-4 text-primary-500 rounded"
            />
            <label htmlFor="accommodationProvided" className="ml-2 text-sm font-medium text-gray-700">
              提供住宿
            </label>
          </div>

          {watch('benefits.accommodation.provided') && (
            <div className="ml-6 mt-2 space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  住宿類型
                </label>
                <select
                  {...register('benefits.accommodation.type')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="">請選擇住宿類型</option>
                  <option value="private_room">私人房間</option>
                  <option value="shared_room">共享房間</option>
                  <option value="dormitory">宿舍</option>
                  <option value="camping">露營</option>
                  <option value="other">其他</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  住宿描述
                </label>
                <textarea
                  {...register('benefits.accommodation.description')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  rows={3}
                  placeholder="請描述住宿條件"
                />
              </div>
            </div>
          )}
        </div>

        {/* 餐食 */}
        <div className="mb-4">
          <div className="flex items-center mb-2">
            <input
              type="checkbox"
              id="mealsProvided"
              {...register('benefits.meals.provided')}
              className="h-4 w-4 text-primary-500 rounded"
            />
            <label htmlFor="mealsProvided" className="ml-2 text-sm font-medium text-gray-700">
              提供餐食
            </label>
          </div>

          {watch('benefits.meals.provided') && (
            <div className="ml-6 mt-2 space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  每日提供餐數
                </label>
                <select
                  {...register('benefits.meals.count', { valueAsNumber: true })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value={1}>1餐</option>
                  <option value={2}>2餐</option>
                  <option value={3}>3餐</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  餐食描述
                </label>
                <textarea
                  {...register('benefits.meals.description')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  rows={3}
                  placeholder="請描述提供的餐食"
                />
              </div>
            </div>
          )}
        </div>

        {/* 津貼 */}
        <div>
          <div className="flex items-center mb-2">
            <input
              type="checkbox"
              id="stipendProvided"
              {...register('benefits.stipend.provided')}
              className="h-4 w-4 text-primary-500 rounded"
            />
            <label htmlFor="stipendProvided" className="ml-2 text-sm font-medium text-gray-700">
              提供津貼
            </label>
          </div>

          {watch('benefits.stipend.provided') && (
            <div className="ml-6 mt-2 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    金額
                  </label>
                  <input
                    type="number"
                    {...register('benefits.stipend.amount', { valueAsNumber: true })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="請輸入金額"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    貨幣
                  </label>
                  <select
                    {...register('benefits.stipend.currency')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="TWD">新台幣 (TWD)</option>
                    <option value="USD">美元 (USD)</option>
                    <option value="EUR">歐元 (EUR)</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  支付頻率
                </label>
                <select
                  {...register('benefits.stipend.frequency')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="daily">每日</option>
                  <option value="weekly">每週</option>
                  <option value="biweekly">雙週</option>
                  <option value="monthly">每月</option>
                </select>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 其他要求 */}
      <div>
        <h3 className="text-lg font-semibold mb-4">其他要求</h3>

        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              最低年齡要求
            </label>
            <input
              type="number"
              {...register('requirements.minAge', { valueAsNumber: true })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="請輸入最低年齡要求"
            />
          </div>

          <div className="flex items-center space-x-6">
            <label className="inline-flex items-center">
              <input
                type="checkbox"
                {...register('requirements.acceptsCouples')}
                className="h-4 w-4 text-primary-500 rounded"
              />
              <span className="ml-2">接受情侶</span>
            </label>

            <label className="inline-flex items-center">
              <input
                type="checkbox"
                {...register('requirements.acceptsFamilies')}
                className="h-4 w-4 text-primary-500 rounded"
              />
              <span className="ml-2">接受家庭</span>
            </label>

            <label className="inline-flex items-center">
              <input
                type="checkbox"
                {...register('requirements.acceptsPets')}
                className="h-4 w-4 text-primary-500 rounded"
              />
              <span className="ml-2">接受寵物</span>
            </label>
          </div>

          {/* 駕照需求 */}
          <div className="border p-4 rounded-md">
            <h4 className="font-medium mb-2">駕照需求</h4>

            <div className="space-y-2">
              <label className="inline-flex items-center">
                <input
                  type="checkbox"
                  {...register('requirements.drivingLicense.carRequired')}
                  className="h-4 w-4 text-primary-500 rounded"
                />
                <span className="ml-2">需要汽車駕照</span>
              </label>

              <label className="inline-flex items-center block">
                <input
                  type="checkbox"
                  {...register('requirements.drivingLicense.motorcycleRequired')}
                  className="h-4 w-4 text-primary-500 rounded"
                />
                <span className="ml-2">需要機車駕照</span>
              </label>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="otherLicense"
                  {...register('requirements.drivingLicense.otherRequired')}
                  className="h-4 w-4 text-primary-500 rounded"
                />
                <label htmlFor="otherLicense" className="ml-2 text-sm font-medium text-gray-700">
                  其他駕照需求
                </label>
              </div>

              {watch('requirements.drivingLicense.otherRequired') && (
                <div className="ml-6 mt-2">
                  <input
                    type="text"
                    {...register('requirements.drivingLicense.otherDescription')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="請說明其他駕照需求"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DetailInfoTab;