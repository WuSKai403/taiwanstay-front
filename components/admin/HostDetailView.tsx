import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { HostStatus } from '@/models/enums/HostStatus';
import { format } from 'date-fns';
import { zhTW } from 'date-fns/locale';
import {
  ArrowLeftIcon,
  UserIcon,
  MapPinIcon,
  PhoneIcon,
  GlobeAltIcon,
  BriefcaseIcon,
  EnvelopeIcon,
} from '@heroicons/react/24/outline';
import CloudinaryImage from '@/components/CloudinaryImage';
import { CloudinaryImageResource } from '@/lib/cloudinary/types';

// === 輔助函數 ===

// 將 Host 照片格式轉換為 CloudinaryImageResource 格式
const convertToCloudinaryResource = (photo: any): CloudinaryImageResource => {
  return {
    public_id: photo.publicId || "",
    secure_url: photo.secureUrl || "",
    thumbnailUrl: photo.thumbnailUrl || photo.secureUrl || "",
    previewUrl: photo.previewUrl || photo.secureUrl || ""
  };
};

// 判斷是否應該顯示特定狀態按鈕
const shouldShowButton = (currentStatus: HostStatus, targetStatus: HostStatus): boolean => {
  switch (targetStatus) {
    case HostStatus.ACTIVE:
      return currentStatus === HostStatus.PENDING || currentStatus === HostStatus.INACTIVE;
    case HostStatus.REJECTED:
      return currentStatus === HostStatus.PENDING;
    case HostStatus.INACTIVE:
      return currentStatus === HostStatus.ACTIVE;
    case HostStatus.SUSPENDED:
      return currentStatus === HostStatus.ACTIVE || currentStatus === HostStatus.INACTIVE;
    default:
      return false;
  }
};

// === 接口定義 ===

// 狀態處理按鈕組件接口
interface StatusActionButtonProps {
  status: HostStatus;
  onStatusChange: (status: HostStatus) => void;
  targetStatus: HostStatus;
  icon: React.ReactNode;
  color: string;
  hoverColor: string;
  label: string;
}

// === 組件定義 ===

