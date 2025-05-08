import React, { useState } from 'react';
import { UseFormRegister, Control, UseFormWatch, UseFormSetValue, FieldErrors } from 'react-hook-form';
import { ApplicationFormData, CloudinaryImageResource } from '@/lib/schemas/application';
import { CloudinaryUploadService } from '@/lib/cloudinary/uploadService';
import CloudinaryImage from '@/components/CloudinaryImage';

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
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);

  // 處理照片上傳
  const handlePhotoUpload = async (file: File) => {
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

    setUploading(true);
    setUploadError(null);
    setUploadProgress(0);

    try {
      // 使用CloudinaryUploadService上傳照片
      const result = await CloudinaryUploadService.uploadFile({
        file,
        folder: 'applications/photos',
        resourceType: 'image',
        uploadMode: 'applicant',
        onProgress: (percent) => setUploadProgress(percent)
      });

      console.log('上傳成功:', result);

      // 將結果轉換為應用程式需要的格式
      const photo = CloudinaryUploadService.convertToImageResource(result);

      // 更新表單資料
      const currentPhotos = watch('photos') || [];
      if (currentPhotos.length < 5) {
        setValue('photos', [...currentPhotos, photo], { shouldValidate: true });

        // 為新上傳的照片增加一個空的描述
        const newDescriptions = [...(watch('photoDescriptions') || [])];
        newDescriptions[currentPhotos.length] = '';
        setValue('photoDescriptions', newDescriptions);

        console.log('照片已新增:', photo);
      }
    } catch (error) {
      console.error('上傳處理失敗', error);
      setUploadError(error instanceof Error ? error.message : '上傳失敗，請重試');
    } finally {
      setUploading(false);
    }
  };

  // 移除照片
  const removePhoto = async (index: number) => {
    try {
      const newPhotos = [...photos];
      const removedPhoto = newPhotos[index];

      // 先從UI移除
      newPhotos.splice(index, 1);
      setValue('photos', newPhotos);

      const newDescriptions = [...photoDescriptions];
      newDescriptions.splice(index, 1);
      setValue('photoDescriptions', newDescriptions);

      // 如果有publicId，嘗試從Cloudinary刪除
      if (removedPhoto?.publicId) {
        try {
          await CloudinaryUploadService.deleteFile(removedPhoto.publicId);
          console.log('已刪除Cloudinary上的照片:', removedPhoto.publicId);
        } catch (error) {
          console.error('刪除Cloudinary照片失敗，但UI已更新', error);
        }
      }
    } catch (error) {
      console.error('移除照片錯誤', error);
    }
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
          {photos.length < 5 ? (
            <div className="border-2 border-dashed rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
              <input
                type="file"
                accept="image/png,image/jpeg,image/jpg"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handlePhotoUpload(e.target.files[0]);
                  }
                }}
                disabled={uploading}
                className="hidden"
                id="photo-upload"
              />
              <label
                htmlFor="photo-upload"
                className={`cursor-pointer flex flex-col items-center justify-center ${uploading ? 'opacity-50' : ''}`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="text-gray-700 font-medium">
                  {uploading ? '上傳中...' : '點擊上傳照片'}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  支援的檔案類型：PNG、JPEG、JPG
                </p>
              </label>
            </div>
          ) : (
            <div className="p-4 border-2 border-dashed rounded-lg text-center bg-gray-50">
              <p className="text-gray-600">已達上傳上限 (5張)</p>
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

          {errors.photos && (
            <p className="mt-2 text-sm text-red-600">{errors.photos.message}</p>
          )}
        </div>

        {/* 已上傳照片預覽 */}
        {photos.length > 0 && (
          <div className="mt-6 space-y-4">
            <h4 className="font-medium">已上傳照片 ({photos.length}/5)</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {photos.map((photo, index) => (
                <div key={photo.publicId || index} className="border rounded-md p-3 space-y-3">
                  <div className="relative h-40 w-full overflow-hidden rounded">
                    {photo.secureUrl ? (
                      <CloudinaryImage
                        resource={photo}
                        alt={`照片 ${index + 1}`}
                        className="w-full h-full"
                        objectFit="cover"
                        isPrivate={true}
                        index={index}
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                        <span className="text-gray-500">照片處理中...</span>
                      </div>
                    )}
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
                  <div className="text-xs text-gray-500 mt-1">
                    <div className="flex justify-between">
                      <span>照片 #{index + 1}</span>
                      <span className="truncate" title={photo.publicId || ''}>
                        {photo.publicId ? photo.publicId.split('/').pop() : '處理中...'}
                      </span>
                    </div>
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