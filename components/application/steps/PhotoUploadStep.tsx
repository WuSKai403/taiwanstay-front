import React, { useState } from 'react';
import { UseFormRegister, Control, UseFormWatch, UseFormSetValue, FieldErrors } from 'react-hook-form';
import { ApplicationFormData, CloudinaryImageResource } from '@/lib/schemas/application';
import Image from 'next/image';

interface PhotoUploadStepProps {
  register: UseFormRegister<ApplicationFormData>;
  control: Control<ApplicationFormData>;
  watch: UseFormWatch<ApplicationFormData>;
  setValue: UseFormSetValue<ApplicationFormData>;
  errors: FieldErrors<ApplicationFormData>;
}

const PhotoUploadStep: React.FC<PhotoUploadStepProps> = ({
  register,
  watch,
  setValue,
  errors
}) => {
  const photos = watch('photos') || [];
  const photoDescriptions = watch('photoDescriptions') || [];

  // 照片上傳處理
  const [uploading, setUploading] = useState(false);

  // 模擬照片上傳功能
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;

    setUploading(true);

    try {
      // 這裡會實際上傳照片到 Cloudinary，目前僅模擬
      // 實際實現需要接入Cloudinary API

      const newPhotos: CloudinaryImageResource[] = Array.from(e.target.files).map((file, index) => ({
        public_id: `photo_${Date.now()}_${index}`,
        secure_url: URL.createObjectURL(file),
        thumbnailUrl: URL.createObjectURL(file),
        previewUrl: URL.createObjectURL(file),
        caption: '',
        altText: file.name,
        displayOrder: photos.length + index
      }));

      setValue('photos', [...photos, ...newPhotos]);

      // 為每張新照片增加一個空的描述
      setValue('photoDescriptions', [
        ...photoDescriptions,
        ...Array(newPhotos.length).fill('')
      ]);
    } catch (error) {
      console.error('照片上傳失敗', error);
    }

    setUploading(false);
  };

  // 移除照片
  const removePhoto = (index: number) => {
    const newPhotos = [...photos];
    newPhotos.splice(index, 1);
    setValue('photos', newPhotos);

    const newDescriptions = [...photoDescriptions];
    newDescriptions.splice(index, 1);
    setValue('photoDescriptions', newDescriptions);
  };

  // 更新照片描述
  const updatePhotoDescription = (index: number, description: string) => {
    const newDescriptions = [...photoDescriptions];
    newDescriptions[index] = description;
    setValue('photoDescriptions', newDescriptions);
  };

  return (
    <div className="space-y-8">
      {/* 照片上傳區域 */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          上傳個人照片 <span className="text-red-500">*</span>
        </h3>
        <p className="text-sm text-gray-500 mb-4">
          請上傳清晰的個人照片，讓主人能夠更了解您。建議上傳不同場景的照片，展示您的多樣性。
          (至少 1 張，最多 5 張)
        </p>

        <div className="mb-4">
          <label className="flex justify-center w-full h-32 px-4 transition bg-white border-2 border-gray-300 border-dashed rounded-md appearance-none cursor-pointer hover:border-primary-500 focus:outline-none">
            <span className="flex items-center space-x-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <span className="font-medium text-gray-600">
                {uploading ? '上傳中...' : '點擊上傳照片或拖放照片至此'}
              </span>
            </span>
            <input
              type="file"
              name="photos"
              multiple
              accept="image/png, image/jpeg, image/jpg"
              className="hidden"
              onChange={handlePhotoUpload}
              disabled={uploading || photos.length >= 5}
            />
          </label>
          {photos.length >= 5 && (
            <p className="mt-1 text-sm text-orange-500">已達上傳上限 (5張)</p>
          )}
          {errors.photos && (
            <p className="mt-1 text-sm text-red-600">{errors.photos.message}</p>
          )}
        </div>

        {/* 已上傳照片預覽 */}
        {photos.length > 0 && (
          <div className="mt-6 space-y-4">
            <h4 className="font-medium">已上傳照片</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {photos.map((photo, index) => (
                <div key={photo.public_id} className="border rounded-md p-3 space-y-3">
                  <div className="relative h-40 w-full overflow-hidden rounded">
                    <Image
                      src={photo.previewUrl}
                      alt={photo.altText || `照片 ${index + 1}`}
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      style={{objectFit: 'cover'}}
                    />
                    <button
                      type="button"
                      onClick={() => removePhoto(index)}
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                  <textarea
                    value={photoDescriptions[index] || ''}
                    onChange={(e) => updatePhotoDescription(index, e.target.value)}
                    className="w-full text-sm p-2 border rounded"
                    placeholder="請描述這張照片 (選填，最多100字)"
                    maxLength={100}
                    rows={2}
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 視頻介紹 */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">視頻介紹 (選填)</h3>
        <p className="text-sm text-gray-500 mb-4">
          上傳一段簡短的自我介紹視頻可以增加您被選中的機會。請提供視頻連結（YouTube、Vimeo等）。
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
          如有其他想告訴主人的信息，請在此處補充。
        </p>
        <textarea
          {...register('additionalNotes')}
          placeholder="任何額外信息 (最多300字)"
          maxLength={300}
          rows={4}
          className="w-full p-2 border rounded"
        />
        <p className="mt-1 text-sm text-gray-500">
          還可以輸入 {300 - (watch('additionalNotes')?.length || 0)} 字
        </p>
      </div>
    </div>
  );
};

export default PhotoUploadStep;