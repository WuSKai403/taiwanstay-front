import React from 'react';
import { useFormContext } from 'react-hook-form';
import CloudinaryUploadWidget from '@/components/common/CloudinaryUploadWidget';
import { CloudinaryImageResource } from '@/lib/cloudinary/types';

const MediaUploadStep: React.FC = () => {
  const {
    register,
    watch,
    setValue,
    formState: { errors }
  } = useFormContext();

  // 獲取表單數據中的照片和描述
  const photos = watch('photos') || [];
  const photoDescriptions = watch('photoDescriptions') || [];
  const videoUrl = watch('videoIntroduction.url') || '';
  const videoDescription = watch('videoIntroduction.description') || '';

  // 更新照片集合
  const handleSetImages = (images: CloudinaryImageResource[]) => {
    setValue('photos', images, { shouldValidate: true });
  };

  // 更新照片描述
  const handleSetDescriptions = (descriptions: string[]) => {
    setValue('photoDescriptions', descriptions, { shouldValidate: true });
  };

  // 處理視頻連結變更
  const handleVideoUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue('videoIntroduction.url', e.target.value, { shouldValidate: true });
  };

  // 處理視頻描述變更
  const handleVideoDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setValue('videoIntroduction.description', e.target.value);
  };

  // 視頻預覽
  const renderVideoPreview = () => {
    if (!videoUrl) return null;

    // 檢查是否是 YouTube 連結
    const youtubeRegex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
    const youtubeMatch = videoUrl.match(youtubeRegex);

    if (youtubeMatch && youtubeMatch[1]) {
      const videoId = youtubeMatch[1];
      return (
        <div className="aspect-w-16 aspect-h-9 mb-4">
          <iframe
            src={`https://www.youtube.com/embed/${videoId}`}
            title="YouTube video player"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="rounded-lg"
          ></iframe>
        </div>
      );
    }

    // 檢查是否是 Vimeo 連結
    const vimeoRegex = /(?:https?:\/\/)?(?:www\.)?(?:vimeo\.com\/)([0-9]+)/;
    const vimeoMatch = videoUrl.match(vimeoRegex);

    if (vimeoMatch && vimeoMatch[1]) {
      const videoId = vimeoMatch[1];
      return (
        <div className="aspect-w-16 aspect-h-9 mb-4">
          <iframe
            src={`https://player.vimeo.com/video/${videoId}`}
            title="Vimeo video player"
            frameBorder="0"
            allow="autoplay; fullscreen; picture-in-picture"
            allowFullScreen
            className="rounded-lg"
          ></iframe>
        </div>
      );
    }

    // 非辨識的連結格式，僅顯示連結
    return (
      <div className="p-4 bg-gray-100 rounded-lg mb-4">
        <div className="flex items-center">
          <svg className="w-6 h-6 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <a href={videoUrl} target="_blank" rel="noreferrer" className="text-primary-600 hover:underline">
            {videoUrl}
          </a>
        </div>
        <p className="text-sm text-gray-500 mt-2">
          無法預覽視頻，僅顯示連結。請確保輸入正確的 YouTube 或 Vimeo 連結。
        </p>
      </div>
    );
  };

  return (
    <div className="space-y-8">
      {/* 照片上傳 */}
      <div>
        <CloudinaryUploadWidget
          images={photos}
          setImages={handleSetImages}
          descriptions={photoDescriptions}
          setDescriptions={handleSetDescriptions}
          showDescriptions={true}
          maxFiles={5}
          isPrivate={false}
          uploadMode="host"
          folder="hosts/photos"
          title="上傳場所照片"
          description="請上傳清晰的照片，展示您的環境、場所特色。這些照片將顯示給所有用戶。(最多 5 張)"
        />

        {errors.photos && (
          <p className="mt-2 text-sm text-red-600">{(errors.photos as any)?.message}</p>
        )}
      </div>

      {/* 視頻連結 */}
      <div>
        <h3 className="text-lg font-medium text-gray-900">視頻介紹 (選填)</h3>
        <p className="text-sm text-gray-600 mb-4">
          添加視頻可以更直觀地展示您的場所和環境，提高接受率。支援 YouTube 和 Vimeo 視頻。
        </p>

        {/* 視頻預覽區域 */}
        {videoUrl && renderVideoPreview()}

        <div className="space-y-4">
          <div>
            <label htmlFor="videoUrl" className="block text-sm font-medium text-gray-700">
              視頻連結
            </label>
            <input
              id="videoUrl"
              type="url"
              value={videoUrl}
              onChange={handleVideoUrlChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
              placeholder="https://www.youtube.com/watch?v=..."
            />
            {errors.videoIntroduction && (errors.videoIntroduction as any)?.url && (
              <p className="mt-1 text-sm text-red-600">{(errors.videoIntroduction as any)?.url?.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="videoDescription" className="block text-sm font-medium text-gray-700">
              視頻描述
            </label>
            <textarea
              id="videoDescription"
              value={videoDescription}
              onChange={handleVideoDescriptionChange}
              rows={2}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
              placeholder="簡短描述視頻內容..."
            />
            {errors.videoIntroduction && (errors.videoIntroduction as any)?.description && (
              <p className="mt-1 text-sm text-red-600">{(errors.videoIntroduction as any)?.description?.message}</p>
            )}
          </div>
        </div>
      </div>

      {/* 虛擬導覽連結 (選填) */}
      <div>
        <h3 className="text-lg font-medium text-gray-900">虛擬導覽 (選填)</h3>
        <p className="text-sm text-gray-600 mb-4">
          如果您有 360° 全景或虛擬導覽，可以在此提供連結。
        </p>

        <div>
          <label htmlFor="virtualTour" className="block text-sm font-medium text-gray-700">
            虛擬導覽連結
          </label>
          <input
            id="virtualTour"
            type="url"
            {...register('additionalMedia.virtualTour')}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
            placeholder="https://..."
          />
          <p className="mt-1 text-sm text-gray-500">此欄位為選填，可留空。如需填寫，請輸入有效的 URL 連結。</p>
          {errors.additionalMedia && (errors.additionalMedia as any)?.virtualTour && (
            <p className="mt-1 text-sm text-red-600">{(errors.additionalMedia as any)?.virtualTour?.message}</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default MediaUploadStep;