import React, { useState, useRef, useMemo } from 'react';
import { useLeafletMap } from './hooks/useLeafletMap';
import { useMapMarkers } from './hooks/useMapMarkers';
import { TAIWAN_CENTER, DEFAULT_ZOOM } from './hooks/useLeaflet';
import { useMapOpportunities } from '@/lib/hooks/useMapOpportunities';
import { TransformedMapMarker } from '@/lib/transforms/opportunity';
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
  position?: [number, number];
  zoom?: number;
  height?: string | number;
  onMarkerClick?: (markerId: string) => void;
  enableClustering?: boolean;
  showZoomControl?: boolean;
  showFullscreenControl?: boolean;
  showLocationControl?: boolean;
  highlightedMarkerId?: string;
  filters?: {
    type?: string;
    region?: string;
    city?: string;
  };
}

const MapComponent: React.FC<MapComponentProps> = ({
  position = TAIWAN_CENTER,
  zoom = DEFAULT_ZOOM,
  height = '100%',
  onMarkerClick,
  enableClustering = true,
  showZoomControl = true,
  showFullscreenControl = false,
  showLocationControl = false,
  highlightedMarkerId,
  filters = {}
}) => {
  // 組件 ID
  const componentIdRef = useRef(`map-${Math.random().toString(36).substr(2, 9)}`);

  // 獲取地圖數據
  const { data: mapData, isLoading: isLoadingData, error } = useMapOpportunities(filters);

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
    mapData?.markers || [],
    markerOptions
  );

  // 計算載入狀態
  const isLoadingMap = !isMapReady || isLoadingData;

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
      {/* 錯誤提示 */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-red-50 bg-opacity-90 z-10">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <p className="text-red-600 font-medium">載入地圖數據時發生錯誤</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default MapComponent;