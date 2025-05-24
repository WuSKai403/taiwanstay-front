import Image from 'next/image';
import { OpportunityDetail } from './constants';
import OpportunityTimeSlots from './OpportunityTimeSlots';
import OpportunityMap from './OpportunityMap';

interface OpportunityContentProps {
  opportunity: OpportunityDetail;
}

const OpportunityContent: React.FC<OpportunityContentProps> = ({ opportunity }) => {
  return (
    <div className="lg:col-span-2">
      {/* 封面圖片 */}
      <div className="bg-white shadow-sm rounded-lg overflow-hidden mb-8">
        <div className="relative h-96">
          {opportunity.media?.images && opportunity.media.images[0]?.url ? (
            <Image
              src={opportunity.media.images[0].url}
              alt={opportunity.title}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className="object-cover"
            />
          ) : (
            <div className="flex items-center justify-center h-full bg-gray-100">
              <span className="text-gray-400">無圖片</span>
            </div>
          )}
        </div>

        <div className="p-6">
          {/* 1. 基本資訊 */}
          <div className="prose max-w-none mb-8">
            <h2 className="text-2xl font-bold mb-4">{opportunity.title}</h2>
            {opportunity.description && (
              <div dangerouslySetInnerHTML={{ __html: opportunity.description }} />
            )}
          </div>

          {/* 2. 時段資訊 */}
          <OpportunityTimeSlots opportunity={opportunity} />

          {/* 3. 工作詳情 */}
          <div className="mb-8">
            <h3 className="text-xl font-bold mb-4">工作詳情</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold text-lg mb-2">提供福利</h4>
                <div className="space-y-2">
                  <p className="flex items-center">
                    <span className="text-gray-600 mr-2">住宿：</span>
                    <span>{opportunity.benefits?.accommodation?.provided ? '提供' : '不提供'}</span>
                  </p>
                  <p className="flex items-center">
                    <span className="text-gray-600 mr-2">餐食：</span>
                    <span>{opportunity.benefits?.meals?.provided ? `提供 (${opportunity.benefits.meals.count}餐)` : '不提供'}</span>
                  </p>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold text-lg mb-2">工作任務</h4>
                <div className="space-y-2">
                  {opportunity.workDetails?.tasks?.map((task, index) => (
                    <p key={index} className="flex items-center">
                      <span className="text-gray-800">{task}</span>
                    </p>
                  ))}
                  {(!opportunity.workDetails?.tasks || opportunity.workDetails.tasks.length === 0) && (
                    <p className="text-gray-500">未提供任務資訊</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* 4. 主辦方資訊 */}
          <div className="mb-8">
            <h3 className="text-xl font-bold mb-4">主辦方資訊</h3>
            <div className="flex items-center mb-4">
              <div className="relative w-16 h-16 rounded-full overflow-hidden mr-4">
                {opportunity.host?.profileImage ? (
                  <Image
                    src={opportunity.host.profileImage}
                    alt={opportunity.host.name}
                    fill
                    sizes="(max-width: 768px) 80px, 128px"
                    style={{ objectFit: 'cover' }}
                  />
                ) : (
                  <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                    <span className="text-gray-500 text-xl font-bold">
                      {opportunity.host?.name?.charAt(0) || '?'}
                    </span>
                  </div>
                )}
              </div>
              <div>
                <h4 className="text-lg font-semibold">{opportunity.host?.name}</h4>
                {opportunity.host?.description && (
                  <p className="text-gray-600 mt-1">{opportunity.host.description}</p>
                )}
              </div>
            </div>
          </div>

          {/* 5. 位置資訊 */}
          <OpportunityMap opportunity={opportunity} />
        </div>
      </div>
    </div>
  );
};

export default OpportunityContent;