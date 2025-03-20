import React, { useCallback, useState } from 'react';
import { CldUploadWidget } from 'next-cloudinary';
import { CloudinaryUploadResult } from '@/lib/cloudinary';

interface CloudinaryUploaderProps {
  onUploadSuccess: (result: CloudinaryUploadResult) => void;
  onUploadError: (error: Error) => void;
  onUploadStart?: () => void;
  folder?: string;
  resourceType?: 'image' | 'video' | 'auto';
  maxFiles?: number;
  acceptedFileTypes?: string[];
  buttonText?: string;
  isPrivate?: boolean;
  publicId?: string;
  onUpdateComplete?: () => void;
}

const CloudinaryUploader: React.FC<CloudinaryUploaderProps> = ({
  onUploadSuccess,
  onUploadError,
  onUploadStart,
  folder = 'taiwanstay',
  resourceType = 'auto',
  maxFiles = 1,
  acceptedFileTypes = ['image/*', 'video/*'],
  buttonText = '上傳檔案',
  isPrivate = false,
  publicId,
  onUpdateComplete
}) => {
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});
  const [error, setError] = useState<string | null>(null);

  const handleUpload = useCallback((error: any, result: any) => {
    if (error) {
      console.error('上傳失敗:', error);
      const errorMessage = error.message || '上傳失敗';
      setError(errorMessage);
      onUploadError(new Error(errorMessage));
      return;
    }

    if (result && result.event === "success") {
      console.log('上傳成功:', result.info);
      setError(null);
      onUploadSuccess(result.info);
      setUploadProgress({});
      onUpdateComplete?.();
    }

    if (result && result.event === "progress") {
      console.log('上傳進度:', result);
      setUploadProgress(prev => ({
        ...prev,
        [result.originalFileName]: Math.round(result.percent)
      }));
    }

    if (result && result.event === "start") {
      console.log('開始上傳');
      onUploadStart?.();
    }
  }, [onUploadSuccess, onUploadError, onUpdateComplete, onUploadStart]);

  const uploadPreset = isPrivate
    ? process.env.NEXT_PUBLIC_CLOUDINARY_PRIVATE_UPLOAD_PRESET
    : process.env.NEXT_PUBLIC_CLOUDINARY_PUBLIC_UPLOAD_PRESET;

  const targetFolder = isPrivate
    ? `${folder}/private`
    : `${folder}/public`;

  if (!uploadPreset) {
    console.error('Missing Cloudinary configuration');
    return (
      <div className="text-red-500">
        錯誤：Cloudinary 設定不完整，請檢查環境變數
      </div>
    );
  }

  return (
    <div className="w-full space-y-4">
      <CldUploadWidget
        uploadPreset={uploadPreset}
        onUpload={handleUpload}
        options={{
          maxFiles,
          resourceType,
          folder: targetFolder,
          clientAllowedFormats: acceptedFileTypes.map(type =>
            type.replace('image/', '').replace('video/', '').replace('*', '')
          ).filter(Boolean),
          sources: ['local', 'url', 'camera'],
          multiple: maxFiles > 1,
          publicId: publicId,
          styles: {
            palette: {
              window: '#FFFFFF',
              windowBorder: '#90A0B3',
              tabIcon: '#0078FF',
              menuIcons: '#5A616A',
              textDark: '#000000',
              textLight: '#FFFFFF',
              link: '#0078FF',
              action: '#FF620C',
              inactiveTabIcon: '#0E2F5A',
              error: '#F44235',
              inProgress: '#0078FF',
              complete: '#20B832',
              sourceBg: '#E4EBF1'
            }
          }
        }}
      >
        {({ open }) => (
          <div
            className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors hover:border-gray-400 ${
              isPrivate ? 'bg-red-50' : ''
            }`}
            onClick={() => open()}
          >
            <p className="text-gray-600">
              {isPrivate ? '點擊此處上傳私密檔案' : '點擊此處上傳檔案'}
            </p>
            <p className="text-sm text-gray-500 mt-2">
              支援的檔案類型：{acceptedFileTypes.join(', ')}
            </p>
            {isPrivate && (
              <p className="text-sm text-red-500 mt-2">
                注意：此為私密上傳區域，檔案將被加密存儲
              </p>
            )}
            {error && (
              <p className="text-red-500 mt-2 text-sm">
                錯誤：{error}
              </p>
            )}
          </div>
        )}
      </CldUploadWidget>

      {/* 上傳進度顯示 */}
      {Object.entries(uploadProgress).map(([fileName, progress]) => (
        <div key={fileName} className="space-y-1">
          <div className="flex justify-between text-sm text-gray-600">
            <span>{fileName}</span>
            <span>{progress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all duration-300 ${
                isPrivate ? 'bg-red-500' : 'bg-blue-500'
              }`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
};

export default CloudinaryUploader;