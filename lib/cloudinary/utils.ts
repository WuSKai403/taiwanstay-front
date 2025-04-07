import { CloudinaryImageConfig, CloudinaryResource, CloudinaryImageResource, CloudinaryUploadResult, SignedUrls } from './types';
import React from 'react';

export const generateTransformation = (config: CloudinaryImageConfig): string => {
  const transformations: string[] = [];

  if (config.width || config.height) {
    transformations.push(`c_${config.crop || 'fill'}`);
    if (config.width) transformations.push(`w_${config.width}`);
    if (config.height) transformations.push(`h_${config.height}`);
  }

  if (config.gravity) transformations.push(`g_${config.gravity}`);
  if (config.quality) transformations.push(`q_${config.quality}`);
  if (config.format) transformations.push(`f_${config.format}`);
  if (config.radius) transformations.push(`r_${config.radius}`);
  if (config.effect) transformations.push(`e_${config.effect}`);
  if (config.background) transformations.push(`b_${config.background}`);

  return transformations.join(',');
};

export const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

export const convertToImageResource = (result: CloudinaryUploadResult): CloudinaryImageResource => {
  if (!result.public_id || !result.secure_url) {
    throw new Error('Missing required fields in CloudinaryResource');
  }

  const resource: CloudinaryResource = {
    public_id: result.public_id,
    secure_url: result.secure_url
  };

  return {
    ...resource,
    thumbnailUrl: resource.secure_url.replace('/upload/', '/upload/c_fill,g_auto,h_200,w_200/'),
    previewUrl: resource.secure_url.replace('/upload/', '/upload/c_scale,w_600/')
  };
};

/**
 * 創建 Cloudinary 圖片設定
 * 適合 MVP 階段使用，避免 Next.js Image 元件對私有資源的權限問題
 * 返回的是圖片配置對象，而非 JSX 元素
 */
export const createCloudinaryImageConfig = (props: {
  resource: CloudinaryImageResource;
  alt?: string;
  className?: string;
  objectFit?: 'cover' | 'contain' | 'fill';
  width?: string | number;
  height?: string | number;
  fallbackText?: string;
  isPrivate?: boolean;
  index?: number;
}): {
  imageUrl: string;
  alt: string;
  className: string;
  style: {
    objectFit: string;
    width: string | number;
    height: string | number;
  };
  fallbackText: string;
} => {
  const {
    resource,
    alt,
    className = '',
    objectFit = 'cover',
    width,
    height,
    fallbackText = '圖片載入失敗',
    isPrivate = false,
    index
  } = props;

  // 對於私有資源，直接使用 secure_url 而不是透過 Next.js Image 元件
  const imageUrl = isPrivate
    ? resource.secure_url // 直接使用 Cloudinary URL
    : resource.previewUrl || resource.secure_url;

  return {
    imageUrl,
    alt: alt || resource.altText || `照片 ${index !== undefined ? index + 1 : ''}`,
    className,
    style: {
      objectFit,
      width: width || '100%',
      height: height || '100%'
    },
    fallbackText
  };
};

export const getUploadParams = (
  isPrivate: boolean,
  folder: string,
  options?: {
    maxFiles?: number;
    tags?: string[];
    resourceType?: string;
  }
): Record<string, any> => {
  return {
    folder,
    tags: options?.tags || [],
    resourceType: options?.resourceType || 'image',
    maxFiles: options?.maxFiles || 1,
    sources: ['local', 'url', 'camera'],
    multiple: false,
    clientAllowedFormats: ['png', 'gif', 'jpeg', 'jpg', 'webp'],
    showAdvancedOptions: true,
    showUploadMoreButton: false,
    singleUploadAutoClose: true,
    showPoweredBy: false,
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
      },
      fonts: {
        default: null,
        "'Fira Sans', sans-serif": {
          url: 'https://fonts.googleapis.com/css2?family=Fira+Sans',
          active: true
        }
      }
    }
  };
};

export const formatUploadError = (error: any): string => {
  if (typeof error === 'string') return error;
  if (error.message) return error.message;
  return '上傳過程中發生錯誤';
};

export const validateImageDimensions = (
  width: number,
  height: number,
  constraints?: {
    minWidth?: number;
    maxWidth?: number;
    minHeight?: number;
    maxHeight?: number;
    aspectRatio?: number;
  }
): { isValid: boolean; error?: string } => {
  if (!constraints) return { isValid: true };

  const {
    minWidth,
    maxWidth,
    minHeight,
    maxHeight,
    aspectRatio
  } = constraints;

  if (minWidth && width < minWidth) {
    return { isValid: false, error: `圖片寬度不得小於 ${minWidth}px` };
  }

  if (maxWidth && width > maxWidth) {
    return { isValid: false, error: `圖片寬度不得大於 ${maxWidth}px` };
  }

  if (minHeight && height < minHeight) {
    return { isValid: false, error: `圖片高度不得小於 ${minHeight}px` };
  }

  if (maxHeight && height > maxHeight) {
    return { isValid: false, error: `圖片高度不得大於 ${maxHeight}px` };
  }

  if (aspectRatio) {
    const currentRatio = width / height;
    const tolerance = 0.01; // 1% 的容許誤差

    if (Math.abs(currentRatio - aspectRatio) > tolerance) {
      return { isValid: false, error: `圖片比例必須為 ${aspectRatio}` };
    }
  }

  return { isValid: true };
};

/**
 * 從伺服器獲取資源的簽名URL
 * @param publicId 資源的公開ID
 * @returns SignedUrls 包含不同大小的簽名URL
 */
export const getSignedUrls = async (publicId: string): Promise<SignedUrls> => {
  try {
    const response = await fetch(`/api/cloudinary/sign-url?publicId=${encodeURIComponent(publicId)}`);

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || '獲取簽名URL失敗');
    }

    return await response.json();
  } catch (error) {
    console.error('獲取簽名URL錯誤:', error);
    throw error;
  }
};