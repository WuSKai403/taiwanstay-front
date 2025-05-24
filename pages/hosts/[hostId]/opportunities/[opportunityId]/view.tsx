import { useRouter } from 'next/router';
import { GetServerSideProps } from 'next';
import { getSession } from 'next-auth/react';
import { useQuery } from '@tanstack/react-query';
import Image from 'next/image';
import Link from 'next/link';
import { format } from 'date-fns';
import { zhTW } from 'date-fns/locale';
import dynamic from 'next/dynamic';
import { useMemo } from 'react';

import HostLayout from '@/components/layout/HostLayout';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { checkHostAccess } from '@/lib/middleware/authMiddleware';
import { OpportunityStatus } from '@/models/enums';
import { statusColorMap, statusLabelMap, TimeSlot } from '@/components/opportunity/constants';
import { CalendarIcon, MapPinIcon } from '@heroicons/react/24/outline';
import { getLatestStatusReason, hasStatusReason } from '@/utils/opportunityUtils';
import StatusReasonBadge from '@/components/opportunity/StatusReasonBadge';
import OpportunityRequirements from '@/components/opportunity/OpportunityRequirements';
import OpportunityMedia from '@/components/opportunity/OpportunityMedia';

// 動態導入地圖組件，避免 SSR 問題
const MapComponent = dynamic(() => import('@/components/MapComponent'), {
  ssr: false,
  loading: () => <div className="h-64 bg-gray-100 flex items-center justify-center">地圖載入中...</div>
});

// 獲取機會詳情
async function fetchOpportunity(opportunityId: string) {
  const response = await fetch(`/api/opportunities/${opportunityId}`);
  if (!response.ok) {
    throw new Error('獲取機會詳情失敗');
  }
  return response.json();
}

