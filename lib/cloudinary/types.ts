import { CloudinaryUploadWidgetResults, CloudinaryUploadWidgetInfo } from 'next-cloudinary';

// Cloudinary 資源基本介面
export interface CloudinaryResource extends CloudinaryUploadWidgetInfo {
  asset_id: string;
  public_id: string;
  version: number;
  version_id: string;
  signature: string;
  width: number;
  height: number;
  format: string;
  resource_type: string;
  created_at: string;
  tags: string[];
  bytes: number;
  type: string;
  etag: string;
  placeholder: boolean;
  url: string;
  secure_url: string;
  folder: string;
  original_filename: string;
  api_key: string;
}

// 上傳結果介面
export type CloudinaryUploadResult = CloudinaryUploadWidgetResults;

// 上傳設定介面
export interface CloudinaryUploadConfig {
  folder: string;
  isPrivate: boolean;
  maxFiles?: number;
  resourceType?: 'image' | 'video' | 'auto';
  tags?: string[];
  context?: Record<string, string>;
  uploadPreset?: string;
}

// 上傳狀態介面
export interface CloudinaryUploadStatus {
  isUploading: boolean;
  progress: number;
  error?: string;
}

// 圖片顯示設定介面
export interface CloudinaryImageConfig {
  width?: number;
  height?: number;
  crop?: string;
  gravity?: string;
  quality?: number;
  format?: string;
  effect?: string;
  radius?: number | string;
  background?: string;
  border?: string;
  dpr?: number | string;
  flags?: string[];
}

// 圖片資源介面（用於前端顯示）
export interface CloudinaryImageResource extends CloudinaryResource {
  thumbnailUrl: string;
  previewUrl: string;
  transformedUrl?: string;
  caption?: string;
  altText?: string;
  displayOrder?: number;
}

// 上傳元件 Props 介面
export interface CloudinaryUploaderProps {
  onUploadSuccess: (result: CloudinaryUploadResult) => void;
  onUploadError: (error: Error) => void;
  onUploadStart?: () => void;
  onUpdateComplete?: () => void;
  config: CloudinaryUploadConfig;
  className?: string;
  buttonText?: string;
}

// 圖片預覽元件 Props 介面
export interface CloudinaryPreviewProps {
  resource: CloudinaryImageResource;
  isPrivate?: boolean;
  showControls?: boolean;
  onDelete?: (publicId: string) => void;
  onEdit?: (resource: CloudinaryImageResource) => void;
  className?: string;
}

// 圖片集合元件 Props 介面
export interface CloudinaryGalleryProps {
  resources: CloudinaryImageResource[];
  isPrivate?: boolean;
  layout?: 'grid' | 'masonry' | 'carousel';
  onSort?: (resources: CloudinaryImageResource[]) => void;
  className?: string;
}

// 上傳進度介面
export interface UploadProgressInfo {
  fileName: string;
  progress: number;
  status: 'pending' | 'uploading' | 'complete' | 'error';
  error?: string;
}

// Cloudinary 設定介面
export interface CloudinaryConfig {
  cloudName: string;
  uploadPreset: {
    public: string;
    private: string;
  };
  folder: {
    public: string;
    private: string;
  };
}

export interface CloudinaryUploadError {
  message: string;
  statusCode?: number;
  error?: any;
}