import React, { useEffect, useState, useCallback } from 'react';
import { useFormContext } from 'react-hook-form';
import LocationPicker from '../ui/LocationPicker';
import TaiwanAddressSelect from '../ui/TaiwanAddressSelect';
// @ts-ignore
import twzipcode from 'twzipcode-data';

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

const LocationStep: React.FC = () => {
  const {
    register,
    formState: { errors },
    watch,
    setValue,
    trigger
  } = useFormContext();

  // 監視位置相關欄位
  const country = watch('country');
  const city = watch('city') || '';
  const district = watch('district') || '';
  const coordinates = watch('coordinates');
  const showExactLocation = watch('showExactLocation');

  // 處理地點選擇事件 - 使用 useCallback 避免不必要的重新創建
  const handleLocationSelected = useCallback((lat: number, lng: number) => {
    setValue('coordinates.coordinates', [lng, lat]);
    // 觸發座標驗證
    trigger('coordinates');
  }, [setValue, trigger]);

  // 處理縣市變更 - 使用 useCallback 避免不必要的重新創建
  const handleCountyChange = useCallback((county: string) => {
    setValue('city', county);
    trigger('city');
  }, [setValue, trigger]);

  // 處理區域變更 - 使用 useCallback 避免不必要的重新創建
  const handleDistrictChange = useCallback((district: string) => {
    setValue('district', district);
    trigger('district');

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
      setValue('zipCode', zipCode);
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

  return (
    <div className="space-y-6">
      {/* 國家 */}
      <div>
        <label htmlFor="country" className="block text-sm font-medium text-gray-700">
          國家 <span className="text-red-500">*</span>
        </label>
        <input
          id="country"
          type="text"
          {...register('country')}
          readOnly
          className="mt-1 block w-full rounded-md border-gray-300 bg-gray-100 shadow-sm"
          placeholder="台灣"
        />
        {errors.country && (
          <p className="mt-1 text-sm text-red-600">{errors.country.message as string}</p>
        )}
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
        {errors.city && (
          <p className="mt-1 text-sm text-red-600">{errors.city.message as string}</p>
        )}
        {errors.district && (
          <p className="mt-1 text-sm text-red-600">{errors.district.message as string}</p>
        )}
      </div>

      {/* 郵遞區號 */}
      <div>
        <label htmlFor="zipCode" className="block text-sm font-medium text-gray-700">
          郵遞區號
        </label>
        <input
          id="zipCode"
          type="text"
          {...register('zipCode')}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
          placeholder="郵遞區號將自動填入，或手動輸入"
        />
        {errors.zipCode && (
          <p className="mt-1 text-sm text-red-600">{errors.zipCode.message as string}</p>
        )}
      </div>

      {/* 詳細地址 */}
      <div>
        <label htmlFor="address" className="block text-sm font-medium text-gray-700">
          詳細地址 <span className="text-red-500">*</span>
        </label>
        <input
          id="address"
          type="text"
          {...register('address')}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
          placeholder="請輸入詳細街道地址"
        />
        {errors.address && (
          <p className="mt-1 text-sm text-red-600">{errors.address.message as string}</p>
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
            address={watch('address')}
            city={city}
            district={district}
          />
        </div>
        {errors.coordinates && (
          <p className="mt-1 text-sm text-red-600">請在地圖上選擇位置</p>
        )}
      </div>

      {/* 位置顯示控制 */}
      <div className="mt-4">
        <div className="relative flex items-start">
          <div className="flex items-center h-5">
            <input
              id="showExactLocation"
              type="checkbox"
              {...register('showExactLocation')}
              className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
          </div>
          <div className="ml-3 text-sm">
            <label htmlFor="showExactLocation" className="font-medium text-gray-700">
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