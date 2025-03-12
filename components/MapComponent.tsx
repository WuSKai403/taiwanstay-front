import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface MapComponentProps {
  position: [number, number]; // [緯度, 經度]
  title: string;
  zoom?: number;
}

const MapComponent: React.FC<MapComponentProps> = ({ position, title, zoom = 13 }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapRef.current) return;

    // 確保只初始化一次地圖
    if (!mapInstanceRef.current) {
      // 初始化地圖
      const map = L.map(mapRef.current).setView(position, zoom);

      // 添加 OpenStreetMap 圖層
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(map);

      // 添加標記
      L.marker(position)
        .addTo(map)
        .bindPopup(title)
        .openPopup();

      mapInstanceRef.current = map;
    } else {
      // 如果地圖已經初始化，只更新視圖和標記
      const map = mapInstanceRef.current;
      map.setView(position, zoom);

      // 清除所有現有標記
      map.eachLayer((layer) => {
        if (layer instanceof L.Marker) {
          map.removeLayer(layer);
        }
      });

      // 添加新標記
      L.marker(position)
        .addTo(map)
        .bindPopup(title)
        .openPopup();
    }

    // 清理函數
    return () => {
      if (mapInstanceRef.current) {
        // 在組件卸載時清理地圖
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [position, title, zoom]);

  return <div ref={mapRef} className="h-full w-full" />;
};

export default MapComponent;