import L from 'leaflet';
import 'leaflet.markercluster';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import 'leaflet-fullscreen';
import 'leaflet-fullscreen/dist/leaflet.fullscreen.css';
import 'leaflet.locatecontrol';
import 'leaflet.locatecontrol/dist/L.Control.Locate.min.css';

// 修復 Leaflet 默認圖標問題
export const fixLeafletIcon = () => {
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: '/images/marker-icon-2x.png',
    iconUrl: '/images/marker-icon.png',
    shadowUrl: '/images/marker-shadow.png',
  });
};

// 自定義標記點圖標
export const createCustomIcon = (isHighlighted: boolean = false, count?: number) => {
  const size = isHighlighted ? 36 : 30;
  const className = `marker-icon ${isHighlighted ? 'highlighted' : ''} ${count && count > 1 ? 'cluster' : ''}`;

  return L.divIcon({
    html: count && count > 1
      ? `<div class="marker-cluster-content">${count}</div>`
      : '<div class="marker-dot"></div>',
    className,
    iconSize: L.point(size, size),
    iconAnchor: [size / 2, size],
  });
};

// 自定義聚合點圖標
export const createClusterIcon = (cluster: any) => {
  const count = cluster.getChildCount();
  const size = count < 10 ? 40 : count < 100 ? 50 : 60;

  return L.divIcon({
    html: `<div class="cluster-icon-content">${count}</div>`,
    className: 'cluster-icon',
    iconSize: L.point(size, size),
  });
};

// 台灣中心點座標
export const TAIWAN_CENTER: [number, number] = [23.5, 121];
export const DEFAULT_ZOOM = 7;
export const MAX_ZOOM = 18;
export const MIN_ZOOM = 4;

// 導出 Leaflet 實例
export type LeafletInstance = typeof L;
export { L };

export default {
  fixLeafletIcon,
  createCustomIcon,
  createClusterIcon,
  L
};