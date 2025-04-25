import React, { useEffect, useState, useCallback } from 'react';
import { useFormContext, FieldErrors } from 'react-hook-form';
import LocationPicker from '../ui/LocationPicker';
import TaiwanAddressSelect from '../ui/TaiwanAddressSelect';
// @ts-ignore
import twzipcode from 'twzipcode-data';

// 定義國家選項
const COUNTRY_OPTIONS = [
  { code: 'TW', nameEn: 'Taiwan', nameZh: '台灣' },
  { code: 'JP', nameEn: 'Japan', nameZh: '日本' },
  { code: 'US', nameEn: 'United States', nameZh: '美國' },
  { code: 'UK', nameEn: 'United Kingdom', nameZh: '英國' },
  { code: 'CA', nameEn: 'Canada', nameZh: '加拿大' },
  { code: 'AU', nameEn: 'Australia', nameZh: '澳洲' },
  { code: 'NZ', nameEn: 'New Zealand', nameZh: '紐西蘭' },
  { code: 'SG', nameEn: 'Singapore', nameZh: '新加坡' },
  { code: 'MY', nameEn: 'Malaysia', nameZh: '馬來西亞' },
  { code: 'TH', nameEn: 'Thailand', nameZh: '泰國' },
  { code: 'KR', nameEn: 'South Korea', nameZh: '韓國' }
];

// 通過資料庫查詢郵遞區號
const getZipCodeFromTwZipcode = (city: string, district: string): string => {
  try {
    // 獲取台灣地址數據
    const addressData = twzipcode();
    const zipcodes = addressData.zipcodes;

    // 找到對應的郵遞區號
    const found = zipcodes.find(
      (item: any) => item.county === city && item.city === district
    );

    return found ? found.id : '';
  } catch (error) {
    console.error('獲取郵遞區號失敗:', error);
    return '';
  }
};

// 定義表單數據類型
interface LocationFormData {
  location: {
    country: string;
    city: string;
    district: string;
    zipCode: string;
    address: string;
    coordinates: {
      coordinates: number[];
    };
    showExactLocation: boolean;
  };
}

// 產生儲存使用者互動狀態的 localStorage key
const getInteractionKey = (city: string, district: string): string => {
  return `location_interacted_${city}_${district}`;
};

