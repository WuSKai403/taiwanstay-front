import { HostStatus } from '@/models/enums/HostStatus';
import { CloudinaryImageResource } from '@/lib/cloudinary/types';

// 將 Host 照片格式轉換為 CloudinaryImageResource 格式
export const convertToCloudinaryResource = (photo: any): CloudinaryImageResource => {
  return {
    public_id: photo.publicId || "",
    secure_url: photo.secureUrl || "",
    thumbnailUrl: photo.thumbnailUrl || photo.secureUrl || "",
    previewUrl: photo.previewUrl || photo.secureUrl || ""
  };
};

// 判斷是否應該顯示特定狀態按鈕
export const shouldShowButton = (currentStatus: HostStatus, targetStatus: HostStatus): boolean => {
  switch (targetStatus) {
    case HostStatus.ACTIVE:
      return currentStatus === HostStatus.PENDING || currentStatus === HostStatus.INACTIVE;
    case HostStatus.REJECTED:
      return currentStatus === HostStatus.PENDING;
    case HostStatus.INACTIVE:
      return currentStatus === HostStatus.ACTIVE;
    case HostStatus.SUSPENDED:
      return currentStatus === HostStatus.ACTIVE || currentStatus === HostStatus.INACTIVE;
    default:
      return false;
  }
};