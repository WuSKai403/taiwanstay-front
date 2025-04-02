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
  // 取得 learningGoals 和 culturalInterests 陣列
  const learningGoals = watch('learningGoals') || [];
  const culturalInterests = watch('culturalInterests') || [];

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

      {/* 文化興趣 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          文化興趣
        </label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-4">
          {[
            '傳統文化', '飲食文化', '農業技術', '在地生活',
            '節慶活動', '手工藝', '原住民文化', '音樂藝術',
            '宗教信仰', '歷史建築', '生態環境', '其他'
          ].map(interest => (
            <label key={interest} className="flex items-center p-2 border rounded-md hover:bg-gray-50">
              <input
                type="checkbox"
                value={interest}
                onChange={(e) => {
                  const current = culturalInterests || [];
                  const newValue = e.target.checked
                    ? [...current, interest]
                    : current.filter(i => i !== interest);
                  setValue('culturalInterests', newValue);
                }}
                checked={culturalInterests?.includes(interest) || false}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <span className="ml-2 text-sm">{interest}</span>
            </label>
          ))}
        </div>
        {culturalInterests?.includes('其他') && (
          <textarea
            placeholder="請說明您的其他文化興趣"
            value={culturalInterests
              .filter(i => i !== '其他' && !['傳統文化', '飲食文化', '農業技術', '在地生活', '節慶活動', '手工藝', '原住民文化', '音樂藝術', '宗教信仰', '歷史建築', '生態環境'].includes(i))
              .join('、')}
            onChange={(e) => {
              const standardInterests = culturalInterests
                .filter(i => ['傳統文化', '飲食文化', '農業技術', '在地生活', '節慶活動', '手工藝', '原住民文化', '音樂藝術', '宗教信仰', '歷史建築', '生態環境', '其他'].includes(i));

              const otherInterests = e.target.value ? [e.target.value] : [];
              setValue('culturalInterests', [...standardInterests, ...otherInterests]);
            }}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
            rows={2}
          />
        )}
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

      {/* 期待學習技能 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          期待學習技能
        </label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {[
            '農業技術', '烹飪技巧', '語言能力', '手工藝',
            '文化知識', '營銷技能', '永續生活方式', '數位技能',
            '經營管理', '在地知識', '活動策劃', '其他'
          ].map(skill => (
            <label key={skill} className="flex items-center p-2 border rounded-md hover:bg-gray-50">
              <input
                type="checkbox"
                value={skill}
                onChange={(e) => {
                  const current = watch('expectedSkills') || [];
                  const newValue = e.target.checked
                    ? [...current, skill]
                    : current.filter(s => s !== skill);
                  setValue('expectedSkills', newValue);
                }}
                checked={watch('expectedSkills')?.includes(skill) || false}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <span className="ml-2 text-sm">{skill}</span>
            </label>
          ))}
        </div>
      </div>

      {/* 可提供的貢獻 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          可提供的貢獻 <span className="text-red-500">*</span>
        </label>
        <textarea
          {...register('contribution')}
          placeholder="請說明您可以為主人提供哪些幫助或價值（50-300字）"
          maxLength={300}
          minLength={50}
          rows={4}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
        />
        <p className="mt-1 text-sm text-gray-500">
          {watch('contribution')?.length || 0}/50-300 字
        </p>
        {errors.contribution && (
          <p className="mt-1 text-sm text-red-600">{errors.contribution.message}</p>
        )}
      </div>

      {/* 適應能力評分 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          適應能力自我評估 <span className="text-red-500">*</span>
        </label>
        <div className="space-y-4 mt-2">
          {[
            { id: 'environmentAdaptation', name: '新環境適應' },
            { id: 'teamwork', name: '團隊合作' },
            { id: 'problemSolving', name: '解決問題' },
            { id: 'independentWork', name: '獨立工作' },
            { id: 'stressManagement', name: '承受壓力' }
          ].map(item => (
            <div key={item.id} className="space-y-2">
              <div className="flex justify-between">
                <label className="text-sm text-gray-700">{item.name}</label>
                <span className="text-sm text-primary-600 font-medium">
                  {adaptabilityRatings?.[item.id as keyof typeof adaptabilityRatings] || 3}/5
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="5"
                step="1"
                value={adaptabilityRatings?.[item.id as keyof typeof adaptabilityRatings] || 3}
                onChange={(e) => {
                  setValue(`adaptabilityRatings.${item.id}` as any, parseInt(e.target.value));
                }}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>較低</span>
                <span>較高</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ExpectationsStep;