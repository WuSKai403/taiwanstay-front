import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';

// 修復 Leaflet 默認圖標問題
const fixLeafletIcon = () => {
  // 重新定義默認圖標
  delete (L.Icon.Default.prototype as any)._getIconUrl;

  L.Icon.Default.mergeOptions({
    iconRetinaUrl: '/images/marker-icon-2x.png',
    iconUrl: '/images/marker-icon.png',
    shadowUrl: '/images/marker-shadow.png',
  });
};

interface MapMarker {
  position: [number, number]; // [緯度, 經度]
  title: string;
  id?: string;
  popupContent?: React.ReactNode | string;
}

interface MapComponentProps {
  position: [number, number]; // 地圖中心點 [緯度, 經度]
  markers?: MapMarker[]; // 多個標記點
  zoom?: number;
  height?: string; // 地圖高度
  onMarkerClick?: (markerId: string) => void; // 標記點點擊事件
  enableClustering?: boolean; // 是否啟用標記點聚合
}

const MapComponent: React.FC<MapComponentProps> = ({
  position,
  markers = [],
  zoom = 13,
  height = '100%',
  onMarkerClick,
  enableClustering = true
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerClusterGroupRef = useRef<any>(null);

  useEffect(() => {
    // 修復 Leaflet 圖標問題
    fixLeafletIcon();

    if (!mapRef.current) return;

    // 確保地圖容器已經渲染並可見
    const initializeMap = () => {
      // 確保 mapRef.current 不為 null
      if (!mapRef.current) return;

      // 確保只初始化一次地圖
      if (!mapInstanceRef.current) {
        // 初始化地圖
        const map = L.map(mapRef.current).setView(position, zoom);

        // 添加 OpenStreetMap 圖層
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(map);

        // 如果啟用聚合，創建一個標記點聚合組
        if (enableClustering) {
          markerClusterGroupRef.current = L.markerClusterGroup();
          map.addLayer(markerClusterGroupRef.current);
        }

        mapInstanceRef.current = map;
      }

      const map = mapInstanceRef.current;
      if (!map) return;

      // 重新計算地圖大小，解決在隱藏/顯示容器時的問題
      map.invalidateSize();

      // 更新地圖中心點和縮放級別
      map.setView(position, zoom);

      // 清除所有現有標記
      if (enableClustering && markerClusterGroupRef.current) {
        markerClusterGroupRef.current.clearLayers();
      } else {
        map.eachLayer((layer) => {
          if (layer instanceof L.Marker) {
            map.removeLayer(layer);
          }
        });
      }

      // 如果有提供標記點數組，則添加多個標記
      if (markers && markers.length > 0) {
        markers.forEach((marker) => {
          const markerInstance = L.marker(marker.position)
            .bindPopup(marker.popupContent?.toString() || marker.title);

          // 如果提供了點擊事件處理函數和標記ID，則添加點擊事件
          if (onMarkerClick && marker.id) {
            markerInstance.on('click', () => {
              onMarkerClick(marker.id!);
            });
          }

          // 根據是否啟用聚合，將標記添加到不同的圖層
          if (enableClustering && markerClusterGroupRef.current) {
            markerClusterGroupRef.current.addLayer(markerInstance);
          } else {
            markerInstance.addTo(map);
          }
        });
      }
      // 如果沒有提供標記點數組但有提供位置，則添加單個標記
      else if (markers.length === 0 && position) {
        L.marker(position)
          .addTo(map)
          .bindPopup("位置")
          .openPopup();
      }
    };

    // 使用 setTimeout 確保 DOM 已完全渲染
    setTimeout(initializeMap, 0);

    // 清理函數
    return () => {
      if (mapInstanceRef.current) {
        // 在組件卸載時清理地圖
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        markerClusterGroupRef.current = null;
      }
    };
  }, [position, markers, zoom, enableClustering, onMarkerClick]);

  return <div ref={mapRef} className="w-full" style={{ height }} />;
};

export default MapComponent;