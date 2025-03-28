import React, { useState, useRef, useCallback, useMemo } from 'react';
import { useLeafletMap } from './hooks/useLeafletMap';
import { useMapMarkers, MapMarker } from './hooks/useMapMarkers';
import { TAIWAN_CENTER, DEFAULT_ZOOM } from './hooks/useLeaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import 'leaflet.locatecontrol/dist/L.Control.Locate.min.css';
import 'leaflet-fullscreen/dist/leaflet.fullscreen.css';

// 獲取機會類型的顯示名稱
const getTypeDisplayName = (type: string): string => {
  const typeNameMap: Record<string, string> = {
    'FARMING': '農場體驗',
    'GARDENING': '園藝工作',
    'ANIMAL_CARE': '動物照顧',
    'CONSTRUCTION': '建築工作',
    'HOSPITALITY': '接待服務',
    'COOKING': '烹飪工作',
    'CLEANING': '清潔工作',
    'CHILDCARE': '兒童照顧',
    'ELDERLY_CARE': '老人照顧',
    'TEACHING': '教學工作',
    'LANGUAGE_EXCHANGE': '語言交流',
    'CREATIVE': '創意工作',
    'DIGITAL_NOMAD': '數位遊牧',
    'ADMINISTRATION': '行政工作',
    'MAINTENANCE': '維修工作',
    'TOURISM': '旅遊工作',
    'CONSERVATION': '保育工作',
    'COMMUNITY': '社區工作',
    'EVENT': '活動工作',
    'OTHER': '其他機會',
    'unknown': '未分類'
  };

  return typeNameMap[type] || '未知類型';
};

interface MapComponentProps {
  markers?: MapMarker[];
  position?: [number, number];
  zoom?: number;
  height?: string | number;
  onMarkerClick?: (markerId: string) => void;
  enableClustering?: boolean;
  showZoomControl?: boolean;
  showFullscreenControl?: boolean;
  showLocationControl?: boolean;
  highlightedMarkerId?: string;
  dataFullyLoaded?: boolean;
}

const MapComponent: React.FC<MapComponentProps> = ({
  markers = [],
  position = TAIWAN_CENTER,
  zoom = DEFAULT_ZOOM,
  height = '100%',
  onMarkerClick,
  enableClustering = true,
  showZoomControl = true,
  showFullscreenControl = false,
  showLocationControl = false,
  highlightedMarkerId,
  dataFullyLoaded = true
}) => {
  // 組件 ID
  const componentIdRef = useRef(`map-${Math.random().toString(36).substr(2, 9)}`);
  const [isLoading, setIsLoading] = useState(!dataFullyLoaded);

  // 記憶化地圖選項
  const mapOptions = useMemo(() => ({
    center: position,
    zoom,
    showZoomControl,
    showFullscreenControl,
    showLocationControl,
  }), [position, zoom, showZoomControl, showFullscreenControl, showLocationControl]);

  // 初始化地圖
  const { mapRef, mapInstance, isMapReady } = useLeafletMap(mapOptions);

  // 記憶化標記選項
  const markerOptions = useMemo(() => ({
    enableClustering,
    onMarkerClick: onMarkerClick,
    highlightedMarkerId,
  }), [enableClustering, onMarkerClick, highlightedMarkerId]);

  // 使用標記管理 hook
  const { updateMarkers } = useMapMarkers(
    mapInstance,
    markers,
    markerOptions
  );

  // 當資料載入狀態變化時更新 loading 狀態
  React.useEffect(() => {
    if (isLoading === !dataFullyLoaded) return;
    console.log('MapComponent: 資料載入狀態變化', dataFullyLoaded ? '已完成' : '載入中');
    setIsLoading(!dataFullyLoaded);
  }, [dataFullyLoaded]);

  // 計算載入狀態
  const isLoadingMap = !isMapReady || !dataFullyLoaded;

  return (
    <div className="relative w-full h-full" id={componentIdRef.current}>
      <div ref={mapRef} style={{ height, width: '100%' }} className="leaflet-map-container">
        <style jsx global>{`
          .leaflet-map-container {
            background-color: #f5f5f5;
          }
          .marker-icon {
            display: flex;
            align-items: center;
            justify-content: center;
            background: transparent;
            border: none;
          }
          .marker-icon .marker-dot {
            width: 12px;
            height: 12px;
            background-color: #3b82f6;
            border: 2px solid #ffffff;
            border-radius: 50%;
            box-shadow: 0 2px 4px rgba(0,0,0,0.2);
          }
          .marker-icon.highlighted .marker-dot {
            width: 16px;
            height: 16px;
            background-color: #2563eb;
          }
          .marker-icon .marker-cluster-content {
            background-color: #3b82f6;
            color: white;
            border-radius: 50%;
            width: 24px;
            height: 24px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 12px;
            font-weight: bold;
            border: 2px solid #ffffff;
            box-shadow: 0 2px 4px rgba(0,0,0,0.2);
          }
          .cluster-icon {
            background: transparent;
            border: none;
          }
          .cluster-icon-content {
            background-color: #2563eb;
            color: white;
            border-radius: 50%;
            width: 100%;
            height: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 14px;
            font-weight: bold;
            border: 2px solid #ffffff;
            box-shadow: 0 2px 4px rgba(0,0,0,0.2);
          }
          .custom-tooltip {
            background-color: rgba(255, 255, 255, 0.95);
            border: none;
            border-radius: 4px;
            padding: 4px 8px;
            font-size: 14px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          }
          .custom-popup {
            margin-bottom: 8px;
          }
          .custom-popup .leaflet-popup-content-wrapper {
            border-radius: 8px;
            padding: 0;
          }
          .custom-popup .leaflet-popup-content {
            margin: 0;
            padding: 16px;
          }
          .custom-popup .leaflet-popup-tip {
            background-color: white;
          }
          .marker-popup {
            min-width: 200px;
          }
        `}</style>
      </div>
      {/* 載入中覆蓋層 */}
      {isLoadingMap && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 bg-opacity-80 z-10">
          <div className="flex flex-col items-center bg-white p-6 rounded-lg shadow-md">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
            <p className="text-gray-700 font-medium">正在載入地圖...</p>
          </div>
        </div>
      )}
      {/* 無標記提示 */}
      {isMapReady && !isLoadingMap && markers.length === 0 && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-[400] pointer-events-none">
          <div className="bg-white bg-opacity-90 p-4 rounded-lg shadow-lg text-center max-w-xs">
            <svg className="h-12 w-12 text-gray-400 mx-auto mb-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
            <p className="text-gray-700 font-medium">地圖上沒有顯示任何機會</p>
            <p className="text-gray-500 text-sm mt-1">請嘗試調整篩選條件</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default MapComponent;