import React, { useState, useEffect, useRef, Fragment } from 'react';
import { CloudinaryImageResource } from '@/lib/cloudinary/types';
import { getSignedUrls, createCloudinaryImageConfig } from '@/lib/cloudinary/utils';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface CloudinaryImageProps {
  resource: CloudinaryImageResource;
  alt?: string;
  className?: string;
  containerClassName?: string;
  objectFit?: 'cover' | 'contain' | 'fill';
  width?: string | number;
  height?: string | number;
  fallbackText?: string;
  isPrivate?: boolean;
  index?: number;
  onError?: (e: React.SyntheticEvent<HTMLImageElement, Event>) => void;
}

/**
 * CloudinaryImage 組件
 * 用於直接顯示 Cloudinary 圖片，特別適合處理私有資源
 * 支援獲取簽名URL以訪問受限制的私有資源
 */
const CloudinaryImage: React.FC<CloudinaryImageProps> = ({
  resource,
  alt,
  className = '',
  containerClassName = '',
  objectFit = 'cover',
  width,
  height,
  fallbackText = '圖片載入失敗',
  isPrivate = false,
  index,
  onError
}) => {
  const [imageUrl, setImageUrl] = useState<string>('');
  const [fullSizeImageUrl, setFullSizeImageUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<boolean>(false);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  // 在組件掛載時或資源變更時獲取簽名URL
  useEffect(() => {
    if (!resource || !resource.public_id) {
      setLoadError(true);
      setIsLoading(false);
      return;
    }

    // 標準模式：直接使用預設URL
    if (!isPrivate) {
      setImageUrl(resource.previewUrl || resource.secure_url || '');
      setFullSizeImageUrl(resource.secure_url || '');
      setIsLoading(false);
      return;
    }

    // 私有資源模式：嘗試獲取私有下載URL
    setIsLoading(true);
    setLoadError(false);

    // 如果已有簽名URLs，直接使用
    if (resource.signedUrls) {
      console.log('使用已有簽名URL:', resource.public_id);
      // 優先使用私有下載URL
      if (resource.signedUrls.privateDownload && resource.signedUrls.privateDownload.previewUrl) {
        console.log('使用 privateDownload 方式訪問:', resource.signedUrls.privateDownload.previewUrl);
        setImageUrl(resource.signedUrls.privateDownload.previewUrl);
        setFullSizeImageUrl(resource.signedUrls.privateDownload.originalUrl || resource.signedUrls.privateDownload.previewUrl);
      } else {
        // 若無私有下載URL，則使用預設URL
        console.log('使用預設URL訪問:', resource.signedUrls.previewUrl);
        setImageUrl(resource.signedUrls.previewUrl || '');
        setFullSizeImageUrl(resource.signedUrls.originalUrl || resource.signedUrls.previewUrl || '');
      }
      setIsLoading(false);
    } else {
      // 否則從API獲取簽名URL
      getSignedUrls(resource.public_id)
        .then(signedUrls => {
          console.log('成功獲取簽名URL:', resource.public_id);
          resource.signedUrls = signedUrls;

          // 優先使用私有下載URL
          if (signedUrls.privateDownload && signedUrls.privateDownload.previewUrl) {
            console.log('使用 privateDownload 方式訪問:', signedUrls.privateDownload.previewUrl);
            setImageUrl(signedUrls.privateDownload.previewUrl);
            setFullSizeImageUrl(signedUrls.privateDownload.originalUrl || signedUrls.privateDownload.previewUrl);
          } else {
            // 若無私有下載URL，則使用預設URL
            console.log('使用預設URL訪問:', signedUrls.previewUrl);
            setImageUrl(signedUrls.previewUrl || '');
            setFullSizeImageUrl(signedUrls.originalUrl || signedUrls.previewUrl || '');
          }
        })
        .catch(error => {
          console.error('獲取簽名URL失敗:', error);
          setLoadError(true);
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [resource, isPrivate]);

  // 圖片載入錯誤處理
  const handleError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    console.error(`圖片載入失敗: ${imageUrl}`);

    // 設置錯誤狀態
    setLoadError(true);

    // 隱藏錯誤的圖片
    e.currentTarget.style.display = 'none';

    // 調用自定義錯誤處理函數
    if (onError) {
      onError(e);
    }
  };

  // 打開模態窗
  const openModal = () => {
    if (!isLoading && !loadError) {
      setIsModalOpen(true);
    }
  };

  // 獲取圖片配置
  const imageConfig = createCloudinaryImageConfig({
    resource,
    alt,
    className,
    objectFit,
    width,
    height,
    fallbackText,
    isPrivate,
    index
  });

  return (
    <>
      <div
        className={`relative ${containerClassName} ${!isLoading && !loadError ? 'cursor-pointer' : ''}`}
        onClick={openModal}
      >
        {isLoading ? (
          // 載入中狀態
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-600"></div>
          </div>
        ) : loadError ? (
          // 載入錯誤狀態
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
            <span className="text-red-500">{fallbackText}</span>
          </div>
        ) : (
          // 圖片載入成功
          <>
            <img
              src={imageUrl || imageConfig.imageUrl}
              alt={imageConfig.alt}
              className={`${imageConfig.className} ${!isLoading && !loadError ? 'hover:opacity-90 transition-opacity' : ''}`}
              style={{
                objectFit: imageConfig.style.objectFit as 'cover' | 'contain' | 'fill',
                width: imageConfig.style.width,
                height: imageConfig.style.height
              }}
              onError={handleError}
            />
            <div className="hidden absolute inset-0 flex items-center justify-center bg-gray-100">
              <span className="text-red-500">{imageConfig.fallbackText}</span>
            </div>
          </>
        )}
      </div>

      {/* 圖片預覽模態窗 */}
      <Transition appear show={isModalOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => setIsModalOpen(false)}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black bg-opacity-75" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-4xl transform overflow-hidden rounded-lg bg-black p-1 text-left align-middle shadow-xl transition-all">
                  <div className="relative">
                    <button
                      type="button"
                      className="absolute top-2 right-2 z-10 rounded-full bg-black bg-opacity-50 p-2 text-white hover:bg-opacity-70"
                      onClick={() => setIsModalOpen(false)}
                    >
                      <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                    </button>
                    <img
                      src={fullSizeImageUrl}
                      alt={imageConfig.alt}
                      className="w-full h-auto max-h-[80vh] object-contain"
                      onError={handleError}
                    />
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </>
  );
};

export default CloudinaryImage;