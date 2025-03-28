import { useRef, useState, useEffect } from 'react';
import { L, fixLeafletIcon, TAIWAN_CENTER, DEFAULT_ZOOM, MAX_ZOOM, MIN_ZOOM } from './useLeaflet';
import type { Map as LeafletMap } from 'leaflet';

interface UseLeafletMapOptions {
  center?: [number, number];
  zoom?: number;
  showZoomControl?: boolean;
  showFullscreenControl?: boolean;
  showLocationControl?: boolean;
}

export const useLeafletMap = ({
  center = TAIWAN_CENTER,
  zoom = DEFAULT_ZOOM,
  showZoomControl = true,
  showFullscreenControl = false,
  showLocationControl = false,
}: UseLeafletMapOptions = {}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [mapInstance, setMapInstance] = useState<LeafletMap | null>(null);
  const [isMapReady, setIsMapReady] = useState(false);
  const mapInitializedRef = useRef(false);

  // 初始化地圖
  useEffect(() => {
    if (!mapRef.current || mapInitializedRef.current || !window) return;

    try {
      mapInitializedRef.current = true;

      // 修復 Leaflet 默認圖標問題
      fixLeafletIcon();

      // 創建地圖實例
      const map = L.map(mapRef.current, {
        center: center,
        zoom: zoom,
        zoomControl: showZoomControl,
        maxZoom: MAX_ZOOM,
        minZoom: MIN_ZOOM,
        attributionControl: true,
      });

      // 添加圖層
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: MAX_ZOOM,
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

      // 添加定位控制項
      if (showLocationControl && (L as any).control.locate) {
        (L as any).control.locate({
          position: 'topleft',
          strings: {
            title: '顯示我的位置',
          },
          locateOptions: {
            enableHighAccuracy: true,
            maxZoom: 16
          },
        }).addTo(map);
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
    } catch (error) {
      console.error('初始化地圖時發生錯誤:', error);
      mapInitializedRef.current = false;
    }
  }, [center, zoom, showZoomControl, showFullscreenControl, showLocationControl]);

  return {
    mapRef,
    mapInstance,
    isMapReady,
    center,
    zoom
  };
};