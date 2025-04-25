import React from 'react';
import { Control, useFormContext } from 'react-hook-form';
import { OpportunityFormData } from '../OpportunityForm';
import { OpportunityType } from '@/models/enums';
import { typeNameMap, typeColorMap } from '@/components/opportunity/constants';
import CloudinaryImage from '@/components/CloudinaryImage';
import { CloudinaryImageResource } from '@/lib/cloudinary/types';
import LocationMapViewer from '@/components/LocationMapViewer';

interface PreviewTabProps {
  control: Control<OpportunityFormData>;
  watch: any;
}

const PreviewTab: React.FC<PreviewTabProps> = ({
  control,
  watch,
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
    workTimeSettings,
  } = values;

  // 獲取類型顏色
  const getTypeColor = (oppType: OpportunityType) => {
    return typeColorMap[oppType] || 'bg-gray-100 text-gray-800';
  };

  // 呈現圖片
  const renderImages = () => {
    // 優先使用 coverImage，如果沒有則使用 images 中的第一張
    const coverImage = media?.coverImage;
    const images = media?.images || [];

    if (coverImage) {
      return (
        <div className="relative rounded-lg overflow-hidden aspect-[2/1]">
          <CloudinaryImage
            resource={coverImage as CloudinaryImageResource}
            alt={coverImage.alt || title}
            className="w-full h-full object-cover"
            objectFit="cover"
            isPrivate={false}
            index={0}
          />
        </div>
      );
    } else if (images.length > 0) {
      return (
        <div className="relative rounded-lg overflow-hidden h-64">
          <CloudinaryImage
            resource={images[0] as CloudinaryImageResource}
            alt={images[0].alt || title}
            className="w-full h-full object-cover"
            objectFit="cover"
            isPrivate={false}
            index={0}
          />
        </div>
      );
    } else {
      return (
        <div className="bg-gray-100 rounded-lg h-64 flex items-center justify-center">
          <p className="text-gray-500">無圖片</p>
        </div>
      );
    }
  };

  // 呈現所有圖片
  const renderAllImages = () => {
    const images = media?.images || [];
    if (images.length === 0) {
      return (
        <div className="bg-gray-100 rounded-lg h-32 flex items-center justify-center">
          <p className="text-gray-500">無圖片</p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
        {images.map((image, index) => (
          <div key={index} className="relative h-48 bg-gray-100 rounded-lg overflow-hidden">
            <CloudinaryImage
              resource={image as CloudinaryImageResource}
              alt={image.alt || `照片 ${index + 1}`}
              className="h-full w-full object-cover"
              objectFit="cover"
              isPrivate={false}
              index={index}
            />
            {media?.descriptions && media.descriptions[index] && (
              <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 p-2">
                <p className="text-xs text-white">{media.descriptions[index]}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-8">
      <h3 className="text-lg font-medium text-gray-900">資料預覽</h3>
      <p className="text-sm text-gray-500">
        以下顯示您填寫的機會資訊，請確認內容正確無誤。
      </p>

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
        {/* 主要圖片 */}
        {renderImages()}

        {/* 主要信息 */}
        <div className="p-6">
          {/* 標題和類型 */}
          <div className="flex items-start justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-900">{title || '未設置標題'}</h2>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getTypeColor(type)}`}>
              {typeNameMap[type] || '其他類型'}
            </span>
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
                座標: {location.coordinates[1].toFixed(6)}, {location.coordinates[0].toFixed(6)}
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
                    position={[location.coordinates[1], location.coordinates[0]]}
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

            {/* 工作時間 */}
            {workTimeSettings && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-3">工作時間</h3>
                <div className="grid grid-cols-2 gap-4">
                  {workTimeSettings.workHoursPerDay && (
                    <div>
                      <span className="text-gray-600">每天工作時間：</span>
                      <span className="font-medium">{workTimeSettings.workHoursPerDay} 小時</span>
                    </div>
                  )}
                  {workTimeSettings.workDaysPerWeek && (
                    <div>
                      <span className="text-gray-600">每週工作天數：</span>
                      <span className="font-medium">{workTimeSettings.workDaysPerWeek} 天</span>
                    </div>
                  )}
                  {workTimeSettings.minimumStay && (
                    <div>
                      <span className="text-gray-600">最少停留時間：</span>
                      <span className="font-medium">{workTimeSettings.minimumStay} 天</span>
                    </div>
                  )}
                  {workTimeSettings.maximumStay && (
                    <div>
                      <span className="text-gray-600">最長停留時間：</span>
                      <span className="font-medium">{workTimeSettings.maximumStay} 天</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 圖片展示區 */}
            {media?.images && media.images.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-3">場所照片</h3>
                {renderAllImages()}
              </div>
            )}

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

                  {benefits.stipend && benefits.stipend.provided && (
                    <div className="flex items-start">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500 mt-0.5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
                      </svg>
                      <div>
                        <h4 className="font-medium">津貼</h4>
                        <p className="text-sm text-gray-600">
                          {benefits.stipend.amount && benefits.stipend.currency
                            ? `${benefits.stipend.amount} ${benefits.stipend.currency}`
                            : '提供津貼'}
                          {benefits.stipend.frequency && ` - ${benefits.stipend.frequency}`}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 駕照需求 */}
            {requirements?.drivingLicense && (
              (requirements.drivingLicense.carRequired ||
               requirements.drivingLicense.motorcycleRequired ||
               requirements.drivingLicense.otherRequired) && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-3">駕照需求</h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <ul className="space-y-2">
                      {requirements.drivingLicense.carRequired && (
                        <li className="flex items-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600 mr-2" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
                            <path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1v-1h3a1 1 0 00.9-.579l2.7-5.4A1 1 0 0017 7h-1.42l-.9-2.7A1 1 0 0014 3.5h-8a1 1 0 00-.9.621L4.2 7H3a1 1 0 00-1 1v3h1V8h1.05a2.5 2.5 0 014.9 0H13a1 1 0 001-1v-1h1l-2 4H8v5h2.05a2.5 2.5 0 014.9 0H15a1 1 0 001-1v-1h1a1 1 0 001-1V8a1 1 0 00-1-1h-1V5a1 1 0 00-1-1H3z" />
                          </svg>
                          <span>需要汽車駕照</span>
                        </li>
                      )}
                      {requirements.drivingLicense.motorcycleRequired && (
                        <li className="flex items-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600 mr-2" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M6.5 14.5v-3.505c0-.245.25-.495.5-.495h2c.25 0 .5.25.5.5v3.5a.5.5 0 00.5.5h4a.5.5 0 00.5-.5v-7a.5.5 0 00-.146-.354L13 5.793V2.5a.5.5 0 00-.5-.5h-1a.5.5 0 00-.5.5v1.293L8.354 1.146a.5.5 0 00-.708 0l-6 6A.5.5 0 001.5 7.5v7a.5.5 0 00.5.5h4a.5.5 0 00.5-.5z" />
                          </svg>
                          <span>需要機車駕照</span>
                        </li>
                      )}
                      {requirements.drivingLicense.otherRequired && (
                        <li className="flex items-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600 mr-2" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                          </svg>
                          <span>其他駕照需求: {requirements.drivingLicense.otherDescription || '未指定'}</span>
                        </li>
                      )}
                    </ul>
                  </div>
                </div>
              )
            )}
          </div>
        </div>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
        <p className="text-yellow-800">
          <strong>注意：</strong> 請檢查以上內容是否完整準確，所有資訊將在發布後顯示給潛在申請者。
        </p>
      </div>
    </div>
  );
};

export default PreviewTab;