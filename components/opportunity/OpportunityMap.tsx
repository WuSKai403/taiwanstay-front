import React from 'react';
import dynamic from 'next/dynamic';
import { OpportunityDetail } from './constants';

// 動態加載地圖元件，避免服務端渲染問題
const LocationMapViewer = dynamic(() => import('@/components/LocationMapViewer'), {
  ssr: false,
  loading: () => <div className="h-64 bg-gray-100 flex items-center justify-center"><span className="text-gray-500">載入地圖...</span></div>
});

interface OpportunityMapProps {
  opportunity: OpportunityDetail;
}

const OpportunityMap: React.FC<OpportunityMapProps> = ({ opportunity }) => {
  // 如果沒有座標資訊，不顯示地圖
  if (!opportunity.location?.coordinates) {
    return (
      <div className="mb-8">
        <h3 className="text-xl font-bold mb-4">位置資訊</h3>
        <div className="bg-gray-50 p-4 rounded-lg">
          <p className="text-gray-500">此機會未提供準確位置資訊</p>
          <p className="mt-2">
            <span className="font-medium">地區：</span>
            {opportunity.location?.city || '未指定'}{opportunity.location?.district ? `, ${opportunity.location.district}` : ''}
          </p>
        </div>
      </div>
    );
  }

  // 提取座標 - 同時支援兩種格式
  let position: [number, number];
  if (opportunity.location.coordinates.coordinates) {
    const coordinates = opportunity.location.coordinates.coordinates;
    position = [coordinates[1], coordinates[0]];
  } else if (opportunity.location.coordinates.lat && opportunity.location.coordinates.lng) {
    position = [opportunity.location.coordinates.lat, opportunity.location.coordinates.lng];
  } else {
    // 如果兩種格式都不存在，顯示默認位置（台北市中心）
    position = [25.0330, 121.5654];
  }

  // 獲取最短停留時間
  const getMinimumStay = () => {
    if (opportunity.hasTimeSlots &&
        opportunity.timeSlots &&
        opportunity.timeSlots.length > 0) {
      // 從時間段中獲取最短停留時間
      const minStay = Math.min(...opportunity.timeSlots.map(slot => slot.minimumStay || 0));
      if (minStay > 0) {
        return `${minStay} 天`;
      }
    }
    return '未指定';
  };

  return (
    <div className="mb-8">
      <h3 className="text-xl font-bold mb-4">位置資訊</h3>
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-2">
          <div className="bg-gray-50 p-3 rounded-lg">
            <p className="text-sm text-gray-600">地址</p>
            <p className="font-medium">{opportunity.location.address || `${opportunity.location.city}${opportunity.location.district ? `, ${opportunity.location.district}` : ''}`}</p>
          </div>

          <div className="bg-gray-50 p-3 rounded-lg">
            <p className="text-sm text-gray-600">最短停留時間</p>
            <p className="font-medium">{getMinimumStay()}</p>
          </div>
        </div>

        <div className="border border-gray-200 rounded-lg overflow-hidden h-64">
          <LocationMapViewer
            position={position}
            address={opportunity.location.address}
            city={opportunity.location.city}
            district={opportunity.location.district}
            height="100%"
          />
        </div>
      </div>
    </div>
  );
};

export default OpportunityMap;