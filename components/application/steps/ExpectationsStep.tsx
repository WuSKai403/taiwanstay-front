import React from 'react';
import { UseFormRegister, Control, UseFormWatch, UseFormSetValue, FieldErrors } from 'react-hook-form';
import { ApplicationFormData } from '@/lib/schemas/application';

interface ExpectationsStepProps {
  register: UseFormRegister<ApplicationFormData>;
  control: Control<ApplicationFormData>;
  watch: UseFormWatch<ApplicationFormData>;
  setValue: UseFormSetValue<ApplicationFormData>;
  errors: FieldErrors<ApplicationFormData>;
}

const ExpectationsStep: React.FC<ExpectationsStepProps> = ({
  register,
  watch,
  setValue,
  errors
}) => {
  // 取得整個適應能力評分物件，而不是個別屬性
  const adaptabilityRatings = watch('adaptabilityRatings');
  // 取得 learningGoals 陣列
  const learningGoals = watch('learningGoals') || [];

  // 處理適應能力評分的更新
  const handleRatingChange = (field: string, value: number) => {
    setValue('adaptabilityRatings', {
      ...adaptabilityRatings,
      [field]: value
    });
  };

  return (
    <div className="space-y-6">
      {/* 學習目標 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          學習目標
        </label>
        <textarea
          placeholder="請描述您希望在這段期間達成的學習目標（例如：學習潛水技巧、提升英語溝通能力等）（50-300字）"
          maxLength={300}
          value={learningGoals.join('、')}
          onChange={(e) => {
            setValue('learningGoals', e.target.value ? [e.target.value] : []);
          }}
          rows={4}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
        />
        <p className="mt-1 text-sm text-gray-500">
          還可以輸入 {300 - (learningGoals.join('、').length || 0)} 字
        </p>
      </div>

      {/* 住宿需求 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          住宿需求
        </label>
        <textarea
          {...register('accommodationNeeds')}
          placeholder="請說明您的住宿需求或偏好（例如：是否需要單人房、是否有特殊設備需求等）（最多200字）"
          maxLength={200}
          rows={3}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
        />
        <p className="mt-1 text-sm text-gray-500">
          還可以輸入 {200 - (watch('accommodationNeeds')?.length || 0)} 字
        </p>
      </div>

      {/* 申請動機 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          申請動機 <span className="text-red-500">*</span>
        </label>
        <div className="mb-3 text-sm text-gray-600 bg-gray-50 p-3 rounded-md">
          <p className="font-medium mb-1">申請動機撰寫指南：</p>
          <ul className="list-disc list-inside space-y-1">
            <li>為什麼選擇這個特定的換宿機會？</li>
            <li>有哪些技能或特質使您特別適合此機會？</li>
            <li>您希望從這段經驗中獲得什麼？</li>
            <li>您的長期目標是什麼，此經驗如何幫助您達成？</li>
          </ul>
        </div>
        <textarea
          {...register('motivation')}
          placeholder="請詳細說明您申請這個機會的動機，以及為什麼您認為自己適合這個職位（100-500字）"
          maxLength={500}
          minLength={100}
          rows={6}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
        />
        <p className="mt-1 text-sm text-gray-500">
          {watch('motivation')?.length || 0}/100-500 字
        </p>
        {errors.motivation && (
          <p className="mt-1 text-sm text-red-600">{errors.motivation.message}</p>
        )}
      </div>

      {/* 可提供的貢獻 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          可提供的貢獻
        </label>
        <textarea
          {...register('contribution')}
          placeholder="請說明您可以為主人提供哪些幫助或價值（最多300字）"
          maxLength={300}
          rows={4}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
        />
        <p className="mt-1 text-sm text-gray-500">
          還可以輸入 {300 - (watch('contribution')?.length || 0)} 字
        </p>
      </div>

      {/* 適應能力評分 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          適應能力自我評估 <span className="text-red-500">*</span>
        </label>
        <div className="space-y-4 mt-2">
          <div className="space-y-2">
            <div className="flex justify-between">
              <label className="text-sm text-gray-700">新環境適應</label>
              <span className="text-sm text-gray-500">
                {adaptabilityRatings?.environmentAdaptation || 3}/5
              </span>
            </div>
            <input
              type="range"
              min="1"
              max="5"
              step="1"
              value={adaptabilityRatings?.environmentAdaptation || 3}
              onChange={(e) => handleRatingChange('environmentAdaptation', parseInt(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between">
              <label className="text-sm text-gray-700">團隊合作</label>
              <span className="text-sm text-gray-500">
                {adaptabilityRatings?.teamwork || 3}/5
              </span>
            </div>
            <input
              type="range"
              min="1"
              max="5"
              step="1"
              value={adaptabilityRatings?.teamwork || 3}
              onChange={(e) => handleRatingChange('teamwork', parseInt(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between">
              <label className="text-sm text-gray-700">解決問題</label>
              <span className="text-sm text-gray-500">
                {adaptabilityRatings?.problemSolving || 3}/5
              </span>
            </div>
            <input
              type="range"
              min="1"
              max="5"
              step="1"
              value={adaptabilityRatings?.problemSolving || 3}
              onChange={(e) => handleRatingChange('problemSolving', parseInt(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between">
              <label className="text-sm text-gray-700">獨立工作</label>
              <span className="text-sm text-gray-500">
                {adaptabilityRatings?.independentWork || 3}/5
              </span>
            </div>
            <input
              type="range"
              min="1"
              max="5"
              step="1"
              value={adaptabilityRatings?.independentWork || 3}
              onChange={(e) => handleRatingChange('independentWork', parseInt(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between">
              <label className="text-sm text-gray-700">承受壓力</label>
              <span className="text-sm text-gray-500">
                {adaptabilityRatings?.stressManagement || 3}/5
              </span>
            </div>
            <input
              type="range"
              min="1"
              max="5"
              step="1"
              value={adaptabilityRatings?.stressManagement || 3}
              onChange={(e) => handleRatingChange('stressManagement', parseInt(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExpectationsStep;