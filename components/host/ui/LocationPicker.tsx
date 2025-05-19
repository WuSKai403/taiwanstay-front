import React, { useState, useEffect, useRef, useCallback } from 'react';

// 組件屬性定義
interface LocationPickerProps {
  defaultPosition: [number, number]; // [緯度, 經度]
  onPositionChange: (lat: number, lng: number) => void;
  address?: string;
  city?: string;
  district?: string;
  height?: string;
}

const LocationPicker: React.FC<LocationPickerProps> = ({
  defaultPosition,
  onPositionChange,
  address,
  city,
  district,
  height = '400px'
}) => {
  const [markerPosition, setMarkerPosition] = useState<[number, number]>(defaultPosition);
  const [isClient, setIsClient] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [mapInstance, setMapInstance] = useState<any>(null);
  const [marker, setMarker] = useState<any>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInitializedRef = useRef<boolean>(false);

  // 確保只在客戶端渲染
  useEffect(() => {
    setIsClient(true);
  }, []);

  // 初始化地圖
  useEffect(() => {
    if (!isClient || mapInitializedRef.current) return;

    const loadLeaflet = async () => {
      try {
        // 動態導入 Leaflet
        const L = await import('leaflet');

        // 檢查地圖容器是否存在
        if (!mapContainerRef.current) {
          console.error('地圖容器不存在');
          return;
        }

        // 創建地圖實例 - 使用 container ID
        const mapId = `map-${Math.random().toString(36).substr(2, 9)}`;
        mapContainerRef.current.id = mapId;

        // 延遲初始化地圖，確保 DOM 已渲染
        setTimeout(() => {
          try {
            // 檢查默認位置是否有效
            let validPosition: [number, number] = [25.0330, 121.5654]; // 台北市中心作為默認位置

            if (defaultPosition &&
                defaultPosition.length === 2 &&
                typeof defaultPosition[0] === 'number' &&
                typeof defaultPosition[1] === 'number' &&
                !isNaN(defaultPosition[0]) &&
                !isNaN(defaultPosition[1])) {
              validPosition = defaultPosition;
            } else {
              console.warn('提供的默認位置無效，使用台北市中心作為默認位置');
            }

            // 確保位置在有效範圍內
            setMarkerPosition(validPosition);

            // 創建地圖實例
            const map = L.map(mapId, {
              // 禁用緩存以避免初始化問題
              preferCanvas: true,
              // 禁用縮放動畫以避免轉換錯誤
              zoomAnimation: false
            }).setView(validPosition, 13);

            // 添加底圖圖層
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
              attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            }).addTo(map);

            // 添加標記
            const newMarker = L.marker(validPosition, {
              draggable: true
            }).addTo(map);

            // 綁定彈出窗
            updatePopupContent(newMarker);

            // 監聽地圖點擊事件
            map.on('click', (e: any) => {
              const { lat, lng } = e.latlng;
              const newPosition: [number, number] = [lat, lng];

              // 更新標記位置
              newMarker.setLatLng(newPosition);

              // 更新彈出窗
              updatePopupContent(newMarker);

              // 更新狀態
              setMarkerPosition(newPosition);
              onPositionChange(lat, lng);
            });

            // 監聽標記拖動結束事件
            newMarker.on('dragend', () => {
              const position = newMarker.getLatLng();
              const newPosition: [number, number] = [position.lat, position.lng];

              // 更新彈出窗
              updatePopupContent(newMarker);

              // 更新狀態
              setMarkerPosition(newPosition);
              onPositionChange(position.lat, position.lng);
            });

            // 保存地圖與標記實例
            setMapInstance(map);
            setMarker(newMarker);

            // 初始化地理編碼 - 僅在初始化時執行一次
            if (city) {
              geocodeCityAndDistrict(map, newMarker);
            }

            // 通知地圖容器大小變化
            setTimeout(() => {
              map.invalidateSize();
            }, 100);

          } catch (e) {
            console.error("地圖初始化錯誤:", e);
          }
        }, 200);
      } catch (error) {
        console.error('載入 Leaflet 時出錯:', error);
      }
    };

    loadLeaflet();

    // 清理函數
    return () => {
      if (mapInstance) {
        mapInstance.remove();
        setMapInstance(null);
        setMarker(null);
        mapInitializedRef.current = false;
      }
    };
  }, [isClient]); // 只依賴於 isClient，避免重複初始化

  // 更新彈出窗內容的輔助函數
  const updatePopupContent = (markerInstance: any) => {
    if (markerInstance && (city || district || address)) {
      const content = `${city || ''} ${district || ''} ${address || ''}`.trim();
      if (content) {
        markerInstance.bindPopup(content).openPopup();
      }
    }
  };

  // 如果找不到區域，嘗試搜索城市
  const fallbackToCity = useCallback(async (mapInstance: any, markerInstance: any) => {
    console.log('找不到對應區域中心，嘗試搜索城市');

    try {
      const cityOnlyResponse = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(city || '')}&countrycodes=tw&limit=1`
      );

      const cityData = await cityOnlyResponse.json();

      if (cityData && cityData.length > 0) {
        const { lat, lon } = cityData[0];
        const cityPosition: [number, number] = [parseFloat(lat), parseFloat(lon)];

        // 更新標記位置
        markerInstance.setLatLng(cityPosition);
        updatePopupContent(markerInstance);

        // 更新地圖視圖
        mapInstance.setView(cityPosition, 12);

        // 更新狀態
        setMarkerPosition(cityPosition);
        onPositionChange(cityPosition[0], cityPosition[1]);
        console.log('找到城市中心:', cityPosition);
      } else {
        console.log('無法找到對應城市位置，使用默認位置');
      }
    } catch (error) {
      console.error('城市地理編碼錯誤:', error);
    }
  }, [city, onPositionChange, updatePopupContent]);

  // 地理編碼函數 - 使用 useCallback 避免每次渲染都重新創建
  const geocodeCityAndDistrict = useCallback(async (mapInstance: any, markerInstance: any) => {
    if (!city || isSearching) return;

    setIsSearching(true);

    try {
      // 構建搜索地址，只使用城市和區域
      const searchAddress = `${city}${district ? ` ${district}` : ''}`;
      console.log('正在搜索區域中心:', searchAddress);

      // 使用 OpenStreetMap Nominatim API 進行地理編碼
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchAddress)}&countrycodes=tw&limit=1`
      );

      const data = await response.json();

      if (data && data.length > 0) {
        const { lat, lon } = data[0];
        const newPosition: [number, number] = [parseFloat(lat), parseFloat(lon)];

        // 更新標記位置
        markerInstance.setLatLng(newPosition);
        updatePopupContent(markerInstance);

        // 更新地圖視圖
        mapInstance.setView(newPosition, 14);

        // 更新狀態
        setMarkerPosition(newPosition);
        onPositionChange(newPosition[0], newPosition[1]);
        console.log('找到區域中心:', newPosition);
      } else {
        fallbackToCity(mapInstance, markerInstance);
      }
    } catch (error) {
      console.error('地理編碼錯誤:', error);
      fallbackToCity(mapInstance, markerInstance);
    } finally {
      setIsSearching(false);
    }
  }, [city, district, fallbackToCity, isSearching, onPositionChange, updatePopupContent]);

  // 當地址變更且有指定城市/區域時，進行搜索
  useEffect(() => {
    if (!mapInstance || !marker || !city || !district) return;

    // 檢查是否已經有使用者在地圖上互動過
    // 如果 city 或 district 有值但沒被定義為傳入屬性，代表他們是暫時的搜索參數
    // 這種情況下才進行自動搜索，避免在使用者已互動後重複搜索
    if (city && district) {
      console.log(`[地圖] 嘗試搜索位置: ${city} ${district}`);
      geocodeCityAndDistrict(mapInstance, marker);
    }
  }, [mapInstance, marker, city, district, geocodeCityAndDistrict]);

  // 當詳細地址變更時，只更新彈出窗內容，不重新搜索位置
  useEffect(() => {
    if (marker) {
      updatePopupContent(marker);
    }
  }, [address, marker]);

  // 確保只在客戶端渲染地圖
  if (!isClient) {
    return (
      <div
        style={{
          height,
          width: '100%',
          backgroundColor: '#f0f0f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        地圖載入中...
      </div>
    );
  }

  return (
    <div style={{ height, width: '100%' }}>
      <div
        ref={mapContainerRef}
        style={{ height: '100%', width: '100%' }}
      />
      <p className="text-gray-500 text-xs mt-1">
        請點擊地圖選擇您的精確位置，或者修改城市和區域來更新位置。標記可以拖動調整位置。
      </p>
    </div>
  );
};

export default LocationPicker;