import { useState, useEffect, useRef } from 'react';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import 'leaflet.locatecontrol/dist/L.Control.Locate.min.css';
import 'leaflet-fullscreen/dist/leaflet.fullscreen.css';
import { useLeafletMap } from './hooks/useLeafletMap';
import { useMapMarkers, MapMarker } from './hooks/useMapMarkers';
import { LeafletInstance as L } from './hooks/useLeaflet';

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
  position: [number, number]; // 地圖中心點 [緯度, 經度]
  markers?: MapMarker[]; // 多個標記點
  zoom?: number;
  height?: string; // 地圖高度
  onMarkerClick?: (markerId: string) => void; // 標記點點擊事件
  enableClustering?: boolean; // 是否啟用標記點聚合
  showZoomControl?: boolean; // 是否顯示縮放控制項
  showFullscreenControl?: boolean; // 是否顯示全屏控制項
  showLocationControl?: boolean; // 是否顯示定位控制項
  highlightedMarkerId?: string; // 高亮顯示的標記ID
  dataFullyLoaded?: boolean; // 資料是否完全載入
}

const MapComponent: React.FC<MapComponentProps> = ({
  position,
  markers = [],
  zoom = 13,
  height = '100%',
  onMarkerClick,
  enableClustering = true,
  showZoomControl = true,
  showFullscreenControl = false,
  showLocationControl = false,
  highlightedMarkerId,
  dataFullyLoaded = true // 默認為 true，向後兼容
}) => {
  const [isLoading, setIsLoading] = useState(!dataFullyLoaded);
  const componentIdRef = useRef(`map-${Math.random().toString(36).substr(2, 9)}`);

  // 使用自定義 Hook 初始化地圖
  const { mapRef, mapInstance, isMapReady } = useLeafletMap({
    center: position,
    zoom,
    showZoomControl,
    showFullscreenControl,
    showLocationControl,
  });

  // 使用自定義 Hook 管理標記
  const { clearMarkers, updateMarkers } = useMapMarkers(mapInstance, markers, {
    enableClustering,
    highlightedMarkerId,
    onMarkerClick,
    clusteringZoomThreshold: 12,
    groupZoomThreshold: 15,
  });

  // 當標記變化時更新標記
  useEffect(() => {
    if (mapInstance && isMapReady && !isLoading) {
      console.log('MapComponent: 標記變化，更新標記', markers.length, '個標記');
      updateMarkers();
    }
  }, [mapInstance, isMapReady, isLoading, markers, updateMarkers]);

  // 當資料載入狀態變化時更新 loading 狀態
  useEffect(() => {
    console.log('MapComponent: 資料載入狀態變化', dataFullyLoaded ? '已完成' : '載入中');
    setIsLoading(!dataFullyLoaded);
  }, [dataFullyLoaded]);

  // 當地圖實例變化時，確保地圖視圖更新到正確的位置
  useEffect(() => {
    if (mapInstance && isMapReady && !isLoading) {
      console.log('MapComponent: 更新地圖視圖位置', position, '標記數量:', markers.length);

      // 設置地圖視圖到指定位置
      mapInstance.setView(position, zoom, {
        animate: true,
        duration: 0.5
      });

      // 如果有標記，調整地圖視圖以包含所有標記
      if (markers.length > 0) {
        try {
          // 創建一個邊界對象
          const bounds = L.latLngBounds([]);

          // 將所有標記添加到邊界中
          markers.forEach(marker => {
            bounds.extend(marker.position);
          });

          // 調整地圖視圖以包含所有標記
          mapInstance.fitBounds(bounds, {
            padding: [50, 50], // 添加一些內邊距
            maxZoom: zoom, // 限制最大縮放級別
            animate: true
          });
        } catch (error) {
          console.error('調整地圖視圖出錯:', error);
        }
      }
    }
  }, [mapInstance, isMapReady, isLoading, position, zoom, markers]);

  return (
    <div className="relative w-full h-full" id={componentIdRef.current}>
      <div ref={mapRef} style={{ height, width: '100%' }} className="leaflet-map-container">
        <style jsx global>{`
          .leaflet-map-container {
            position: relative;
            z-index: 0;
          }

          .custom-popup .leaflet-popup-content-wrapper {
            border-radius: 8px;
            box-shadow: 0 3px 14px rgba(0,0,0,0.2);
            padding: 0;
            overflow: hidden;
            border: 1px solid rgba(0,0,0,0.1);
            transition: all 0.3s ease;
          }

          .custom-popup .leaflet-popup-content {
            margin: 0;
            padding: 0;
            width: 280px !important;
          }

          .custom-popup .leaflet-popup-tip {
            box-shadow: 0 3px 14px rgba(0,0,0,0.2);
            background-color: white;
          }

          /* 標記彈出窗口樣式 */
          .marker-popup h3 {
            margin-bottom: 0.5rem;
            font-weight: 600;
            color: #1f2937;
          }

          .marker-popup a {
            text-decoration: none;
            transition: all 0.2s ease;
          }

          .marker-popup .view-details-btn {
            cursor: pointer;
            display: inline-block;
            padding: 0.5rem 1rem;
            background-color: #2563eb;
            color: white;
            border-radius: 0.25rem;
            font-size: 0.875rem;
            font-weight: 500;
            transition: all 0.2s ease;
          }

          .marker-popup .view-details-btn:hover {
            background-color: #1d4ed8;
            transform: translateY(-1px);
          }

          /* 自定義提示樣式 */
          .custom-tooltip {
            background-color: white;
            border: 1px solid #2563eb;
            border-radius: 4px;
            padding: 6px 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.15);
            font-size: 12px;
            max-width: 200px;
          }

          .custom-tooltip .leaflet-tooltip-content {
            color: #1f2937;
          }

          /* 自定義按鈕樣式 */
          .custom-popup .leaflet-popup-content a {
            display: inline-block;
            border: 1px solid #2563EB;
            color: #2563EB;
            font-size: 0.75rem;
            padding: 0.375rem 1rem;
            border-radius: 0.25rem;
            transition: all 0.2s;
            text-decoration: none;
          }

          .custom-popup .leaflet-popup-content a:hover {
            background-color: #f9fafb;
            color: #1d4ed8;
            border-color: #1d4ed8;
          }

          /* Fullscreen 控制項樣式 */
          .leaflet-control-fullscreen a {
            background: #fff url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABoAAAAaCAYAAACpSkzOAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAAN1wAADdcBQiibeAAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAAE8SURBVEiJ7ZU9SwNBEIafd0khYGFhYSHBIo1gY6cgFvoD/BFiYWEhFhYWFhYWIkIQsbCwEAJiYaGNWFiIhYVFCsFCBIs8i72QXC57H0aJhdnqduZ9dmZ2b1jIpK7rM+CJn+2+MebVp4GqAm4CK8AqsAmkwLlPkAjYA06Bc2APiDIBwDZwCwzqdAMM2+SvgXegXwd4gQ6AJ+CtCvQCHNrET4Ah8FIB+gSOXJtfdIgPgbEF9A5sWWIfwEsd4MkCOQHGFkjqA1myQEaWqgxrZVD4hqzOwFbpkUUZVznI3GdlsJWdqxLUqhy3W5dWxk1VBrKKK7FmqyxR3ZWxWQMpmzLRWZlUZtqQSVOZVcDLNZCZzDRlUgHxDLDRpDKAC2DfNScKgUWgA6wB+8AFcB90/1/pG9tgBVksHYQUAAAAAElFTkSuQmCC') no-repeat 0 0;
            background-size: 26px 26px;
          }

          .leaflet-touch .leaflet-control-fullscreen a {
            background-position: 2px 2px;
          }

          .leaflet-fullscreen-on .leaflet-control-fullscreen a {
            background-position: 0 -26px;
          }

          .leaflet-touch.leaflet-fullscreen-on .leaflet-control-fullscreen a {
            background-position: 2px -24px;
          }

          .leaflet-container.leaflet-fullscreen {
            position: fixed;
            width: 100% !important;
            height: 100% !important;
            top: 0;
            left: 0;
            z-index: 99999;
          }

          .marker-cluster {
            background-clip: padding-box;
            border-radius: 20px;
          }

          .marker-cluster-small {
            background-color: rgba(181, 226, 140, 0.6);
          }

          .marker-cluster-small div {
            background-color: rgba(110, 204, 57, 0.6);
          }

          .marker-cluster-medium {
            background-color: rgba(241, 211, 87, 0.6);
          }

          .marker-cluster-medium div {
            background-color: rgba(240, 194, 12, 0.6);
          }

          .marker-cluster-large {
            background-color: rgba(253, 156, 115, 0.6);
          }

          .marker-cluster-large div {
            background-color: rgba(241, 128, 23, 0.6);
          }

          .cluster-icon {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 100%;
            height: 100%;
            font-weight: bold;
            color: #fff;
            text-shadow: 0 1px 2px rgba(0,0,0,0.25);
          }

          .cluster-small {
            font-size: 12px;
          }

          .cluster-medium {
            font-size: 14px;
          }

          .cluster-large {
            font-size: 16px;
          }
        `}</style>
      </div>
      {/* 載入中覆蓋層 - 在資料載入過程中顯示，防止用戶操作地圖 */}
      {(isLoading || !dataFullyLoaded) && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 bg-opacity-80 z-10">
          <div className="flex flex-col items-center bg-white p-6 rounded-lg shadow-md">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
            <p className="text-gray-700 font-medium">正在載入地圖資料...</p>
            <p className="text-gray-500 text-sm mt-2">請稍候，這可能需要一些時間</p>
          </div>
        </div>
      )}
      {/* 地圖未準備好時的載入指示器 */}
      {!isMapReady && !isLoading && dataFullyLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-2"></div>
            <p className="text-gray-600">載入地圖中...</p>
          </div>
        </div>
      )}
      {/* 當地圖準備好但沒有標記時顯示提示 */}
      {isMapReady && !isLoading && dataFullyLoaded && markers.length === 0 && (
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