import React, { useCallback, useEffect, useRef, useState } from 'react';
// @ts-ignore
import twzipcode from 'twzipcode-data';

// 從 host/ui 組件引用現有的組件，確保功能一致
import TaiwanAddressSelect from '@/components/host/ui/TaiwanAddressSelect';
import LocationPicker from '@/components/host/ui/LocationPicker';

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

interface LocationSelectorProps {
  // 表單字段值
  city: string;
  district: string;
  address: string;
  zipCode?: string;
  coordinates?: [number, number] | null;
  showExactLocation?: boolean;

  // 錯誤訊息
  errors?: {
    city?: string;
    district?: string;
    address?: string;
    coordinates?: string;
  };

  // 回調函數，用於更新表單值
  onCityChange: (city: string) => void;
  onDistrictChange: (district: string) => void;
  onAddressChange: (address: string) => void;
  onZipCodeChange?: (zipCode: string) => void;
  onCoordinatesChange: (coordinates: [number, number]) => void;
  onShowExactLocationChange?: (show: boolean) => void;

  // 其他選項
  isAddressRequired?: boolean;
  isCoordinatesRequired?: boolean;
  showZipCode?: boolean;
  showMap?: boolean;
  showExactLocationOption?: boolean;
  userInteracted?: boolean; // 新增：從外部傳入的使用者互動狀態
}

