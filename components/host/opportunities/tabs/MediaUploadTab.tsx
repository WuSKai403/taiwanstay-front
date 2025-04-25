import React, { useState } from 'react';
import { Control, useFieldArray } from 'react-hook-form';
import { OpportunityFormData } from '../OpportunityForm';
import CloudinaryUploadWidget from '@/components/common/CloudinaryUploadWidget';
import { CloudinaryImageResource } from '@/lib/cloudinary/types';
import CloudinaryImage from '@/components/CloudinaryImage';

interface MediaUploadTabProps {
  control: Control<OpportunityFormData>;
  register: any;
  errors: any;
  watch: any;
  setValue?: any;
}

const MediaUploadTab: React.FC<MediaUploadTabProps> = ({
  control,
  register,
  errors,
  watch,
  setValue,
}) => {
  // 使用 useFieldArray 處理圖片列表
  const {
    fields: imageFields,
    append: appendImage,
    remove: removeImage,
  } = useFieldArray({
    control,
    name: 'media.images',
  } as any); // 使用 as any 臨時規避型別錯誤

  // 獲取和設置圖片
  const images = watch('media.images') || [];
  const descriptions = watch('media.descriptions') || []; // 這個可能是一個對象而非數組
  const coverImage = watch('media.coverImage');

  // 視頻相關
  const videoUrl = watch('media.videoUrl') || '';
  const videoDescription = watch('media.videoDescription') || '';

  // 處理圖片上傳
  const handleSetImages = (newImages: CloudinaryImageResource[]) => {
    setValue('media.images', newImages, { shouldValidate: true });
  };

  // 處理圖片描述
  const handleSetDescriptions = (newDescriptions: string[]) => {
    // 確保 descriptions 是數組格式
    if (Array.isArray(newDescriptions)) {
      setValue('media.descriptions', newDescriptions);
    } else {
      // 如果不是數組，則轉換為數組
      setValue('media.descriptions', []);
    }
  };

  // 處理封面圖片上傳
  const handleSetCoverImage = (newImages: CloudinaryImageResource[]) => {
    if (newImages && newImages.length > 0) {
      setValue('media.coverImage', newImages[0], { shouldValidate: true });
    } else {
      setValue('media.coverImage', null);
    }
  };

  // 處理視頻 URL 變更
  const handleVideoUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue('media.videoUrl', e.target.value, { shouldValidate: true });
  };

  // 處理視頻描述變更
  const handleVideoDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setValue('media.videoDescription', e.target.value);
  };

  // 處理虛擬導覽變更
  const handleVirtualTourChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue('media.virtualTour', e.target.value);
  };

  return (
    <div className="space-y-8">
      {/* 封面圖片上傳 */}
      <div className="border-b pb-6">
        <h3 className="text-lg font-semibold mb-4">封面圖片</h3>
        <p className="text-gray-600 mb-4">
          上傳橫幅圖片作為機會列表和詳情頁的主要展示圖片。建議尺寸 1200×600 像素，橫幅比例。
        </p>

        <div className="mb-6">
          {coverImage ? (
            <div className="relative">
              <div className="aspect-[2/1] overflow-hidden rounded-lg bg-gray-100 mb-2">
                <CloudinaryImage
                  resource={coverImage}
                  alt={coverImage.alt || "封面圖片"}
                  className="w-full h-full object-cover"
                  objectFit="cover"
                  isPrivate={false}
                />
              </div>
              <button
                type="button"
                onClick={() => setValue('media.coverImage', null)}
                className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          ) : (
            <CloudinaryUploadWidget
              images={coverImage ? [coverImage] : []}
              setImages={handleSetCoverImage}
              showDescriptions={false}
              maxFiles={1}
              isPrivate={false}
              uploadMode="host"
              folder="opportunities/covers"
              title="上傳封面圖片"
              description="建議尺寸 1200×600 像素，橫幅比例"
            />
          )}
        </div>
      </div>

      {/* 圖片上傳 */}
      <div className="border-b pb-6">
        <h3 className="text-lg font-semibold mb-4">機會圖片</h3>
        <p className="text-gray-600 mb-4">上傳高品質的工作環境照片可提高申請率，這些圖片會顯示在詳情頁中</p>

        <CloudinaryUploadWidget
          images={images}
          setImages={handleSetImages}
          descriptions={Array.isArray(descriptions) ? descriptions : []}
          setDescriptions={handleSetDescriptions}
          showDescriptions={true}
          maxFiles={10}
          isPrivate={false}
          uploadMode="host"
          folder="opportunities/photos"
          title="上傳機會照片"
          description="展示工作環境和住宿條件，最多10張"
        />

        {errors?.media?.images && (
          <p className="mt-1 text-sm text-red-600">{errors.media.images.message}</p>
        )}
      </div>

      {/* 視頻區域 */}
      <div className="border-b pb-6">
        <h3 className="text-lg font-semibold mb-4">視頻介紹 (選填)</h3>
        <p className="text-gray-600 mb-4">
          添加視頻可以更直觀地展示您的工作機會，提高申請率。支援 YouTube 和 Vimeo 視頻。
        </p>

        <div className="space-y-4">
          <div>
            <label htmlFor="videoUrl" className="block text-sm font-medium text-gray-700 mb-1">
              視頻連結
            </label>
            <input
              id="videoUrl"
              type="url"
              value={videoUrl}
              onChange={handleVideoUrlChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="https://www.youtube.com/watch?v=..."
            />
          </div>

          <div>
            <label htmlFor="videoDescription" className="block text-sm font-medium text-gray-700 mb-1">
              視頻描述
            </label>
            <textarea
              id="videoDescription"
              value={videoDescription}
              onChange={handleVideoDescriptionChange}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="簡短描述視頻內容..."
            />
          </div>
        </div>
      </div>

      {/* 虛擬導覽區域 */}
      <div>
        <h3 className="text-lg font-semibold mb-4">虛擬導覽 (選填)</h3>
        <p className="text-gray-600 mb-4">
          如果您有 360° 全景或虛擬導覽，可以在此提供連結。
        </p>

        <div>
          <label htmlFor="virtualTour" className="block text-sm font-medium text-gray-700 mb-1">
            虛擬導覽連結
          </label>
          <input
            id="virtualTour"
            type="url"
            onChange={handleVirtualTourChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            placeholder="https://..."
          />
        </div>
      </div>
    </div>
  );
};

export default MediaUploadTab;