// 影片處理組件
const VideoPreview: React.FC<{ url: string; description?: string }> = ({ url, description }) => {
  if (!url) return null;

  const videoUrl = url || '';

  // 解析組件
  const renderVideoEmbed = () => {
    // YouTube 影片處理
    if (videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be')) {
      // 解析不同格式的YouTube網址
      let videoId = '';
      if (videoUrl.includes('youtube.com/watch?v=')) {
        const urlParams = new URLSearchParams(videoUrl.split('?')[1]);
        videoId = urlParams.get('v') || '';
      } else if (videoUrl.includes('youtu.be/')) {
        videoId = videoUrl.split('youtu.be/')[1]?.split('?')[0] || '';
      } else if (videoUrl.includes('youtube.com/embed/')) {
        videoId = videoUrl.split('youtube.com/embed/')[1]?.split('?')[0] || '';
      }

      if (videoId) {
        return (
          <iframe
            src={`https://www.youtube.com/embed/${videoId}`}
            title="YouTube video player"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="w-full h-full rounded-lg"
          ></iframe>
        );
      }
    }

    // Vimeo 影片處理
    if (videoUrl.includes('vimeo.com')) {
      const vimeoId = videoUrl.split('vimeo.com/')[1]?.split('?')[0] || '';
      if (vimeoId) {
        return (
          <iframe
            src={`https://player.vimeo.com/video/${vimeoId}`}
            title="Vimeo video player"
            frameBorder="0"
            allow="autoplay; fullscreen; picture-in-picture"
            allowFullScreen
            className="w-full h-full rounded-lg"
          ></iframe>
        );
      }
    }

    // 無法識別的影片連結
    return (
      <div className="bg-gray-100 p-4 rounded-lg text-center">
        <a
          href={videoUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:underline"
        >
          {videoUrl}
        </a>
        <p className="text-sm text-gray-500 mt-2">
          無法嵌入影片，請點擊連結在新視窗中查看
        </p>
      </div>
    );
  };

  return (
    <div className="mb-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-2">影片介紹</h2>
      <div className="aspect-w-16 aspect-h-9">
        {renderVideoEmbed()}
      </div>
      {description && (
        <p className="mt-2 text-sm text-gray-600">
          {description}
        </p>
      )}
    </div>
  );
};

// 照片集組件
const PhotoGallery: React.FC<{ photos: any[]; photoDescriptions?: string[]; hostName: string }> = ({
  photos,
  photoDescriptions,
  hostName
}) => {
  if (!photos || photos.length === 0) return null;

  return (
    <div className="mb-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-2">照片集</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {photos.map((photo: any, index: number) => (
          <div key={`photo-${index}`} className="relative h-40 rounded-lg overflow-hidden">
            <CloudinaryImage
              resource={convertToCloudinaryResource(photo)}
              alt={`${hostName} 照片 ${index + 1}`}
              className="w-full h-full"
              containerClassName="h-full w-full"
              objectFit="cover"
              isPrivate={false}
              index={index}
            />
            {photoDescriptions?.[index] && (
              <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white p-2 text-sm">
                {photoDescriptions[index]}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

// 狀態標籤組件
const StatusBadge: React.FC<{ status: HostStatus }> = ({ status }) => {
  const statusConfig: Record<HostStatus, { text: string; bgColor: string; textColor: string }> = {
    [HostStatus.PENDING]: { text: '待審核', bgColor: 'bg-yellow-100', textColor: 'text-yellow-800' },
    [HostStatus.ACTIVE]: { text: '活躍中', bgColor: 'bg-green-100', textColor: 'text-green-800' },
    [HostStatus.INACTIVE]: { text: '暫停中', bgColor: 'bg-gray-100', textColor: 'text-gray-800' },
    [HostStatus.REJECTED]: { text: '已拒絕', bgColor: 'bg-red-100', textColor: 'text-red-800' },
    [HostStatus.SUSPENDED]: { text: '已暫停', bgColor: 'bg-purple-100', textColor: 'text-purple-800' },
    [HostStatus.EDITING]: { text: '編輯中', bgColor: 'bg-blue-100', textColor: 'text-blue-800' }
  };

  const config = statusConfig[status] || { text: '未知', bgColor: 'bg-gray-100', textColor: 'text-gray-800' };

  return (
    <span className={`px-3 py-1 rounded-full text-sm font-medium ${config.bgColor} ${config.textColor}`}>
      {config.text}
    </span>
  );
};

// 額外媒體組件
const AdditionalMedia: React.FC<{
  additionalMedia: {
    virtualTour?: string;
    presentation?: string | { secureUrl: string; publicId: string }
  }
}> = ({ additionalMedia }) => {
  if (!additionalMedia || (!additionalMedia.virtualTour && !additionalMedia.presentation)) return null;

  return (
    <div className="mb-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-2">額外媒體</h2>
      <div className="space-y-4">
        {additionalMedia.virtualTour && (
          <div>
            <h3 className="text-md font-medium text-gray-900 mb-1">虛擬導覽</h3>
            <a href={additionalMedia.virtualTour}
               target="_blank"
               rel="noopener noreferrer"
               className="text-blue-600 hover:underline">
              查看虛擬導覽
            </a>
          </div>
        )}
        {additionalMedia.presentation && (
          <div>
            <h3 className="text-md font-medium text-gray-900 mb-1">簡報資料</h3>
            <a href={
                typeof additionalMedia.presentation === 'object'
                  ? additionalMedia.presentation.secureUrl
                  : additionalMedia.presentation
              }
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline">
              查看簡報
            </a>
          </div>
        )}
      </div>
    </div>
  );
};

// 狀態處理按鈕組件
const StatusActionButton: React.FC<StatusActionButtonProps> = ({
  status,
  onStatusChange,
  targetStatus,
  icon,
  color,
  hoverColor,
  label
}) => {
  if (!shouldShowButton(status, targetStatus)) {
    return null;
  }

  return (
    <button
      onClick={() => onStatusChange(targetStatus)}
      className={`flex items-center px-4 py-2 rounded-md font-medium ${color} ${hoverColor} transition-colors`}
    >
      {icon}
      <span className="ml-2">{label}</span>
    </button>
  );
};

// === 導出 ===
// 使用默認導出方式，將所有組件收集到一個對象中
const HostDetailView = {
  convertToCloudinaryResource,
  VideoPreview,
  PhotoGallery,
  StatusBadge,
  AdditionalMedia,
  StatusActionButton
};

export default HostDetailView;