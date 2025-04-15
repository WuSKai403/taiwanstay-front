import React from 'react';
import { useFormContext } from 'react-hook-form';
import CloudinaryImage from '@/components/CloudinaryImage';
import { CloudinaryImageResource } from '@/lib/cloudinary/types';
import { HostType } from '@/models/enums/HostType';

// 場所類型中文名稱
const TYPE_NAMES: Record<HostType, string> = {
  [HostType.COWORKING_SPACE]: '共享工作空間',
  [HostType.CULTURAL_VENUE]: '文化場所',
  [HostType.COMMUNITY_CENTER]: '社區中心',
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
  [HostType.OTHER]: '其他'
};

const PreviewStep: React.FC = () => {
  const { watch } = useFormContext();

  // 獲取表單所有數據
  const formData = watch();

  // 基本信息
  const name = formData.name || '';
  const description = formData.description || '';
  const type = formData.type as HostType || '';
  const category = formData.category || '';
  const foundingYear = formData.foundingYear || '';
  const teamSize = formData.teamSize || '';
  const languages = formData.languages || [];

  // 地址信息
  const location = formData.location || {};
  const fullAddress = `${location.country || '台灣'} ${location.city || ''} ${location.district || ''} ${location.zipCode || ''} ${location.address || ''}`;

  // 聯絡信息
  const contactInfo = formData.contactInfo || {};

  // 照片與視頻 - 修改為與 MediaUploadStep 一致的欄位結構
  const photos = formData.photos || [];
  const photoDescriptions = formData.photoDescriptions || [];
  const videoIntroduction = formData.videoIntroduction || {};
  const additionalMedia = formData.additionalMedia || {};

  // 特色與描述
  const features = formData.features?.features || [];
  const story = formData.features?.story || '';
  const experience = formData.features?.experience || '';
  const environment = formData.features?.environment || {};

  // 設施與服務
  const amenities = formData.amenities || {};
  const customAmenities = formData.amenities?.customAmenities || [];
  const amenitiesNotes = formData.amenities?.amenitiesNotes || '';
  const workExchangeDescription = formData.amenities?.workExchangeDescription || '';

  // 渲染設施列表
  const renderAmenities = () => {
    const amenitiesList: JSX.Element[] = [];

    // 處理每個類別的設施
    Object.entries(amenities).forEach(([categoryId, options]) => {
      if (typeof options === 'object' && options !== null) {
        Object.entries(options).forEach(([optionId, isSelected]) => {
          if (isSelected) {
            // 查找設施名稱
            const category = AMENITIES_CATEGORIES.find(cat => cat.id === categoryId);
            if (category) {
              const option = category.options.find(opt => opt.id === optionId);
              if (option) {
                amenitiesList.push(
                  <span key={`${categoryId}-${optionId}`} className="inline-flex items-center rounded-full bg-primary-100 px-3 py-0.5 text-sm font-medium text-primary-800 mr-2 mb-2">
                    {option.label}
                  </span>
                );
              }
            }
          }
        });
      }
    });

    // 添加自定義設施
    customAmenities.forEach((amenity: string, index: number) => {
      amenitiesList.push(
        <span key={`custom-${index}`} className="inline-flex items-center rounded-full bg-gray-100 px-3 py-0.5 text-sm font-medium text-gray-800 mr-2 mb-2">
          {amenity}
        </span>
      );
    });

    return amenitiesList.length > 0 ? (
      <div className="flex flex-wrap mt-2">{amenitiesList}</div>
    ) : (
      <p className="text-gray-500 italic">未選擇設施</p>
    );
  };

  // AMENITIES_CATEGORIES
  const AMENITIES_CATEGORIES = [
    {
      id: 'basics',
      name: '基本設施',
      options: [
        { id: 'wifi', label: '免費 Wi-Fi' },
        { id: 'parking', label: '停車場' },
        { id: 'elevator', label: '電梯' },
        { id: 'airConditioner', label: '空調' },
        { id: 'heater', label: '暖氣' },
        { id: 'washingMachine', label: '洗衣機' }
      ]
    },
    {
      id: 'accommodation',
      name: '住宿設施',
      options: [
        { id: 'privateRoom', label: '私人房間' },
        { id: 'sharedRoom', label: '共享房間' },
        { id: 'camping', label: '露營區' },
        { id: 'kitchen', label: '廚房設施' },
        { id: 'bathroom', label: '獨立衛浴' },
        { id: 'sharedBathroom', label: '共享衛浴' }
      ]
    },
    {
      id: 'workExchange',
      name: '工作交換',
      options: [
        { id: 'workingDesk', label: '工作桌' },
        { id: 'internetAccess', label: '高速網路' },
        { id: 'toolsProvided', label: '提供工具' },
        { id: 'trainingProvided', label: '提供培訓' },
        { id: 'flexibleHours', label: '彈性工作時間' }
      ]
    },
    {
      id: 'lifestyle',
      name: '生活風格',
      options: [
        { id: 'petFriendly', label: '寵物友善' },
        { id: 'smokingAllowed', label: '允許吸菸' },
        { id: 'childFriendly', label: '適合兒童' },
        { id: 'organic', label: '有機耕作' },
        { id: 'vegetarian', label: '提供素食' },
        { id: 'ecoFriendly', label: '環保設施' }
      ]
    },
    {
      id: 'activities',
      name: '休閒活動',
      options: [
        { id: 'yoga', label: '瑜珈' },
        { id: 'meditation', label: '冥想空間' },
        { id: 'freeDiving', label: '自由潛水' },
        { id: 'scubaDiving', label: '水肺潛水' },
        { id: 'hiking', label: '登山健行' },
        { id: 'farmingActivities', label: '農場活動' },
        { id: 'culturalExchange', label: '文化交流' }
      ]
    }
  ];

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-medium text-gray-900">預覽申請資料</h3>
        <p className="text-sm text-gray-500 mt-1">
          請檢查您提供的所有資訊是否正確。提交後，我們將會審核您的申請，並在審核通過後與您聯繫。
        </p>
      </div>

      {/* 基本資訊 */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6 bg-gray-50">
          <h3 className="text-base font-semibold leading-6 text-gray-900">基本資訊</h3>
        </div>
        <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
          <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <dt className="text-sm font-medium text-gray-500">場所名稱</dt>
              <dd className="mt-1 text-base text-gray-900">{name}</dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-sm font-medium text-gray-500">場所描述</dt>
              <dd className="mt-1 text-sm text-gray-900 whitespace-pre-line">{description}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">場所類型</dt>
              <dd className="mt-1 text-sm text-gray-900">{type ? TYPE_NAMES[type] : '未選擇'}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">類別</dt>
              <dd className="mt-1 text-sm text-gray-900">{category || '未選擇'}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">成立年份</dt>
              <dd className="mt-1 text-sm text-gray-900">{foundingYear || '未提供'}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">團隊規模</dt>
              <dd className="mt-1 text-sm text-gray-900">{teamSize || '未提供'}</dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-sm font-medium text-gray-500">使用語言</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {languages && languages.length > 0 ? languages.join(', ') : '未提供'}
              </dd>
            </div>
          </dl>
        </div>
      </div>

      {/* 地址信息 */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6 bg-gray-50">
          <h3 className="text-base font-semibold leading-6 text-gray-900">地址資訊</h3>
        </div>
        <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
          <dl className="grid grid-cols-1 gap-x-4 gap-y-6">
            <div className="sm:col-span-2">
              <dt className="text-sm font-medium text-gray-500">完整地址</dt>
              <dd className="mt-1 text-sm text-gray-900">{fullAddress}</dd>
            </div>
            {/* 這裡可以添加一個靜態地圖顯示 */}
          </dl>
        </div>
      </div>

      {/* 照片及媒體 - 修改為匹配 MediaUploadStep 的欄位結構 */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6 bg-gray-50">
          <h3 className="text-base font-semibold leading-6 text-gray-900">照片及媒體</h3>
        </div>
        <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
          {/* 照片 */}
          <div className="mb-6">
            <h4 className="text-sm font-medium text-gray-700 mb-3">場所照片</h4>
            {photos && photos.length > 0 ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
                {photos.map((photo: CloudinaryImageResource, index: number) => (
                  <div key={index} className="relative h-48 bg-gray-100 rounded-lg overflow-hidden">
                    <CloudinaryImage
                      resource={photo}
                      alt={`照片 ${index + 1}`}
                      className="h-full w-full object-cover"
                      objectFit="cover"
                      isPrivate={false}
                      index={index}
                    />
                    {photoDescriptions && photoDescriptions[index] && (
                      <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 p-2">
                        <p className="text-xs text-white">{photoDescriptions[index]}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 italic">未上傳照片</p>
            )}
          </div>

          {/* 視頻介紹 */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3">視頻介紹</h4>
            {videoIntroduction && videoIntroduction.url ? (
              <div>
                <div className="aspect-w-16 aspect-h-9 rounded-lg overflow-hidden">
                  {/* 解析視頻URL，嘗試顯示嵌入式播放器 */}
                  {videoIntroduction.url.includes('youtube.com') || videoIntroduction.url.includes('youtu.be') ? (
                    <iframe
                      src={`https://www.youtube.com/embed/${videoIntroduction.url.split('v=')[1] || videoIntroduction.url.split('youtu.be/')[1]}`}
                      title="YouTube video player"
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    ></iframe>
                  ) : (
                    <div className="bg-gray-200 flex items-center justify-center text-gray-500">
                      视频链接: {videoIntroduction.url}
                    </div>
                  )}
                </div>
                {videoIntroduction.description && (
                  <p className="mt-2 text-sm text-gray-600">{videoIntroduction.description}</p>
                )}
              </div>
            ) : (
              <p className="text-gray-500 italic">未提供視頻介紹</p>
            )}
          </div>

          {/* 虛擬導覽 */}
          {additionalMedia?.virtualTour && (
            <div className="mt-6">
              <h4 className="text-sm font-medium text-gray-700 mb-3">虛擬導覽</h4>
              <a
                href={additionalMedia.virtualTour}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary-600 hover:text-primary-500"
              >
                查看虛擬導覽
              </a>
            </div>
          )}
        </div>
      </div>

      {/* 聯絡資訊 */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6 bg-gray-50">
          <h3 className="text-base font-semibold leading-6 text-gray-900">聯絡資訊</h3>
        </div>
        <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
          <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
            <div>
              <dt className="text-sm font-medium text-gray-500">聯絡電子郵件</dt>
              <dd className="mt-1 text-sm text-gray-900">{contactInfo.contactEmail || '未提供'}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">聯絡手機</dt>
              <dd className="mt-1 text-sm text-gray-900">{contactInfo.contactMobile || '未提供'}</dd>
            </div>
            {contactInfo.phone && (
              <div>
                <dt className="text-sm font-medium text-gray-500">其他聯絡電話</dt>
                <dd className="mt-1 text-sm text-gray-900">{contactInfo.phone}</dd>
              </div>
            )}
            {contactInfo.fax && (
              <div>
                <dt className="text-sm font-medium text-gray-500">傳真</dt>
                <dd className="mt-1 text-sm text-gray-900">{contactInfo.fax}</dd>
              </div>
            )}
            {contactInfo.website && (
              <div>
                <dt className="text-sm font-medium text-gray-500">網站</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  <a href={`https://${contactInfo.website}`} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:text-primary-500">
                    {contactInfo.website}
                  </a>
                </dd>
              </div>
            )}
            {contactInfo.socialMedia && Object.entries(contactInfo.socialMedia).some(([_, value]) => value) && (
              <div className="sm:col-span-2">
                <dt className="text-sm font-medium text-gray-500">社群媒體</dt>
                <dd className="mt-1 grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {contactInfo.socialMedia.facebook && (
                    <a
                      href={`https://facebook.com/${contactInfo.socialMedia.facebook}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary-600 hover:text-primary-500"
                    >
                      Facebook: {contactInfo.socialMedia.facebook}
                    </a>
                  )}
                  {contactInfo.socialMedia.instagram && (
                    <a
                      href={`https://instagram.com/${contactInfo.socialMedia.instagram}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary-600 hover:text-primary-500"
                    >
                      Instagram: {contactInfo.socialMedia.instagram}
                    </a>
                  )}
                  {contactInfo.socialMedia.line && (
                    <span className="text-gray-900">
                      LINE: {contactInfo.socialMedia.line}
                    </span>
                  )}
                  {contactInfo.socialMedia.other && (
                    <span className="text-gray-900">
                      其他: {contactInfo.socialMedia.other}
                    </span>
                  )}
                </dd>
              </div>
            )}
            {contactInfo.contactHours && (
              <div className="sm:col-span-2">
                <dt className="text-sm font-medium text-gray-500">聯絡時段</dt>
                <dd className="mt-1 text-sm text-gray-900">{contactInfo.contactHours}</dd>
              </div>
            )}
            {contactInfo.notes && (
              <div className="sm:col-span-2">
                <dt className="text-sm font-medium text-gray-500">聯絡注意事項</dt>
                <dd className="mt-1 text-sm text-gray-900 whitespace-pre-line">{contactInfo.notes}</dd>
              </div>
            )}
          </dl>
        </div>
      </div>

      {/* 特色與描述 */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6 bg-gray-50">
          <h3 className="text-base font-semibold leading-6 text-gray-900">特色與描述</h3>
        </div>
        <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
          {/* 特色標籤 */}
          <div className="mb-6">
            <h4 className="text-sm font-medium text-gray-700 mb-2">特色標籤</h4>
            {features && features.length > 0 ? (
              <div className="flex flex-wrap">
                {features.map((feature: string, index: number) => (
                  <span key={index} className="inline-flex items-center rounded-full bg-primary-100 px-3 py-0.5 text-sm font-medium text-primary-800 mr-2 mb-2">
                    {feature}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 italic">未選擇特色標籤</p>
            )}
          </div>

          {/* 主人故事 */}
          <div className="mb-6">
            <h4 className="text-sm font-medium text-gray-700 mb-2">主人故事</h4>
            {story ? (
              <p className="text-sm text-gray-900 whitespace-pre-line">{story}</p>
            ) : (
              <p className="text-gray-500 italic">未提供主人故事</p>
            )}
          </div>

          {/* 工作交換經驗 */}
          {experience && (
            <div className="mb-6">
              <h4 className="text-sm font-medium text-gray-700 mb-2">工作交換經驗</h4>
              <p className="text-sm text-gray-900 whitespace-pre-line">{experience}</p>
            </div>
          )}

          {/* 環境描述 */}
          <div className="mb-6">
            <h4 className="text-sm font-medium text-gray-700 mb-2">環境描述</h4>
            {environment ? (
              <div className="space-y-4">
                {/* 周邊環境 */}
                {environment.surroundings && (
                  <div>
                    <h5 className="text-xs font-medium text-gray-600">周邊環境</h5>
                    <p className="text-sm text-gray-900 whitespace-pre-line">{environment.surroundings}</p>
                  </div>
                )}

                {/* 交通便利性 */}
                {environment.accessibility && (
                  <div>
                    <h5 className="text-xs font-medium text-gray-600">交通便利性</h5>
                    <p className="text-sm text-gray-900 whitespace-pre-line">{environment.accessibility}</p>
                  </div>
                )}

                {/* 附近景點 */}
                {environment.nearbyAttractions && environment.nearbyAttractions.length > 0 && (
                  <div>
                    <h5 className="text-xs font-medium text-gray-600">附近景點</h5>
                    <div className="flex flex-wrap mt-1">
                      {environment.nearbyAttractions.map((attraction: string, index: number) => (
                        <span key={index} className="inline-flex items-center rounded-full bg-gray-100 px-3 py-0.5 text-sm font-medium text-gray-800 mr-2 mb-2">
                          {attraction}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-gray-500 italic">未提供環境描述</p>
            )}
          </div>
        </div>
      </div>

      {/* 設施與服務 */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6 bg-gray-50">
          <h3 className="text-base font-semibold leading-6 text-gray-900">設施與服務</h3>
        </div>
        <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
          <div className="mb-6">
            <h4 className="text-sm font-medium text-gray-700 mb-2">提供的設施</h4>
            {renderAmenities()}
          </div>

          {workExchangeDescription && (
            <div className="mb-6">
              <h4 className="text-sm font-medium text-gray-700 mb-2">工作交換概述</h4>
              <p className="text-sm text-gray-900 whitespace-pre-line">{workExchangeDescription}</p>
            </div>
          )}

          {amenitiesNotes && (
            <div className="mb-6">
              <h4 className="text-sm font-medium text-gray-700 mb-2">設施與服務備註</h4>
              <p className="text-sm text-gray-900 whitespace-pre-line">{amenitiesNotes}</p>
            </div>
          )}
        </div>
      </div>

      <div className="rounded-md bg-yellow-50 p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-yellow-800">提交前請確認</h3>
            <div className="mt-2 text-sm text-yellow-700">
              <p>
                提交後，我們將審核您提供的資訊。請確保所有資訊準確無誤，特別是聯絡方式，以便我們能夠與您取得聯繫。
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PreviewStep;