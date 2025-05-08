export interface CustomTransformationOptions {
  width?: number;
  height?: number;
  crop?: string;
  radius?: string;
  quality?: string;
  fetch_format?: string;
}

// 上傳結果介面
export interface CloudinaryUploadResult {
  asset_id: string;
  publicId: string;
  version: number;
  version_id: string;
  signature: string;
  width: number;
  height: number;
  format: string;
  resource_type: string;
  created_at: string;
  bytes: number;
  type: string;
  url: string;
  secureUrl: string;
  original_filename: string;
  tags?: string[];
  context?: {
    caption?: string;
    alt?: string;
  };
}

export interface CloudinaryDeleteResult {
  result: string;
  asset_id?: string;
}

export interface CloudinaryUpdateResult extends CloudinaryUploadResult {
  // 更新特定的欄位
}

export interface CloudinaryError {
  message: string;
  name: string;
  http_code?: number;
}

class CloudinaryService {
  private static instance: CloudinaryService;
  private cloudName: string;

  private constructor() {
    this.cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || '';
  }

  public static getInstance(): CloudinaryService {
    if (!CloudinaryService.instance) {
      CloudinaryService.instance = new CloudinaryService();
    }
    return CloudinaryService.instance;
  }

  private getUploadOptions(isPrivate: boolean = false): Record<string, any> {
    return {
      resource_type: 'auto',
      folder: isPrivate ? 'taiwanstay/private' : 'taiwanstay/public',
      context: {
        caption: 'auto'
      }
    };
  }

  public async uploadImage(
    file: File | string,
    isPrivate: boolean = false,
    publicId?: string
  ): Promise<CloudinaryUploadResult> {
    try {
      const uploadPreset = isPrivate
        ? process.env.NEXT_PUBLIC_CLOUDINARY_PRIVATE_UPLOAD_PRESET
        : process.env.NEXT_PUBLIC_CLOUDINARY_PUBLIC_UPLOAD_PRESET;

      if (!uploadPreset) {
        throw new Error('Missing upload preset configuration');
      }

      const options = this.getUploadOptions(isPrivate);

      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', uploadPreset);
      formData.append('folder', options.folder);

      if (publicId) {
        formData.append('publicId', publicId);
      }

      if (options.context) {
        formData.append('context', JSON.stringify(options.context));
      }

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${this.cloudName}/auto/upload`,
        {
          method: 'POST',
          body: formData
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Upload failed');
      }

      return await response.json();
    } catch (error) {
      console.error('Upload error:', error);
      throw error;
    }
  }

  public async deleteFile(publicId: string): Promise<void> {
    // 刪除檔案需要在後端 API 處理，因為需要 API Secret
    const response = await fetch(`/api/cloudinary/delete?publicId=${publicId}`, {
      method: 'DELETE'
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Delete failed');
    }
  }

  public getTransformationString(transformations: CustomTransformationOptions[] = []): string {
    return transformations
      .map(transform => {
        const parts = [];
        if (transform.width) parts.push(`w_${transform.width}`);
        if (transform.height) parts.push(`h_${transform.height}`);
        if (transform.crop) parts.push(`c_${transform.crop}`);
        if (transform.radius) parts.push(`r_${transform.radius}`);
        if (transform.quality) parts.push(`q_${transform.quality}`);
        if (transform.fetch_format) parts.push(`f_${transform.fetch_format}`);
        return parts.join(',');
      })
      .join('/');
  }
}

export const cloudinaryService = CloudinaryService.getInstance();