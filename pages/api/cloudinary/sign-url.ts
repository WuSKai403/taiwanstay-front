import { NextApiRequest, NextApiResponse } from 'next';
import { v2 as cloudinary } from 'cloudinary';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';

// 初始化Cloudinary配置
cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

/**
 * 生成Cloudinary資源的簽名URL
 * @param req 請求，包含資源publicId
 * @param res 響應，返回簽名URL
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // 檢查請求方法
  if (req.method !== 'GET') {
    return res.status(405).json({ message: '僅支持GET請求' });
  }

  try {
    // 檢查使用者認證
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      return res.status(401).json({ message: '需要認證才能訪問此API' });
    }

    // 獲取查詢參數
    const { publicId } = req.query;

    if (!publicId || typeof publicId !== 'string') {
      return res.status(400).json({ message: '缺少必要的publicId參數' });
    }

    // 檢查 Cloudinary 配置
    const { cloud_name, api_key, api_secret } = cloudinary.config();
    if (!cloud_name || !api_key || !api_secret) {
      console.error('Cloudinary 配置錯誤:', { cloud_name, api_key, api_secret: api_secret ? '已設定' : '未設定' });
      return res.status(500).json({ message: 'Cloudinary 配置錯誤' });
    }

    console.log('使用的 Cloudinary 配置:', { cloud_name, api_key, api_secret: '隱藏' });
    console.log('請求的公開ID:', publicId);

    // 時間戳記
    const timestamp = Math.floor(Date.now() / 1000);
    const expiration = timestamp + 3600; // 1小時後過期

    // 使用私有下載 URL 方法 (適用於訪問受限制資源)
    const generatePrivateDownloadUrl = (transformationString: string) => {
      try {
        // 使用 Cloudinary 的私有下載 URL 方法
        const options = {
          type: 'upload',
          resource_type: 'image',
          ...(transformationString ? { transformation: transformationString } : {})
        };

        return cloudinary.utils.private_download_url(publicId, 'jpg', options);
      } catch (error) {
        console.error('生成私有下載URL錯誤:', error);
        return null;
      }
    };

    // 取得轉換參數
    const thumbnailTransform = 'c_fill,g_auto,h_200,w_200';
    const previewTransform = 'c_scale,w_600';

    // 返回私有下載URLs
    res.status(200).json({
      // 私有下載URLs
      privateDownload: {
        thumbnailUrl: generatePrivateDownloadUrl(thumbnailTransform),
        previewUrl: generatePrivateDownloadUrl(previewTransform),
        originalUrl: generatePrivateDownloadUrl('')
      },
      // 預設URLs
      thumbnailUrl: generatePrivateDownloadUrl(thumbnailTransform),
      previewUrl: generatePrivateDownloadUrl(previewTransform),
      originalUrl: generatePrivateDownloadUrl(''),
      // 時間資訊
      timestamp,
      expires: expiration
    });
  } catch (error) {
    console.error('生成簽名URL錯誤:', error);
    res.status(500).json({ message: '生成簽名URL時發生錯誤', error: (error as Error).message });
  }
}