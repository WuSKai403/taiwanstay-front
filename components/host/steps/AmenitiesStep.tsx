import React from 'react';
import { useFormContext } from 'react-hook-form';

// 設施類別與選項 - 重新設計，移除無障礙設施類別，將電梯移至基本設施
const AMENITIES_CATEGORIES = [
  {
    id: 'basics',
    name: '基本設施',
    options: [
      { id: 'wifi', label: '免費 Wi-Fi' },
      { id: 'parking', label: '停車場' },
      { id: 'elevator', label: '電梯' },
      { id: 'airConditioner', label: '空調' },
      { id: 'heater', label: '暖氣' },
      { id: 'washingMachine', label: '洗衣機' }
    ]
  },
  {
    id: 'accommodation',
    name: '住宿設施',
    options: [
      { id: 'privateRoom', label: '私人房間' },
      { id: 'sharedRoom', label: '共享房間' },
      { id: 'camping', label: '露營區' },
      { id: 'kitchen', label: '廚房設施' },
      { id: 'bathroom', label: '獨立衛浴' },
      { id: 'sharedBathroom', label: '共享衛浴' }
    ]
  },
  {
    id: 'workExchange',
    name: '工作交換',
    options: [
      { id: 'workingDesk', label: '工作桌' },
      { id: 'internetAccess', label: '高速網路' },
      { id: 'toolsProvided', label: '提供工具' },
      { id: 'trainingProvided', label: '提供培訓' },
      { id: 'flexibleHours', label: '彈性工作時間' }
    ]
  },
  {
    id: 'lifestyle',
    name: '生活風格',
    options: [
      { id: 'petFriendly', label: '寵物友善' },
      { id: 'smokingAllowed', label: '允許吸菸' },
      { id: 'childFriendly', label: '適合兒童' },
      { id: 'organic', label: '有機耕作' },
      { id: 'vegetarian', label: '提供素食' },
      { id: 'ecoFriendly', label: '環保設施' }
    ]
  },
  {
    id: 'activities',
    name: '休閒活動',
    options: [
      { id: 'yoga', label: '瑜珈' },
      { id: 'meditation', label: '冥想空間' },
      { id: 'freeDiving', label: '自由潛水' },
      { id: 'scubaDiving', label: '水肺潛水' },
      { id: 'hiking', label: '登山健行' },
      { id: 'farmingActivities', label: '農場活動' },
      { id: 'culturalExchange', label: '文化交流' }
    ]
  }
];

