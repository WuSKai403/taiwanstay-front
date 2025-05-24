import React from 'react';
import { Control, useFormContext } from 'react-hook-form';
import { OpportunityFormData } from '../OpportunityForm';
import { OpportunityStatus, OpportunityType } from '@/models/enums';
import { typeNameMap, typeColorMap, TimeSlot } from '@/components/opportunity/constants';
import CloudinaryImage from '@/components/CloudinaryImage';
import { CloudinaryImageResource } from '@/lib/cloudinary/types';
import LocationMapViewer from '@/components/LocationMapViewer';
import OpportunityRequirements from '@/components/opportunity/OpportunityRequirements';
import OpportunityMedia from '@/components/opportunity/OpportunityMedia';
import { OpportunityMedia as OpportunityMediaType } from '@/lib/types/media';
import {
  statusColorMap,
  statusLabelMap,
  statusActions,
  getPrimaryAction,
  getSecondaryActions,
  needsConfirmation,
  getConfirmationMessage
} from '@/lib/opportunities/statusManager';

interface PreviewTabProps {
  control: Control<OpportunityFormData>;
  watch: any;
  status?: OpportunityStatus;
  onStatusChange?: (newStatus: OpportunityStatus | null) => void;
  onSave?: () => void;
}

const PreviewTab: React.FC<PreviewTabProps> = ({
  control,
  watch,
  status = OpportunityStatus.DRAFT,
  onStatusChange,
  onSave,
}) => {
  const { getValues } = useFormContext<OpportunityFormData>();

  // 獲取表單數據
  const values = getValues();
  const {
    title,
    shortDescription,
    description,
    type,
    location,
    workDetails,
    benefits,
    requirements,
    media,
    hasTimeSlots,
    timeSlots,
  } = values;

  // 獲取類型顏色
  const getTypeColor = (oppType: OpportunityType) => {
    return typeColorMap[oppType] || 'bg-gray-100 text-gray-800';
  };

  // 處理時間槽數據，確保每個時間槽都有一個 id
  const processedTimeSlots: TimeSlot[] = (timeSlots || []).map(slot => ({
    ...slot,
    id: slot.id || `preview-slot-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    startDate: slot.startDate || '',
    endDate: slot.endDate || '',
    defaultCapacity: slot.defaultCapacity || 1,
    minimumStay: slot.minimumStay || 1,
    appliedCount: slot.appliedCount || 0,
    confirmedCount: slot.confirmedCount || 0,
    status: slot.status || 'active'
  }));

  // 將表單數據轉換為 OpportunityDetail 格式以兼容組件
  const opportunityPreview = {
    id: 'preview',
    publicId: 'preview',
    title: title || '未設置標題',
    slug: '',
    shortDescription: shortDescription || '未設置簡短描述',
    description: description || '未設置工作描述',
    type: type,
    status: status,
    location: {
      city: location?.city,
      district: location?.district,
      address: location?.showExactLocation ? location?.address : undefined,
      region: location?.region,
      coordinates: location?.coordinates ? {
        type: location.coordinates.type || "Point",
        coordinates: location.coordinates.coordinates
      } : undefined,  // 使用 undefined 替代 null
    },
    workDetails: workDetails || {
      tasks: [],
    },
    benefits: benefits || {
      accommodation: {
        provided: false
      },
      meals: {
        provided: false
      }
    },
    requirements: requirements || {},
    media: {
      // 確保 media 屬性符合 OpportunityMedia 類型
      coverImage: media?.coverImage || undefined,
      images: media?.images || [],
      videoUrl: media?.videoUrl || undefined,
      videoDescription: media?.videoDescription || undefined,
      virtualTour: media?.virtualTour || undefined,
      descriptions: media?.descriptions || []
    } as OpportunityMediaType,
    host: {
      id: '',
      name: '',
    },
    stats: {
      applications: 0,
      bookmarks: 0,
      views: 0
    },
    hasTimeSlots: hasTimeSlots,
    timeSlots: processedTimeSlots,
    statusHistory: []
  };

  // 獲取當前狀態的操作按鈕 (僅用於顯示說明文字)
  const primaryAction = getPrimaryAction(status);
  const secondaryActions = getSecondaryActions(status);

  return (
    <div className="space-y-8">
      <div className="flex items-center">
        <h3 className="text-lg font-medium text-gray-900">資料預覽</h3>
        <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColorMap[status]}`}>
          {statusLabelMap[status]}
        </span>
      </div>

      <p className="text-sm text-gray-500">
        以下顯示您填寫的機會資訊，請確認內容正確無誤。
      </p>

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
        {/* 主要信息 */}
        <div className="p-6">
          {/* 標題和類型 */}
          <div className="flex items-start justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-900">{title || '未設置標題'}</h2>
            <div className="flex items-center space-x-2">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getTypeColor(type)}`}>
                {typeNameMap[type] || '其他類型'}
              </span>
            </div>
          </div>

          {/* 地點 */}
          <div className="flex items-center text-gray-600 mb-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span>
              {location?.city && location?.district
                ? `${location.city}, ${location.district}`
                : '未設置地點'}
              {location?.zipCode && ` (${location.zipCode})`}
              {location?.showExactLocation && location?.address && ` - ${location.address}`}
            </span>
          </div>

          {/* 座標信息 (如果有) */}
          {location?.coordinates && location?.showExactLocation && (
            <div className="flex items-center text-gray-600 mb-4 text-sm">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
              <span>
                座標: {location.coordinates.coordinates[1].toFixed(6)}, {location.coordinates.coordinates[0].toFixed(6)}
              </span>
            </div>
          )}

          {/* 簡短描述 */}
          <p className="text-gray-700 mb-6">{shortDescription || '未設置簡短描述'}</p>

          {/* 主要內容 */}
          <div className="border-t pt-6">
            {/* 地圖檢視 */}
            {location?.coordinates && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-3">地點位置</h3>
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <LocationMapViewer
                    position={[location.coordinates.coordinates[1], location.coordinates.coordinates[0]]}
                    address={location?.address}
                    city={location?.city}
                    district={location?.district}
                    height="300px"
                  />
                </div>
              </div>
            )}

            <h3 className="text-lg font-semibold mb-3">工作描述</h3>
            <p className="text-gray-700 whitespace-pre-line mb-6">{description || '未設置工作描述'}</p>

            {/* 工作詳情 */}
            {workDetails && workDetails.tasks && workDetails.tasks.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-3">工作任務</h3>
                <ul className="list-disc pl-5 space-y-1">
                  {workDetails.tasks.map((task, index) => (
                    <li key={index} className="text-gray-700">{task}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* 相關技能 */}
            {workDetails && workDetails.skills && workDetails.skills.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-3">相關技能</h3>
                <div className="flex flex-wrap gap-2">
                  {workDetails.skills.map((skill, index) => (
                    <span key={index} className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* 時間段管理 */}
            {hasTimeSlots && timeSlots && timeSlots.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-3">工作時間段</h3>
                <div className="space-y-4">
                  {timeSlots.map((slot, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                      <h4 className="font-medium mb-2">時間段 #{index + 1}</h4>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <span className="text-gray-600 text-sm">開始日期：</span>
                          <span className="font-medium">{slot.startDate || '未設定'}</span>
                        </div>
                        <div>
                          <span className="text-gray-600 text-sm">結束日期：</span>
                          <span className="font-medium">{slot.endDate || '未設定'}</span>
                        </div>
                        <div>
                          <span className="text-gray-600 text-sm">人數容量：</span>
                          <span className="font-medium">{slot.defaultCapacity} 人</span>
                        </div>
                        <div>
                          <span className="text-gray-600 text-sm">最短停留時間：</span>
                          <span className="font-medium">{slot.minimumStay} 天</span>
                        </div>
                        {slot.description && (
                          <div className="col-span-2 mt-2">
                            <span className="text-gray-600 text-sm">描述：</span>
                            <p className="text-sm mt-1">{slot.description}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 媒體內容 */}
            <div className="mb-6">
              <OpportunityMedia opportunity={opportunityPreview} isPreview={true} />
            </div>

            {/* 福利 */}
            {benefits && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-3">福利</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {benefits.accommodation && (
                    <div className="flex items-start">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500 mt-0.5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" />
                      </svg>
                      <div>
                        <h4 className="font-medium">住宿</h4>
                        <p className="text-sm text-gray-600">
                          {benefits.accommodation.provided ? '提供住宿' : '不提供住宿'}
                          {benefits.accommodation.description && ` - ${benefits.accommodation.description}`}
                        </p>
                      </div>
                    </div>
                  )}

                  {benefits.meals && (
                    <div className="flex items-start">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500 mt-0.5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                      <div>
                        <h4 className="font-medium">餐飲</h4>
                        <p className="text-sm text-gray-600">
                          {benefits.meals.provided ? '提供膳食' : '不提供膳食'}
                          {benefits.meals.count ? ` - 每天 ${benefits.meals.count} 餐` : ''}
                          {benefits.meals.description && ` - ${benefits.meals.description}`}
                        </p>
                      </div>
                    </div>
                  )}

                  {benefits.stipend && (
                    <div className="flex items-start">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500 mt-0.5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
                      </svg>
                      <div>
                        <h4 className="font-medium">津貼</h4>
                        <p className="text-sm text-gray-600">
                          {benefits.stipend.provided ? '提供津貼' : '不提供津貼'}
                          {benefits.stipend.amount && benefits.stipend.currency ? ` - ${benefits.stipend.amount} ${benefits.stipend.currency}` : ''}
                          {benefits.stipend.frequency && ` (${benefits.stipend.frequency})`}
                        </p>
                      </div>
                    </div>
                  )}

                  {benefits.otherBenefits && benefits.otherBenefits.length > 0 && (
                    <div className="flex items-start">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500 mt-0.5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 2a4 4 0 00-4 4v1H5a1 1 0 00-.994.89l-1 9A1 1 0 004 18h12a1 1 0 00.994-1.11l-1-9A1 1 0 0015 7h-1V6a4 4 0 00-4-4zm2 5V6a2 2 0 10-4 0v1h4zm-6 3a1 1 0 112 0 1 1 0 01-2 0zm7-1a1 1 0 100 2 1 1 0 000-2z" clipRule="evenodd" />
                      </svg>
                      <div>
                        <h4 className="font-medium">其他福利</h4>
                        <ul className="text-sm text-gray-600 list-disc pl-4">
                          {benefits.otherBenefits.map((benefit, index) => (
                            <li key={index}>{benefit}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 要求 */}
            {requirements && Object.keys(requirements).length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-3">條件與要求</h3>
                <OpportunityRequirements opportunity={opportunityPreview} />
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
          <p className="text-yellow-800">
            <strong>注意：</strong> 請檢查以上內容是否完整準確，所有資訊將在發布後顯示給潛在申請者。
          </p>
        </div>

        <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
          <h4 className="font-semibold text-blue-800 mb-2">審核流程說明</h4>
          <ol className="list-decimal pl-5 text-blue-700 space-y-1">
            <li>點擊「儲存」按鈕可將工作機會保存為草稿，您可以隨時繼續編輯</li>
            <li>點擊「送出審核」按鈕將提交工作機會進行審核</li>
            <li>審核通常需要 1-2 個工作天</li>
            <li>審核通過後，工作機會將自動發布並對外開放申請</li>
            <li>如果審核未通過，您將收到通知並可修改後重新提交</li>
          </ol>
        </div>
      </div>

      {/* 底部狀態說明 */}
      <div className="mt-8 pt-6 border-t border-gray-200">
        <div className="flex flex-col">
          <h4 className="font-medium text-gray-900 mb-2">可用操作說明</h4>
          <div className="text-sm text-gray-600">
            {primaryAction && (
              <p className="mb-2">
                <span className="font-medium">{primaryAction.actionLabel}:</span> {primaryAction.description}
              </p>
            )}
            {secondaryActions.map((action, index) => (
              <p key={index} className="mb-2">
                <span className="font-medium">{action.actionLabel}:</span> {action.description}
              </p>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PreviewTab;