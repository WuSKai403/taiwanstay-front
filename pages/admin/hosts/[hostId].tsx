import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import Image from 'next/image';
import Head from 'next/head';
import { UserRole } from '@/models/enums/UserRole';
import { HostStatus } from '@/models/enums/HostStatus';
import { HostType } from '@/models/enums/HostType';
import {
  CheckIcon,
  XMarkIcon,
  ClockIcon,
  BanIcon,
  ArrowLeftIcon,
  UserIcon,
  MapPinIcon,
  PhoneIcon,
  GlobeAltIcon,
  CalendarIcon,
  IdentificationIcon,
  EnvelopeIcon,
  PhotoIcon,
  NoSymbolIcon,
  ArrowPathIcon,
  BriefcaseIcon
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import { zhTW } from 'date-fns/locale';
import mongoose from 'mongoose';
import CloudinaryImage from '@/components/CloudinaryImage';
import { CloudinaryImageResource } from '@/lib/cloudinary/types';
import HostDetailView from '@/components/admin/HostDetailComponents';
import LocationMapViewer from '@/components/LocationMapViewer';

// 定義主辦方資料介面
interface IHost {
  _id: mongoose.Types.ObjectId | string;
  userId: mongoose.Types.ObjectId | string;
  name: string;
  slug: string;
  description: string;
  status: HostStatus;
  statusNote?: string;
  type: HostType;
  category: string;
  foundedYear?: number;
  teamSize?: number;
  languages: string[];
  verified: boolean;
  verifiedAt?: Date;
  contactInfo: {
    contactEmail: string;
    contactMobile: string;
    phone?: string;
    website?: string;
    contactHours?: string;
    socialMedia?: {
      facebook?: string;
      instagram?: string;
      threads?: string;
      line?: string;
      [key: string]: string | undefined;
    };
  };
  location: {
    address: string;
    city: string;
    district?: string;
    zipCode?: string;
    country: string;
    coordinates?: {
      type: string;
      coordinates: number[];
    };
    showExactLocation: boolean;
  };
  photos?: Array<{
    publicId: string;
    secureUrl: string;
    thumbnailUrl?: string;
    previewUrl?: string;
    originalUrl?: string;
    [key: string]: any;
  }>;
  photoDescriptions?: string[];
  videoIntroduction?: {
    url?: string;
    description?: string;
  };
  additionalMedia?: {
    virtualTour?: string;
    presentation?: string | {
      publicId: string;
      secureUrl: string;
      thumbnailUrl?: string;
      previewUrl?: string;
      originalUrl?: string;
    };
  };
  features?: string[];
  story?: string;
  experience?: string;
  environment?: {
    surroundings: string;
    accessibility?: string;
    nearbyAttractions?: string[];
  };
  amenities?: {
    basics?: {
      wifi?: boolean;
      parking?: boolean;
      elevator?: boolean;
      airConditioner?: boolean;
      heater?: boolean;
      washingMachine?: boolean;
    };
    accommodation?: {
      privateRoom?: boolean;
      sharedRoom?: boolean;
      camping?: boolean;
      kitchen?: boolean;
      bathroom?: boolean;
      sharedBathroom?: boolean;
    };
    workExchange?: {
      workingDesk?: boolean;
      internetAccess?: boolean;
      toolsProvided?: boolean;
      trainingProvided?: boolean;
      flexibleHours?: boolean;
    };
    lifestyle?: {
      petFriendly?: boolean;
      smokingAllowed?: boolean;
      childFriendly?: boolean;
      organic?: boolean;
      vegetarian?: boolean;
      ecoFriendly?: boolean;
    };
    activities?: {
      yoga?: boolean;
      meditation?: boolean;
      freeDiving?: boolean;
      scubaDiving?: boolean;
      hiking?: boolean;
      farmingActivities?: boolean;
      culturalExchange?: boolean;
    };
    customAmenities?: string[];
    amenitiesNotes?: string;
    workExchangeDescription?: string;
  };
  user?: {
    _id: string;
    name?: string;
    email?: string;
    image?: string;
  };
  createdAt: Date;
  updatedAt: Date;
  [key: string]: any;
}

// 主頁面組件
function HostDetail() {
  const router = useRouter();
  const { hostId } = router.query;
  const { data: session, status: sessionStatus } = useSession();
  const [host, setHost] = useState<IHost | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [statusNote, setStatusNote] = useState<string>('');
  const [showStatusModal, setShowStatusModal] = useState<boolean>(false);
  const [pendingStatus, setPendingStatus] = useState<HostStatus | null>(null);
  const [saving, setSaving] = useState<boolean>(false);

  // 載入主辦方資料
  useEffect(() => {
    if (typeof window !== 'undefined' && session && hostId) {
      // 檢查用戶權限
      if (session?.user?.role !== UserRole.ADMIN && session?.user?.role !== UserRole.SUPER_ADMIN) {
        router.push('/');
        return;
      }

      fetchHostData();
    }
  }, [session, router, hostId]);

  const fetchHostData = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/hosts/${hostId}`);
      if (response.ok) {
        const data = await response.json();
        setHost(data);
      } else {
        alert('無法獲取主辦方資料');
      }
    } catch (error) {
      console.error('獲取主辦方資料失敗', error);
    } finally {
      setLoading(false);
    }
  };

  // 處理狀態更新
  const handleStatusChange = (newStatus: HostStatus) => {
    setPendingStatus(newStatus);
    setShowStatusModal(true);
  };

  const confirmStatusChange = async () => {
    if (!pendingStatus) return;

    setSaving(true);
    try {
      const response = await fetch(`/api/admin/hosts/${hostId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: pendingStatus,
          statusNote: statusNote
        }),
      });

      if (response.ok) {
        // 更新狀態成功後先關閉模態框，再重新獲取數據
        setShowStatusModal(false);
        setPendingStatus(null);
        setStatusNote('');

        // 獲取更新後的數據
        setTimeout(() => {
          fetchHostData();
        }, 300); // 延遲執行，確保 DOM 有時間正確清理
      } else {
        const errorData = await response.json();
        alert(`更新失敗: ${errorData.message}`);
      }
    } catch (error) {
      console.error('更新主辦方狀態失敗', error);
      alert('更新主辦方狀態時發生錯誤，請稍後再試。');
    } finally {
      setSaving(false);
    }
  };

  // 處理登入狀態
  if (sessionStatus === 'loading' || loading) {
    return <div className="min-h-screen flex items-center justify-center">載入中...</div>;
  }

  if (!session || (session?.user?.role !== UserRole.ADMIN && session?.user?.role !== UserRole.SUPER_ADMIN)) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <h1 className="text-2xl font-bold mb-4">無權限訪問</h1>
        <p className="mb-6">您沒有管理員權限，無法訪問此頁面。</p>
        <Link href="/" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">返回首頁</Link>
      </div>
    );
  }

  if (!host) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <h1 className="text-2xl font-bold mb-4">找不到主辦方</h1>
        <p className="mb-6">無法找到指定的主辦方資料。</p>
        <Link href="/admin/hosts" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">返回主辦方列表</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <Head>
        <title>{host?.name ? `${host.name} - 主辦方詳情` : '主辦方詳情'} | 管理員</title>
      </Head>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link href="/admin/hosts" className="flex items-center text-gray-600 hover:text-gray-900">
            <ArrowLeftIcon className="h-4 w-4 mr-1" />
            返回主辦方列表
          </Link>
        </div>

        {/* 主辦方信息卡片 */}
        <div className="bg-white shadow rounded-lg overflow-hidden mb-8">
          {/* 封面照片 */}
          <div className="h-48 w-full relative bg-gray-200">
            {host.photos && host.photos.length > 0 ? (
              <CloudinaryImage
                resource={HostDetailView.convertToCloudinaryResource(host.photos[0])}
                alt={host.name}
                className="w-full h-full"
                containerClassName="h-full w-full"
                objectFit="cover"
                isPrivate={false}
                index={0}
              />
            ) : (
              <div className="h-full w-full flex items-center justify-center text-gray-400">
                無封面照片
              </div>
            )}
          </div>

          {/* 主要資訊 */}
          <div className="p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
              <div className="flex items-center mb-4 md:mb-0">
                <div className="mr-4 h-16 w-16 flex-shrink-0 relative">
                  {host.photos && host.photos.length > 0 ? (
                    <CloudinaryImage
                      resource={HostDetailView.convertToCloudinaryResource(host.photos[0])}
                      alt={host.name}
                      className="rounded-full w-full h-full"
                      containerClassName="h-full w-full"
                      objectFit="cover"
                      isPrivate={false}
                      index={0}
                    />
                  ) : (
                    <div className="h-16 w-16 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 text-xl">
                      {host.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">{host.name}</h1>
                  <div className="flex items-center mt-1 text-sm text-gray-600">
                    <span className="mr-3">{host.type}</span>
                    <span>{host.category}</span>
                  </div>
                </div>
              </div>
              <div className="flex flex-col md:items-end">
                <HostDetailView.StatusBadge status={host.status} />
                {host.statusNote && (
                  <p className="mt-2 text-sm text-gray-500">
                    狀態備註: {host.statusNote}
                  </p>
                )}
              </div>
            </div>

            {/* 主辦方描述 */}
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">主辦方描述</h2>
              <p className="text-gray-700 whitespace-pre-line">{host.description}</p>
              {host.story && (
                <div className="mt-4">
                  <h3 className="text-md font-medium text-gray-900 mb-1">主辦方故事</h3>
                  <p className="text-gray-700 whitespace-pre-line">{host.story}</p>
                </div>
              )}
              {host.experience && (
                <div className="mt-4">
                  <h3 className="text-md font-medium text-gray-900 mb-1">相關經驗</h3>
                  <p className="text-gray-700 whitespace-pre-line">{host.experience}</p>
                </div>
              )}
            </div>

            {/* 聯絡資訊 */}
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">聯絡資訊</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center">
                  <EnvelopeIcon className="h-5 w-5 text-gray-400 mr-2" />
                  <span className="text-gray-700">{host.contactInfo.contactEmail}</span>
                </div>
                {host.contactInfo.contactMobile && (
                  <div className="flex items-center">
                    <PhoneIcon className="h-5 w-5 text-gray-400 mr-2" />
                    <span className="text-gray-700">{host.contactInfo.contactMobile} (手機)</span>
                  </div>
                )}
                {host.contactInfo.phone && (
                  <div className="flex items-center">
                    <PhoneIcon className="h-5 w-5 text-gray-400 mr-2" />
                    <span className="text-gray-700">{host.contactInfo.phone}</span>
                  </div>
                )}
                {host.contactInfo.website && (
                  <div className="flex items-center">
                    <GlobeAltIcon className="h-5 w-5 text-gray-400 mr-2" />
                    <a href={host.contactInfo.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                      {host.contactInfo.website}
                    </a>
                  </div>
                )}
              </div>
              {host.contactInfo.socialMedia && Object.entries(host.contactInfo.socialMedia).length > 0 && (
                <div className="mt-4">
                  <h3 className="text-md font-medium text-gray-900 mb-2">社群媒體</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {host.contactInfo.socialMedia.facebook && (
                      <a href={host.contactInfo.socialMedia.facebook} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                        Facebook
                      </a>
                    )}
                    {host.contactInfo.socialMedia.instagram && (
                      <a href={host.contactInfo.socialMedia.instagram} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                        Instagram
                      </a>
                    )}
                    {host.contactInfo.socialMedia.threads && (
                      <a href={host.contactInfo.socialMedia.threads} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                        Threads
                      </a>
                    )}
                    {host.contactInfo.socialMedia.line && (
                      <span className="text-gray-700">Line: {host.contactInfo.socialMedia.line}</span>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* 地址資訊 */}
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">地址資訊</h2>
              <div className="flex items-start">
                <MapPinIcon className="h-5 w-5 text-gray-400 mr-2 mt-0.5" />
                <div>
                  <p className="text-gray-700">{host.location.address}</p>
                  <p className="text-gray-700">{host.location.city}, {host.location.district || ''} {host.location.zipCode || ''}</p>
                  <p className="text-gray-700">{host.location.country}</p>
                  {!host.location.showExactLocation && (
                    <p className="text-sm text-yellow-600 mt-2">注意：此主辦方選擇不公開確切位置</p>
                  )}
                </div>
              </div>

              {/* 地圖顯示 */}
              {host.location.coordinates && host.location.coordinates.coordinates && (
                <div className="mt-4">
                  <h3 className="text-md font-medium text-gray-900 mb-2">地圖位置</h3>
                  <div className="border border-gray-300 rounded-md overflow-hidden" style={{ height: '300px' }}>
                    <LocationMapViewer
                      key={`map-${host._id}-${host.updatedAt}`}
                      position={[
                        host.location.coordinates.coordinates[1],
                        host.location.coordinates.coordinates[0]
                      ]}
                      address={host.location.address}
                      city={host.location.city}
                      district={host.location.district}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    座標：{host.location.coordinates.coordinates[1].toFixed(6)}, {host.location.coordinates.coordinates[0].toFixed(6)}
                  </p>
                </div>
              )}

              {host.environment?.surroundings && (
                <div className="mt-4">
                  <h3 className="text-md font-medium text-gray-900 mb-1">周邊環境</h3>
                  <p className="text-gray-700">{host.environment.surroundings}</p>
                </div>
              )}
              {host.environment?.accessibility && (
                <div className="mt-2">
                  <h3 className="text-md font-medium text-gray-900 mb-1">交通方式</h3>
                  <p className="text-gray-700">{host.environment.accessibility}</p>
                </div>
              )}
              {host.environment?.nearbyAttractions && host.environment.nearbyAttractions.length > 0 && (
                <div className="mt-2">
                  <h3 className="text-md font-medium text-gray-900 mb-1">附近景點</h3>
                  <div className="flex flex-wrap gap-2">
                    {host.environment.nearbyAttractions.map((attraction, index) => (
                      <span key={index} className="px-2 py-1 bg-gray-100 rounded-md text-sm text-gray-700">
                        {attraction}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* 主辦方特色 */}
            {host.features && host.features.length > 0 && (
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-2">主辦方特色</h2>
                <div className="flex flex-wrap gap-2">
                  {host.features.map((feature, index) => (
                    <span key={index} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                      {feature}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* 基本資訊 */}
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">基本資訊</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center">
                  <CalendarIcon className="h-5 w-5 text-gray-400 mr-2" />
                  <span className="text-gray-700">成立年份: {host.foundedYear || '未提供'}</span>
                </div>
                <div className="flex items-center">
                  <UserIcon className="h-5 w-5 text-gray-400 mr-2" />
                  <span className="text-gray-700">團隊規模: {host.teamSize || '未提供'}</span>
                </div>
                <div className="flex items-center col-span-2">
                  <span className="text-gray-700">使用語言: {host.languages?.length ? host.languages.join(', ') : '未提供'}</span>
                </div>
              </div>
            </div>

            {/* 設施與服務 */}
            {host.amenities && (
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-2">設施與服務</h2>

                {/* 基本設施 */}
                {host.amenities.basics && Object.entries(host.amenities.basics).some(([_, value]) => value) && (
                  <div className="mb-4">
                    <h3 className="text-md font-medium text-gray-900 mb-2">基本設施</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {Object.entries(host.amenities.basics)
                        .filter(([_, value]) => value)
                        .map(([key, _]) => (
                          <div key={key} className="flex items-center">
                            <CheckIcon className="h-4 w-4 text-green-500 mr-2" />
                            <span className="text-gray-700">
                              {key.replace(/([A-Z])/g, ' $1').trim()}
                            </span>
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                {/* 住宿設施 */}
                {host.amenities.accommodation && Object.entries(host.amenities.accommodation).some(([_, value]) => value) && (
                  <div className="mb-4">
                    <h3 className="text-md font-medium text-gray-900 mb-2">住宿設施</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {Object.entries(host.amenities.accommodation)
                        .filter(([_, value]) => value)
                        .map(([key, _]) => (
                          <div key={key} className="flex items-center">
                            <CheckIcon className="h-4 w-4 text-green-500 mr-2" />
                            <span className="text-gray-700">
                              {key.replace(/([A-Z])/g, ' $1').trim()}
                            </span>
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                {/* 工作交換設施 */}
                {host.amenities.workExchange && Object.entries(host.amenities.workExchange).some(([_, value]) => value) && (
                  <div className="mb-4">
                    <h3 className="text-md font-medium text-gray-900 mb-2">工作交換設施</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {Object.entries(host.amenities.workExchange)
                        .filter(([_, value]) => value)
                        .map(([key, _]) => (
                          <div key={key} className="flex items-center">
                            <CheckIcon className="h-4 w-4 text-green-500 mr-2" />
                            <span className="text-gray-700">
                              {key.replace(/([A-Z])/g, ' $1').trim()}
                            </span>
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                {/* 生活方式 */}
                {host.amenities.lifestyle && Object.entries(host.amenities.lifestyle).some(([_, value]) => value) && (
                  <div className="mb-4">
                    <h3 className="text-md font-medium text-gray-900 mb-2">生活方式</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {Object.entries(host.amenities.lifestyle)
                        .filter(([_, value]) => value)
                        .map(([key, _]) => (
                          <div key={key} className="flex items-center">
                            <CheckIcon className="h-4 w-4 text-green-500 mr-2" />
                            <span className="text-gray-700">
                              {key.replace(/([A-Z])/g, ' $1').trim()}
                            </span>
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                {/* 活動 */}
                {host.amenities.activities && Object.entries(host.amenities.activities).some(([_, value]) => value) && (
                  <div className="mb-4">
                    <h3 className="text-md font-medium text-gray-900 mb-2">提供活動</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {Object.entries(host.amenities.activities)
                        .filter(([_, value]) => value)
                        .map(([key, _]) => (
                          <div key={key} className="flex items-center">
                            <CheckIcon className="h-4 w-4 text-green-500 mr-2" />
                            <span className="text-gray-700">
                              {key.replace(/([A-Z])/g, ' $1').trim()}
                            </span>
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                {/* 自定義設施 */}
                {host.amenities.customAmenities && host.amenities.customAmenities.length > 0 && (
                  <div className="mb-4">
                    <h3 className="text-md font-medium text-gray-900 mb-2">其他設施</h3>
                    <div className="flex flex-wrap gap-2">
                      {host.amenities.customAmenities.map((amenity, index) => (
                        <span key={index} className="px-2 py-1 bg-gray-100 rounded-md text-sm text-gray-700">
                          {amenity}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* 設施備註 */}
                {host.amenities.amenitiesNotes && (
                  <div className="mt-4">
                    <h3 className="text-md font-medium text-gray-900 mb-1">設施備註</h3>
                    <p className="text-gray-700 whitespace-pre-line">{host.amenities.amenitiesNotes}</p>
                  </div>
                )}

                {/* 工作交換說明 */}
                {host.amenities.workExchangeDescription && (
                  <div className="mt-4">
                    <h3 className="text-md font-medium text-gray-900 mb-1">工作交換說明</h3>
                    <p className="text-gray-700 whitespace-pre-line">{host.amenities.workExchangeDescription}</p>
                  </div>
                )}
              </div>
            )}

            {/* 照片集 */}
            {host.photos && host.photos.length > 0 && (
              <HostDetailView.PhotoGallery photos={host.photos} photoDescriptions={host.photoDescriptions} hostName={host.name} />
            )}

            {/* 額外媒體 */}
            {host.additionalMedia && (host.additionalMedia.virtualTour || host.additionalMedia.presentation) && (
              <HostDetailView.AdditionalMedia additionalMedia={host.additionalMedia} />
            )}

            {/* 影片介紹 */}
            {host.videoIntroduction?.url && (
              <HostDetailView.VideoPreview
                url={host.videoIntroduction.url}
                description={host.videoIntroduction.description}
              />
            )}

            {/* 申請日期 */}
            <div className="border-t pt-4 mt-6 text-right">
              <p className="text-sm text-gray-500">
                申請日期: {format(new Date(host.createdAt), 'yyyy年MM月dd日', { locale: zhTW })}
              </p>
              {host.verifiedAt && (
                <p className="text-sm text-gray-500">
                  驗證日期: {format(new Date(host.verifiedAt), 'yyyy年MM月dd日', { locale: zhTW })}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* 狀態管理按鈕 */}
        <div className="flex flex-wrap gap-4 mb-8">
          <HostDetailView.StatusActionButton
            status={host.status}
            onStatusChange={handleStatusChange}
            targetStatus={HostStatus.ACTIVE}
            icon={<CheckIcon className="h-5 w-5" />}
            color="bg-green-600 text-white"
            hoverColor="hover:bg-green-700"
            label="核准申請"
          />
          <HostDetailView.StatusActionButton
            status={host.status}
            onStatusChange={handleStatusChange}
            targetStatus={HostStatus.REJECTED}
            icon={<XMarkIcon className="h-5 w-5" />}
            color="bg-red-600 text-white"
            hoverColor="hover:bg-red-700"
            label="拒絕申請"
          />
          <HostDetailView.StatusActionButton
            status={host.status}
            onStatusChange={handleStatusChange}
            targetStatus={HostStatus.INACTIVE}
            icon={<ClockIcon className="h-5 w-5" />}
            color="bg-yellow-600 text-white"
            hoverColor="hover:bg-yellow-700"
            label="暫停帳號"
          />
          <HostDetailView.StatusActionButton
            status={host.status}
            onStatusChange={handleStatusChange}
            targetStatus={HostStatus.SUSPENDED}
            icon={<BanIcon className="h-5 w-5" />}
            color="bg-purple-600 text-white"
            hoverColor="hover:bg-purple-700"
            label="停用帳號"
          />
        </div>

        {/* 用戶前台連結 */}
        <div className="bg-white shadow rounded-lg p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">相關連結</h2>
          <div className="flex flex-col space-y-3">
            <Link href={`/hosts/${host._id}`} className="text-blue-600 hover:underline flex items-center">
              <GlobeAltIcon className="h-4 w-4 mr-1" />
              查看公開頁面
            </Link>
            <Link href={`/admin/users/${host.userId}`} className="text-blue-600 hover:underline flex items-center">
              <UserIcon className="h-4 w-4 mr-1" />
              查看用戶資料
            </Link>
            <Link href={`/admin/opportunities?hostId=${host._id}`} className="text-blue-600 hover:underline flex items-center">
              <BriefcaseIcon className="h-4 w-4 mr-1" />
              查看相關機會
            </Link>
          </div>
        </div>
      </div>

      {/* 狀態更新模態框 */}
      {showStatusModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-xl font-bold mb-4">變更主辦方狀態</h2>
            <p className="mb-4">
              確定要將主辦方 &quot;{host.name}&quot; 的狀態變更為
              {pendingStatus === HostStatus.ACTIVE && " 活躍"}
              {pendingStatus === HostStatus.REJECTED && " 拒絕"}
              {pendingStatus === HostStatus.INACTIVE && " 暫停"}
              {pendingStatus === HostStatus.SUSPENDED && " 停用"}
              嗎？
            </p>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2">
                狀態備註 (選填)
              </label>
              <textarea
                value={statusNote}
                onChange={(e) => setStatusNote(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                rows={3}
                placeholder="請輸入備註說明狀態變更原因"
              ></textarea>
            </div>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowStatusModal(false);
                  setPendingStatus(null);
                  setStatusNote('');
                }}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50"
                disabled={saving}
              >
                取消
              </button>
              <button
                onClick={confirmStatusChange}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                disabled={saving}
              >
                {saving ? '處理中...' : '確認變更'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// 導出組件
export default HostDetail;