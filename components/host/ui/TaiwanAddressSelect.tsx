import React, { useState, useEffect, useCallback } from 'react';
// @ts-ignore
import twzipcode from 'twzipcode-data';

interface TaiwanAddressSelectProps {
  defaultCounty?: string;
  defaultDistrict?: string;
  onCountyChange: (county: string) => void;
  onDistrictChange: (district: string) => void;
  className?: string;
}

interface County {
  id: string;
  name: string;
}

interface District {
  id: string;
  county: string;
  city: string;
}

const TaiwanAddressSelect: React.FC<TaiwanAddressSelectProps> = ({
  defaultCounty,
  defaultDistrict,
  onCountyChange,
  onDistrictChange,
  className
}) => {
  // 獲取台灣地址數據
  const addressData = twzipcode();
  const [counties, setCounties] = useState<County[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [filteredDistricts, setFilteredDistricts] = useState<District[]>([]);
  const [selectedCounty, setSelectedCounty] = useState<string>(defaultCounty || '');
  const [selectedDistrict, setSelectedDistrict] = useState<string>(defaultDistrict || '');
  const [isInitialized, setIsInitialized] = useState(false);

  // 初始化縣市和鄉鎮區域數據
  useEffect(() => {
    if (addressData) {
      setCounties(addressData.counties);
      setDistricts(addressData.zipcodes);
      setIsInitialized(true);
    }
  }, [addressData]);

  // 當縣市變化時，篩選對應的鄉鎮區域，這是一個單獨的函數
  const filterDistrictsByCounty = useCallback((county: string) => {
    if (county && districts.length > 0) {
      return districts.filter(district => district.county === county);
    }
    return [];
  }, [districts]);

  // 處理縣市選擇變化
  const handleCountyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const county = e.target.value;
    setSelectedCounty(county);

    // 當縣市變更時，重新過濾區域
    const newFilteredDistricts = filterDistrictsByCounty(county);
    setFilteredDistricts(newFilteredDistricts);

    // 如果有新的區域可選，自動選擇第一個
    if (newFilteredDistricts.length > 0) {
      const firstDistrict = newFilteredDistricts[0].city;
      setSelectedDistrict(firstDistrict);
      onDistrictChange(firstDistrict);
    } else {
      setSelectedDistrict('');
      onDistrictChange('');
    }

    onCountyChange(county);
  };

  // 處理鄉鎮區域選擇變化
  const handleDistrictChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const district = e.target.value;
    setSelectedDistrict(district);
    onDistrictChange(district);
  };

  // 初始化選擇項 - 只執行一次
  useEffect(() => {
    if (isInitialized && counties.length > 0 && districts.length > 0) {
      // 設定初始縣市
      if (defaultCounty && counties.some(c => c.name === defaultCounty)) {
        setSelectedCounty(defaultCounty);
        const filtered = filterDistrictsByCounty(defaultCounty);
        setFilteredDistricts(filtered);

        // 設定初始區域
        if (defaultDistrict && filtered.some(d => d.city === defaultDistrict)) {
          setSelectedDistrict(defaultDistrict);
        } else if (filtered.length > 0) {
          // 如果沒有預設區域或區域不在過濾結果中，選擇第一個
          setSelectedDistrict(filtered[0].city);
        }
      }
    }
  }, [isInitialized, counties, districts, defaultCounty, defaultDistrict, filterDistrictsByCounty]);

  // 當第一次載入時，若有初始值，需通知父組件
  useEffect(() => {
    if (isInitialized && selectedCounty) {
      onCountyChange(selectedCounty);
      if (selectedDistrict) {
        onDistrictChange(selectedDistrict);
      }
    }
  }, [isInitialized, onCountyChange, onDistrictChange, selectedCounty, selectedDistrict]);

  return (
    <div className={`flex flex-wrap gap-2 ${className || ''}`}>
      <div className="w-full md:w-1/2">
        <select
          value={selectedCounty}
          onChange={handleCountyChange}
          className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <option value="">請選擇縣市</option>
          {counties.map((county) => (
            <option key={county.id} value={county.name}>
              {county.name}
            </option>
          ))}
        </select>
      </div>

      <div className="w-full md:w-1/2">
        <select
          value={selectedDistrict}
          onChange={handleDistrictChange}
          className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
          disabled={!selectedCounty}
        >
          <option value="">請選擇鄉鎮市區</option>
          {filteredDistricts.map((district) => (
            <option key={`${district.county}-${district.city}`} value={district.city}>
              {district.city}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default TaiwanAddressSelect;