const LocationSelector: React.FC<LocationSelectorProps> = ({
  city,
  district,
  address,
  zipCode,
  coordinates,
  showExactLocation,
  errors,
  onCityChange,
  onDistrictChange,
  onAddressChange,
  onZipCodeChange,
  onCoordinatesChange,
  onShowExactLocationChange,
  isAddressRequired = true,
  isCoordinatesRequired = true,
  showZipCode = false,
  showMap = true,
  showExactLocationOption = false,
  userInteracted: externalUserInteracted // 外部傳入的互動狀態
}) => {
  // 新增useRef防止初次渲染和重複值更新
  const prevZipCodeRef = useRef<string>('');
  // 追蹤使用者是否已在地圖上互動 - 優先使用外部傳入狀態
  const [internalUserInteracted, setInternalUserInteracted] = useState<boolean>(false);
  // 使用外部狀態（如果提供）或內部狀態
  const userInteracted = externalUserInteracted !== undefined ? externalUserInteracted : internalUserInteracted;

  // 追蹤最後一次城市區域選擇
  const lastSelectionRef = useRef<{city: string, district: string}>({city: '', district: ''});

  // 處理縣市變更
  const handleCountyChange = useCallback((county: string) => {
    onCityChange(county);
    // 重置區域選擇時的使用者互動狀態 - 僅當未提供外部狀態時處理
    if (externalUserInteracted === undefined) {
      setInternalUserInteracted(false);
    }
    lastSelectionRef.current = {city: county, district: ''};
  }, [onCityChange, externalUserInteracted]);

  // 處理區域變更
  const handleDistrictChange = useCallback((district: string) => {
    onDistrictChange(district);
    // 新的區域選擇時，允許一次搜索 - 僅當未提供外部狀態時處理
    if (externalUserInteracted === undefined) {
      setInternalUserInteracted(false);
    }
    lastSelectionRef.current = {city: city, district: district};
    // 區域變更時不主動更新郵遞區號，讓useEffect統一處理
  }, [onDistrictChange, city, externalUserInteracted]);

  // 監聽縣市和區域變更來更新郵遞區號 - 修改版本，避免無限循環
  useEffect(() => {
    // 只有當縣市和區域都有值，且有提供郵遞區號變更函數時才處理
    if (city && district && onZipCodeChange) {
      const newZipCode = getZipCodeFromTwZipcode(city, district);

      // 只有當新的郵遞區號與前一個不同，且有效時才更新
      if (newZipCode && newZipCode !== prevZipCodeRef.current) {
        prevZipCodeRef.current = newZipCode;
        onZipCodeChange(newZipCode);
      }
    }
  }, [city, district, onZipCodeChange]);

  // 處理地圖位置選擇
  const handleLocationSelected = useCallback((lat: number, lng: number) => {
    onCoordinatesChange([lng, lat]);
    // 使用者在地圖上交互後，標記為已交互 - 僅當未提供外部狀態時處理
    if (externalUserInteracted === undefined) {
      setInternalUserInteracted(true);
    }
  }, [onCoordinatesChange, externalUserInteracted]);

  // 處理地址變更
  const handleAddressChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onAddressChange(e.target.value);
  }, [onAddressChange]);

  // 處理顯示精確位置選項變更
  const handleShowExactLocationChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (onShowExactLocationChange) {
      onShowExactLocationChange(e.target.checked);
    }
  }, [onShowExactLocationChange]);

  return (
    <div className="space-y-4">
      {/* 縣市與鄉鎮市區選擇 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          縣市與鄉鎮市區 <span className="text-red-500">*</span>
        </label>
        <TaiwanAddressSelect
          defaultCounty={city}
          defaultDistrict={district}
          onCountyChange={handleCountyChange}
          onDistrictChange={handleDistrictChange}
        />
        {errors?.city && (
          <p className="mt-1 text-sm text-red-600">{errors.city}</p>
        )}
        {errors?.district && (
          <p className="mt-1 text-sm text-red-600">{errors.district}</p>
        )}
      </div>

      {/* 郵遞區號 */}
      {showZipCode && (
        <div>
          <label htmlFor="location-zipCode" className="block text-sm font-medium text-gray-700">
            郵遞區號
          </label>
          <input
            id="location-zipCode"
            type="text"
            value={zipCode || ''}
            disabled
            className="mt-1 block w-full rounded-md border-gray-300 bg-gray-50 shadow-sm"
            placeholder="郵遞區號將自動填入"
          />
        </div>
      )}

      {/* 詳細地址 */}
      <div>
        <label htmlFor="location-address" className="block text-sm font-medium text-gray-700">
          詳細地址 {isAddressRequired && <span className="text-red-500">*</span>}
        </label>
        <input
          id="location-address"
          type="text"
          value={address}
          onChange={handleAddressChange}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
          placeholder="請輸入詳細街道地址"
        />
        {errors?.address && (
          <p className="mt-1 text-sm text-red-600">{errors.address}</p>
        )}
        {!isAddressRequired && (
          <p className="mt-1 text-xs text-gray-500">
            詳細地址僅在申請者被接受後顯示，保障您的隱私
          </p>
        )}
      </div>

      {/* 地圖位置選擇器 */}
      {showMap && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            在地圖上選擇位置 {isCoordinatesRequired && <span className="text-red-500">*</span>}
          </label>
          <div className="border border-gray-300 rounded-md overflow-hidden h-80">
            <LocationPicker
              defaultPosition={coordinates ? [coordinates[1], coordinates[0]] : [25.0, 121.5]}
              onPositionChange={handleLocationSelected}
              address={address}
              city={userInteracted ? undefined : city}
              district={userInteracted ? undefined : district}
            />
          </div>
          {errors?.coordinates && (
            <p className="mt-1 text-sm text-red-600">{errors.coordinates}</p>
          )}
        </div>
      )}

      {/* 位置顯示控制 */}
      {showExactLocationOption && (
        <div className="mt-4">
          <div className="relative flex items-start">
            <div className="flex items-center h-5">
              <input
                id="location-showExactLocation"
                type="checkbox"
                checked={showExactLocation}
                onChange={handleShowExactLocationChange}
                className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
            </div>
            <div className="ml-3 text-sm">
              <label htmlFor="location-showExactLocation" className="font-medium text-gray-700">
                顯示精確位置
              </label>
              <p className="text-gray-500">
                勾選後，申請者可以看到您的確切位置。未勾選則僅顯示大致區域。
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LocationSelector;