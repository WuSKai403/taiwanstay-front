import React, { useState, useEffect, useRef } from 'react';

// 組件屬性定義
interface LocationMapViewerProps {
  position: [number, number]; // [緯度, 經度]
  address?: string;
  city?: string;
  district?: string;
  height?: string;
}

const LocationMapViewer: React.FC<LocationMapViewerProps> = ({
  position,
  address,
  city,
  district,
  height = '300px'
}) => {
  const [isClient, setIsClient] = useState(false);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const mapInitializedRef = useRef<boolean>(false);

  // 確保只在客戶端渲染
  useEffect(() => {
    setIsClient(true);
    return () => {
      // 組件卸載時清理地圖
      if (mapInstanceRef.current) {
        console.log('清理地圖實例');
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        mapInitializedRef.current = false;
      }
    };
  }, []);

  // 初始化地圖
  useEffect(() => {
    if (!isClient || !mapContainerRef.current || mapInitializedRef.current) return;

    // 設置初始化標誌
    mapInitializedRef.current = true;

    // 動態載入 Leaflet
    const loadLeaflet = async () => {
      try {
        // 載入 Leaflet CSS
        if (!document.querySelector('link[href*="leaflet.css"]')) {
          const link = document.createElement('link');
          link.rel = 'stylesheet';
          link.href = 'https://unpkg.com/leaflet@1.7.1/dist/leaflet.css';
          link.integrity = 'sha512-xodZBNTC5n17Xt2atTPuE1HxjVMSvLVW9ocqUKLsCC5CXdbqCmblAshOMAS6/keqq/sMZMZ19scR4PsZChSR7A==';
          link.crossOrigin = '';
          document.head.appendChild(link);
        }

        // 確保 Leaflet CSS 完全載入
        await new Promise(resolve => setTimeout(resolve, 100));

        // 載入 Leaflet JS
        const L = await import('leaflet');

        // 修復標記圖標問題
        delete (L.Icon.Default.prototype as any)._getIconUrl;
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
          iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
          shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png'
        });

        // 確保 DOM 已完全準備好並且地圖尚未初始化
        if (!mapContainerRef.current) {
          console.error('地圖容器不存在');
          return;
        }

        if (mapContainerRef.current.childNodes.length > 0) {
          console.warn('地圖容器已有子元素，可能已初始化');
          // 嘗試清理容器
          mapContainerRef.current.innerHTML = '';
        }

        // 創建地圖實例 - 使用 container ID
        const mapId = `map-viewer-${Math.random().toString(36).substr(2, 9)}`;
        mapContainerRef.current.id = mapId;

        // 延遲初始化地圖，確保 DOM 已渲染
        setTimeout(() => {
          try {
            // 創建地圖實例
            const map = L.map(mapId, {
              // 禁用緩存以避免初始化問題
              preferCanvas: true,
              // 禁用縮放動畫以避免轉換錯誤
              zoomAnimation: false,
              // 允許縮放但禁止拖動
              dragging: false,
              scrollWheelZoom: true,
              doubleClickZoom: false,
              boxZoom: true,
              keyboard: false,
              zoomControl: true,
              attributionControl: true
            }).setView(position, 15);

            // 保存地圖實例以便清理
            mapInstanceRef.current = map;

            // 添加底圖圖層
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
              attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            }).addTo(map);

            // 添加標記
            const marker = L.marker(position).addTo(map);

            // 設置彈出窗內容
            if (city || district || address) {
              const content = `
                <div style="text-align: center;">
                  <strong>${city || ''} ${district || ''}</strong>
                  <p>${address || ''}</p>
                  <p style="color: #666; font-size: 12px;">經緯度: ${position[0].toFixed(6)}, ${position[1].toFixed(6)}</p>
                </div>
              `;
              marker.bindPopup(content).openPopup();
            }

            // 添加縮放控制提示
            const ZoomInfo = L.Control.extend({
              onAdd: function(map: any) {
                const div = L.DomUtil.create('div', 'zoom-info');
                div.innerHTML = `
                  <div style="background: rgba(255, 255, 255, 0.8); padding: 5px; border-radius: 5px; font-size: 12px; box-shadow: 0 0 5px rgba(0,0,0,0.2);">
                    <p style="margin: 0; color: #333;">
                      <strong>可使用以下方式縮放：</strong><br>
                      • 滾輪捲動<br>
                      • 點擊 +/- 按鈕<br>
                    </p>
                  </div>
                `;
                return div;
              }
            });

            new ZoomInfo({ position: 'bottomright' }).addTo(map);

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
      if (mapInstanceRef.current) {
        console.log('清理地圖實例 - useEffect 清理');
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        mapInitializedRef.current = false;
      }
    };
  }, [isClient, position, city, district, address]);

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
    </div>
  );
};

export default LocationMapViewer;