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
  if (!result.publicId || !result.secureUrl) {
    throw new Error('Missing required fields in CloudinaryResource');
  }

  const resource: CloudinaryResource = {
    publicId: result.publicId,
    secureUrl: result.secureUrl
  };

  return {
    ...resource,
    thumbnailUrl: resource.secureUrl.replace('/upload/', '/upload/c_fill,g_auto,h_200,w_200/'),
    previewUrl: resource.secureUrl.replace('/upload/', '/upload/c_scale,w_600/')
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

  // 對於私有資源，直接使用 secureUrl 而不是透過 Next.js Image 元件
  const imageUrl = isPrivate
    ? resource.secureUrl // 直接使用 Cloudinary URL
    : resource.previewUrl || resource.secureUrl;

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
 * @param type 可選參數，指定需要的圖片類型 (默認為 'preview')
 * @returns SignedUrls 包含不同大小的簽名URL
 */
export const getSignedUrls = async (publicId: string, type?: 'thumbnail' | 'preview' | 'original'): Promise<SignedUrls> => {
  try {
    // 生成請求ID
    const requestId = Date.now().toString(36) + Math.random().toString(36).substring(2, 5);

    // 記錄請求開始
    console.log(`%c[CloudinaryFetch-${requestId}] 開始請求簽名URL`, 'background:#3F51B5;color:white;padding:3px 6px;border-radius:3px;', {
      publicId,
      type: type || 'all',
      時間: new Date().toLocaleTimeString()
    });

    // 構建請求URL
    let url = `/api/cloudinary/sign-url?publicId=${encodeURIComponent(publicId)}`;

    // 如果指定了類型，添加到查詢參數
    if (type) {
      url += `&type=${type}`;
    }

    // 記錄實際發送請求
    const startTime = performance.now();
    console.log(`%c[CloudinaryFetch-${requestId}] 發送API請求`, 'background:#FF9800;color:white;padding:3px 6px;border-radius:3px;', {
      url: url.substring(0, 100) + (url.length > 100 ? '...' : ''),
      publicId: publicId.substring(0, 20) + (publicId.length > 20 ? '...' : '')
    });

    const response = await fetch(url);
    const endTime = performance.now();

    if (!response.ok) {
      const errorData = await response.json();
      console.error(`%c[CloudinaryFetch-${requestId}] 請求失敗`, 'background:#F44336;color:white;padding:3px 6px;border-radius:3px;', {
        status: response.status,
        error: errorData.message || '獲取簽名URL失敗',
        耗時: `${(endTime - startTime).toFixed(2)}ms`
      });
      throw new Error(errorData.message || '獲取簽名URL失敗');
    }

    // 檢查響應頭
    const cacheStatus = response.headers.get('x-cache') || response.headers.get('cf-cache-status') || 'UNKNOWN';
    const requestId2 = response.headers.get('cloudinary-req-id') || 'N/A';

    const result = await response.json();

    console.log(`%c[CloudinaryFetch-${requestId}] 請求完成`, 'background:#4CAF50;color:white;padding:3px 6px;border-radius:3px;', {
      publicId: publicId.substring(0, 20) + (publicId.length > 20 ? '...' : ''),
      耗時: `${(endTime - startTime).toFixed(2)}ms`,
      緩存狀態: cacheStatus,
      服務端RequestID: requestId2,
      過期時間: result.expires ? new Date(result.expires * 1000).toLocaleString() : '未知'
    });

    return result;
  } catch (error) {
    console.error(`%c[CloudinaryFetch] 獲取簽名URL錯誤`, 'background:#F44336;color:white;padding:3px 6px;border-radius:3px;', {
      publicId,
      error
    });
    throw error;
  }
};

/**
 * 獲取優化後的Cloudinary圖片URL
 * 使用Cloudinary轉換參數減少資源消耗
 * @param url 原始Cloudinary URL
 * @param type 圖片類型 ('thumbnail'|'preview'|'original')
 * @returns 優化後的URL
 */
export const getOptimizedImageUrl = (url: string, type: 'thumbnail' | 'preview' | 'original'): string => {
  if (!url) return '';

  switch (type) {
    case 'thumbnail':
      // 使用 c_fill 確保裁剪到正確尺寸，q_auto:eco 提供較小文件大小
      return url.replace('/upload/', '/upload/c_fill,g_auto,h_150,w_150,q_auto:eco,f_auto/');

    case 'preview':
      // 較小的預覽尺寸，良好的品質平衡
      return url.replace('/upload/', '/upload/c_scale,w_600,q_auto:good,f_auto/');

    case 'original':
      // 自動優化品質和格式但保持原始尺寸
      return url.replace('/upload/', '/upload/q_auto,f_auto/');

    default:
      return url;
  }
};