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

      {/* 技能與專業能力（整合欄位） */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          技能與專業能力（選填）
        </label>
        <div className="mb-3 text-sm text-gray-600 bg-gray-50 p-3 rounded-md">
          <p>請填寫您擁有的技能、專業證照及工作類型偏好，例如：</p>
          <ul className="list-disc list-inside">
            <li>語言技能：英文流利、日文基礎</li>
            <li>專業證照：廚師執照、救生員證書</li>
            <li>擅長工作：園藝、攝影、網站維護</li>
            <li>偏好工作類型：室內工作、客戶接待</li>
          </ul>
        </div>
        <textarea
          {...register('skills')}
          placeholder="請列出您所擁有的各項技能、專業證照及工作偏好（最多300字，選填）"
          maxLength={300}
          rows={6}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
        />
        <p className="mt-1 text-sm text-gray-500">
          還可以輸入 {300 - (watch('skills')?.toString().length || 0)} 字
        </p>
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

        <div className="mt-3 text-sm text-gray-600 bg-gray-50 p-3 rounded-md">
          <p className="font-medium mb-1">參考指標：</p>
          <ul className="list-disc list-inside space-y-1">
            <li><span className="font-medium">1分</span>：較輕的室內工作，需要休息較多</li>
            <li><span className="font-medium">2分</span>：可接受輕度體力活，如清潔或短時間站立工作</li>
            <li><span className="font-medium">3分</span>：一般體力活動，能持續工作數小時</li>
            <li><span className="font-medium">4分</span>：較高體力活動，可接受農務等戶外勞動</li>
            <li><span className="font-medium">5分</span>：高強度體力活動，長時間戶外工作無壓力</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default WorkCapabilityStep;