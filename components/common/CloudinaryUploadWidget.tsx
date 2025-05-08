import React, { useState, useId } from 'react';
import { CloudinaryUploadService } from '@/lib/cloudinary/uploadService';
import { CloudinaryImageResource } from '@/lib/cloudinary/types';
import CloudinaryImage from '@/components/CloudinaryImage';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { PhotoIcon } from '@heroicons/react/24/outline';

interface CloudinaryUploadWidgetProps {
  /** 已上傳的圖片集合 */
  images: CloudinaryImageResource[];
  /** 設置更新後的圖片集合 */
  setImages: (images: CloudinaryImageResource[]) => void;
  /** 最大可上傳數量，預設 5 */
  maxFiles?: number;
  /** 是否為私有資源（預設為公開資源） */
  isPrivate?: boolean;
  /** 上傳模式 */
  uploadMode?: 'applicant' | 'host';
  /** 上傳資料夾 */
  folder?: string;
  /** 標題文字 */
  title?: string;
  /** 描述文字 */
  description?: string;
  /** 是否顯示圖片描述輸入框 */
  showDescriptions?: boolean;
  /** 圖片描述集合 */
  descriptions?: string[];
  /** 更新圖片描述 */
  setDescriptions?: (descriptions: string[]) => void;
}

const CloudinaryUploadWidget: React.FC<CloudinaryUploadWidgetProps> = ({
  images,
  setImages,
  maxFiles = 5,
  isPrivate = false,
  uploadMode = 'host',
  folder = 'hosts/photos',
  title = '上傳圖片',
  description = '請上傳清晰的圖片（最多 5 張）',
  showDescriptions = false,
  descriptions = [],
  setDescriptions,
}) => {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  // 生成唯一ID避免衝突
  const uploadId = useId();

  // 處理照片上傳
  const handleImageUpload = async (file: File) => {
    // 檢查檔案類型
    const validTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    if (!validTypes.includes(file.type)) {
      setUploadError('不支援的檔案類型，請上傳 JPG 或 PNG 圖片');
      return;
    }

    // 檢查檔案大小 (限制 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      setUploadError('檔案過大，請上傳小於 5MB 的圖片');
      return;
    }

    // 檢查是否已達上限
    if (images.length >= maxFiles) {
      setUploadError(`已達上傳上限 (${maxFiles}張)`);
      return;
    }

    setUploading(true);
    setUploadError(null);
    setUploadProgress(0);

    try {
      // 使用CloudinaryUploadService上傳照片
      const result = await CloudinaryUploadService.uploadFile({
        file,
        folder,
        resourceType: 'image',
        isPrivate,
        uploadMode,
        onProgress: (percent) => setUploadProgress(percent)
      });

      console.log('上傳成功:', result);

      // 將結果轉換為應用程式需要的格式
      const newImage = CloudinaryUploadService.convertToImageResource(result);

      // 更新圖片集合
      setImages([...images, newImage]);

      // 若需處理描述，則為新上傳的圖片增加空描述
      if (showDescriptions && setDescriptions) {
        const newDescriptions = [...descriptions];
        newDescriptions[images.length] = '';
        setDescriptions(newDescriptions);
      }

      console.log('圖片已新增:', newImage);
    } catch (error) {
      console.error('上傳處理失敗', error);
      setUploadError(error instanceof Error ? error.message : '上傳失敗，請重試');
    } finally {
      setUploading(false);
    }
  };

  // 移除圖片
  const removeImage = async (index: number) => {
    try {
      const newImages = [...images];
      const removedImage = newImages[index];

      // 先從UI移除
      newImages.splice(index, 1);
      setImages(newImages);

      // 若需處理描述，則從描述集合中移除對應項
      if (showDescriptions && setDescriptions) {
        const newDescriptions = [...descriptions];
        newDescriptions.splice(index, 1);
        setDescriptions(newDescriptions);
      }

      // 如果有publicId，嘗試從Cloudinary刪除
      if (removedImage?.publicId) {
        try {
          await CloudinaryUploadService.deleteFile(removedImage.publicId);
          console.log('已刪除Cloudinary上的圖片:', removedImage.publicId);
        } catch (error) {
          console.error('刪除Cloudinary圖片失敗，但UI已更新', error);
        }
      }
    } catch (error) {
      console.error('移除圖片錯誤', error);
    }
  };

  // 更新圖片描述
  const updateImageDescription = (index: number, text: string) => {
    if (showDescriptions && setDescriptions) {
      const newDescriptions = [...descriptions];
      newDescriptions[index] = text;
      setDescriptions(newDescriptions);
    }
  };

  return (
    <div className="space-y-6">
      {/* 標題和描述 */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
        <p className="text-sm text-gray-500 mb-4">{description}</p>
      </div>

      {/* 上傳區域 */}
      <div>
        {images.length < maxFiles ? (
          <div className="border-2 border-dashed rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
            <input
              type="file"
              accept="image/png,image/jpeg,image/jpg"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleImageUpload(e.target.files[0]);
                }
              }}
              disabled={uploading}
              className="hidden"
              id={`image-upload-${uploadId}`}
            />
            <label
              htmlFor={`image-upload-${uploadId}`}
              className={`cursor-pointer flex flex-col items-center justify-center ${uploading ? 'opacity-50' : ''}`}
            >
              <PhotoIcon className="h-12 w-12 text-gray-400 mb-3" />
              <p className="text-gray-700 font-medium">
                {uploading ? '上傳中...' : '點擊上傳圖片'}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                支援的檔案類型：PNG、JPEG、JPG
              </p>
            </label>
          </div>
        ) : (
          <div className="p-4 border-2 border-dashed rounded-lg text-center bg-gray-50">
            <p className="text-gray-600">已達上傳上限 ({maxFiles}張)</p>
          </div>
        )}

        {/* 上傳進度顯示 */}
        {uploading && (
          <div className="mt-4 space-y-1">
            <div className="flex justify-between text-sm text-gray-600">
              <span>上傳進度</span>
              <span>{uploadProgress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="h-2 rounded-full transition-all duration-300 bg-primary-600"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}

        {uploadError && (
          <p className="mt-2 text-sm text-red-600">{uploadError}</p>
        )}
      </div>

      {/* 已上傳圖片預覽 */}
      {images.length > 0 && (
        <div className="mt-6 space-y-4">
          <h4 className="font-medium">已上傳圖片 ({images.length}/{maxFiles})</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {images.map((image, index) => (
              <div key={image.publicId || index} className="border rounded-md p-3 space-y-3">
                <div className="relative h-40 w-full overflow-hidden rounded">
                  {image.secureUrl ? (
                    <CloudinaryImage
                      resource={image}
                      alt={`圖片 ${index + 1}`}
                      className="w-full h-full"
                      objectFit="cover"
                      isPrivate={isPrivate}
                      index={index}
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                      <span className="text-gray-500">圖片處理中...</span>
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600"
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  <div className="flex justify-between">
                    <span>圖片 #{index + 1}</span>
                    <span className="truncate" title={image.publicId || ''}>
                      {image.publicId ? image.publicId.split('/').pop() : '處理中...'}
                    </span>
                  </div>
                </div>
                {showDescriptions && setDescriptions && (
                  <textarea
                    value={descriptions[index] || ''}
                    onChange={(e) => updateImageDescription(index, e.target.value)}
                    className="w-full text-sm p-2 border rounded"
                    placeholder="請描述這張圖片 (選填，最多100字)"
                    maxLength={100}
                    rows={2}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CloudinaryUploadWidget;