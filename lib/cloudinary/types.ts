// Cloudinary 資源基本介面
export interface CloudinaryResource {
  publicId: string;
  format?: string;
  version?: string;
  filename?: string;
  secureUrl: string;
  url?: string;
  bytes?: number;
  width?: number;
  height?: number;
  created_at?: string;
  resource_type?: string;
}

// 上傳結果介面 (原始的Cloudinary API回應)
export interface CloudinaryUploadResult {
  publicId: string;
  secureUrl: string;
  bytes: number;
  created_at: string;
  format: string;
  original_filename: string;
  width: number;
  height: number;
}

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

// 簽名URL介面
export interface CloudinaryResourceURL {
  thumbnailUrl: string;
  previewUrl: string;
  originalUrl: string;
}

export interface SignedUrls {
  thumbnailUrl: string;
  previewUrl: string;
  originalUrl: string;
  privateDownload?: CloudinaryResourceURL;
  timestamp?: number;
  expires?: number;
}

// 圖片資源介面（用於前端顯示）
export interface CloudinaryImageResource extends CloudinaryResource {
  alt?: string;
  original_url?: string;
  original_secure_url?: string;
  thumbnailUrl: string;
  previewUrl: string;
  originalUrl?: string;
  signedUrls?: SignedUrls;
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