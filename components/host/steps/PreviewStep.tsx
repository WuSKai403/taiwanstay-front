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
  const contact = formData.contact || {};

  // 照片與視頻
  const photos = formData.photos || [];
  const photoDescriptions = formData.photoDescriptions || [];
  const videoIntroduction = formData.videoIntroduction || {};

  // 設施與服務
  const amenities = formData.amenities || {};
  const customAmenities = formData.customAmenities || [];
  const amenitiesNotes = formData.amenitiesNotes || '';

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
      id: 'accessibility',
      name: '無障礙設施',
      options: [
        { id: 'wheelchair', label: '輪椅通道' },
        { id: 'elevator', label: '電梯' },
        { id: 'accessibleToilet', label: '無障礙廁所' },
        { id: 'accessibleParking', label: '無障礙停車位' },
        { id: 'brailleSignage', label: '點字標示' }
      ]
    },
    {
      id: 'facilities',
      name: '基本設施',
      options: [
        { id: 'wifi', label: '免費 Wi-Fi' },
        { id: 'parking', label: '停車場' },
        { id: 'airConditioner', label: '空調' },
        { id: 'heater', label: '暖氣' },
        { id: 'restroom', label: '洗手間' },
        { id: 'lockers', label: '置物櫃' }
      ]
    },
    {
      id: 'equipment',
      name: '設備',
      options: [
        { id: 'projector', label: '投影機' },
        { id: 'soundSystem', label: '音響系統' },
        { id: 'microphone', label: '麥克風' },
        { id: 'computer', label: '電腦' },
        { id: 'printer', label: '印表機' },
        { id: 'whiteboard', label: '白板' }
      ]
    },
    {
      id: 'services',
      name: '服務',
      options: [
        { id: 'reception', label: '接待服務' },
        { id: 'cleaning', label: '清潔服務' },
        { id: 'guide', label: '導覽服務' },
        { id: 'translation', label: '翻譯服務' },
        { id: 'catering', label: '餐飲服務' },
        { id: 'livestream', label: '直播設備' }
      ]
    },
    {
      id: 'special',
      name: '特色服務',
      options: [
        { id: 'workshop', label: '工作坊' },
        { id: 'exhibition', label: '展覽空間' },
        { id: 'childCare', label: '兒童照顧' },
        { id: 'petFriendly', label: '寵物友善' }
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

      {/* 照片及媒體 */}
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
                      <div className="absolute bottom-0 inset-x-0 bg-black bg-opacity-50 text-white p-2 text-sm">
                        {photoDescriptions[index]}
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
                  {/* 這裡放視頻嵌入iframe，需要解析視頻URL */}
                  <div className="bg-gray-200 flex items-center justify-center text-gray-500">
                    视频链接: {videoIntroduction.url}
                  </div>
                </div>
                {videoIntroduction.description && (
                  <p className="mt-2 text-sm text-gray-600">{videoIntroduction.description}</p>
                )}
              </div>
            ) : (
              <p className="text-gray-500 italic">未提供視頻介紹</p>
            )}
          </div>
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
              <dt className="text-sm font-medium text-gray-500">聯絡人</dt>
              <dd className="mt-1 text-sm text-gray-900">{contact.person || '未提供'}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">職稱</dt>
              <dd className="mt-1 text-sm text-gray-900">{contact.title || '未提供'}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">聯絡電話</dt>
              <dd className="mt-1 text-sm text-gray-900">{contact.phone || '未提供'}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">電子郵件</dt>
              <dd className="mt-1 text-sm text-gray-900">{contact.email || '未提供'}</dd>
            </div>
            {contact.fax && (
              <div>
                <dt className="text-sm font-medium text-gray-500">傳真</dt>
                <dd className="mt-1 text-sm text-gray-900">{contact.fax}</dd>
              </div>
            )}
            {contact.website && (
              <div>
                <dt className="text-sm font-medium text-gray-500">網站</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  <a href={`https://${contact.website}`} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:text-primary-500">
                    {contact.website}
                  </a>
                </dd>
              </div>
            )}
            {contact.social && Object.entries(contact.social).some(([_, value]) => value) && (
              <div className="sm:col-span-2">
                <dt className="text-sm font-medium text-gray-500">社群媒體</dt>
                <dd className="mt-1 grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {contact.social.facebook && (
                    <a
                      href={`https://facebook.com/${contact.social.facebook}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary-600 hover:text-primary-500"
                    >
                      Facebook: {contact.social.facebook}
                    </a>
                  )}
                  {contact.social.instagram && (
                    <a
                      href={`https://instagram.com/${contact.social.instagram}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary-600 hover:text-primary-500"
                    >
                      Instagram: {contact.social.instagram}
                    </a>
                  )}
                  {contact.social.line && (
                    <span className="text-gray-900">
                      LINE: {contact.social.line}
                    </span>
                  )}
                  {contact.social.other && (
                    <span className="text-gray-900">
                      其他: {contact.social.other}
                    </span>
                  )}
                </dd>
              </div>
            )}
            {contact.contactHours && (
              <div className="sm:col-span-2">
                <dt className="text-sm font-medium text-gray-500">聯絡時段</dt>
                <dd className="mt-1 text-sm text-gray-900">{contact.contactHours}</dd>
              </div>
            )}
            {contact.notes && (
              <div className="sm:col-span-2">
                <dt className="text-sm font-medium text-gray-500">聯絡注意事項</dt>
                <dd className="mt-1 text-sm text-gray-900 whitespace-pre-line">{contact.notes}</dd>
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
            {formData.features && formData.features.length > 0 ? (
              <div className="flex flex-wrap">
                {formData.features.map((feature: string, index: number) => (
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
            {formData.story ? (
              <p className="text-sm text-gray-900 whitespace-pre-line">{formData.story}</p>
            ) : (
              <p className="text-gray-500 italic">未提供主人故事</p>
            )}
          </div>

          {/* 工作交換經驗 */}
          {formData.experience && (
            <div className="mb-6">
              <h4 className="text-sm font-medium text-gray-700 mb-2">工作交換經驗</h4>
              <p className="text-sm text-gray-900 whitespace-pre-line">{formData.experience}</p>
            </div>
          )}

          {/* 環境描述 */}
          <div className="mb-6">
            <h4 className="text-sm font-medium text-gray-700 mb-2">環境描述</h4>
            {formData.environment ? (
              <div className="space-y-4">
                {/* 周邊環境 */}
                {formData.environment.surroundings && (
                  <div>
                    <h5 className="text-xs font-medium text-gray-600">周邊環境</h5>
                    <p className="text-sm text-gray-900 whitespace-pre-line">{formData.environment.surroundings}</p>
                  </div>
                )}

                {/* 交通便利性 */}
                {formData.environment.accessibility && (
                  <div>
                    <h5 className="text-xs font-medium text-gray-600">交通便利性</h5>
                    <p className="text-sm text-gray-900 whitespace-pre-line">{formData.environment.accessibility}</p>
                  </div>
                )}

                {/* 附近景點 */}
                {formData.environment.nearbyAttractions && formData.environment.nearbyAttractions.length > 0 && (
                  <div>
                    <h5 className="text-xs font-medium text-gray-600">附近景點</h5>
                    <div className="flex flex-wrap mt-1">
                      {formData.environment.nearbyAttractions.map((attraction: string, index: number) => (
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