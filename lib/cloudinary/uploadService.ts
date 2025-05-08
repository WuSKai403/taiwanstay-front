import { CloudinaryImageResource } from './types';

/**
 * Cloudinary直接上傳參數
 */
export interface UploadOptions {
  /** 上傳的檔案 */
  file: File;
  /** 上傳目標資料夾 */
  folder?: string;
  /** 資源類型 */
  resourceType?: 'image' | 'video' | 'auto';
  /** 是否為私有檔案 */
  isPrivate?: boolean;
  /** 上傳模式: 'applicant' - 使用私有預設值, 'host' - 使用公開預設值, 默認根據isPrivate決定 */
  uploadMode?: 'applicant' | 'host';
  /** 上傳進度回調 */
  onProgress?: (percent: number) => void;
  /** 指定的公開ID */
  publicId?: string;
  /** 自訂標籤 */
  tags?: string[];
}

/**
 * Cloudinary上傳結果
 */
export interface CloudinaryUploadResponse {
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
  bytes: number;
  type: string;
  url: string;
  secure_url: string;
  original_filename: string;
  tags?: string[];
  context?: {
    caption?: string;
    alt?: string;
  };
}

/**
 * Cloudinary上傳服務
 * 提供簡易的檔案上傳功能，直接使用Cloudinary API
 */
export class CloudinaryUploadService {
  /**
   * 直接上傳檔案到Cloudinary
   * @param options 上傳選項
   * @returns 上傳結果Promise
   */
  static async uploadFile(options: UploadOptions): Promise<CloudinaryUploadResponse> {
    const {
      file,
      folder = 'taiwanstay',
      resourceType = 'auto',
      isPrivate = false,
      uploadMode,
      onProgress,
      publicId,
      tags = []
    } = options;

    // 根據uploadMode或isPrivate決定使用哪個上傳預設值
    let uploadPreset: string | undefined;
    if (uploadMode === 'applicant') {
      // 申請者上傳的個人照片使用private預設值
      uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_PRIVATE_UPLOAD_PRESET;
    } else if (uploadMode === 'host') {
      // 主辦方上傳的機會照片使用public預設值
      uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_PUBLIC_UPLOAD_PRESET;
    } else {
      // 保持原有邏輯，根據isPrivate決定
      uploadPreset = isPrivate
      ? process.env.NEXT_PUBLIC_CLOUDINARY_PRIVATE_UPLOAD_PRESET
      : process.env.NEXT_PUBLIC_CLOUDINARY_PUBLIC_UPLOAD_PRESET;
    }

    // 獲取雲名稱
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;

    // 檢查配置
    if (!uploadPreset || !cloudName) {
      throw new Error('缺少Cloudinary配置，請檢查環境變數');
    }

    // 準備上傳資料
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', uploadPreset);

    // 設定目標資料夾，根據實際上傳預設值決定子資料夾
    const isUsingPrivatePreset = uploadMode === 'applicant' ||
      (uploadMode === undefined && isPrivate);
    const targetFolder = isUsingPrivatePreset ? `${folder}/private` : `${folder}/public`;
    formData.append('folder', targetFolder);

    // 如果有指定公開ID，則加入
    if (publicId) {
      formData.append('public_id', publicId);
    }

    // 如果有標籤，則加入
    if (tags.length > 0) {
      formData.append('tags', tags.join(','));
    }

    // 使用XMLHttpRequest支援上傳進度
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      // 監聽上傳進度
      if (onProgress) {
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const percentComplete = Math.round((event.loaded / event.total) * 100);
            onProgress(percentComplete);
          }
        };
      }

      // 處理上傳完成
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const response = JSON.parse(xhr.responseText) as CloudinaryUploadResponse;
            resolve(response);
          } catch (error) {
            reject(new Error('上傳成功但解析結果失敗'));
          }
        } else {
          try {
            const errorData = JSON.parse(xhr.responseText);
            reject(new Error(errorData.error?.message || '上傳失敗'));
          } catch (error) {
            reject(new Error(`上傳失敗 (${xhr.status})`));
          }
        }
      };

      // 處理上傳錯誤
      xhr.onerror = () => {
        reject(new Error('網絡錯誤，上傳失敗'));
      };

      // 開始上傳
      xhr.open('POST', `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`);
      xhr.send(formData);
    });
  }

  /**
   * 將上傳結果轉換為應用程式可用的圖片資源格式
   * @param result 上傳結果
   * @returns 圖片資源
   */
  static convertToImageResource(result: CloudinaryUploadResponse): CloudinaryImageResource {
    return {
      publicId: result.public_id,
      secureUrl: result.secure_url,
      previewUrl: result.secure_url.replace('/upload/', '/upload/c_scale,w_600/'),
      thumbnailUrl: result.secure_url.replace('/upload/', '/upload/c_fill,g_auto,h_200,w_200/'),
      version: result.version_id,
      altText: result.context?.alt
    };
  }

  /**
   * 刪除Cloudinary上的檔案
   * 注意：這個方法呼叫後端API進行刪除，因為刪除需要API Secret
   * @param publicId 要刪除的檔案公開ID
   * @returns 刪除結果Promise
   */
  static async deleteFile(publicId: string): Promise<{ result: string }> {
    const response = await fetch(`/api/cloudinary/delete?publicId=${encodeURIComponent(publicId)}`, {
      method: 'DELETE'
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || '刪除失敗');
    }

    return response.json();
  }
}