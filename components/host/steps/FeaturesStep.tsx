import React, { useState } from 'react';
import { useFormContext } from 'react-hook-form';

// 特色標籤選項
const FEATURE_OPTIONS = [
  { id: 'organic', label: '有機農場' },
  { id: 'familyFriendly', label: '家庭友善' },
  { id: 'petFriendly', label: '寵物友善' },
  { id: 'sustainable', label: '永續發展' },
  { id: 'cultural', label: '文化交流' },
  { id: 'educational', label: '教育性質' },
  { id: 'artistic', label: '藝術創作' },
  { id: 'spiritual', label: '身心靈成長' },
  { id: 'outdoor', label: '戶外活動' },
  { id: 'wellness', label: '健康養生' },
  { id: 'ecological', label: '生態保育' },
  { id: 'social', label: '社會企業' },
  { id: 'traditional', label: '傳統技藝' }
];

const FeaturesStep: React.FC = () => {
  const {
    register,
    watch,
    setValue,
    formState: { errors }
  } = useFormContext();

  // 監聽已選擇的特色標籤
  const selectedFeatures = watch('features') || [];
  const [newAttraction, setNewAttraction] = useState('');
  const nearbyAttractions = watch('environment.nearbyAttractions') || [];

  // 處理特色標籤選擇
  const handleFeatureToggle = (featureId: string) => {
    const isSelected = selectedFeatures.includes(featureId);

    if (isSelected) {
      // 如果已選擇，則移除
      setValue('features', selectedFeatures.filter(id => id !== featureId), { shouldValidate: true });
    } else {
      // 如果未選擇且未達到上限，則添加
      if (selectedFeatures.length < 5) {
        setValue('features', [...selectedFeatures, featureId], { shouldValidate: true });
      }
    }
  };

  // 處理新增附近景點
  const handleAddAttraction = () => {
    if (newAttraction.trim() && !nearbyAttractions.includes(newAttraction.trim())) {
      if (nearbyAttractions.length < 10) {
        setValue('environment.nearbyAttractions', [...nearbyAttractions, newAttraction.trim()], { shouldValidate: true });
        setNewAttraction('');
      }
    }
  };

  // 處理移除附近景點
  const handleRemoveAttraction = (attraction: string) => {
    setValue(
      'environment.nearbyAttractions',
      nearbyAttractions.filter((item: string) => item !== attraction),
      { shouldValidate: true }
    );
  };

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-medium text-gray-900">特色與描述</h3>
        <p className="mt-1 text-sm text-gray-500">
          請描述您的場所特色和環境，幫助申請者更深入了解您提供的體驗。
        </p>
      </div>

      {/* 特色標籤 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          特色標籤（最多選擇5個）
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {FEATURE_OPTIONS.map((feature) => (
            <button
              key={feature.id}
              type="button"
              onClick={() => handleFeatureToggle(feature.id)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                selectedFeatures.includes(feature.id)
                  ? 'bg-primary-100 text-primary-800 border-2 border-primary-500'
                  : 'bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200'
              }`}
            >
              {feature.label}
            </button>
          ))}
        </div>
        {errors.features && (
          <p className="mt-1 text-sm text-red-600">{errors.features.message as string}</p>
        )}
      </div>

      {/* 主人故事 */}
      <div>
        <label htmlFor="story" className="block text-sm font-medium text-gray-700">
          主人故事
        </label>
        <p className="mt-1 text-sm text-gray-500 mb-2">
          請分享關於您場所的創立故事、使命和理念，讓申請者更了解您的背景和價值觀。
        </p>
        <textarea
          id="story"
          {...register('story')}
          rows={6}
          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
          placeholder="例如：我們的農場創立於2010年，源自於對有機農業的熱愛和對可持續生活方式的追求..."
        />
        {errors.story && (
          <p className="mt-1 text-sm text-red-600">{errors.story.message as string}</p>
        )}
      </div>

      {/* 經驗描述 */}
      <div>
        <label htmlFor="experience" className="block text-sm font-medium text-gray-700">
          工作交換經驗 (選填)
        </label>
        <p className="mt-1 text-sm text-gray-500 mb-2">
          簡述您過去接待工作交換者的經驗，能提供什麼樣的指導和學習機會。
        </p>
        <textarea
          id="experience"
          {...register('experience')}
          rows={4}
          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
          placeholder="例如：過去5年來，我們已接待超過50位來自全球各地的工作交換者，提供農業技術、永續生活方式的學習機會..."
        />
        {errors.experience && (
          <p className="mt-1 text-sm text-red-600">{errors.experience.message as string}</p>
        )}
      </div>

      {/* 環境描述 */}
      <div>
        <h4 className="text-md font-medium text-gray-800 mb-3">周邊環境</h4>

        {/* 周邊環境描述 */}
        <div className="mb-4">
          <label htmlFor="surroundings" className="block text-sm font-medium text-gray-700">
            環境描述
          </label>
          <p className="mt-1 text-sm text-gray-500 mb-2">
            描述您場所的周邊環境、自然風景、氣候特色等。
          </p>
          <textarea
            id="surroundings"
            {...register('environment.surroundings')}
            rows={4}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
            placeholder="例如：我們的場所位於山腳下，四周被茂密的森林環繞，空氣清新，晚上可以看到滿天星斗..."
          />
          {errors.environment?.surroundings && (
            <p className="mt-1 text-sm text-red-600">{errors.environment.surroundings.message as string}</p>
          )}
        </div>

        {/* 交通便利性 */}
        <div className="mb-4">
          <label htmlFor="accessibility" className="block text-sm font-medium text-gray-700">
            交通便利性 (選填)
          </label>
          <p className="mt-1 text-sm text-gray-500 mb-2">
            說明如何抵達您的場所，包括公共交通和自行開車的方式。
          </p>
          <textarea
            id="accessibility"
            {...register('environment.accessibility')}
            rows={3}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
            placeholder="例如：可搭乘台鐵至花蓮站，再轉乘公車約30分鐘；自行開車從台北出發約需3小時..."
          />
          {errors.environment?.accessibility && (
            <p className="mt-1 text-sm text-red-600">{errors.environment.accessibility.message as string}</p>
          )}
        </div>

        {/* 附近景點 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            附近景點 (選填，最多10個)
          </label>
          <div className="flex mb-3">
            <input
              type="text"
              value={newAttraction}
              onChange={(e) => setNewAttraction(e.target.value)}
              className="flex-grow rounded-l-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
              placeholder="輸入附近景點名稱..."
              maxLength={50}
            />
            <button
              type="button"
              onClick={handleAddAttraction}
              disabled={!newAttraction.trim() || nearbyAttractions.length >= 10}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-r-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              添加
            </button>
          </div>

          {/* 已添加的附近景點列表 */}
          {nearbyAttractions.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {nearbyAttractions.map((attraction: string, index: number) => (
                <div
                  key={index}
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100"
                >
                  <span>{attraction}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveAttraction(attraction)}
                    className="ml-2 inline-flex text-gray-400 hover:text-gray-600"
                  >
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FeaturesStep;
