import { CloudinaryImageConfig, CloudinaryResource, CloudinaryImageResource } from './types';
import type { CloudinaryUploadWidgetOptions, CloudinaryUploadWidgetResults } from 'next-cloudinary';

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

export const convertToImageResource = (info: CloudinaryResource): CloudinaryImageResource => {
  return {
    ...info,
    thumbnailUrl: info.secure_url.replace('/upload/', '/upload/c_fill,g_auto,h_200,w_200/'),
    previewUrl: info.secure_url.replace('/upload/', '/upload/c_scale,w_600/')
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
): CloudinaryUploadWidgetOptions => {
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