import React from 'react';
import { UseFormRegister, Control, UseFormWatch, UseFormSetValue, FieldErrors } from 'react-hook-form';
import { CloudinaryImageResource } from '@/lib/cloudinary/types';
import CloudinaryUploadWidget from '@/components/common/CloudinaryUploadWidget';

interface HostFormData {
  photos: CloudinaryImageResource[];
  photoDescriptions: string[];
  videoIntroduction?: string;
  additionalNotes?: string;
  // 其他主機註冊表單欄位...
}

interface PhotoUploadStepProps {
  register: UseFormRegister<HostFormData>;
  control: Control<HostFormData>;
  watch: UseFormWatch<HostFormData>;
  setValue: UseFormSetValue<HostFormData>;
  errors: FieldErrors<HostFormData>;
}

const PhotoUploadStep: React.FC<PhotoUploadStepProps> = ({
  register,
  watch,
  setValue,
  errors
}) => {
  const photos = watch('photos') || [];
  const photoDescriptions = watch('photoDescriptions') || [];

  // 更新照片集合
  const handleSetImages = (images: CloudinaryImageResource[]) => {
    setValue('photos', images, { shouldValidate: true });
  };

  // 更新照片描述
  const handleSetDescriptions = (descriptions: string[]) => {
    setValue('photoDescriptions', descriptions, { shouldValidate: true });
  };

  return (
    <div className="space-y-8">
      {/* 使用共用的CloudinaryUploadWidget */}
      <CloudinaryUploadWidget
        images={photos}
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

      {errors.photos && (
        <p className="mt-2 text-sm text-red-600">{errors.photos.message}</p>
      )}

      {/* 視頻介紹 */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">視頻介紹 (選填)</h3>
        <p className="text-sm text-gray-500 mb-4">
          上傳一段簡短的房源介紹視頻可以增加入住率。請提供視頻連結（YouTube、Vimeo等）。
        </p>
        <input
          type="text"
          {...register('videoIntroduction')}
          placeholder="請輸入視頻連結 (例如: https://www.youtube.com/watch?v=xxx)"
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
          {...register('additionalNotes')}
          placeholder="任何額外信息 (最多500字)"
          maxLength={500}
          rows={4}
          className="w-full p-2 border rounded"
        />
        <p className="mt-1 text-sm text-gray-500">
          還可以輸入 {500 - (watch('additionalNotes')?.length || 0)} 字
        </p>
      </div>
    </div>
  );
};

export default PhotoUploadStep;