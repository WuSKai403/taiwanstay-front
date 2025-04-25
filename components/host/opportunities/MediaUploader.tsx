import React, { useState } from 'react';
import CloudinaryUploadWidget from '@/components/common/CloudinaryUploadWidget';
import { CloudinaryImageResource } from '@/lib/cloudinary/types';

interface MediaUploaderProps {
  images: CloudinaryImageResource[];
  setImages: (images: CloudinaryImageResource[]) => void;
  descriptions?: string[];
  setDescriptions?: (descriptions: string[]) => void;
  maxFiles?: number;
  isPrivate?: boolean;
  showDescriptions?: boolean;
}

const MediaUploader: React.FC<MediaUploaderProps> = ({
  images,
  setImages,
  descriptions = [],
  setDescriptions,
  maxFiles = 5,
  isPrivate = false,
  showDescriptions = true,
}) => {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900">工作機會照片</h3>
        <p className="text-sm text-gray-600 mb-4">
          請上傳清晰的照片，展示工作環境和相關場景。這些照片將顯示給所有用戶。
        </p>

        <CloudinaryUploadWidget
          images={images}
          setImages={setImages}
          descriptions={descriptions}
          setDescriptions={setDescriptions}
          showDescriptions={showDescriptions}
          maxFiles={maxFiles}
          isPrivate={isPrivate}
          uploadMode="host"
          folder="opportunities/photos"
          title="上傳機會照片"
          description={`上傳相關照片來吸引更多申請者 (最多 ${maxFiles} 張)`}
        />
      </div>

      <div className="mt-4">
        <p className="text-sm text-gray-500">
          * 建議上傳工作環境、日常工作場景、工具或設備等相關照片
        </p>
        <p className="text-sm text-gray-500">
          * 高質量的照片能提高申請率
        </p>
      </div>
    </div>
  );
};

export default MediaUploader;