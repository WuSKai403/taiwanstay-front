import React, { useState, useEffect, useRef, Fragment, useCallback } from 'react';
import { CloudinaryImageResource } from '@/lib/cloudinary/types';
import { getSignedUrls, createCloudinaryImageConfig, getOptimizedImageUrl } from '@/lib/cloudinary/utils';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { useQuery } from '@tanstack/react-query';
import { getCachedImage, cacheImage } from '@/lib/cache/imageCache';
import { toast } from 'react-hot-toast';

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
 * 優化：使用 React Query 緩存減少 API 請求
 * 優化：使用 IndexedDB 緩存圖片數據減少重複下載
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
  // 基本狀態
  const [imageUrl, setImageUrl] = useState<string>('');
  const [fullSizeImageUrl, setFullSizeImageUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<boolean>(false);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [loadOriginal, setLoadOriginal] = useState<boolean>(false);
  const [imageSource, setImageSource] = useState<'cache' | 'network' | 'none'>('none');
  const [imageObjectUrl, setImageObjectUrl] = useState<string | null>(null);
  const [originalObjectUrl, setOriginalObjectUrl] = useState<string | null>(null);
  const [isLoadingHighRes, setIsLoadingHighRes] = useState<boolean>(false);

  // 定義 localStorage 緩存鍵名
  const localStorageKey = useRef<string>(`cloudinary_${resource?.public_id}_${isPrivate ? 'private' : 'public'}`);

  // 從 localStorage 獲取緩存
  const getLocalCache = useCallback(() => {
    if (!resource?.public_id) return null;

    try {
      const cachedData = localStorage.getItem(localStorageKey.current);
      if (cachedData) {
        const parsedData = JSON.parse(cachedData);

        // 檢查緩存是否過期 (55 分鐘)
        const now = Date.now();
        if (parsedData.expires && parsedData.expires > now) {
          console.log('%c[緩存] - 使用 localStorage 緩存', 'background:#8BC34A;color:white;padding:3px 6px;border-radius:3px;', {
            publicId: resource.public_id,
            來源: 'localStorage',
            剩餘分鐘: Math.round((parsedData.expires - now) / 60000)
          });
          return parsedData;
        } else {
          // 緩存過期，刪除
          localStorage.removeItem(localStorageKey.current);
        }
      }
    } catch (error) {
      console.error('讀取localStorage緩存錯誤:', error);
    }
    return null;
  }, [resource?.public_id]);

  // 保存數據到 localStorage
  const saveToLocalCache = useCallback((data: any) => {
    if (!resource?.public_id || !data) return;

    try {
      // 設置 55 分鐘過期時間
      const expires = Date.now() + 55 * 60 * 1000;
      const cacheData = {
        ...data,
        expires
      };

      localStorage.setItem(localStorageKey.current, JSON.stringify(cacheData));
    } catch (error) {
      console.error('保存到localStorage緩存錯誤:', error);
    }
  }, [resource?.public_id]);

  // 從IndexedDB檢查圖片緩存
  const checkImageCache = useCallback(async (publicId: string, type: 'thumbnail' | 'preview' | 'original' = 'preview') => {
    if (!publicId) return null;

    try {
      // 嘗試從IndexedDB獲取圖片
      const cachedImage = await getCachedImage(publicId, type);

      if (cachedImage) {
        console.log('%c[緩存] - 使用IndexedDB緩存', 'background:#4CAF50;color:white;padding:3px 6px;border-radius:3px;', {
          publicId,
          type,
          來源: 'IndexedDB'
        });
        return cachedImage;
      }
    } catch (error) {
      console.error('檢查圖片緩存失敗:', error);
    }
    return null;
  }, []);

  // 檢查是否已經緩存過圖片 - 改為異步函數
  const hasCachedImage = useCallback(async (publicId: string, type: 'thumbnail' | 'preview' | 'original', url: string) => {
    if (!publicId) return false;

    // 創建緩存標識
    const urlHash = btoa(url).slice(0, 20);
    const cacheKey = `img_cache_${publicId}_${type}_${urlHash}`;
    const cachedTimestamp = localStorage.getItem(cacheKey);

    if (cachedTimestamp) {
      // 檢查緩存是否過期
      const cacheTime = parseInt(cachedTimestamp);
      const now = Date.now();
      const threeDays = 3 * 24 * 60 * 60 * 1000;

      if (now - cacheTime > threeDays) {
        // 緩存超過3天，刪除標記
        localStorage.removeItem(cacheKey);
        return false;
      }

      // 驗證 IndexedDB 中是否真的有數據
      try {
        const cachedImage = await getCachedImage(publicId, type);
        return !!cachedImage; // 如果有數據返回 true，否則返回 false
      } catch (err) {
        console.error('檢查 IndexedDB 緩存失敗:', err);
        return false;
      }
    }
    return false;
  }, []);

  // 使用React Query緩存請求
  const { data: signedUrls, isError } = useQuery({
    queryKey: ['cloudinarySignedUrl', resource?.public_id, isPrivate],
    queryFn: async () => {
      if (!resource?.public_id || !isPrivate) return null;

      // 先檢查 localStorage 緩存
      const localCache = getLocalCache();
      if (localCache) {
        return localCache;
      }

      // 無緩存時發起請求
      const result = await getSignedUrls(resource.public_id);

      // 緩存結果到 localStorage
      saveToLocalCache(result);

      return result;
    },
    enabled: !!resource?.public_id && isPrivate,
    staleTime: 55 * 60 * 1000, // 55分鐘內不重新獲取
    gcTime: 24 * 60 * 60 * 1000, // 保留緩存24小時
    retry: 1, // 僅重試一次以減少API調用
  });

  // 統一的圖片加載流程
  const loadImage = useCallback(async (publicId: string, type: 'preview' | 'original' = 'preview', signedUrl?: string) => {
    if (!publicId) return null;

    // 1. 檢查 IndexedDB 緩存
    const cachedImage = await checkImageCache(publicId, type);
    if (cachedImage) {
      if (type === 'preview') {
        setImageUrl(cachedImage);
        setImageSource('cache');
      } else {
        setOriginalObjectUrl(cachedImage);
      }
      return cachedImage;
    }

    // 2. 使用 privateDownload URL
    if (signedUrl) {
      if (type === 'preview') {
        setImageUrl(signedUrl);
        setImageSource('network');
      } else {
        setFullSizeImageUrl(signedUrl);
      }

      // 背景緩存
      cacheImage(publicId, signedUrl, type)
        .then(() => {
          // 緩存成功，記錄到localStorage避免重複操作
          const urlHash = btoa(signedUrl).slice(0, 20);
          const cacheKey = `img_cache_${publicId}_${type}_${urlHash}`;
          localStorage.setItem(cacheKey, Date.now().toString());
        })
        .catch(err => console.error('緩存圖片失敗:', err));

      return signedUrl;
    }

    // 3. 失敗處理
    if (type === 'preview') {
      setLoadError(true);
    }
    return null;
  }, [checkImageCache]);

  // 初始化時檢查圖片緩存
  useEffect(() => {
    const initializeImage = async () => {
      if (!resource?.public_id) {
        setLoadError(true);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setLoadError(false);

      // 先檢查緩存中是否有圖片
      const cachedImage = await checkImageCache(resource.public_id, 'preview');

      if (cachedImage) {
        // 緩存命中
        setImageUrl(cachedImage);
        setImageObjectUrl(cachedImage);
        setImageSource('cache');
        setIsLoading(false);
        return;
      }

      // 非私有資源：直接使用優化的公開URL
      if (!isPrivate) {
        const optimizedPreviewUrl = getOptimizedImageUrl(
          resource.previewUrl || resource.secure_url || '',
          'preview'
        );

        setImageUrl(optimizedPreviewUrl);
        setIsLoading(false);
        setImageSource('network');

        // 背景緩存圖片
        cacheImage(resource.public_id, optimizedPreviewUrl, 'preview');
      }
    };

    initializeImage();
  }, [resource?.public_id, isPrivate, checkImageCache]);

  // 處理私有資源的簽名URL
  useEffect(() => {
    if (!isPrivate || !resource?.public_id || imageSource === 'cache') return;

    if (signedUrls) {
      // 優先使用私有下載URL
      if (signedUrls.privateDownload?.previewUrl) {
        loadImage(resource.public_id, 'preview', signedUrls.privateDownload.previewUrl);
      } else if (signedUrls.previewUrl) {
        loadImage(resource.public_id, 'preview', signedUrls.previewUrl);
      }

      setIsLoading(false);
    }

    if (isError) {
      console.error('獲取簽名URL失敗:', resource.public_id);
      setLoadError(true);
      setIsLoading(false);
    }
  }, [resource, isPrivate, signedUrls, isError, imageSource, loadImage]);

  // 當模態窗打開時，加載高解析度圖片
  useEffect(() => {
    if (isModalOpen && resource?.public_id) {
      const loadHighResImage = async () => {
        setIsLoadingHighRes(true);

        // 1. 檢查緩存中是否有高解析度圖片
        const cachedOriginal = await checkImageCache(resource.public_id, 'original');
        if (cachedOriginal) {
          setOriginalObjectUrl(cachedOriginal);
          setLoadOriginal(true);
          setIsLoadingHighRes(false);
          return;
        }

        // 2. 使用已有的簽名URL
        if (signedUrls?.privateDownload?.originalUrl) {
          loadImage(resource.public_id, 'original', signedUrls.privateDownload.originalUrl);
          setLoadOriginal(true);
          setIsLoadingHighRes(false);
          return;
        }

        // 3. 對於私有資源，請求專門的原圖URL
        if (isPrivate) {
          try {
            const result = await getSignedUrls(resource.public_id, 'original');
            if (result.privateDownload?.originalUrl) {
              loadImage(resource.public_id, 'original', result.privateDownload.originalUrl);
              setLoadOriginal(true);
            }
          } catch (err) {
            console.error('獲取高解析度圖片URL失敗:', err);
            toast.error('無法載入高解析度圖片');
          }
        } else {
          // 4. 對於公開資源，使用優化的URL
          const optimizedOriginalUrl = getOptimizedImageUrl(
            resource.secure_url || '',
            'original'
          );
          loadImage(resource.public_id, 'original', optimizedOriginalUrl);
          setLoadOriginal(true);
        }

        setIsLoadingHighRes(false);
      };

      loadHighResImage();
    }

    return () => {
      if (!isModalOpen) {
        setLoadOriginal(false);
      }
    };
  }, [isModalOpen, resource?.public_id, signedUrls, isPrivate, checkImageCache, loadImage]);

  // 釋放ObjectURL以防止內存泄漏
  useEffect(() => {
    return () => {
      if (imageObjectUrl && imageObjectUrl.startsWith('blob:')) {
        URL.revokeObjectURL(imageObjectUrl);
      }
      if (originalObjectUrl && originalObjectUrl.startsWith('blob:')) {
        URL.revokeObjectURL(originalObjectUrl);
      }
    };
  }, [imageObjectUrl, originalObjectUrl]);

  // 圖片載入錯誤處理
  const handleError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    console.error('圖片載入失敗:', imageUrl);
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
              loading="lazy"
              decoding="async"
              onError={handleError}
            />

            {/* 圖片來源指示器 - 開發模式下可見 */}
            {process.env.NODE_ENV === 'development' && (
              <div className="absolute bottom-0 right-0 text-xs px-1 rounded bg-black bg-opacity-60 text-white">
                {imageSource === 'cache' ? '緩存' : '網絡'}
              </div>
            )}
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

                    {/* 預覽圖像 - 顯示到高解析度圖片載入完成 */}
                    <img
                      src={imageUrl}
                      alt={imageConfig.alt}
                      className={`w-full h-auto max-h-[80vh] object-contain ${loadOriginal && (originalObjectUrl || fullSizeImageUrl) ? 'opacity-0' : 'opacity-100'}`}
                      style={{
                        transition: "opacity 0.3s",
                        position: loadOriginal ? 'absolute' : 'static',
                        inset: 0
                      }}
                    />

                    {/* 高解析度圖片 */}
                    {loadOriginal && (
                      <img
                        src={originalObjectUrl || fullSizeImageUrl || imageUrl}
                        alt={imageConfig.alt}
                        loading="eager"
                        className="w-full h-auto max-h-[80vh] object-contain"
                        onError={(e) => {
                          console.error('高解析度圖片載入失敗，回退到預覽圖');

                          // 如果是blob URL失敗，嘗試使用簽名URL
                          if (originalObjectUrl && originalObjectUrl.startsWith('blob:')) {
                            e.currentTarget.src = fullSizeImageUrl || imageUrl;
                          } else if (e.currentTarget.src !== imageUrl) {
                            // 回退到預覽圖
                            e.currentTarget.src = imageUrl;
                          }
                        }}
                      />
                    )}

                    {/* 載入指示器 */}
                    {isLoadingHighRes && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-white"></div>
                      </div>
                    )}
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