import { NextApiRequest, NextApiResponse } from 'next';
import { cloudinaryService } from '@/lib/cloudinary';
import Notification from '@/models/Notification';
import { NotificationType } from '@/models/enums/NotificationType';
import { v2 as cloudinary } from 'cloudinary';

// Cloudinary 通知的介面定義
interface CloudinaryNotification {
  public_id: string;
  secure_url: string;
  resource_type: string;
  type: string;
  eager?: Array<{
    transformation: string;
    url: string;
    secure_url: string;
  }>;
  notification_type: string;
  upload_info?: {
    info?: {
      detection?: {
        captioning?: {
          data?: {
            caption?: string;
          };
        };
      };
    };
  };
  tags?: string[];
  context?: Record<string, string>;
}

// 驗證 Cloudinary 請求
const validateCloudinaryRequest = (req: NextApiRequest): boolean => {
  const timestamp = req.headers['x-cld-timestamp'];
  const signature = req.headers['x-cld-signature'];

  if (!timestamp || !signature) {
    console.error('Missing Cloudinary verification headers');
    return false;
  }

  // TODO: 實作簽名驗證邏輯
  return true;
};

// 處理上傳完成通知
async function handleUploadComplete(notification: CloudinaryNotification) {
  try {
    // 取得資源資訊
    const resourceInfo = await cloudinary.api.resource(notification.public_id);

    // 檢查是否為低品質圖片
    if (notification.tags?.includes('blurry')) {
      // 可以發送通知給相關用戶
      await Notification.create({
        userId: resourceInfo.context?.userId, // 假設 context 中有 userId
        type: NotificationType.SYSTEM_ANNOUNCEMENT,
        title: '圖片品質警告',
        message: '您上傳的圖片可能品質不佳，建議重新上傳更清晰的版本。',
        isRead: false,
        metadata: {
          resourceId: notification.public_id,
          resourceType: notification.resource_type
        }
      });
    }

    // 如果有自動生成的說明文字，更新到 context
    if (notification.upload_info?.info?.detection?.captioning?.data?.caption) {
      const formData = new FormData();
      formData.append('file', notification.secure_url);
      formData.append('context', JSON.stringify({
        caption: notification.upload_info.info.detection.captioning.data.caption
      }));

      await fetch(
        `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/auto/upload`,
        {
          method: 'POST',
          body: formData
        }
      );
    }

    console.log('Upload completed:', {
      public_id: notification.public_id,
      url: notification.secure_url,
      resource_type: notification.resource_type
    });
  } catch (error) {
    console.error('Error handling upload complete:', error);
    throw error;
  }
}

// 處理 eager 轉換完成通知
async function handleEagerComplete(notification: CloudinaryNotification) {
  try {
    if (!notification.eager) {
      throw new Error('No eager transformations in notification');
    }

    // 記錄轉換結果
    console.log('Eager transformations completed:', {
      public_id: notification.public_id,
      transformations: notification.eager
    });

    // 可以在這裡處理轉換後的資源
    // 例如：更新資料庫中的資源狀態
    // 或發送通知給相關用戶
  } catch (error) {
    console.error('Error handling eager complete:', error);
    throw error;
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // 只允許 POST 請求
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // 驗證請求來源
    if (!validateCloudinaryRequest(req)) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // 解析通知內容
    const notification = req.body as CloudinaryNotification;

    // 根據通知類型處理不同情況
    switch (notification.notification_type) {
      case 'eager':
        await handleEagerComplete(notification);
        break;

      case 'upload':
        await handleUploadComplete(notification);
        break;

      default:
        console.log('Unhandled notification type:', notification.notification_type);
    }

    // 回應 Cloudinary
    return res.status(200).json({
      received: true,
      notification_type: notification.notification_type
    });

  } catch (error) {
    console.error('Error processing Cloudinary notification:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}