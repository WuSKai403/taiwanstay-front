/**
 * 通用媒體資源介面
 * 所有與 Cloudinary 相關的媒體資源統一使用此介面
 */
export interface MediaImage {
  // Cloudinary 資源 ID
  publicId: string;
  // 安全的 URL (HTTPS)
  secureUrl: string;
  // 可選的普通 URL
  url?: string;
  // 預覽尺寸 URL (600px)
  previewUrl?: string;
  // 縮圖尺寸 URL (200px)
  thumbnailUrl?: string;
  // 替代文字
  alt?: string;
  // 資源版本
  version?: string;
  // 檔案格式
  format?: string;
  // 檔案寬度
  width?: number;
  // 檔案高度
  height?: number;
}

/**
 * 通用媒體集合介面
 * 用於機會、主人、用戶等需要多種媒體資源的實體
 */
export interface MediaCollection {
  // 封面圖片
  coverImage?: MediaImage;
  // 圖片集合
  images?: MediaImage[];
  // 圖片描述 (與 images 陣列對應)
  descriptions?: string[];
  // 影片 URL
  videoUrl?: string;
  // 影片描述
  videoDescription?: string;
  // 虛擬導覽 URL
  virtualTour?: string;
}

/**
 * 簡單的配置圖片介面
 * 用於只需要一張圖片的場景，如用戶頭像
 */
export interface ProfileImage extends MediaImage {
  // 繼承 MediaImage 所有屬性
}

/**
 * 使用者頭像介面
 */
export interface UserMedia {
  // 用戶頭像
  profileImage?: ProfileImage;
}

/**
 * 主人媒體介面
 */
export interface HostMedia {
  // 主人頭像
  profileImage?: ProfileImage;
  // 主人封面圖片
  coverImage?: MediaImage;
  // 主人相關圖片集合
  images?: MediaImage[];
}

/**
 * 機會媒體介面
 */
export interface OpportunityMedia extends MediaCollection {
  // 繼承 MediaCollection 所有屬性
}

/**
 * 將前端媒體數據轉換為資料庫格式
 * @param mediaFromFrontend 前端傳來的媒體數據
 * @returns 適合資料庫儲存的媒體數據
 */
export function transformMediaForDB(mediaFromFrontend: any): any {
  if (!mediaFromFrontend) return null;

  // 轉換邏輯
  const result: any = {};

  // 處理封面圖片
  if (mediaFromFrontend.coverImage) {
    // 確保 URL 欄位一致性
    const coverImage = { ...mediaFromFrontend.coverImage };
    if (coverImage.secureUrl && !coverImage.url) {
      coverImage.url = coverImage.secureUrl;
    }
    result.coverImage = coverImage;
  }

  // 處理圖片集合
  if (mediaFromFrontend.images?.length > 0) {
    result.images = mediaFromFrontend.images.map((img: any) => {
      const image = { ...img };
      if (image.secureUrl && !image.url) {
        image.url = image.secureUrl;
      }
      return image;
    });
  }

  // 複製其他欄位
  if (mediaFromFrontend.descriptions) result.descriptions = mediaFromFrontend.descriptions;
  if (mediaFromFrontend.videoUrl) result.videoUrl = mediaFromFrontend.videoUrl;
  if (mediaFromFrontend.videoDescription) result.videoDescription = mediaFromFrontend.videoDescription;
  if (mediaFromFrontend.virtualTour) result.virtualTour = mediaFromFrontend.virtualTour;

  // 處理用戶頭像
  if (mediaFromFrontend.profileImage) {
    const profileImage = { ...mediaFromFrontend.profileImage };
    if (profileImage.secureUrl && !profileImage.url) {
      profileImage.url = profileImage.secureUrl;
    }
    result.profileImage = profileImage;
  }

  return result;
}

/**
 * 將資料庫媒體數據轉換為前端格式
 * @param mediaFromDB 資料庫儲存的媒體數據
 * @returns 適合前端使用的媒體數據
 */
export function transformMediaForFrontend(mediaFromDB: any): any {
  if (!mediaFromDB) return null;

  // 轉換邏輯
  const result: any = {};

  // 處理封面圖片
  if (mediaFromDB.coverImage) {
    // 確保 secureUrl 欄位一致性
    const coverImage = { ...mediaFromDB.coverImage };
    if (coverImage.url && !coverImage.secureUrl) {
      coverImage.secureUrl = coverImage.url;
    }
    result.coverImage = coverImage;
  }

  // 處理圖片集合
  if (mediaFromDB.images?.length > 0) {
    result.images = mediaFromDB.images.map((img: any) => {
      const image = { ...img };
      if (image.url && !image.secureUrl) {
        image.secureUrl = image.url;
      }
      return image;
    });
  }

  // 複製其他欄位
  if (mediaFromDB.descriptions) result.descriptions = mediaFromDB.descriptions;
  if (mediaFromDB.videoUrl) result.videoUrl = mediaFromDB.videoUrl;
  if (mediaFromDB.videoDescription) result.videoDescription = mediaFromDB.videoDescription;
  if (mediaFromDB.virtualTour) result.virtualTour = mediaFromDB.virtualTour;

  // 處理用戶頭像
  if (mediaFromDB.profileImage) {
    const profileImage = { ...mediaFromDB.profileImage };
    if (profileImage.url && !profileImage.secureUrl) {
      profileImage.secureUrl = profileImage.url;
    }
    result.profileImage = profileImage;
  }

  return result;
}