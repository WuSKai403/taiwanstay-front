import React from 'react';
import { UseFormRegister, Control, UseFormWatch, UseFormSetValue, FieldErrors, UseFieldArrayAppend, UseFieldArrayRemove, FieldArrayWithId } from 'react-hook-form';
import { ApplicationFormData, Language } from '@/lib/schemas/application';

interface PersonalInfoStepProps {
  register: UseFormRegister<ApplicationFormData>;
  control: Control<ApplicationFormData>;
  watch: UseFormWatch<ApplicationFormData>;
  setValue: UseFormSetValue<ApplicationFormData>;
  errors: FieldErrors<ApplicationFormData>;
  languageFields: FieldArrayWithId<ApplicationFormData, 'languages', 'id'>[];
  appendLanguage: UseFieldArrayAppend<ApplicationFormData, 'languages'>;
  removeLanguage: UseFieldArrayRemove;
}

const PersonalInfoStep: React.FC<PersonalInfoStepProps> = ({
  register,
  watch,
  setValue,
  errors,
  languageFields,
  appendLanguage,
  removeLanguage
}) => {
  return (
    <div className="space-y-6">
      {/* 語言能力 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          語言能力 <span className="text-red-500">*</span>
        </label>
        <div className="mt-2 space-y-2">
          {['中文', '英文', '日文', '韓文', '法文', '德文', '西班牙文'].map(lang => (
            <div key={lang} className="flex items-center space-x-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={watch('languages').some((l: any) => l.language === lang)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setValue('languages', [...watch('languages'), { language: lang, level: 'basic' }]);
                    } else {
                      setValue('languages', watch('languages').filter((l: any) => l.language !== lang));
                    }
                  }}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label className="ml-2 text-sm text-gray-700">{lang}</label>
              </div>
              {watch('languages').some((l: any) => l.language === lang) && (
                <select
                  value={watch('languages').find((l: any) => l.language === lang)?.level}
                  onChange={(e) => {
                    setValue('languages', watch('languages').map((l: any) =>
                      l.language === lang ? { ...l, level: e.target.value } : l
                    ));
                  }}
                  className="mt-1 block w-32 rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                >
                  <option value="native">母語</option>
                  <option value="fluent">流利</option>
                  <option value="intermediate">中等</option>
                  <option value="basic">基礎</option>
                </select>
              )}
            </div>
          ))}
          <div className="mt-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              添加其他語言
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="語言名稱"
                className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                id="new-language"
              />
              <button
                type="button"
                onClick={() => {
                  const input = document.getElementById('new-language') as HTMLInputElement;
                  if (input && input.value) {
                    appendLanguage({ language: input.value, level: 'basic' });
                    input.value = '';
                  }
                }}
                className="px-3 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
              >
                添加
              </button>
            </div>
          </div>
        </div>
        {errors.languages && (
          <p className="mt-1 text-sm text-red-600">請至少選擇一種語言</p>
        )}
      </div>

      {/* 飲食限制 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">飲食限制</label>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            {[
              { value: '素食', label: '素食' },
              { value: '不吃牛肉', label: '不吃牛肉' },
              { value: '不吃豬肉', label: '不吃豬肉' },
              { value: '不吃海鮮', label: '不吃海鮮' },
              { value: '其他', label: '其他' }
            ].map(option => (
              <div key={option.value} className="flex items-center">
                <input
                  type="checkbox"
                  {...register('dietaryRestrictions.type')}
                  value={option.value}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label className="ml-2 text-sm text-gray-700">{option.label}</label>
              </div>
            ))}
          </div>

          {/* 素食類型 */}
          {watch('dietaryRestrictions.type')?.includes('素食') && (
            <div className="ml-6 border-l-2 border-gray-200 pl-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                請選擇素食類型
              </label>
              <div className="space-y-2">
                {[
                  { value: '全素', label: '全素（純素）' },
                  { value: '蛋奶素', label: '蛋奶素' },
                  { value: '蛋素', label: '蛋素（不食用奶製品）' },
                  { value: '奶素', label: '奶素（不食用蛋）' }
                ].map(option => (
                  <div key={option.value} className="flex items-center">
                    <input
                      type="radio"
                      {...register('dietaryRestrictions.vegetarianType')}
                      value={option.value}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                    />
                    <label className="ml-2 text-sm text-gray-700">{option.label}</label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 其他飲食說明 */}
          {watch('dietaryRestrictions.type')?.includes('其他') && (
            <div className="ml-6 border-l-2 border-gray-200 pl-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                請說明其他飲食限制
              </label>
              <textarea
                {...register('dietaryRestrictions.otherDetails')}
                placeholder="請描述您的其他飲食限制（最多 200 字）"
                maxLength={200}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                rows={3}
              />
              <p className="mt-1 text-sm text-gray-500">
                還可以輸入 {200 - (watch('dietaryRestrictions.otherDetails')?.length || 0)} 字
              </p>
            </div>
          )}
        </div>
      </div>

      {/* 旅伴情況 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          旅伴情況
        </label>
        <div className="mt-2 space-y-2">
          <div className="flex flex-wrap gap-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                {...register('travelingWith.partner')}
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="ml-2">伴侶</span>
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                {...register('travelingWith.children')}
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="ml-2">小孩</span>
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                {...register('travelingWith.pets')}
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="ml-2">寵物</span>
            </label>
          </div>
          <textarea
            {...register('travelingWith.details')}
            placeholder="請提供更多關於旅伴的細節（最多 150 字）"
            maxLength={150}
            className="mt-2 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
            rows={3}
          />
          <p className="mt-1 text-sm text-gray-500">
            還可以輸入 {150 - (watch('travelingWith.details')?.length || 0)} 字
          </p>
        </div>
      </div>

      {/* 特殊需求 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          特殊需求
        </label>
        <textarea
          {...register('specialRequirements')}
          placeholder="請描述您的特殊需求或考量（最多 300 字）"
          maxLength={300}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
          rows={3}
        />
        <p className="mt-1 text-sm text-gray-500">
          還可以輸入 {300 - (watch('specialRequirements')?.length || 0)} 字
        </p>
      </div>

      {/* 過敏資訊 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          過敏資訊
        </label>
        <textarea
          {...register('allergies')}
          placeholder="請描述您的過敏情況或需注意的健康問題（最多 200 字）"
          maxLength={200}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
          rows={3}
        />
        <p className="mt-1 text-sm text-gray-500">
          還可以輸入 {200 - (watch('allergies')?.length || 0)} 字
        </p>
      </div>

      {/* 國籍 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          國籍 <span className="text-red-500">*</span>
        </label>
        <select
          {...register('nationality')}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
        >
          <option value="">請選擇國籍</option>
          <option value="台灣">台灣</option>
          <option value="日本">日本</option>
          <option value="韓國">韓國</option>
          <option value="美國">美國</option>
          <option value="加拿大">加拿大</option>
          <option value="英國">英國</option>
          <option value="法國">法國</option>
          <option value="德國">德國</option>
          <option value="澳洲">澳洲</option>
          <option value="紐西蘭">紐西蘭</option>
          <option value="其他">其他</option>
        </select>
        {errors.nationality && (
          <p className="mt-1 text-sm text-red-600">請選擇國籍</p>
        )}
      </div>

      {/* 簽證類型 - 根據國籍顯示 */}
      {watch('nationality') && watch('nationality') !== '台灣' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            持有簽證類型 <span className="text-red-500">*</span>
          </label>
          <select
            {...register('visaType')}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
          >
            <option value="">請選擇簽證類型</option>
            <option value="觀光簽證">觀光簽證</option>
            <option value="工作假期簽證">工作假期簽證</option>
            <option value="學生簽證">學生簽證</option>
            <option value="居留證">居留證</option>
            <option value="其他">其他</option>
          </select>
          {errors.visaType && (
            <p className="mt-1 text-sm text-red-600">請選擇簽證類型</p>
          )}
        </div>
      )}
    </div>
  );
};

export default PersonalInfoStep;