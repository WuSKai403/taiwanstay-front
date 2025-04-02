import React from 'react';
import { UseFormRegister, Control, UseFormWatch, UseFormSetValue, FieldErrors, UseFieldArrayAppend, UseFieldArrayRemove, FieldArrayWithId } from 'react-hook-form';
import { ApplicationFormData, WorkExperience } from '@/lib/schemas/application';

interface WorkCapabilityStepProps {
  register: UseFormRegister<ApplicationFormData>;
  control: Control<ApplicationFormData>;
  watch: UseFormWatch<ApplicationFormData>;
  setValue: UseFormSetValue<ApplicationFormData>;
  errors: FieldErrors<ApplicationFormData>;
  workExperienceFields: FieldArrayWithId<ApplicationFormData, 'workExperience', 'id'>[];
  appendWorkExperience: UseFieldArrayAppend<ApplicationFormData, 'workExperience'>;
  removeWorkExperience: UseFieldArrayRemove;
}

const WorkCapabilityStep: React.FC<WorkCapabilityStepProps> = ({
  register,
  watch,
  errors,
  workExperienceFields,
  appendWorkExperience,
  removeWorkExperience,
  setValue
}) => {
  return (
    <div className="space-y-6">
      {/* 工作經驗 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          工作經驗
        </label>
        <div className="mt-2 space-y-4">
          {workExperienceFields.map((field, index) => (
            <div key={field.id} className="p-4 bg-gray-50 rounded-md space-y-3">
              <div className="flex justify-between">
                <h4 className="text-sm font-medium">工作經驗 #{index + 1}</h4>
                <button
                  type="button"
                  onClick={() => removeWorkExperience(index)}
                  className="text-red-600 hover:text-red-700"
                >
                  刪除
                </button>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-700">職位</label>
                  <input
                    type="text"
                    {...register(`workExperience.${index}.position`)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-700">公司</label>
                  <input
                    type="text"
                    {...register(`workExperience.${index}.company`)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-700">工作時間</label>
                <input
                  type="text"
                  {...register(`workExperience.${index}.duration`)}
                  placeholder="例如：2020/01 - 2021/12"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-700">工作內容</label>
                <textarea
                  {...register(`workExperience.${index}.description`)}
                  rows={3}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                />
              </div>
            </div>
          ))}
          <button
            type="button"
            onClick={() => appendWorkExperience({ position: '', company: '', duration: '', description: '' })}
            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            新增工作經驗
          </button>
        </div>
      </div>

      {/* 體能狀況 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          體能狀況 <span className="text-red-500">*</span>
        </label>
        <textarea
          {...register('physicalCondition')}
          placeholder="請描述您的體能狀況，例如：是否有特殊健康狀況、運動習慣等（50-300字）"
          maxLength={300}
          rows={4}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
        />
        <p className="mt-1 text-sm text-gray-500">
          還可以輸入 {300 - (watch('physicalCondition')?.length || 0)} 字
        </p>
        {errors.physicalCondition && (
          <p className="mt-1 text-sm text-red-600">{errors.physicalCondition.message}</p>
        )}
      </div>

      {/* 技能列表 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          技能列表
        </label>
        <textarea
          placeholder="請列出您所擁有的相關技能和證照，每項技能請換行填寫（最多10項）"
          value={watch('skills').join('\n')}
          onChange={(e) => {
            const skills = e.target.value.split('\n').filter(skill => skill.trim() !== '');
            setValue('skills', skills.slice(0, 10));
          }}
          rows={4}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
        />
        <p className="mt-1 text-sm text-gray-500">
          已輸入 {watch('skills').length}/10 項技能
        </p>
      </div>

      {/* 擅長工作類型 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          擅長工作類型 <span className="text-red-500">*</span>
        </label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {[
            '農耕', '接待', '清潔', '廚房', '營銷',
            '手工藝', '維修', '照顧（動物）', '照顧（植物）',
            '教學', '翻譯', '攝影', '網站維護', '其他'
          ].map(type => (
            <label key={type} className="flex items-center p-2 border rounded-md hover:bg-gray-50">
              <input
                type="checkbox"
                value={type}
                onChange={(e) => {
                  const current = watch('preferredWorkTypes') || [];
                  const newValue = e.target.checked
                    ? [...current, type]
                    : current.filter(t => t !== type);
                  setValue('preferredWorkTypes', newValue);
                }}
                checked={watch('preferredWorkTypes')?.includes(type) || false}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <span className="ml-2 text-sm">{type}</span>
            </label>
          ))}
        </div>
        {errors.preferredWorkTypes && (
          <p className="mt-1 text-sm text-red-600">請至少選擇一種擅長的工作類型</p>
        )}
      </div>

      {/* 不願從事工作 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          不願從事工作
        </label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {[
            '農耕', '接待', '清潔', '廚房', '營銷',
            '手工藝', '維修', '照顧（動物）', '照顧（植物）',
            '教學', '翻譯', '攝影', '網站維護', '其他'
          ].map(type => (
            <label key={type} className="flex items-center p-2 border rounded-md hover:bg-gray-50">
              <input
                type="checkbox"
                value={type}
                onChange={(e) => {
                  const current = watch('unwillingWorkTypes') || [];
                  const newValue = e.target.checked
                    ? [...current, type]
                    : current.filter(t => t !== type);
                  setValue('unwillingWorkTypes', newValue);
                }}
                checked={watch('unwillingWorkTypes')?.includes(type) || false}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <span className="ml-2 text-sm">{type}</span>
            </label>
          ))}
        </div>
      </div>

      {/* 體力活接受度 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          體力活接受度 <span className="text-red-500">*</span>
        </label>
        <div className="mt-2">
          <input
            type="range"
            min="1"
            max="5"
            step="1"
            {...register('physicalStrength', { valueAsNumber: true })}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
          />
          <div className="flex justify-between text-xs text-gray-600 mt-1">
            <span>較低</span>
            <span>一般</span>
            <span>較高</span>
          </div>
        </div>
        <p className="mt-2 text-sm text-gray-500">目前選擇：{watch('physicalStrength') || 3}/5</p>
      </div>

      {/* 專業證照 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          專業證照
        </label>
        <textarea
          {...register('certifications')}
          placeholder="請列出您所擁有的專業證照或資格（最多 200 字）"
          maxLength={200}
          rows={3}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
        />
        <p className="mt-1 text-sm text-gray-500">
          還可以輸入 {200 - (watch('certifications')?.length || 0)} 字
        </p>
      </div>

      {/* 期望工作時數 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          期望工作時數（每週）
        </label>
        <select
          {...register('preferredWorkHours')}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
        >
          <option value="">請選擇</option>
          <option value="20小時以下">20小時以下</option>
          <option value="20-30小時">20-30小時</option>
          <option value="30-40小時">30-40小時</option>
          <option value="40小時以上">40小時以上</option>
        </select>
        <p className="mt-1 text-sm text-gray-500">
          若機會已有規定工作時數，此欄位可不必填寫
        </p>
      </div>
    </div>
  );
};

export default WorkCapabilityStep;