const OpportunityViewPage = ({ hostId, opportunityId }: { hostId: string, opportunityId: string }) => {
  const router = useRouter();

  // 獲取機會詳情
  const { data, isLoading, error } = useQuery({
    queryKey: ['opportunity-view', opportunityId],
    queryFn: () => fetchOpportunity(opportunityId),
    refetchOnWindowFocus: false,
  });

  const opportunity = data?.opportunity;

  // 返回列表
  const handleBackToList = () => {
    router.push(`/hosts/${hostId}/opportunities`);
  };

  // 編輯機會
  const handleEdit = () => {
    router.push(`/hosts/${hostId}/opportunities/${opportunityId}`);
  };

  // 查看申請
  const handleViewApplications = () => {
    router.push(`/hosts/${hostId}/applications?opportunityId=${opportunityId}`);
  };

  // 格式化日期
  const formatDate = (dateString?: string) => {
    if (!dateString) return '未知';
    const date = new Date(dateString);
    return format(date, 'yyyy年MM月dd日 HH:mm', { locale: zhTW });
  };

  // 修改地圖相關部分
  const mapPosition = useMemo(() => {
    if (opportunity?.location?.coordinates) {
      // 處理兩種可能的座標格式
      if (opportunity.location.coordinates.coordinates) {
        const [lng, lat] = opportunity.location.coordinates.coordinates;
        return [lat, lng] as [number, number];
      } else if (opportunity.location.coordinates.lat && opportunity.location.coordinates.lng) {
        return [opportunity.location.coordinates.lat, opportunity.location.coordinates.lng] as [number, number];
      }
    }
    return undefined;
  }, [opportunity?.location]);

  // 將機會詳情轉換為地圖需要的 TransformedOpportunity 格式
  const transformedOpportunity = useMemo(() => {
    if (!opportunity) return null;

    return {
      id: opportunity.id,
      _id: opportunity.id,
      title: opportunity.title,
      slug: opportunity.slug,
      type: opportunity.type,
      host: {
        id: opportunity.host?.id || '',
        name: opportunity.host?.name || '',
        avatar: null
      },
      location: {
        region: opportunity.location?.region || '',
        city: opportunity.location?.city || '',
        address: opportunity.location?.address || null,
        coordinates: opportunity.location?.coordinates ? {
          type: "Point" as const,
          coordinates: opportunity.location.coordinates.coordinates ?
            opportunity.location.coordinates.coordinates :
            [opportunity.location.coordinates.lng, opportunity.location.coordinates.lat]
        } : null
      },
      media: {
        images: opportunity.media?.images || [],
        videoUrl: opportunity.media?.videoUrl,
        videoDescription: opportunity.media?.videoDescription,
        virtualTour: opportunity.media?.virtualTour
      },
      hasTimeSlots: opportunity.hasTimeSlots || false,
      timeSlots: opportunity.timeSlots || [],
      createdAt: opportunity.createdAt || '',
      updatedAt: opportunity.updatedAt || ''
    };
  }, [opportunity]);

  // 加載中狀態
  if (isLoading) {
    return (
      <HostLayout>
        <div className="flex justify-center items-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      </HostLayout>
    );
  }

  // 錯誤狀態
  if (error || !opportunity) {
    return (
      <HostLayout>
        <div className="p-6">
          <div className="bg-red-50 text-red-600 p-4 rounded-md">
            獲取機會詳情失敗，請刷新頁面重試
          </div>
          <button
            onClick={handleBackToList}
            className="mt-4 bg-gray-100 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-200 transition-colors"
          >
            返回
          </button>
        </div>
      </HostLayout>
    );
  }

  return (
    <HostLayout>
      <div className="p-4 md:p-6">
        {/* 頂部操作欄 */}
        <div className="flex flex-wrap justify-between items-center mb-6">
          <div className="flex items-center space-x-2">
            <button
              onClick={handleBackToList}
              className="px-3 py-1.5 bg-gray-100 text-gray-800 rounded-md hover:bg-gray-200 transition-colors"
            >
              返回列表
            </button>
            <h1 className="text-2xl font-bold">{opportunity.title}</h1>
            <span
              className={`px-2 py-1 rounded-full text-xs font-medium ${
                statusColorMap[opportunity.status as OpportunityStatus]
              }`}
            >
              {statusLabelMap[opportunity.status as OpportunityStatus]}
            </span>
          </div>

          <div className="flex space-x-2 mt-2 md:mt-0">
            {opportunity.status === OpportunityStatus.DRAFT || opportunity.status === OpportunityStatus.REJECTED ? (
              <button
                onClick={handleEdit}
                className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark transition-colors"
              >
                編輯機會
              </button>
            ) : null}

            <button
              onClick={handleViewApplications}
              className="px-4 py-2 bg-blue-100 text-blue-800 rounded-md hover:bg-blue-200 transition-colors"
            >
              查看申請 ({opportunity.stats?.applications || 0})
            </button>
          </div>
        </div>

        {/* 如果是被拒絕的機會，顯示拒絕原因 */}
        {opportunity.status === OpportunityStatus.REJECTED && (
          <div className="mb-6">
            <StatusReasonBadge
              opportunity={opportunity}
              showLabel={true}
              className="mt-2"
            />
          </div>
        )}

        {/* 主要內容 */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200">
          {/* 封面圖片 */}
          {opportunity.media?.coverImage && (
            <div className="relative w-full h-64 md:h-80">
              <Image
                src={opportunity.media.coverImage}
                alt={opportunity.title}
                layout="fill"
                objectFit="cover"
              />
            </div>
          )}

          {/* 基本信息 */}
          <div className="p-6">
            <div className="mb-6">
              <div className="border-b border-gray-200 pb-4 mb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      statusColorMap[opportunity.status as OpportunityStatus]
                    }`}>
                      {statusLabelMap[opportunity.status as OpportunityStatus]}
                    </span>
                    <div className="text-gray-500 text-sm flex items-center">
                      <CalendarIcon className="w-4 h-4 mr-1" />
                      <span>發布於 {formatDate(opportunity.createdAt)}</span>
                    </div>
                  </div>
                </div>
                <h1 className="text-2xl font-bold mt-2">{opportunity.title}</h1>
                <div className="flex items-center mt-2 text-gray-600">
                  <MapPinIcon className="w-4 h-4 mr-1" />
                  <span>{`${opportunity.location?.city || ''}${opportunity.location?.district ? `, ${opportunity.location.district}` : ''}`}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-gray-600">
                    <span className="font-medium">機會類型：</span> {opportunity.type}
                  </p>
                  <p className="text-gray-600">
                    <span className="font-medium">地點：</span> {opportunity.location?.city} {opportunity.location?.district}
                  </p>
                  <p className="text-gray-600">
                    <span className="font-medium">創建時間：</span> {formatDate(opportunity.createdAt)}
                  </p>
                  {opportunity.publishedAt && (
                    <p className="text-gray-600">
                      <span className="font-medium">發布時間：</span> {formatDate(opportunity.publishedAt)}
                    </p>
                  )}
                </div>
                <div>
                  <p className="text-gray-600">
                    <span className="font-medium">瀏覽次數：</span> {opportunity.stats?.views || 0}
                  </p>
                  <p className="text-gray-600">
                    <span className="font-medium">申請人數：</span> {opportunity.stats?.applications || 0}
                  </p>
                  <p className="text-gray-600">
                    <span className="font-medium">收藏次數：</span> {opportunity.stats?.bookmarks || 0}
                  </p>
                </div>
              </div>
            </div>

            {/* 簡短描述 */}
            <div className="mb-6">
              <h2 className="text-xl font-bold mb-2">簡短描述</h2>
              <p className="text-gray-700">{opportunity.shortDescription}</p>
            </div>

            {/* 詳細描述 */}
            <div className="mb-6">
              <h2 className="text-xl font-bold mb-2">詳細描述</h2>
              <div className="prose max-w-none">
                <p className="whitespace-pre-line text-gray-700">{opportunity.description}</p>
              </div>
            </div>

            {/* 媒體內容 */}
            <div className="mb-6">
              <OpportunityMedia opportunity={opportunity} isPreview={false} />
            </div>

            {/* 工作詳情 */}
            {opportunity.workDetails && (
              <div className="mb-6">
                <h2 className="text-xl font-bold mb-2">工作詳情</h2>
                {opportunity.workDetails.tasks && opportunity.workDetails.tasks.length > 0 && (
                  <div className="mb-4">
                    <h3 className="font-medium text-gray-800 mb-1">工作任務</h3>
                    <ul className="list-disc pl-5 space-y-1">
                      {opportunity.workDetails.tasks.map((task: string, index: number) => (
                        <li key={index} className="text-gray-700">{task}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {opportunity.workDetails.skills && opportunity.workDetails.skills.length > 0 && (
                  <div className="mb-4">
                    <h3 className="font-medium text-gray-800 mb-1">所需技能</h3>
                    <ul className="list-disc pl-5 space-y-1">
                      {opportunity.workDetails.skills.map((skill: string, index: number) => (
                        <li key={index} className="text-gray-700">{skill}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {opportunity.workDetails.learningOpportunities && opportunity.workDetails.learningOpportunities.length > 0 && (
                  <div className="mb-4">
                    <h3 className="font-medium text-gray-800 mb-1">學習機會</h3>
                    <ul className="list-disc pl-5 space-y-1">
                      {opportunity.workDetails.learningOpportunities.map((item: string, index: number) => (
                        <li key={index} className="text-gray-700">{item}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {opportunity.workDetails.physicalDemand && (
                  <div className="mb-4">
                    <h3 className="font-medium text-gray-800 mb-1">體力需求</h3>
                    <p className="text-gray-700">
                      {opportunity.workDetails.physicalDemand === 'low' && '輕度體力活動'}
                      {opportunity.workDetails.physicalDemand === 'medium' && '中度體力活動'}
                      {opportunity.workDetails.physicalDemand === 'high' && '高度體力活動'}
                    </p>
                  </div>
                )}

                {opportunity.workDetails.languages && opportunity.workDetails.languages.length > 0 && (
                  <div className="mb-4">
                    <h3 className="font-medium text-gray-800 mb-1">語言要求</h3>
                    <ul className="list-disc pl-5 space-y-1">
                      {opportunity.workDetails.languages.map((language: string, index: number) => (
                        <li key={index} className="text-gray-700">{language}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* 福利信息 */}
            {opportunity.benefits && (
              <div className="mb-6">
                <h2 className="text-xl font-bold mb-2">提供福利</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* 住宿 */}
                  {opportunity.benefits.accommodation && (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="font-medium text-gray-800 mb-1">住宿</h3>
                      <p className="text-gray-700">
                        {opportunity.benefits.accommodation.provided ? '提供住宿' : '不提供住宿'}
                      </p>
                      {opportunity.benefits.accommodation.provided && opportunity.benefits.accommodation.type && (
                        <p className="text-gray-700">
                          類型：
                          {opportunity.benefits.accommodation.type === 'private_room' && '私人房間'}
                          {opportunity.benefits.accommodation.type === 'shared_room' && '共享房間'}
                          {opportunity.benefits.accommodation.type === 'dormitory' && '宿舍'}
                          {opportunity.benefits.accommodation.type === 'camping' && '露營'}
                          {opportunity.benefits.accommodation.type === 'other' && '其他'}
                        </p>
                      )}
                      {opportunity.benefits.accommodation.description && (
                        <p className="text-gray-700 mt-1">{opportunity.benefits.accommodation.description}</p>
                      )}
                    </div>
                  )}

                  {/* 餐食 */}
                  {opportunity.benefits.meals && (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="font-medium text-gray-800 mb-1">餐食</h3>
                      <p className="text-gray-700">
                        {opportunity.benefits.meals.provided ? '提供餐食' : '不提供餐食'}
                      </p>
                      {opportunity.benefits.meals.provided && opportunity.benefits.meals.count && (
                        <p className="text-gray-700">
                          每日餐數：{opportunity.benefits.meals.count}
                        </p>
                      )}
                      {opportunity.benefits.meals.description && (
                        <p className="text-gray-700 mt-1">{opportunity.benefits.meals.description}</p>
                      )}
                    </div>
                  )}

                  {/* 津貼 */}
                  {opportunity.benefits.stipend && opportunity.benefits.stipend.provided && (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="font-medium text-gray-800 mb-1">津貼</h3>
                      <p className="text-gray-700">
                        {opportunity.benefits.stipend.amount && opportunity.benefits.stipend.currency ?
                          `${opportunity.benefits.stipend.amount} ${opportunity.benefits.stipend.currency}` :
                          '提供津貼'}
                        {opportunity.benefits.stipend.frequency && (
                          opportunity.benefits.stipend.frequency === 'daily' ? '／天' :
                          opportunity.benefits.stipend.frequency === 'weekly' ? '／週' :
                          opportunity.benefits.stipend.frequency === 'monthly' ? '／月' : ''
                        )}
                      </p>
                    </div>
                  )}

                  {/* 其他福利 */}
                  {opportunity.benefits.otherBenefits && opportunity.benefits.otherBenefits.length > 0 && (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="font-medium text-gray-800 mb-1">其他福利</h3>
                      <ul className="list-disc pl-5 space-y-1">
                        {opportunity.benefits.otherBenefits.map((benefit: string, index: number) => (
                          <li key={index} className="text-gray-700">{benefit}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 要求與限制 */}
            {opportunity.requirements && (
              <OpportunityRequirements opportunity={opportunity} />
            )}

            {/* 地點地圖 */}
            {mapPosition && (
              <div className="mb-6">
                <h2 className="text-xl font-bold mb-2">位置</h2>
                <div className="h-64 rounded-lg overflow-hidden">
                  <MapComponent
                    position={mapPosition}
                    opportunities={transformedOpportunity ? [transformedOpportunity] as any : []}
                    zoom={14}
                    readOnly={true}
                  />
                </div>
                <p className="mt-2 text-sm text-gray-500">
                  {opportunity.location?.address ||
                   `${opportunity.location?.city || ''} ${opportunity.location?.district || ''}`}
                </p>
              </div>
            )}

            {/* 時間段 */}
            {opportunity.timeSlots && opportunity.timeSlots.length > 0 && (
              <div className="mb-6">
                <h2 className="text-xl font-bold mb-2" id="available-timeslots">可申請時間段</h2>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">開始日期</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">結束日期</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">可用名額</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">最短停留</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">每週工作天數</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">每日工作時數</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">狀態</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {opportunity.timeSlots.map((slot: TimeSlot, index: number) => (
                        <tr key={index}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{slot.startDate}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{slot.endDate}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{slot.defaultCapacity - (slot.confirmedCount || 0)}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{slot.minimumStay} 天</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{slot.workDaysPerWeek} 天</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{slot.workHoursPerDay} 小時</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{slot.status}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </HostLayout>
  );
};

// 服務端權限檢查
export const getServerSideProps: GetServerSideProps = async (context) => {
  const { hostId, opportunityId } = context.params as { hostId: string; opportunityId: string };
  const session = await getSession(context);

  // 檢查訪問權限
  if (!session?.user) {
    return { redirect: { destination: '/auth/signin', permanent: false } };
  }

  // 確保用戶ID存在
  const userId = session.user.id;
  if (!userId) {
    return { redirect: { destination: '/auth/signin', permanent: false } };
  }

  // 使用服務端函數檢查是否有此主人的訪問權限
  const hasAccess = await checkHostAccess(userId, hostId);

  if (!hasAccess) {
    return { notFound: true };
  }

  return { props: { hostId, opportunityId } };
};

export default OpportunityViewPage;