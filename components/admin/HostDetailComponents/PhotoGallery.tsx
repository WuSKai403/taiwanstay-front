import React from 'react';
import CloudinaryImage from '@/components/CloudinaryImage';
import { convertToCloudinaryResource } from './utils';

interface PhotoGalleryProps {
  photos: any[];
  photoDescriptions?: string[];
  hostName: string;
}

// 照片集組件
const PhotoGallery: React.FC<PhotoGalleryProps> = ({
  photos,
  photoDescriptions,
  hostName
}) => {
  if (!photos || photos.length === 0) return null;

  return (
    <div className="mb-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-2">照片集</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {photos.map((photo: any, index: number) => (
          <div key={`photo-${index}`} className="relative h-40 rounded-lg overflow-hidden">
            <CloudinaryImage
              resource={convertToCloudinaryResource(photo)}
              alt={`${hostName} 照片 ${index + 1}`}
              className="w-full h-full"
              containerClassName="h-full w-full"
              objectFit="cover"
              isPrivate={false}
              index={index}
            />
            {photoDescriptions?.[index] && (
              <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white p-2 text-sm">
                {photoDescriptions[index]}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default PhotoGallery;