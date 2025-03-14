import { useRef, useState, useEffect } from 'react';
import { fixLeafletIcon, LeafletInstance as L } from './useLeaflet';

interface UseLeafletMapOptions {
  center: [number, number];
  zoom: number;
  showZoomControl: boolean;
  showFullscreenControl: boolean;
  showLocationControl: boolean;
}

export const useLeafletMap = ({
  center,
  zoom,
  showZoomControl,
  showFullscreenControl,
  showLocationControl,
}: UseLeafletMapOptions) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [mapInstance, setMapInstance] = useState<L.Map | null>(null);
  const [isMapReady, setIsMapReady] = useState(false);
  const mapInitializedRef = useRef(false);

  // 初始化地圖
  useEffect(() => {
    // 如果地圖已經初始化或 DOM 元素不存在，則返回
    if (mapInstance || !mapRef.current || mapInitializedRef.current || !window) return;

    mapInitializedRef.current = true;

    // 修復 Leaflet 默認圖標問題
    fixLeafletIcon();

    // 創建地圖實例
    const map = L.map(mapRef.current, {
      center: center,
      zoom: zoom,
      zoomControl: showZoomControl,
      attributionControl: true,
    });

    // 添加圖層
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);

    // 添加全屏控制項
    if (showFullscreenControl && (L as any).control.fullscreen) {
      (L as any).control.fullscreen({
        position: 'topleft',
        title: '全屏顯示',
        titleCancel: '退出全屏',
        forceSeparateButton: true,
      }).addTo(map);
    }

    // 添加定位控制項 - 安全地檢查是否可用
    if (showLocationControl) {
      try {
        // 檢查 locate 控制項是否可用
        if ((L as any).control.locate) {
          (L as any).control.locate({
            position: 'topleft',
            strings: {
              title: '顯示我的位置',
            },
            locateOptions: {
              enableHighAccuracy: true,
            },
          }).addTo(map);
        } else {
          console.warn('Leaflet.Locate 插件未正確載入，定位功能不可用');
        }
      } catch (error) {
        console.error('添加定位控制項時出錯:', error);
      }
    }

    // 設置地圖實例和準備狀態
    setMapInstance(map);
    setIsMapReady(true);

    // 清理函數
    return () => {
      if (map) {
        map.remove();
        mapInitializedRef.current = false;
        setMapInstance(null);
        setIsMapReady(false);
      }
    };
  }, [center, zoom, showZoomControl, showFullscreenControl, showLocationControl]);

  return { mapRef, mapInstance, isMapReady };
};