import { useState, useMemo } from 'react';
import { useRouter } from 'next/router';
import { GetServerSideProps } from 'next';
import { getSession } from 'next-auth/react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import AdminLayout from '@/components/layout/AdminLayout';
import { OpportunityStatus, OpportunityType } from '@/models/enums';
import { UserRole } from '@/models/enums/UserRole';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import Image from 'next/image';
import Link from 'next/link';
import { statusColorMap, statusLabelMap, typeNameMap, OpportunityDetail } from '@/components/opportunity/constants';
import { CalendarIcon, MapPinIcon } from '@heroicons/react/24/outline';
import dynamic from 'next/dynamic';
import OpportunityDetailedInfo from '@/components/opportunity/OpportunityDetailedInfo';
import OpportunityWorkDetails from '@/components/opportunity/OpportunityWorkDetails';
import OpportunityRequirements from '@/components/opportunity/OpportunityRequirements';
import OpportunityBenefits from '@/components/opportunity/OpportunityBenefits';
import OpportunityImpact from '@/components/opportunity/OpportunityImpact';
import CloudinaryImage from '@/components/CloudinaryImage';
import { CloudinaryImageResource, createImageResourceFromUrl } from '@/lib/cloudinary/types';
import { getLatestStatusReason, hasStatusReason } from '@/utils/opportunityUtils';
import StatusReasonBadge from '@/components/opportunity/StatusReasonBadge';

// 動態導入地圖組件，避免 SSR 問題
const MapComponent = dynamic(() => import('@/components/MapComponent'), {
  ssr: false,
  loading: () => <div className="h-64 bg-gray-100 flex items-center justify-center">地圖載入中...</div>
});

