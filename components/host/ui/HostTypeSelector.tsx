import React from 'react';
import { HostType } from '@/types/host';

// 類型圖標映射
const TYPE_ICONS: Record<HostType, string> = {
  [HostType.FARM]: '🌾',
  [HostType.HOSTEL]: '🏨',
  [HostType.HOMESTAY]: '🏡',
  [HostType.ECO_VILLAGE]: '🌱',
  [HostType.RETREAT_CENTER]: '🧘',
  [HostType.COMMUNITY]: '👪',
  [HostType.NGO]: '🌍',
  [HostType.SCHOOL]: '🏫',
  [HostType.CAFE]: '☕',
  [HostType.RESTAURANT]: '🍽️',
  [HostType.ART_CENTER]: '🎨',
  [HostType.ANIMAL_SHELTER]: '🐾',
  [HostType.OUTDOOR_ACTIVITY]: '🏕️',
  [HostType.OTHER]: '📦',
  [HostType.COWORKING_SPACE]: '💼',
  [HostType.CULTURAL_VENUE]: '🏛️',
  [HostType.COMMUNITY_CENTER]: '🏘️'
};

// 類型名稱映射
const TYPE_NAMES: Record<HostType, string> = {
  [HostType.FARM]: '農場',
  [HostType.HOSTEL]: '青年旅館',
  [HostType.HOMESTAY]: '民宿',
  [HostType.ECO_VILLAGE]: '生態村',
  [HostType.RETREAT_CENTER]: '靜修中心',
  [HostType.COMMUNITY]: '社區',
  [HostType.NGO]: '非政府組織',
  [HostType.SCHOOL]: '學校',
  [HostType.CAFE]: '咖啡廳',
  [HostType.RESTAURANT]: '餐廳',
  [HostType.ART_CENTER]: '藝術中心',
  [HostType.ANIMAL_SHELTER]: '動物收容所',
  [HostType.OUTDOOR_ACTIVITY]: '戶外活動',
  [HostType.OTHER]: '其他',
  [HostType.COWORKING_SPACE]: '共享工作空間',
  [HostType.CULTURAL_VENUE]: '文化場所',
  [HostType.COMMUNITY_CENTER]: '社區中心'
};

// 類型描述映射
const TYPE_DESCRIPTIONS: Record<HostType, string> = {
  [HostType.FARM]: '有機農場、果園、茶園等農業相關場所',
  [HostType.HOSTEL]: '提供短期住宿的青年旅館或背包客棧',
  [HostType.HOMESTAY]: '提供家庭式住宿體驗的民宿',
  [HostType.ECO_VILLAGE]: '實踐永續生活的生態社區或村落',
  [HostType.RETREAT_CENTER]: '提供靜修、瑜伽或冥想體驗的場所',
  [HostType.COMMUNITY]: '社區組織、社區發展協會等社區型態',
  [HostType.NGO]: '環保組織、社會企業等非營利機構',
  [HostType.SCHOOL]: '學校、實驗教育機構、教育中心等',
  [HostType.CAFE]: '咖啡廳、複合式空間、共享工作空間',
  [HostType.RESTAURANT]: '餐廳、小吃店、食品製作場所',
  [HostType.ART_CENTER]: '藝術中心、工作室、藝術村等創意場所',
  [HostType.ANIMAL_SHELTER]: '動物收容所、動物保護相關場所',
  [HostType.OUTDOOR_ACTIVITY]: '提供戶外活動、生態導覽的場所',
  [HostType.OTHER]: '不屬於上述類型的其他場所',
  [HostType.COWORKING_SPACE]: '共享工作空間、創客空間、協作空間',
  [HostType.CULTURAL_VENUE]: '文化展演空間、劇場、博物館',
  [HostType.COMMUNITY_CENTER]: '社區活動中心、社區共享空間'
};

interface HostTypeSelectorProps {
  selectedType: HostType | undefined;
  onChange: (type: HostType) => void;
}

const HostTypeSelector: React.FC<HostTypeSelectorProps> = ({ selectedType, onChange }) => {
  // 主要類型順序
  const mainTypes = [
    HostType.FARM,
    HostType.HOMESTAY,
    HostType.HOSTEL,
    HostType.COWORKING_SPACE,
    HostType.CULTURAL_VENUE,
    HostType.COMMUNITY_CENTER,
    HostType.COMMUNITY,
    HostType.ECO_VILLAGE
  ];

  // 次要類型順序
  const secondaryTypes = [
    HostType.NGO,
    HostType.SCHOOL,
    HostType.CAFE,
    HostType.RESTAURANT,
    HostType.ART_CENTER,
    HostType.ANIMAL_SHELTER,
    HostType.OUTDOOR_ACTIVITY,
    HostType.RETREAT_CENTER,
    HostType.OTHER
  ];

  return (
    <div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-2">
        {mainTypes.map((type) => (
          <div
            key={type}
            onClick={() => onChange(type)}
            className={`cursor-pointer rounded-lg border p-3 transition-colors ${
              selectedType === type
                ? 'border-primary-500 bg-primary-50'
                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center">
              <div className="mr-3 text-2xl">{TYPE_ICONS[type]}</div>
              <div>
                <h4 className="font-medium text-gray-900">{TYPE_NAMES[type]}</h4>
                <p className="text-xs text-gray-500 line-clamp-2">
                  {TYPE_DESCRIPTIONS[type]}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6">
        <h4 className="text-sm font-medium text-gray-500 mb-3">其他類型</h4>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {secondaryTypes.map((type) => (
            <div
              key={type}
              onClick={() => onChange(type)}
              className={`cursor-pointer rounded-lg border p-3 transition-colors ${
                selectedType === type
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center">
                <div className="mr-3 text-2xl">{TYPE_ICONS[type]}</div>
                <div>
                  <h4 className="font-medium text-gray-900">{TYPE_NAMES[type]}</h4>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default HostTypeSelector;