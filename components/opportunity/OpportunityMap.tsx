import { useMemo } from 'react';
import dynamic from 'next/dynamic';
import { OpportunityDetail } from './constants';

// 動態導入地圖組件，避免 SSR 問題
const MapComponent = dynamic(() => import('@/components/MapComponent'), {
  ssr: false,
  loading: () => <div className="h-96 bg-gray-200 flex items-center justify-center">地圖載入中...</div>
});

interface OpportunityMapProps {
  opportunity: OpportunityDetail;
}

// 將機會詳情轉換為地圖需要的 TransformedOpportunity 格式
const convertToTransformedOpportunity = (opp: OpportunityDetail) => {
  return {
    id: opp.id,
    _id: opp.id,
    title: opp.title,
    slug: opp.slug,
    type: opp.type,
    host: {
      id: opp.host?.id || '',
      name: opp.host?.name || '',
      avatar: null
    },
    location: {
      region: opp.location?.region || '',
      city: opp.location?.city || '',
      address: opp.location?.address || null,
      coordinates: opp.location?.coordinates?.coordinates ? {
        lat: opp.location.coordinates.coordinates[1], // 緯度
        lng: opp.location.coordinates.coordinates[0]  // 經度
      } : null
    },
    media: {
      images: opp.media?.images || []
    },
    workTimeSettings: {
      hoursPerDay: opp.workTimeSettings?.workHoursPerDay || 0,
      daysPerWeek: opp.workTimeSettings?.workDaysPerWeek || 0,
      minimumStay: opp.workTimeSettings?.minimumStay || null,
      availableMonths: null
    },
    createdAt: opp.createdAt || '',
    updatedAt: opp.updatedAt || ''
  };
};

const OpportunityMap: React.FC<OpportunityMapProps> = ({ opportunity }) => {
  // 計算地圖位置
  const mapPosition = useMemo(() => {
    if (opportunity.location?.coordinates?.coordinates) {
      const [lng, lat] = opportunity.location.coordinates.coordinates;
      return [lat, lng] as [number, number];
    }
    return undefined;
  }, [opportunity.location]);

  if (!opportunity.location?.coordinates?.coordinates) {
    return null;
  }

  return (
    <div className="mt-6">
      <h3 className="text-lg font-semibold mb-4">位置</h3>
      <div className="h-96 relative rounded-lg overflow-hidden">
        <MapComponent
          position={mapPosition}
          zoom={15}
          showZoomControl
          showFullscreenControl
          showLocationControl
          opportunities={[convertToTransformedOpportunity(opportunity)]}
          isLoading={false}
        />
      </div>
    </div>
  );
};

export default OpportunityMap;