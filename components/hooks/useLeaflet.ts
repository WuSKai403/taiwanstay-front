import L from 'leaflet';
import 'leaflet.markercluster';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import 'leaflet-fullscreen';
import 'leaflet-fullscreen/dist/leaflet.fullscreen.css';
import 'leaflet.locatecontrol';
import 'leaflet.locatecontrol/dist/L.Control.Locate.min.css';

// 修復 Leaflet 默認圖標問題
export function fixLeafletIcon() {
  delete (L.Icon.Default.prototype as any)._getIconUrl;

  L.Icon.Default.mergeOptions({
    iconRetinaUrl: '/images/marker-icon-2x.png',
    iconUrl: '/images/marker-icon.png',
    shadowUrl: '/images/marker-shadow.png',
  });
}

// 創建自定義標記圖標
export function createCustomIcon(
  isHighlighted: boolean = false,
  count: number = 0,
  iconUrl: string = '/images/map-marker.svg'
) {
  const iconSize: L.PointTuple = isHighlighted ? [32, 32] : [24, 24];
  const iconAnchor: L.PointTuple = isHighlighted ? [16, 32] : [12, 24];

  const customIcon = L.divIcon({
    className: 'custom-div-icon',
    html: `
      <div style="position: relative;">
        <div style="
          width: ${iconSize[0]}px;
          height: ${iconSize[0]}px;
          background-color: #FFFFFF;
          border-radius: 50%;
          box-shadow: 0 2px 5px rgba(0,0,0,0.3);
          border: 2px solid #2563EB;
          ${isHighlighted ? 'z-index: 1000;' : ''}
          display: flex;
          align-items: center;
          justify-content: center;
        "></div>
        ${count > 1
          ? `<div style="
              position: absolute;
              top: -6px;
              right: -6px;
              background-color: #2563EB;
              color: white;
              border-radius: 50%;
              width: 18px;
              height: 18px;
              display: flex;
              justify-content: center;
              align-items: center;
              font-size: 11px;
              font-weight: bold;
              border: 1.5px solid white;
              box-shadow: 0 1px 3px rgba(0,0,0,0.3);
            ">${count}</div>`
          : ''}
      </div>
    `,
    iconSize: iconSize,
    iconAnchor: iconAnchor,
  });

  return customIcon;
}

// 創建集群圖標 - 使用與單個標記相同的設計風格
export function createClusterIcon(cluster: any) {
  const count = cluster.getChildCount();
  let size = 32;
  let fontSize = 12;

  if (count > 100) {
    size = 44;
    fontSize = 16;
  } else if (count > 50) {
    size = 38;
    fontSize = 14;
  }

  return L.divIcon({
    html: `
      <div style="
        width: ${size}px;
        height: ${size}px;
        background-color: #FFFFFF;
        border-radius: 50%;
        box-shadow: 0 2px 5px rgba(0,0,0,0.3);
        border: 2px solid #2563EB;
        display: flex;
        align-items: center;
        justify-content: center;
        position: relative;
      ">
        <div style="
          position: absolute;
          top: -8px;
          right: -8px;
          background-color: #2563EB;
          color: white;
          border-radius: 50%;
          min-width: 20px;
          height: 20px;
          padding: 0 3px;
          display: flex;
          justify-content: center;
          align-items: center;
          font-size: ${fontSize}px;
          font-weight: bold;
          border: 1.5px solid white;
          box-shadow: 0 1px 3px rgba(0,0,0,0.3);
        ">${count}</div>
      </div>
    `,
    className: 'custom-cluster-icon',
    iconSize: L.point(size, size),
    iconAnchor: L.point(size/2, size/2)
  });
}

// 導出 Leaflet 實例，以便在組件中使用
export const LeafletInstance = L;

export default {
  fixLeafletIcon,
  createCustomIcon,
  createClusterIcon,
  L: LeafletInstance
};