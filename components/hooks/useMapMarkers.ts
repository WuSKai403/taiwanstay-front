import { useEffect, useRef } from 'react';
import { LeafletInstance as L } from './useLeaflet';
import { createCustomIcon, createClusterIcon } from './useLeaflet';

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
  mapInstance: L.Map | null,
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
  const markersRef = useRef<{ [key: string]: L.Marker }>({});
  const markerClusterGroupRef = useRef<any>(null);
  const currentMarkersRef = useRef<MapMarker[]>([]);

  // 清除所有標記
  const clearMarkers = () => {
    if (!mapInstance) return;

    // 如果啟用了集群，清除集群
    if (enableClustering && markerClusterGroupRef.current) {
      markerClusterGroupRef.current.clearLayers();
    } else {
      // 否則直接從地圖中移除標記
      Object.values(markersRef.current).forEach(marker => {
        marker.remove();
      });
    }

    // 清空標記引用
    markersRef.current = {};
  };

  // 更新標記
  const updateMarkers = () => {
    if (!mapInstance) return;

    console.log('useMapMarkers: 更新標記', markers.length, '個標記');

    // 清除現有標記
    clearMarkers();

    // 如果沒有標記，直接返回
    if (markers.length === 0) {
      console.log('useMapMarkers: 沒有標記，跳過更新');
      return;
    }

    // 創建集群組（如果啟用）
    if (enableClustering && !markerClusterGroupRef.current) {
      console.log('useMapMarkers: 創建標記集群組');
      markerClusterGroupRef.current = (L as any).markerClusterGroup({
        showCoverageOnHover: false,
        zoomToBoundsOnClick: true,
        spiderfyOnMaxZoom: true,
        removeOutsideVisibleBounds: true,
        disableClusteringAtZoom: clusteringZoomThreshold,
        iconCreateFunction: createClusterIcon,
        maxClusterRadius: 80,
        spiderLegPolylineOptions: {
          weight: 1.5,
          color: '#222',
          opacity: 0.5,
        },
        polygonOptions: {
          fillColor: '#3388ff',
          color: '#3388ff',
          weight: 0.5,
          opacity: 0.5,
          fillOpacity: 0.2,
        },
      });
      mapInstance.addLayer(markerClusterGroupRef.current);
    }

    // 處理標記分組
    const currentZoom = mapInstance.getZoom();
    const shouldGroup = currentZoom < groupZoomThreshold;
    const groupedMarkers: { [key: string]: MapMarker[] } = {};

    // 如果需要分組，則按位置分組
    if (shouldGroup) {
      markers.forEach(marker => {
        // 使用位置作為鍵（精確到小數點後 4 位）
        const posKey = `${marker.position[0].toFixed(4)},${marker.position[1].toFixed(4)}`;
        if (!groupedMarkers[posKey]) {
          groupedMarkers[posKey] = [];
        }
        groupedMarkers[posKey].push(marker);
      });
    }

    // 添加標記到地圖
    if (shouldGroup) {
      // 添加分組標記
      Object.entries(groupedMarkers).forEach(([posKey, markersAtPosition]) => {
        const firstMarker = markersAtPosition[0];
        const count = markersAtPosition.length;
        const isHighlighted = markersAtPosition.some(m => m.id === highlightedMarkerId);

        // 創建標記
        const marker = L.marker(firstMarker.position, {
          icon: createCustomIcon(isHighlighted, count),
          title: firstMarker.title || '',
        });

        // 設置點擊事件
        if (onMarkerClick) {
          marker.on('click', () => {
            // 如果只有一個標記，直接觸發點擊事件
            if (count === 1) {
              onMarkerClick(firstMarker.id);
            } else {
              // 如果有多個標記，顯示一個列表讓用戶選擇
              const popupContent = `
                <div class="marker-popup p-3" style="max-width: 300px;">
                  <h3 class="font-semibold text-base mb-3 text-gray-800">此位置有 ${count} 個機會</h3>
                  <div class="space-y-3">
                    ${markersAtPosition.map(m => `
                      <div class="border-b pb-2 mb-2 last:border-b-0 last:mb-0 last:pb-0">
                        <h4 class="font-medium text-sm mb-1 text-gray-800">${m.title || '未命名機會'}</h4>
                        <div class="flex justify-center">
                          <a
                            href="/opportunities/${m.slug || m.id}"
                            class="inline-block border border-primary-600 text-primary-600 text-xs px-4 py-1.5 rounded hover:bg-gray-50 hover:text-primary-700 hover:border-primary-700 transition-colors"
                          >
                            查看詳情
                          </a>
                        </div>
                      </div>
                    `).join('')}
                  </div>
                </div>
              `;

              // 創建彈出窗口
              const popup = L.popup({
                maxWidth: 320,
                className: 'custom-popup'
              })
                .setLatLng(firstMarker.position)
                .setContent(popupContent)
                .openOn(mapInstance);
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
        markersRef.current[posKey] = marker;
      });
    } else {
      // 添加單個標記
      markers.forEach(markerData => {
        const isHighlighted = markerData.id === highlightedMarkerId;
        const markerKey = `marker-${markerData.id}`;

        // 創建標記
        const marker = L.marker(markerData.position, {
          icon: createCustomIcon(isHighlighted),
          title: markerData.title || '',
        });

        // 設置懸停效果
        marker.on('mouseover', () => {
          // 放大標記
          marker.setIcon(createCustomIcon(true));

          // 如果沒有彈出窗口，則顯示簡單的提示
          if (!marker.getPopup()) {
            const tooltipContent = `
              <div class="font-semibold">${markerData.title || '未命名機會'}</div>
              <div class="text-xs text-gray-600">${markerData.type ? typeNameMap[markerData.type] || '未分類' : '未分類'}</div>
            `;
            marker.bindTooltip(tooltipContent, {
              direction: 'top',
              offset: [0, -10],
              className: 'custom-tooltip'
            }).openTooltip();
          }
        });

        marker.on('mouseout', () => {
          // 如果不是高亮標記，則恢復原來的大小
          if (markerData.id !== highlightedMarkerId) {
            marker.setIcon(createCustomIcon(false));
          }

          // 關閉提示
          if (marker.getTooltip()) {
            marker.closeTooltip();
          }
        });

        // 設置點擊事件
        if (onMarkerClick) {
          marker.on('click', () => {
            // 如果有自定義彈出內容，使用它
            if (markerData.popupContent) {
              const popup = L.popup({
                maxWidth: 320,
                className: 'custom-popup'
              })
                .setLatLng(markerData.position)
                .setContent(markerData.popupContent as string)
                .openOn(mapInstance);
            } else {
              // 否則創建一個簡單的彈出窗口
              const popupContent = `
                <div class="p-3" style="max-width: 250px;">
                  <h3 class="font-semibold text-base mb-2">${markerData.title || '未命名機會'}</h3>
                  <div class="flex justify-center mt-2">
                    <a
                      href="/opportunities/${markerData.slug || markerData.id}"
                      class="inline-block border border-primary-600 text-primary-600 text-xs px-4 py-1.5 rounded hover:bg-gray-50 hover:text-primary-700 hover:border-primary-700 transition-colors"
                    >
                      查看詳情
                    </a>
                  </div>
                </div>
              `;

              const popup = L.popup({
                maxWidth: 320,
                className: 'custom-popup'
              })
                .setLatLng(markerData.position)
                .setContent(popupContent)
                .openOn(mapInstance);
            }

            // 觸發點擊事件
            onMarkerClick(markerData.id);
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
    }

    // 更新當前標記引用
    currentMarkersRef.current = [...markers];
  };

  // 當地圖實例、標記或選項變化時更新標記
  useEffect(() => {
    if (!mapInstance) return;

    console.log('useMapMarkers: 依賴項變化，更新標記', markers.length);

    // 確保清除現有標記，即使沒有新標記
    clearMarkers();

    // 只有在有標記時才執行更新標記的操作
    if (markers.length > 0) {
      updateMarkers();
    }

    // 添加縮放事件監聽器
    const handleZoomEnd = () => {
      console.log('useMapMarkers: 縮放結束，更新標記');
      // 只有在有標記時才執行更新標記的操作
      if (markers.length > 0) {
        updateMarkers();
      }
    };

    mapInstance.on('zoomend', handleZoomEnd);

    // 清理函數
    return () => {
      console.log('useMapMarkers: 清理標記');
      mapInstance.off('zoomend', handleZoomEnd);
      clearMarkers();
    };
  }, [
    mapInstance,
    markers,
    enableClustering,
    highlightedMarkerId,
    onMarkerClick,
    clusteringZoomThreshold,
    groupZoomThreshold,
  ]);

  // 如果高亮的標記變化，打開彈出窗口
  useEffect(() => {
    if (!mapInstance || !highlightedMarkerId || markers.length === 0) return;

    // 查找高亮標記
    const highlightedMarker = currentMarkersRef.current.find(
      marker => marker.id === highlightedMarkerId
    );

    if (highlightedMarker) {
      // 查找對應的 Leaflet 標記
      let leafletMarker: L.Marker | undefined;

      // 檢查是否是分組標記
      const currentZoom = mapInstance.getZoom();
      const shouldGroup = currentZoom < groupZoomThreshold;

      if (shouldGroup) {
        // 查找包含高亮標記的分組
        const posKey = `${highlightedMarker.position[0].toFixed(4)},${highlightedMarker.position[1].toFixed(4)}`;
        leafletMarker = markersRef.current[posKey];
      } else {
        // 直接查找單個標記
        const markerKey = `marker-${highlightedMarkerId}`;
        leafletMarker = markersRef.current[markerKey];
      }

      // 如果找到標記，打開彈出窗口
      if (leafletMarker) {
        // 如果有自定義彈出內容，使用它
        if (highlightedMarker.popupContent) {
          leafletMarker.bindPopup(
            highlightedMarker.popupContent as string
          ).openPopup();
        } else {
          // 否則使用標題
          leafletMarker.bindPopup(
            highlightedMarker.title || '未命名機會'
          ).openPopup();
        }

        // 將地圖視圖移動到標記位置
        mapInstance.setView(highlightedMarker.position, mapInstance.getZoom());
      }
    }
  }, [mapInstance, highlightedMarkerId, groupZoomThreshold, markers.length]);

  return {
    clearMarkers,
    updateMarkers,
  };
};