import { useRef, useCallback, useEffect } from 'react';
import { L, createCustomIcon, createClusterIcon } from './useLeaflet';
import 'leaflet.markercluster';
import type { Map as LeafletMap, Marker, MarkerClusterGroup } from 'leaflet';

// 標記點數據接口
export interface MapMarker {
  id: string;
  position: [number, number]; // [緯度, 經度]
  title?: string;
  type?: string;
  count?: number;
  popupContent?: React.ReactNode | string;
  slug?: string; // 添加 slug 屬性用於導航
}

// 標記管理選項接口
interface UseMapMarkersOptions {
  enableClustering?: boolean;
  highlightedMarkerId?: string;
  onMarkerClick?: (markerId: string) => void;
  clusteringZoomThreshold?: number;
  groupZoomThreshold?: number;
}

// 機會類型中文名稱映射
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

export const useMapMarkers = (
  mapInstance: LeafletMap | null,
  markers: MapMarker[],
  options: UseMapMarkersOptions = {}
) => {
  const {
    enableClustering = true,
    highlightedMarkerId,
    onMarkerClick,
    clusteringZoomThreshold = 12,
    groupZoomThreshold = 15,
  } = options;

  // 使用 ref 來存儲標記和集群
  const markersRef = useRef<{ [key: string]: Marker }>({});
  const markerClusterGroupRef = useRef<MarkerClusterGroup | null>(null);
  const currentMarkersRef = useRef<MapMarker[]>([]);

  // 清除所有標記
  const clearMarkers = useCallback(() => {
    if (!mapInstance) return;

    // 如果啟用了集群，清除集群
    if (enableClustering && markerClusterGroupRef.current) {
      markerClusterGroupRef.current.clearLayers();
      mapInstance.removeLayer(markerClusterGroupRef.current);
      markerClusterGroupRef.current = null;
    } else {
      // 否則直接從地圖中移除標記
      Object.values(markersRef.current).forEach(marker => {
        marker.remove();
      });
    }

    // 清空標記引用
    markersRef.current = {};
  }, [mapInstance, enableClustering]);

  // 更新標記
  const updateMarkers = useCallback(() => {
    if (!mapInstance) return;

    console.log('useMapMarkers: 更新標記', markers.length, '個標記');

    // 清除現有標記
    clearMarkers();

    // 如果沒有標記，直接返回
    if (markers.length === 0) {
      console.log('useMapMarkers: 沒有標記，跳過更新');
      return;
    }

    try {
      // 創建集群組（如果啟用）
      if (enableClustering) {
        console.log('useMapMarkers: 創建標記集群組');
        markerClusterGroupRef.current = L.markerClusterGroup({
          showCoverageOnHover: false,
          zoomToBoundsOnClick: true,
          spiderfyOnMaxZoom: true,
          removeOutsideVisibleBounds: true,
          disableClusteringAtZoom: clusteringZoomThreshold,
          iconCreateFunction: createClusterIcon,
          maxClusterRadius: 80,
        });
        mapInstance.addLayer(markerClusterGroupRef.current);
      }

      // 處理標記分組
      const currentZoom = mapInstance.getZoom();
      const shouldGroup = currentZoom < groupZoomThreshold;
      const groupedMarkers: { [key: string]: MapMarker[] } = {};

      // 如果需要分組，則按位置分組
      markers.forEach(marker => {
        const posKey = shouldGroup
          ? `${marker.position[0].toFixed(4)},${marker.position[1].toFixed(4)}`
          : `marker-${marker.id}`;

        if (!groupedMarkers[posKey]) {
          groupedMarkers[posKey] = [];
        }
        groupedMarkers[posKey].push(marker);
      });

      // 創建標記
      Object.entries(groupedMarkers).forEach(([posKey, markersAtPosition]) => {
        const firstMarker = markersAtPosition[0];
        const markerKey = shouldGroup ? posKey : `marker-${firstMarker.id}`;
        const count = markersAtPosition.length;

        // 如果有多個標記在同一位置，稍微偏移位置
        const position: [number, number] = [...firstMarker.position];
        if (count > 1 && !shouldGroup) {
          const offset = 0.0001; // 約 10 米
          position[0] += Math.random() * offset - offset / 2;
          position[1] += Math.random() * offset - offset / 2;
        }

        // 創建標記
        const marker = L.marker(position, {
          icon: createCustomIcon(
            firstMarker.id === highlightedMarkerId,
            count > 1 ? count : undefined
          )
        });

        // 設置提示
        if (firstMarker.title) {
          marker.bindTooltip(
            count > 1
              ? `此位置有 ${count} 個機會`
              : firstMarker.title,
            {
              direction: 'top',
              offset: [0, -10],
              className: 'custom-tooltip'
            }
          );
        }

        // 設置彈出視窗
        if (count > 1) {
          const popupContent = `
            <div class="marker-popup">
              <h3 class="text-lg font-semibold mb-2">此位置有 ${count} 個機會</h3>
              <div class="space-y-3">
                ${markersAtPosition.map(m => `
                  <div class="border-b pb-2">
                    <h4 class="font-medium">${m.title || '未命名機會'}</h4>
                    <a href="/opportunities/${m.slug || m.id}"
                       class="inline-block mt-2 px-4 py-1 text-sm text-blue-600 border border-blue-600 rounded hover:bg-blue-50">
                      查看詳情
                    </a>
                  </div>
                `).join('')}
              </div>
            </div>
          `;
          marker.bindPopup(popupContent, {
            maxWidth: 300,
            className: 'custom-popup'
          });
        }

        // 設置滑鼠事件
        marker.on('mouseover', () => {
          marker.setIcon(createCustomIcon(true, count > 1 ? count : undefined));
          if (marker.getTooltip()) {
            marker.openTooltip();
          }
        });

        marker.on('mouseout', () => {
          if (firstMarker.id !== highlightedMarkerId) {
            marker.setIcon(createCustomIcon(false, count > 1 ? count : undefined));
          }
          if (marker.getTooltip()) {
            marker.closeTooltip();
          }
        });

        // 設置點擊事件
        if (onMarkerClick) {
          marker.on('click', () => {
            if (count === 1) {
              onMarkerClick(firstMarker.id);
            } else {
              marker.openPopup();
            }
          });
        }

        // 添加標記到集群或地圖
        if (enableClustering && markerClusterGroupRef.current) {
          markerClusterGroupRef.current.addLayer(marker);
        } else {
          marker.addTo(mapInstance);
        }

        // 保存標記引用
        markersRef.current[markerKey] = marker;
      });

      // 更新當前標記引用
      currentMarkersRef.current = [...markers];
    } catch (error) {
      console.error('更新標記時發生錯誤:', error);
    }
  }, [mapInstance, markers, enableClustering, highlightedMarkerId, onMarkerClick, clusteringZoomThreshold, groupZoomThreshold, clearMarkers]);

  // 當標記或地圖實例變化時更新標記
  useEffect(() => {
    if (!mapInstance) return;
    updateMarkers();
  }, [mapInstance, markers, updateMarkers]);

  return {
    updateMarkers,
    clearMarkers
  };
};