const AmenitiesStep: React.FC = () => {
  const {
    register,
    watch,
    setValue,
    formState: { errors }
  } = useFormContext();

  // 獲取表單數據中的設施
  const amenities = watch('amenities') || {};

  // 處理新增自定義設施
  const [customAmenity, setCustomAmenity] = React.useState('');
  const customAmenities = watch('amenities.customAmenities') || [];

  const handleAddCustomAmenity = () => {
    if (customAmenity.trim() && !customAmenities.includes(customAmenity.trim())) {
      setValue('amenities.customAmenities', [...customAmenities, customAmenity.trim()], { shouldValidate: true });
      setCustomAmenity('');
    }
  };

  const handleRemoveCustomAmenity = (amenity: string) => {
    setValue(
      'amenities.customAmenities',
      customAmenities.filter((item: string) => item !== amenity),
      { shouldValidate: true }
    );
  };

  // 安全獲取錯誤訊息
  const getErrorMessage = (path: string): string | undefined => {
    try {
      const keys = path.split('.');
      let current: any = errors;

      for (const key of keys) {
        if (current && current[key]) {
          current = current[key];
        } else {
          return undefined;
        }
      }

      return current.message ? String(current.message) : undefined;
    } catch (e) {
      return undefined;
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-medium text-gray-900">設施與服務</h3>
        <p className="mt-1 text-sm text-gray-500">
          請選擇您場所提供的設施與服務，幫助申請者了解您提供的環境與條件。
        </p>
      </div>

      {/* 設施分類列表 */}
      <div className="space-y-6">
        {AMENITIES_CATEGORIES.map((category) => (
          <div key={category.id} className="border rounded-lg p-4">
            <h4 className="text-md font-medium text-gray-800 mb-3">{category.name}</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-3">
              {category.options.map((option) => (
                <div key={option.id} className="flex items-start">
                  <div className="flex h-5 items-center">
                    <input
                      id={`amenity-${option.id}`}
                      type="checkbox"
                      {...register(`amenities.${category.id}.${option.id}`)}
                      className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                  </div>
                  <div className="ml-3 text-sm">
                    <label
                      htmlFor={`amenity-${option.id}`}
                      className="font-medium text-gray-700 cursor-pointer"
                    >
                      {option.label}
                    </label>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* 自定義設施 */}
      <div className="border rounded-lg p-4">
        <h4 className="text-md font-medium text-gray-800 mb-3">自定義設施與服務</h4>
        <p className="text-sm text-gray-600 mb-4">若上述選項未包含您提供的設施或服務，請在此處添加</p>

        <div className="flex">
          <input
            type="text"
            value={customAmenity}
            onChange={(e) => setCustomAmenity(e.target.value)}
            className="flex-grow rounded-l-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
            placeholder="輸入自定義設施或服務..."
            maxLength={50}
          />
          <button
            type="button"
            onClick={handleAddCustomAmenity}
            disabled={!customAmenity.trim()}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-r-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            添加
          </button>
        </div>

        {/* 自定義設施列表 */}
        {customAmenities.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {customAmenities.map((amenity: string, index: number) => (
              <div
                key={index}
                className="inline-flex items-center rounded-md bg-primary-50 px-2 py-1 text-sm font-medium text-primary-700"
              >
                <span>{amenity}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveCustomAmenity(amenity)}
                  className="ml-1 inline-flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full text-primary-600 hover:bg-primary-200 hover:text-primary-500 focus:bg-primary-500 focus:text-white focus:outline-none"
                >
                  <span className="sr-only">移除 {amenity}</span>
                  <svg className="h-2.5 w-2.5" stroke="currentColor" fill="none" viewBox="0 0 8 8">
                    <path strokeLinecap="round" strokeWidth="1.5" d="M1 1l6 6m0-6L1 7" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 工作交換描述 */}
      <div>
        <label htmlFor="workExchangeDescription" className="block text-sm font-medium text-gray-700">
          工作交換概述
        </label>
        <p className="mt-1 text-sm text-gray-500 mb-2">
          簡要說明您提供的工作交換類型，具體細節將在機會描述中詳細說明。
        </p>
        <textarea
          id="amenities.workExchangeDescription"
          data-error-path="amenities.workExchangeDescription"
          {...register('amenities.workExchangeDescription')}
          rows={4}
          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
          placeholder="例如：我們主要提供農場工作、廚房協助、接待服務等工作交換機會..."
        />
        {getErrorMessage('amenities.workExchangeDescription') && (
          <p className="mt-1 text-sm text-red-600">{getErrorMessage('amenities.workExchangeDescription')}</p>
        )}
      </div>

      {/* 額外說明 */}
      <div>
        <label htmlFor="amenitiesNotes" className="block text-sm font-medium text-gray-700">
          設施與服務補充說明 (選填)
        </label>
        <p className="mt-1 text-sm text-gray-500 mb-2">
          補充說明您的設施使用方式、開放時間或特殊規定等
        </p>
        <textarea
          id="amenities.amenitiesNotes"
          data-error-path="amenities.amenitiesNotes"
          {...register('amenities.amenitiesNotes')}
          rows={4}
          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
          placeholder="例如：Wi-Fi密碼會在入住時提供、廚房開放時間為上午8點至晚上9點..."
        />
        {getErrorMessage('amenities.amenitiesNotes') && (
          <p className="mt-1 text-sm text-red-600">{getErrorMessage('amenities.amenitiesNotes')}</p>
        )}
      </div>
    </div>
  );
};

export default AmenitiesStep;
export { AMENITIES_CATEGORIES };