// 從API接收到的機會詳情類型 (與 OpportunityDetail 接口不同)
interface APIOpportunityDetail {
  _id: string;
  title: string;
  slug: string;
  publicId?: string;
  status: OpportunityStatus;
  description: string;
  shortDescription: string;
  createdAt: string;
  updatedAt?: string;
  publishedAt?: string;
  location?: {
    city?: string;
    country?: string;
    address?: string;
    district?: string;
    region?: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
  workDetails?: {
    type?: string;
    duties?: string[];
    requirements?: string[];
    benefits?: string[];
    accommodation?: {
      provided: boolean;
      details?: string;
    };
    hours?: {
      perDay?: number;
      perWeek?: number;
      schedule?: string;
    };
    tasks?: string[];
    skills?: string[];
    learningOpportunities?: string[];
    physicalDemand?: 'low' | 'medium' | 'high';
    languages?: string[];
  };
  benefits?: {
    accommodation: {
      provided: boolean;
      type?: 'private_room' | 'shared_room' | 'dormitory' | 'camping' | 'other';
      description?: string;
    };
    meals: {
      provided: boolean;
      count?: number;
      description?: string;
    };
    stipend?: {
      provided: boolean;
      amount?: number;
      currency?: string;
      frequency?: string;
    };
    otherBenefits?: string[];
  };
  requirements?: {
    minAge?: number;
    acceptsCouples?: boolean;
    acceptsFamilies?: boolean;
    acceptsPets?: boolean;
    drivingLicense?: {
      carRequired: boolean;
      motorcycleRequired: boolean;
      otherRequired: boolean;
      otherDescription?: string;
    };
    otherRequirements?: string[];
  };
  impact?: {
    environmentalContribution?: string;
    socialContribution?: string;
    culturalExchange?: string;
    sustainableDevelopmentGoals?: string[];
  };
  hostId?: {
    _id: string;
    name: string;
    description?: string;
    contactEmail?: string;
    contactPhone?: string;
  };
  media?: {
    coverImage?: string;
    images?: string[];
  };
  stats?: {
    applications?: number;
    views?: number;
    bookmarks?: number;
  };
  statusHistory?: Array<{
    status: OpportunityStatus;
    reason?: string;
    changedBy?: string;
    changedAt: string;
  }>;
  type?: OpportunityType;
  timeSlots?: Array<{
    id: string;
    startDate: string;
    endDate: string;
    defaultCapacity: number;
    minimumStay: number;
    confirmedCount: number;
    appliedCount: number;
    status: string;
  }>;
  hasTimeSlots?: boolean;
}

// 獲取機會詳情
async function fetchOpportunityDetail(id: string) {
  try {
    // 檢查 ID 是否是有效的 MongoDB ObjectId (24位十六進制字符串)
    const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(id);

    if (!isValidObjectId) {
      console.error(`ID 格式錯誤: "${id}" 不是有效的 MongoDB ObjectId`);
      throw new Error(`ID 格式錯誤: "${id}" 不是有效的 MongoDB ObjectId，請使用24位十六進制字符串ID`);
    }

  // 使用管理員專用的API來獲取機會詳情
  const response = await fetch(`/api/admin/opportunities/${id}`);
  if (!response.ok) {
      console.error(`API 回應錯誤: ${response.status} ${response.statusText}`);
      throw new Error(`獲取機會詳情失敗: ${response.status}`);
  }

  const data = await response.json();
    console.log('API 數據:', data);

  // 檢查 API 回傳格式並提取 opportunity 數據
  if (data.success && data.opportunity) {
      return data.opportunity as APIOpportunityDetail;
  } else {
    console.error('API回傳格式不正確:', data);
      throw new Error(data.message || '獲取機會詳情失敗: 資料格式錯誤');
    }
  } catch (error) {
    console.error('獲取機會詳情出錯:', error);
    throw error;
  }
}

// 更新機會狀態
async function updateOpportunityStatus(id: string, status: OpportunityStatus, reason?: string) {
  const body: { status: OpportunityStatus; reason?: string } = { status };

  if (reason) {
    body.reason = reason;
  }

  const response = await fetch(`/api/opportunities/${id}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error('更新機會狀態失敗');
  }

  return response.json();
}

// 將 API 回傳的詳情轉換為標準 OpportunityDetail 格式
function convertToOpportunityDetail(apiData: APIOpportunityDetail): OpportunityDetail {
  // 處理API坐標數據
  let locationCoordinates;

  if (apiData.location?.coordinates) {
    // 使用類型斷言處理坐標格式
    const apiCoordinates = apiData.location.coordinates as any;
    locationCoordinates = {
      type: 'Point',
      coordinates: [
        apiCoordinates.lng || 0,
        apiCoordinates.lat || 0
      ] as [number, number]
    };
  }

  const images = apiData.media?.images || [];

  return {
    id: apiData._id,
    publicId: apiData.publicId || apiData._id.substring(0, 8),
    title: apiData.title,
    slug: apiData.slug,
    shortDescription: apiData.shortDescription,
    description: apiData.description,
    type: apiData.type || OpportunityType.OTHER,
    status: apiData.status,
    location: {
      address: apiData.location?.address,
      city: apiData.location?.city,
      district: apiData.location?.district,
      region: apiData.location?.region || apiData.location?.country,
      country: apiData.location?.country,
      coordinates: locationCoordinates
    },
    workDetails: {
      tasks: apiData.workDetails?.tasks ||
        (apiData.workDetails?.duties as string[] || []),
      skills: apiData.workDetails?.skills || [],
      learningOpportunities: apiData.workDetails?.learningOpportunities || [],
      physicalDemand: apiData.workDetails?.physicalDemand || 'medium',
      languages: apiData.workDetails?.languages || [],
    },
    benefits: apiData.benefits || {
      accommodation: {
        provided: apiData.workDetails?.accommodation?.provided || false,
        type: 'other',
        description: apiData.workDetails?.accommodation?.details,
      },
      meals: {
        provided: false,
      },
    },
    requirements: apiData.requirements || {
      acceptsCouples: false,
      acceptsFamilies: false,
      acceptsPets: false,
    },
    impact: apiData.impact,
    media: {
      coverImage: apiData.media?.coverImage,
      images: images,
    },
    host: {
      id: apiData.hostId?._id || '',
      name: apiData.hostId?.name || '',
      description: apiData.hostId?.description,
      contactPhone: apiData.hostId?.contactPhone,
      contactEmail: apiData.hostId?.contactEmail,
      profileImage: undefined,
      responseRate: undefined,
      responseTime: undefined,
      verificationStatus: undefined,
      memberSince: undefined,
      socialMedia: undefined,
    },
    stats: {
      applications: apiData.stats?.applications || 0,
      bookmarks: apiData.stats?.bookmarks || 0,
      views: apiData.stats?.views || 0,
    },
    hasTimeSlots: apiData.hasTimeSlots || false,
    timeSlots: apiData.timeSlots || [],
    createdAt: apiData.createdAt,
    updatedAt: apiData.updatedAt,
    publishedAt: apiData.publishedAt,
    statusHistory: apiData.statusHistory || [],
  };
}

const OpportunityDetailPage = () => {
  const router = useRouter();
  const { id } = router.query;
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectionDialog, setShowRejectionDialog] = useState(false);
  const queryClient = useQueryClient();

  // 使用 React Query 獲取機會詳情
  const { data: apiOpportunity, isLoading, error } = useQuery({
    queryKey: ['opportunity-detail', id],
    queryFn: () => fetchOpportunityDetail(id as string),
    enabled: !!id,
  });

  // 將 API 數據轉換為標準格式
  const opportunity = useMemo(() => {
    if (!apiOpportunity) return null;
    return convertToOpportunityDetail(apiOpportunity);
  }, [apiOpportunity]);

  // 狀態更新 mutation
  const updateStatusMutation = useMutation({
    mutationFn: ({ status, reason }: { status: OpportunityStatus; reason?: string }) =>
      updateOpportunityStatus(id as string, status, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['opportunity-detail', id] });
      setShowRejectionDialog(false);
      setRejectionReason('');
    },
  });

  // 處理狀態更新
  const handleStatusUpdate = (status: OpportunityStatus) => {
    if (status === OpportunityStatus.REJECTED) {
      setShowRejectionDialog(true);
    } else {
      updateStatusMutation.mutate({ status });
    }
  };

  // 提交拒絕原因
  const handleSubmitRejection = () => {
    if (!rejectionReason.trim()) {
      alert('請提供拒絕原因');
      return;
    }

    updateStatusMutation.mutate({
      status: OpportunityStatus.REJECTED,
      reason: rejectionReason
    });
  };

  // 返回列表
  const handleBackToList = () => {
    router.push('/admin/opportunities');
  };

  // 查看申請
  const handleViewApplications = () => {
    router.push(`/admin/applications?opportunityId=${id}`);
  };

  // 格式化日期
  const formatDate = (dateString?: string) => {
    if (!dateString) return '未知';
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-TW', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // 地圖相關處理
  const mapPosition = useMemo(() => {
    if (opportunity?.location?.coordinates?.coordinates) {
      // coordinates 是 [lng, lat] 形式，需要轉換為 [lat, lng]
      return [
        opportunity.location.coordinates.coordinates[1],
        opportunity.location.coordinates.coordinates[0]
      ] as [number, number];
    }
    return undefined;
  }, [opportunity?.location]);

  // 轉換為地圖所需格式
  const transformedOpportunity = useMemo(() => {
    if (!opportunity) return null;

    // 使用類型斷言確保我們能夠正確處理類型，避免TypeScript錯誤
    // 這是安全的，因為我們已在 convertToOpportunityDetail 中確保了數據格式
    const mapData = {
      id: opportunity.id,
      _id: opportunity.id,
      title: opportunity.title,
      slug: opportunity.slug,
      type: opportunity.type,
      host: {
        id: opportunity.host.id || '',
        name: opportunity.host.name || '',
        avatar: null
      },
      location: {
        region: opportunity.location?.region || '',
        city: opportunity.location?.city || '',
        address: opportunity.location?.address || null,
        coordinates: opportunity.location?.coordinates?.coordinates ? {
          lat: opportunity.location.coordinates.coordinates[1],
          lng: opportunity.location.coordinates.coordinates[0]
        } : null
      },
      media: {
        images: (opportunity.media.images || []).map(url => ({
          url,
          alt: opportunity.title
        }))
      },
      hasTimeSlots: opportunity.hasTimeSlots || false,
      timeSlots: opportunity.timeSlots || [],
      createdAt: opportunity.createdAt || '',
      updatedAt: opportunity.updatedAt || ''
    };

    return mapData as any; // 使用類型斷言處理整個對象
  }, [opportunity]);

  // 加載中狀態
  if (isLoading) {
    return (
      <AdminLayout title="機會詳情">
        <div className="flex justify-center items-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      </AdminLayout>
    );
  }

  // 錯誤狀態
  if (error || !opportunity) {
    // 檢查是否是 ID 格式錯誤
    const errorMessage = error instanceof Error ? error.message : '獲取機會詳情失敗，請刷新頁面重試';
    const isIdFormatError = errorMessage.includes('ID 格式錯誤');

    return (
      <AdminLayout title="機會詳情">
        <div className="bg-red-50 text-red-600 p-4 rounded-md my-4">
          {isIdFormatError ? (
            <>
              <h3 className="font-bold mb-2">ID 格式錯誤</h3>
              <p className="mb-2">您嘗試訪問的機會 ID 格式不正確。MongoDB 的 ObjectId 必須是 24 位的十六進制字符串。</p>
              <p>例如: <code className="bg-red-100 px-2 py-1 rounded">507f1f77bcf86cd799439011</code></p>
            </>
          ) : (
            errorMessage
          )}
        </div>
        <button
          onClick={handleBackToList}
          className="mt-4 px-4 py-2 bg-gray-100 text-gray-800 rounded-md hover:bg-gray-200"
        >
          返回列表
        </button>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="機會詳情">
      <div className="p-4 md:p-6">
        {/* 頂部操作欄 */}
        <div className="mb-6">
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <button
              onClick={handleBackToList}
              className="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-800 rounded-md hover:bg-gray-200"
            >
              <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
              </svg>
              返回列表
            </button>

            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
              statusColorMap[opportunity.status as OpportunityStatus] || 'bg-gray-100 text-gray-800'
            }`}>
              {statusLabelMap[opportunity.status as OpportunityStatus] || opportunity.status}
            </span>

            <span className={`px-3 py-1 rounded-full text-xs font-medium
              ${opportunity.type ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>
              {opportunity.type ? typeNameMap[opportunity.type as OpportunityType] || opportunity.type : '未指定類型'}
            </span>
          </div>

          <div className="flex flex-wrap justify-between items-center">
            <h1 className="text-3xl font-bold">{opportunity.title}</h1>

            <div className="mt-4 md:mt-0 flex flex-wrap gap-2">
            {/* 申請管理按鈕 */}
            <button
              onClick={handleViewApplications}
              className="px-4 py-2 bg-blue-100 text-blue-800 rounded-md hover:bg-blue-200"
            >
                申請管理 ({opportunity.stats.applications || 0})
            </button>

            {/* 根據當前狀態顯示不同的操作按鈕 */}
            {opportunity.status === OpportunityStatus.PENDING && (
              <>
                <button
                  onClick={() => handleStatusUpdate(OpportunityStatus.ACTIVE)}
                  className="px-4 py-2 bg-green-100 text-green-800 rounded-md hover:bg-green-200"
                >
                  批准上架
                </button>
                <button
                  onClick={() => handleStatusUpdate(OpportunityStatus.REJECTED)}
                  className="px-4 py-2 bg-red-100 text-red-800 rounded-md hover:bg-red-200"
                >
                  拒絕
                </button>
              </>
            )}

            {opportunity.status === OpportunityStatus.ACTIVE && (
              <button
                onClick={() => handleStatusUpdate(OpportunityStatus.PAUSED)}
                className="px-4 py-2 bg-yellow-100 text-yellow-800 rounded-md hover:bg-yellow-200"
              >
                暫停
              </button>
            )}

            {opportunity.status === OpportunityStatus.PAUSED && (
              <button
                onClick={() => handleStatusUpdate(OpportunityStatus.ACTIVE)}
                className="px-4 py-2 bg-green-100 text-green-800 rounded-md hover:bg-green-200"
              >
                恢復上架
              </button>
            )}

            {(opportunity.status === OpportunityStatus.ACTIVE ||
              opportunity.status === OpportunityStatus.PAUSED) && (
              <button
                onClick={() => handleStatusUpdate(OpportunityStatus.ARCHIVED)}
                className="px-4 py-2 bg-red-100 text-red-800 rounded-md hover:bg-red-200"
              >
                下架
              </button>
            )}
            </div>
          </div>
        </div>

        {/* 拒絕對話框 */}
        {showRejectionDialog && (
          <div className="fixed inset-0 bg-gray-800 bg-opacity-75 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-lg w-full mx-4">
              <h2 className="text-lg font-semibold mb-4">拒絕原因</h2>
              <p className="text-gray-600 mb-4">請提供拒絕此機會的原因，這將會顯示給主辦方。</p>

              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md min-h-[120px]"
                placeholder="請輸入拒絕原因..."
              />

              <div className="flex justify-end gap-2 mt-4">
                <button
                  onClick={() => setShowRejectionDialog(false)}
                  className="px-4 py-2 bg-gray-100 text-gray-800 rounded-md hover:bg-gray-200"
                >
                  取消
                </button>
                <button
                  onClick={handleSubmitRejection}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                  disabled={updateStatusMutation.isPending}
                >
                  {updateStatusMutation.isPending ? '處理中...' : '提交'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 主內容區域 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 左側主要內容 */}
          <div className="lg:col-span-2">
            {/* 封面圖片 */}
            <div className="bg-white shadow-sm rounded-lg overflow-hidden mb-8">
              <div className="relative h-80">
                {opportunity.media.coverImage ? (
                  <CloudinaryImage
                    resource={createImageResourceFromUrl(opportunity.media.coverImage, 'cover_' + opportunity.id)}
                    alt={opportunity.title}
                    imageType="cover"
                    className="h-80 w-full object-cover"
                  />
                ) : (
                  <div className="h-80 w-full flex items-center justify-center bg-gray-100">
                    <span className="text-gray-400">無封面圖片</span>
                  </div>
                )}
              </div>

              <div className="p-6">
                <div className="border-b border-gray-200 pb-4 mb-4">
                  <div className="flex items-center justify-between">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      statusColorMap[opportunity.status as OpportunityStatus]
                    }`}>
                      {statusLabelMap[opportunity.status as OpportunityStatus]}
                    </span>
                    <div className="flex items-center text-gray-500 text-sm">
                      <CalendarIcon className="w-4 h-4 mr-1" />
                      <span>發布於 {formatDate(opportunity.createdAt)}</span>
                    </div>
                  </div>
                  <h2 className="text-2xl font-bold mt-2">{opportunity.title}</h2>
                  <div className="flex items-center mt-2 text-gray-600">
                    <MapPinIcon className="w-4 h-4 mr-1" />
                    <span>{`${opportunity.location?.city || ''} ${opportunity.location?.district || ''}`}</span>
              </div>
            </div>

            {opportunity.status === OpportunityStatus.REJECTED && (
              <div className="mb-6">
                <StatusReasonBadge
                  opportunity={opportunity}
                  showLabel={true}
                  className="mt-2"
                />
              </div>
            )}

                {/* 詳細信息 */}
                <OpportunityDetailedInfo opportunity={opportunity} />

          {/* 機會描述 */}
                <div className="mb-6">
                  <h3 className="text-xl font-bold mb-2">機會介紹</h3>

            {opportunity.shortDescription && (
              <div className="mb-4">
                      <p className="font-medium text-gray-700 mb-1">簡短描述:</p>
                      <p className="text-gray-700">{opportunity.shortDescription}</p>
              </div>
            )}

            {opportunity.description && (
              <div>
                      <p className="font-medium text-gray-700 mb-1">詳細描述:</p>
                      <div className="prose max-w-none text-gray-700 whitespace-pre-line">
                  {opportunity.description}
                </div>
              </div>
            )}
          </div>

          {/* 工作詳情 */}
                <OpportunityWorkDetails opportunity={opportunity} />

                {/* 申請要求 */}
                <OpportunityRequirements opportunity={opportunity} />

                {/* 福利與待遇 */}
                <OpportunityBenefits opportunity={opportunity} />

                {/* 影響與永續發展 */}
                {opportunity.impact && <OpportunityImpact opportunity={opportunity} />}

                {/* 地圖組件 */}
                {mapPosition && (
                  <div className="mb-6">
                    <h3 className="text-xl font-bold mb-4">地點</h3>
                    <div className="h-72 rounded-lg overflow-hidden">
                      <MapComponent
                        position={mapPosition}
                        opportunities={transformedOpportunity ? [transformedOpportunity] : []}
                        zoom={14}
                        readOnly={true}
                      />
                    </div>
                    <p className="mt-2 text-sm text-gray-600">
                      {opportunity.location?.address ||
                       `${opportunity.location?.city || ''} ${opportunity.location?.district || ''}`}
                    </p>
                  </div>
                )}

                {/* 時間段 */}
                {opportunity.timeSlots && opportunity.timeSlots.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-xl font-bold mb-4">可申請時間段</h3>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">開始日期</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">結束日期</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">可用名額</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">最短停留</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">狀態</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {opportunity.timeSlots.map((slot, index) => (
                            <tr key={index}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{slot.startDate}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{slot.endDate}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{slot.defaultCapacity - (slot.confirmedCount || 0)}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{slot.minimumStay} 天</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{slot.status}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* 圖片集 */}
                {opportunity.media.images && opportunity.media.images.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-xl font-bold mb-4">圖片集</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                      {opportunity.media.images.map((image, index) => (
                        <div key={index} className="relative aspect-square rounded-md overflow-hidden">
                          <CloudinaryImage
                            resource={createImageResourceFromUrl(image, `opportunity_${opportunity.id}_${index}`)}
                            alt={`${opportunity.title} 圖片 ${index + 1}`}
                            imageType="opportunity"
                            className="h-full w-full object-cover"
                            index={index}
                          />
                        </div>
                      ))}
                  </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 右側邊欄 */}
          <div className="lg:col-span-1">
            {/* 主辦方信息 */}
            <div className="bg-white shadow-sm rounded-lg p-6 mb-6">
              <h3 className="text-xl font-bold mb-4 pb-2 border-b">主辦方資訊</h3>

              {opportunity.host && (
                <div>
                  <h4 className="text-lg font-semibold mb-2">{opportunity.host.name}</h4>
                  <p className="text-gray-600 mb-3"><span className="font-medium">ID:</span> {opportunity.host.id}</p>

                  {opportunity.host.contactEmail && (
                    <p className="text-gray-600 mb-2">
                      <span className="font-medium">聯絡信箱:</span> {opportunity.host.contactEmail}
                    </p>
                  )}

                  {opportunity.host.contactPhone && (
                    <p className="text-gray-600 mb-2">
                      <span className="font-medium">聯絡電話:</span> {opportunity.host.contactPhone}
                    </p>
                  )}

                  {opportunity.host.description && (
                    <div className="mt-3">
                      <p className="font-medium text-gray-700 mb-1">主辦方簡介:</p>
                      <p className="text-gray-600 whitespace-pre-line">{opportunity.host.description}</p>
                    </div>
                  )}

                  <div className="mt-4">
                    <Link
                      href={`/admin/hosts/${opportunity.host.id}`}
                      className="inline-flex items-center text-blue-600 hover:text-blue-800"
                    >
                      <span className="mr-2">查看主辦方詳情</span>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                      </svg>
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* 統計資訊 */}
            <div className="bg-white shadow-sm rounded-lg p-6 mb-6">
              <h3 className="text-xl font-bold mb-4 pb-2 border-b">統計資訊</h3>

              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-3 bg-blue-50 rounded-lg">
                  <div className="text-gray-500 text-sm">瀏覽</div>
                  <div className="font-semibold text-lg">{opportunity.stats.views || 0}</div>
                </div>
                <div className="p-3 bg-green-50 rounded-lg">
                  <div className="text-gray-500 text-sm">申請</div>
                  <div className="font-semibold text-lg">{opportunity.stats.applications || 0}</div>
                </div>
                <div className="p-3 bg-yellow-50 rounded-lg">
                  <div className="text-gray-500 text-sm">收藏</div>
                  <div className="font-semibold text-lg">{opportunity.stats.bookmarks || 0}</div>
                </div>
                </div>

              <div className="mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="text-gray-500 text-sm">創建時間</div>
                    <div className="font-semibold">{formatDate(opportunity.createdAt).split(' ')[0]}</div>
                  </div>
                  {opportunity.publishedAt && (
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <div className="text-gray-500 text-sm">發布時間</div>
                      <div className="font-semibold">{formatDate(opportunity.publishedAt).split(' ')[0]}</div>
                  </div>
                )}
                </div>
              </div>
            </div>

            {/* 快速操作 */}
            <div className="bg-white shadow-sm rounded-lg p-6">
              <h3 className="text-xl font-bold mb-4 pb-2 border-b">快速操作</h3>

              <div className="space-y-3">
                <button
                  onClick={handleViewApplications}
                  className="w-full px-4 py-2 bg-blue-100 text-blue-800 rounded-md hover:bg-blue-200 flex items-center justify-center"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path>
                  </svg>
                  查看申請 ({opportunity.stats.applications || 0})
                </button>

                <Link
                  href={`/opportunities/${opportunity.slug}`}
                  target="_blank"
                  className="w-full px-4 py-2 bg-gray-100 text-gray-800 rounded-md hover:bg-gray-200 flex items-center justify-center"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                  </svg>
                  前台預覽
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getSession(context);

  // 檢查訪問權限
  if (!session?.user) {
    return { redirect: { destination: '/auth/signin', permanent: false } };
  }

  // 確保用戶是管理員
  if (session.user.role !== UserRole.ADMIN && session.user.role !== UserRole.SUPER_ADMIN) {
    return { redirect: { destination: '/', permanent: false } };
  }

  return { props: {} };
};

export default OpportunityDetailPage;