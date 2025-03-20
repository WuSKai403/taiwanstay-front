import React from 'react';
import { CldImage } from 'next-cloudinary';
import { ImageProps } from 'next/image';

interface CustomTransformationOptions {
  width?: number;
  height?: number;
  crop?: string;
  radius?: string;
  quality?: string;
  fetch_format?: string;
}

interface CloudinaryImageProps extends Omit<ImageProps, 'src'> {
  publicId: string;
  isPrivate?: boolean;
  transformations?: CustomTransformationOptions[];
}

const CloudinaryImage: React.FC<CloudinaryImageProps> = ({
  publicId,
  alt,
  width,
  height,
  isPrivate = false,
  transformations = [],
  ...props
}) => {
  // 將 transformations 轉換為 next-cloudinary 支援的格式
  const transformationArray = transformations.map(transform => ({
    width: transform.width,
    height: transform.height,
    crop: transform.crop,
    radius: transform.radius,
    quality: transform.quality,
    format: transform.fetch_format
  }));

  return (
    <div className="relative">
      <CldImage
        src={publicId}
        alt={alt}
        width={width}
        height={height}
        {...props}
        deliveryType={isPrivate ? "authenticated" : "upload"}
        preserveTransformations
        {...(transformationArray.length > 0 && {
          transforms: {
            ...transformationArray[0],
            quality: "auto",
            format: "auto"
          }
        })}
      />
    </div>
  );
};

export default CloudinaryImage;