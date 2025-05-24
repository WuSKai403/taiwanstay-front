import { OpportunityDetail } from './constants';
import CloudinaryImage from '@/components/CloudinaryImage';
import { CloudinaryImageResource, createImageResourceFromUrl } from '@/lib/cloudinary/types';
import Image from 'next/image';
import { MediaImage, OpportunityMedia as MediaType } from '@/lib/types/media';

// 擴展現有的 media 接口，添加我們需要的額外屬性
interface ExtendedMedia {
  coverImage?: string | MediaImage | CloudinaryImageResource;
  images?: Array<string | MediaImage | CloudinaryImageResource>;
  videoUrl?: string;
  videoDescription?: string;
  virtualTour?: string;
  descriptions?: string[];
}

interface OpportunityMediaProps {
  opportunity?: OpportunityDetail;
  media?: MediaType;
  isPreview?: boolean;
  className?: string;
}

const OpportunityMedia: React.FC<OpportunityMediaProps> = ({ opportunity, media: directMedia, isPreview = false, className = '' }) => {
  // 優先使用直接傳入的 media，如果沒有則從 opportunity 中獲取
  const media = directMedia || (opportunity ? opportunity.media : undefined);
  const title = opportunity?.title || '機會預覽';

  if (!media) {
    return (
      <div className={`mb-6 ${className}`}>
        <h3 className="text-xl font-bold mb-4">媒體資料</h3>
        <p className="text-gray-500">未提供媒體資料</p>
      </div>
    );
  }

  // 將 MediaImage 轉換為 CloudinaryImageResource 的輔助函數
  const convertToCloudinaryResource = (image: MediaImage | CloudinaryImageResource): CloudinaryImageResource => {
    if ('thumbnailUrl' in image && typeof image.thumbnailUrl === 'string') {
      // 已經是 CloudinaryImageResource
      return image as CloudinaryImageResource;
    }

    // 將 MediaImage 轉換為 CloudinaryImageResource
    return {
      publicId: image.publicId,
      secureUrl: image.secureUrl,
      url: image.url || image.secureUrl,
      thumbnailUrl: image.thumbnailUrl || image.secureUrl,
      previewUrl: image.previewUrl || image.secureUrl,
      alt: image.alt || '',
      format: image.format || '',
      version: image.version || ''
    };
  };

  // 渲染封面圖片
  const renderCoverImage = () => {
    if (!media.coverImage) return null;

    if (isPreview) {
      // 處理不同類型的封面圖片資源
      let coverResource: CloudinaryImageResource;

      if (typeof media.coverImage === 'string') {
        coverResource = createImageResourceFromUrl(media.coverImage, `cover_preview`);
      } else {
        coverResource = convertToCloudinaryResource(media.coverImage);
      }

      return (
        <div className="relative rounded-lg overflow-hidden aspect-[2/1]">
          <CloudinaryImage
            resource={coverResource}
            alt={coverResource.alt || title}
            className="w-full h-full object-cover"
            objectFit="cover"
            isPrivate={false}
            index={0}
          />
        </div>
      );
    } else {
      // 獲取圖片URL
      let imageUrl = '';
      let altText = title;

      if (typeof media.coverImage === 'string') {
        imageUrl = media.coverImage;
      } else if (media.coverImage) {
        imageUrl = media.coverImage.secureUrl || media.coverImage.url || '';
        altText = media.coverImage.alt || title;
      }

      return (
        <div className="relative w-full h-64 md:h-80">
          <Image
            src={imageUrl}
            alt={altText}
            layout="fill"
            objectFit="cover"
          />
        </div>
      );
    }
  };

  // 渲染圖片集
  const renderImageGallery = () => {
    const images = media.images || [];
    if (images.length === 0) {
      return (
        <div className="bg-gray-100 rounded-lg h-32 flex items-center justify-center">
          <p className="text-gray-500">無圖片</p>
        </div>
      );
    }

    if (isPreview) {
      return (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
          {images.map((image, index) => {
            // 處理不同類型的圖片資源
            let imageResource: CloudinaryImageResource;

            if (typeof image === 'string') {
              imageResource = createImageResourceFromUrl(image, `opportunity_preview_${index}`);
            } else {
              imageResource = convertToCloudinaryResource(image);
            }

            return (
              <div key={index} className="relative h-48 bg-gray-100 rounded-lg overflow-hidden">
                <CloudinaryImage
                  resource={imageResource}
                  alt={imageResource.alt || `照片 ${index + 1}`}
                  className="h-full w-full object-cover"
                  objectFit="cover"
                  isPrivate={false}
                  index={index}
                />
                {media.descriptions && Array.isArray(media.descriptions) && media.descriptions[index] && (
                  <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 p-2">
                    <p className="text-xs text-white">{media.descriptions[index]}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      );
    } else {
      return (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {images.map((image, index) => {
            // 獲取圖片URL
            let imageUrl = '';
            let altText = `${title} 圖片 ${index + 1}`;

            if (typeof image === 'string') {
              imageUrl = image;
            } else if (image) {
              imageUrl = image.secureUrl || image.url || '';
              altText = image.alt || `${title} 圖片 ${index + 1}`;
            }

            return (
              <div key={index} className="relative aspect-square">
                <Image
                  src={imageUrl}
                  alt={altText}
                  layout="fill"
                  objectFit="cover"
                  className="rounded-md"
                />
              </div>
            );
          })}
        </div>
      );
    }
  };

  // 渲染影片
  const renderVideo = () => {
    if (!media.videoUrl) return null;

    // 處理 YouTube 影片連結
    let videoSrc = media.videoUrl;
    if (videoSrc.includes('youtube.com/watch?v=')) {
      videoSrc = videoSrc.replace('watch?v=', 'embed/');
    } else if (videoSrc.includes('youtu.be/')) {
      videoSrc = videoSrc.replace('youtu.be/', 'youtube.com/embed/');
    }

    return (
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3">影片介紹</h3>
        <div className="relative pt-[56.25%]">
          <iframe
            className="absolute top-0 left-0 w-full h-full rounded-lg"
            src={videoSrc}
            title={media.videoDescription || "機會影片"}
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          ></iframe>
        </div>
        {media.videoDescription && (
          <p className="mt-2 text-sm text-gray-600">{media.videoDescription}</p>
        )}
      </div>
    );
  };

  // 渲染虛擬導覽
  const renderVirtualTour = () => {
    if (!media.virtualTour) return null;

    // 檢查是否為已嵌入格式的虛擬導覽代碼
    const isEmbedded = media.virtualTour.includes('<iframe') || media.virtualTour.includes('<div');

    if (isEmbedded) {
      return (
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3">虛擬導覽</h3>
          <div className="virtualTour-container" dangerouslySetInnerHTML={{ __html: media.virtualTour }}></div>
        </div>
      );
    }

    return (
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3">虛擬導覽</h3>
        <div className="relative pt-[56.25%]">
          <iframe
            className="absolute top-0 left-0 w-full h-full rounded-lg"
            src={media.virtualTour}
            title="虛擬導覽"
            frameBorder="0"
            allowFullScreen
          ></iframe>
        </div>
      </div>
    );
  };

  return (
    <div>
      {/* 主要圖片 */}
      {renderCoverImage()}

      {/* 圖片集 */}
      {media.images && media.images.length > 0 && (
        <div className="mb-6">
          <h3 className="text-xl font-bold mb-4">圖片集</h3>
          {renderImageGallery()}
        </div>
      )}

      {/* 影片 */}
      {renderVideo()}

      {/* 虛擬導覽 */}
      {renderVirtualTour()}
    </div>
  );
};

export default OpportunityMedia;