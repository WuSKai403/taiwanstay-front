import React, { memo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { TransformedOpportunity } from '@/lib/transforms/opportunity';
import { OpportunityType } from '@/models/enums/OpportunityType';

// 機會類型標籤顏色映射
const typeColorMap: Record<string, string> = {
  'FARMING': 'bg-green-100 text-green-800',
  'GARDENING': 'bg-emerald-100 text-emerald-800',
  'ANIMAL_CARE': 'bg-blue-100 text-blue-800',
  'CONSTRUCTION': 'bg-orange-100 text-orange-800',
  'HOSPITALITY': 'bg-purple-100 text-purple-800',
  'COOKING': 'bg-red-100 text-red-800',
  'CLEANING': 'bg-gray-100 text-gray-800',
  'CHILDCARE': 'bg-pink-100 text-pink-800',
  'ELDERLY_CARE': 'bg-indigo-100 text-indigo-800',
  'TEACHING': 'bg-yellow-100 text-yellow-800',
  'LANGUAGE_EXCHANGE': 'bg-cyan-100 text-cyan-800',
  'CREATIVE': 'bg-fuchsia-100 text-fuchsia-800',
  'DIGITAL_NOMAD': 'bg-violet-100 text-violet-800',
  'ADMINISTRATION': 'bg-slate-100 text-slate-800',
  'MAINTENANCE': 'bg-zinc-100 text-zinc-800',
  'TOURISM': 'bg-rose-100 text-rose-800',
  'CONSERVATION': 'bg-teal-100 text-teal-800',
  'COMMUNITY': 'bg-amber-100 text-amber-800',
  'EVENT': 'bg-sky-100 text-sky-800',
  'OTHER': 'bg-neutral-100 text-neutral-800',
  'unknown': 'bg-gray-100 text-gray-800'
};

// 機會類型中文名稱映射
const typeNameMap = {
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
  'OTHER': '其他機會'
};

interface OpportunityCardProps {
  opportunity: TransformedOpportunity;
}

// 使用 React.memo 優化渲染
const OpportunityCard = memo(({ opportunity }: OpportunityCardProps) => {
  const defaultImage = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgZmlsbD0iI2YzZjRmNiIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMjAiIGZpbGw9IiM5Y2EzYWYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj7nhKHlm77niYc8L3RleHQ+PC9zdmc+';

  return (
    <Link
      href={`/opportunities/${opportunity.slug}`}
      className="block bg-white rounded-lg shadow hover:shadow-md transition-shadow duration-300"
    >
      <div className="relative h-48">
        <Image
          src={opportunity.media?.images?.[0]?.url || defaultImage}
          alt={opportunity.title}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className="object-cover rounded-t-lg"
          priority={false}
          loading="lazy"
        />
        <div className="absolute top-2 right-2">
          <span
            className={`px-2 py-1 rounded-full text-sm ${
              typeColorMap[opportunity.type] || 'bg-gray-100 text-gray-800'
            }`}
          >
            {typeNameMap[opportunity.type as keyof typeof typeNameMap] || '其他機會'}
          </span>
        </div>
      </div>
      <div className="p-4">
        <h3 className="text-lg font-semibold mb-2 line-clamp-2">{opportunity.title}</h3>
        <div className="flex items-center text-sm text-gray-500">
          <span>{opportunity.location?.city || '地點未指定'}</span>
          <span className="mx-2">•</span>
          <span>
            {opportunity.workTimeSettings?.minimumStay
              ? `最少 ${opportunity.workTimeSettings.minimumStay} 天`
              : '彈性時間'}
          </span>
        </div>
      </div>
    </Link>
  );
});

OpportunityCard.displayName = 'OpportunityCard';

export default OpportunityCard;