const LocationStep: React.FC = () => {
  const {
    register,
    formState: { errors },
    watch,
    setValue,
    trigger
  } = useFormContext<LocationFormData>();

  // 追蹤使用者是否已在地圖上互動
  const [userInteracted, setUserInteracted] = useState<boolean>(false);

  // 監視位置相關欄位
  const country = watch('location.country');
  const city = watch('location.city') || '';
  const district = watch('location.district') || '';
  const coordinates = watch('location.coordinates');
  const showExactLocation = watch('location.showExactLocation');

  // 確保國家預設值正確設置為台灣
  useEffect(() => {
    // 強制設定為台灣
    setValue('location.country', 'TW');
    trigger('location.country');
  }, [setValue, trigger]);

  // 載入使用者互動狀態
  useEffect(() => {
    if (city && district) {
      const interactionKey = getInteractionKey(city, district);
      const hasInteracted = localStorage.getItem(interactionKey) === 'true';
      setUserInteracted(hasInteracted);
      console.log(`[地址] 讀取互動狀態: ${city}-${district} => ${hasInteracted ? '已互動' : '未互動'}`);
    } else {
      setUserInteracted(false);
    }
  }, [city, district]);

  // 處理地點選擇事件 - 使用 useCallback 避免不必要的重新創建
  const handleLocationSelected = useCallback((lat: number, lng: number) => {
    setValue('location.coordinates.coordinates', [lng, lat]);
    // 觸發座標驗證
    trigger('location.coordinates');

    // 儲存使用者互動狀態到 localStorage
    if (city && district) {
      const interactionKey = getInteractionKey(city, district);
      localStorage.setItem(interactionKey, 'true');
      setUserInteracted(true);
      console.log(`[地址] 已設定互動狀態: ${city}-${district}`);
    }
  }, [setValue, trigger, city, district]);

  // 處理縣市變更 - 使用 useCallback 避免不必要的重新創建
  const handleCountyChange = useCallback((county: string) => {
    setValue('location.city', county);
    trigger('location.city');
    // 城市變更時不重置互動狀態，而是在下一個 useEffect 中讀取新組合的互動狀態
  }, [setValue, trigger]);

  // 處理區域變更 - 使用 useCallback 避免不必要的重新創建
  const handleDistrictChange = useCallback((district: string) => {
    setValue('location.district', district);
    trigger('location.district');
    // 區域變更時不重置互動狀態，而是在下一個 useEffect 中讀取新組合的互動狀態

    // 當區域變更時直接更新郵遞區號
    if (city && district) {
      updateZipCode(city, district);
    }
  }, [setValue, trigger, city]);

  // 更新郵遞區號的通用函數
  const updateZipCode = useCallback((city: string, district: string) => {
    if (!city || !district) return;

    // 從 twzipcode 資料庫中獲取郵遞區號
    const zipCode = getZipCodeFromTwZipcode(city, district);

    if (zipCode) {
      console.log(`找到郵遞區號: ${city} ${district} => ${zipCode}`);
      setValue('location.zipCode', zipCode);
    } else {
      console.log(`未找到郵遞區號: ${city} ${district}`);
    }
  }, [setValue]);

  // 監聽縣市和區域變更來更新郵遞區號
  useEffect(() => {
    if (city && district) {
      updateZipCode(city, district);
    }
  }, [city, district, updateZipCode]);

  // 安全地獲取錯誤訊息
  const getLocationError = (fieldName: string): string | undefined => {
    return errors.location &&
           errors.location[fieldName as keyof typeof errors.location] &&
           (errors.location[fieldName as keyof typeof errors.location] as any).message;
  };

  return (
    <div className="space-y-6">
      {/* 國家 */}
      <div>
        <label htmlFor="location.country" className="block text-sm font-medium text-gray-700">
          國家 <span className="text-red-500">*</span>
        </label>
        <div className="mt-1 block w-full py-2 px-3 rounded-md border border-gray-300 bg-gray-100 text-gray-700">
          {COUNTRY_OPTIONS.find(c => c.code === 'TW')?.nameEn} {COUNTRY_OPTIONS.find(c => c.code === 'TW')?.nameZh}
          <input
            type="hidden"
            {...register('location.country')}
            value="TW"
          />
        </div>
        {getLocationError('country') && (
          <p className="mt-1 text-sm text-red-600">{getLocationError('country')}</p>
        )}
        <p className="mt-1 text-xs text-gray-500">
          目前僅開放台灣地區的主人註冊
        </p>
      </div>

      {/* 城市和區域選擇 - 使用新組件 */}
      <div>
        <div className="grid grid-cols-1 gap-2">
          <label className="block text-sm font-medium text-gray-700">
            縣市與鄉鎮市區 <span className="text-red-500">*</span>
          </label>
          <TaiwanAddressSelect
            defaultCounty={city}
            defaultDistrict={district}
            onCountyChange={handleCountyChange}
            onDistrictChange={handleDistrictChange}
          />
        </div>
        {getLocationError('city') && (
          <p className="mt-1 text-sm text-red-600">{getLocationError('city')}</p>
        )}
        {getLocationError('district') && (
          <p className="mt-1 text-sm text-red-600">{getLocationError('district')}</p>
        )}
      </div>

      {/* 郵遞區號 */}
      <div>
        <label htmlFor="location.zipCode" className="block text-sm font-medium text-gray-700">
          郵遞區號
        </label>
        <input
          id="location.zipCode"
          type="text"
          {...register('location.zipCode')}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
          placeholder="郵遞區號將自動填入，或手動輸入"
        />
        {getLocationError('zipCode') && (
          <p className="mt-1 text-sm text-red-600">{getLocationError('zipCode')}</p>
        )}
      </div>

      {/* 詳細地址 */}
      <div>
        <label htmlFor="location.address" className="block text-sm font-medium text-gray-700">
          詳細地址 <span className="text-red-500">*</span>
        </label>
        <input
          id="location.address"
          type="text"
          {...register('location.address')}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
          placeholder="請輸入詳細街道地址"
        />
        {getLocationError('address') && (
          <p className="mt-1 text-sm text-red-600">{getLocationError('address')}</p>
        )}
      </div>

      {/* 地圖位置選擇器 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          在地圖上選擇位置 <span className="text-red-500">*</span>
        </label>
        <div className="border border-gray-300 rounded-md overflow-hidden">
          <LocationPicker
            defaultPosition={[
              coordinates?.coordinates?.[1] || 25.0,
              coordinates?.coordinates?.[0] || 121.5
            ]}
            onPositionChange={handleLocationSelected}
            address={watch('location.address')}
            city={userInteracted ? undefined : city}
            district={userInteracted ? undefined : district}
          />
        </div>
        {getLocationError('coordinates') && (
          <p className="mt-1 text-sm text-red-600">請在地圖上選擇位置</p>
        )}
      </div>

      {/* 位置顯示控制 */}
      <div className="mt-4">
        <div className="relative flex items-start">
          <div className="flex items-center h-5">
            <input
              id="location.showExactLocation"
              type="checkbox"
              {...register('location.showExactLocation')}
              className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
          </div>
          <div className="ml-3 text-sm">
            <label htmlFor="location.showExactLocation" className="font-medium text-gray-700">
              顯示精確位置
            </label>
            <p className="text-gray-500">
              勾選後，旅行者可以看到您的確切位置。未勾選則僅顯示大致區域。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LocationStep;