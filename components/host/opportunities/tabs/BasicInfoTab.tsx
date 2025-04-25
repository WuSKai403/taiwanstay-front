import React, { useCallback, useEffect, useState } from 'react';
import { Control } from 'react-hook-form';
import { OpportunityFormData } from '../OpportunityForm';
import { typeNameMap } from '@/components/opportunity/constants';
import LocationSelector from '@/components/common/LocationSelector';

interface BasicInfoTabProps {
  control: Control<OpportunityFormData>;
  register: any;
  errors: any;
  watch: any;
  setValue: any;
}

// 產生儲存使用者互動狀態的 localStorage key
const getInteractionKey = (city: string, district: string): string => {
  return `basic_info_location_interacted_${city}_${district}`;
};

const BasicInfoTab: React.FC<BasicInfoTabProps> = ({
  control,
  register,
  errors,
  watch,
  setValue,
}) => {
  // 獲取地點相關表單值
  const city = watch('location.city') || '';
  const district = watch('location.district') || '';
  const address = watch('location.address') || '';
  const zipCode = watch('location.zipCode') || '';
  const coordinates = watch('location.coordinates') || null;
  const showExactLocation = watch('location.showExactLocation') || false;

  // 追蹤使用者是否已在地圖上互動
  const [userInteracted, setUserInteracted] = useState<boolean>(false);

  // 載入使用者互動狀態
  useEffect(() => {
    if (city && district) {
      const interactionKey = getInteractionKey(city, district);
      const hasInteracted = localStorage.getItem(interactionKey) === 'true';
      setUserInteracted(hasInteracted);
      console.log(`[基本資訊] 讀取互動狀態: ${city}-${district} => ${hasInteracted ? '已互動' : '未互動'}`);
    } else {
      setUserInteracted(false);
    }
  }, [city, district]);

  // 處理地點變更的回調函數 - 使用useCallback包裝
  const handleCityChange = useCallback((value: string) => {
    setValue('location.city', value, { shouldValidate: true });
    // 重置互動狀態將在useEffect中處理
  }, [setValue]);

  const handleDistrictChange = useCallback((value: string) => {
    setValue('location.district', value, { shouldValidate: true });
    // 重置互動狀態將在useEffect中處理
  }, [setValue]);

  const handleAddressChange = useCallback((value: string) => {
    setValue('location.address', value, { shouldValidate: true });
  }, [setValue]);

  const handleZipCodeChange = useCallback((value: string) => {
    setValue('location.zipCode', value);
  }, [setValue]);

  const handleCoordinatesChange = useCallback((value: [number, number]) => {
    setValue('location.coordinates', value, { shouldValidate: true });

    // 儲存使用者互動狀態到 localStorage
    if (city && district) {
      const interactionKey = getInteractionKey(city, district);
      localStorage.setItem(interactionKey, 'true');
      setUserInteracted(true);
      console.log(`[基本資訊] 已設定互動狀態: ${city}-${district}`);
    }
  }, [setValue, city, district]);

  // 確保 showExactLocation 始終為 true
  useEffect(() => {
    setValue('location.showExactLocation', true);
  }, [setValue]);

  // 構建地點相關錯誤信息
  const locationErrors = {
    city: errors.location?.city?.message,
    district: errors.location?.district?.message,
    address: errors.location?.address?.message,
    coordinates: errors.location?.coordinates?.message,
  };

  return (
    <div className="space-y-6">
      {/* 標題 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          標題 <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          {...register('title')}
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
          placeholder="輸入機會標題，例如：「有機農場工作機會」"
        />
        {errors.title && (
          <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
        )}
      </div>

      {/* 機會類型 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          機會類型 <span className="text-red-500">*</span>
        </label>
        <select
          {...register('type')}
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
        >
          {Object.entries(typeNameMap).map(([type, name]) => (
            <option key={type} value={type}>
              {name}
            </option>
          ))}
        </select>
        {errors.type && (
          <p className="mt-1 text-sm text-red-600">{errors.type.message}</p>
        )}
        <p className="mt-1 text-sm text-gray-500">選擇最符合此機會性質的類型</p>
      </div>

      {/* 簡短描述 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          簡短描述 <span className="text-red-500">*</span>
        </label>
        <textarea
          {...register('shortDescription')}
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
          rows={3}
          placeholder="用簡短的文字描述這個工作機會（這將顯示在列表頁面）"
        />
        {errors.shortDescription && (
          <p className="mt-1 text-sm text-red-600">{errors.shortDescription.message}</p>
        )}
        <p className="mt-1 text-sm text-gray-500">建議 100-200 字以內，簡要描述機會的主要特點</p>
      </div>

      {/* 詳細描述 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          詳細描述 <span className="text-red-500">*</span>
        </label>
        <textarea
          {...register('description')}
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
          rows={8}
          placeholder="詳細描述這個工作機會，包括預期的工作內容、環境描述、主要職責等"
        />
        {errors.description && (
          <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
        )}
        <p className="mt-1 text-sm text-gray-500">詳細且具體的描述更容易吸引適合的申請者</p>
      </div>

      {/* 地點資訊 */}
      <div className="border-t pt-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">地點資訊</h3>

        <LocationSelector
          city={city}
          district={district}
          address={address}
          zipCode={zipCode}
          coordinates={coordinates}
          showExactLocation={showExactLocation}
          errors={locationErrors}
          onCityChange={handleCityChange}
          onDistrictChange={handleDistrictChange}
          onAddressChange={handleAddressChange}
          onZipCodeChange={handleZipCodeChange}
          onCoordinatesChange={handleCoordinatesChange}
          isAddressRequired={false}
          showZipCode={true}
          showMap={true}
          userInteracted={userInteracted}
        />
      </div>
    </div>
  );
};

export default BasicInfoTab;