import React from 'react';
import { useFormContext } from 'react-hook-form';
import { CloudinaryImageResource } from '@/lib/cloudinary/types';
import CloudinaryUploadWidget from '@/components/common/CloudinaryUploadWidget';
import { HostRegisterFormData } from '@/lib/schemas/host';

// 擴展 CloudinaryImageResource 類型以支持 caption 字段
interface PhotoWithCaption extends CloudinaryImageResource {
  caption?: string;
}

const PhotoUploadStep: React.FC = () => {
  const { watch, setValue, formState: { errors } } = useFormContext<HostRegisterFormData>();

  // 獲取當前的圖片集合
  const galleryPhotos = watch('media.gallery') as PhotoWithCaption[] || [];
  const photoDescriptions = galleryPhotos.map(photo => photo?.caption || '');

  // 更新照片集合
  const handleSetImages = (images: CloudinaryImageResource[]) => {
    setValue('media.gallery', images as any, { shouldValidate: true });
  };

  // 更新照片描述
  const handleSetDescriptions = (descriptions: string[]) => {
    const updatedGallery = [...galleryPhotos];
    descriptions.forEach((desc, index) => {
      if (updatedGallery[index]) {
        updatedGallery[index].caption = desc;
      }
    });
    setValue('media.gallery', updatedGallery as any, { shouldValidate: true });
  };

  // 更新視頻連結
  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const videoUrl = e.target.value;
    if (videoUrl) {
      setValue('media.videos', [{ url: videoUrl, description: '' }], { shouldValidate: true });
    } else {
      setValue('media.videos', [], { shouldValidate: true });
    }
  };

  return (
    <div className="space-y-8">
      {/* 使用共用的CloudinaryUploadWidget */}
      <CloudinaryUploadWidget
        images={galleryPhotos}
        setImages={handleSetImages}
        descriptions={photoDescriptions}
        setDescriptions={handleSetDescriptions}
        showDescriptions={true}
        maxFiles={5}
        isPrivate={false} // 主機照片為公開
        uploadMode="host"
        folder="hosts/photos"
        title="上傳房源照片"
        description="請上傳清晰的房源照片，讓大家能更了解您的住宿環境。建議上傳不同角度的照片，展示房間的多樣性。(最多 5 張)"
      />

      {errors.media?.gallery && (
        <p className="mt-2 text-sm text-red-600">{errors.media.gallery.message}</p>
      )}

      {/* 視頻介紹 */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">視頻介紹 (選填)</h3>
        <p className="text-sm text-gray-500 mb-4">
          上傳一段簡短的房源介紹視頻可以增加入住率。請提供視頻連結（YouTube、Vimeo等）。
        </p>
        <input
          type="text"
          value={watch('media.videos')?.[0]?.url || ''}
          onChange={handleVideoChange}
          placeholder="請輸入視頻連結 (例如: https://www.youtube.com/watch?v=xxx)"
          className="w-full p-2 border rounded"
        />
      </div>

      {/* 虛擬導覽 */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">虛擬導覽 (選填)</h3>
        <p className="text-sm text-gray-500 mb-4">
          如果您有360°虛擬導覽或3D模型連結，請在此處提供。
        </p>
        <input
          type="text"
          value={watch('media.additionalMedia.virtualTour') as string || ''}
          onChange={(e) => setValue('media.additionalMedia.virtualTour', e.target.value, { shouldValidate: true })}
          placeholder="請輸入虛擬導覽連結"
          className="w-full p-2 border rounded"
        />
      </div>

      {/* 附加備註 */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">附加備註 (選填)</h3>
        <p className="text-sm text-gray-500 mb-4">
          如有其他想告訴住客的信息，請在此處補充。
        </p>
        <textarea
          value={watch('details.rules')?.[0] || ''}
          onChange={(e) => setValue('details.rules', [e.target.value], { shouldValidate: true })}
          placeholder="任何額外信息 (最多500字)"
          maxLength={500}
          rows={4}
          className="w-full p-2 border rounded"
        />
        <p className="mt-1 text-sm text-gray-500">
          還可以輸入 {500 - (watch('details.rules')?.[0]?.length || 0)} 字
        </p>
      </div>
    </div>
  );
};

export default PhotoUploadStep;