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

// 請求計數器
const requestCounter = {
  total: 0,
  thumbnail: 0,
  preview: 0,
  original: 0,
  all: 0
};

/**
 * 生成Cloudinary資源的簽名URL
 * @param req 請求，包含資源publicId和可選的type參數
 * @param res 響應，返回簽名URL
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // 唯一請求ID
  const requestId = Date.now().toString(36) + Math.random().toString(36).substring(2, 9);

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
    const { publicId, type } = req.query;
    const requestType = type as string | undefined;
    const userAgent = req.headers['user-agent'] || '未知';

    if (!publicId || typeof publicId !== 'string') {
      return res.status(400).json({ message: '缺少必要的publicId參數' });
    }

    // 增加計數器
    requestCounter.total++;
    if (requestType === 'thumbnail') requestCounter.thumbnail++;
    else if (requestType === 'preview') requestCounter.preview++;
    else if (requestType === 'original') requestCounter.original++;
    else requestCounter.all++;

    // 請求追蹤日誌
    console.log(`[API請求] #${requestCounter.total} - 簽名URL請求 ${requestId}`, {
      時間: new Date().toISOString(),
      用戶: session.user?.email,
      圖片ID: publicId,
      類型: type || 'all',
      userAgent: userAgent.substring(0, 100),
      計數器狀態: { ...requestCounter }
    });

    // 檢查 Cloudinary 配置
    const { cloud_name, api_key, api_secret } = cloudinary.config();
    if (!cloud_name || !api_key || !api_secret) {
      console.error('Cloudinary 配置錯誤:', { cloud_name, api_key, api_secret: api_secret ? '已設定' : '未設定' });
      return res.status(500).json({ message: 'Cloudinary 配置錯誤' });
    }

    // 時間戳記
    const timestamp = Math.floor(Date.now() / 1000);
    const expiration = timestamp + 3600; // 1小時後過期

    // 根據請求類型優化轉換參數
    let thumbnailTransform = 'c_fill,g_auto,h_150,w_150,q_auto:eco,f_auto';
    let previewTransform = 'c_scale,w_600,q_auto:good,f_auto';
    let originalTransform = 'q_auto,f_auto';

    // 如果指定了特定類型，只生成該類型的URL以減少計算和帶寬
    const requestedType = type as string | undefined;

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

    // 準備響應數據
    const responseData: any = {
      timestamp,
      expires: expiration,
      requestId
    };

    // 生成開始時間
    const startTime = process.hrtime();

    // 根據請求類型生成相應的URL
    if (!requestedType || requestedType === 'thumbnail' || requestedType === 'all') {
      responseData.thumbnailUrl = generatePrivateDownloadUrl(thumbnailTransform);
      if (!responseData.privateDownload) responseData.privateDownload = {};
      responseData.privateDownload.thumbnailUrl = responseData.thumbnailUrl;
    }

    if (!requestedType || requestedType === 'preview' || requestedType === 'all') {
      responseData.previewUrl = generatePrivateDownloadUrl(previewTransform);
      if (!responseData.privateDownload) responseData.privateDownload = {};
      responseData.privateDownload.previewUrl = responseData.previewUrl;
    }

    if (!requestedType || requestedType === 'original' || requestedType === 'all') {
      responseData.originalUrl = generatePrivateDownloadUrl(originalTransform);
      if (!responseData.privateDownload) responseData.privateDownload = {};
      responseData.privateDownload.originalUrl = responseData.originalUrl;
    }

    // 計算響應時間
    const hrend = process.hrtime(startTime);
    const executionTimeMs = hrend[0] * 1000 + hrend[1] / 1000000;

    // 添加快取相關響應頭，鼓勵客戶端和中間緩存保留這些響應
    res.setHeader('Cache-Control', 'public, max-age=3000, s-maxage=3600, stale-while-revalidate=86400');
    res.setHeader('Expires', new Date(Date.now() + 3000 * 1000).toUTCString());
    res.setHeader('Cloudinary-Req-ID', requestId);

    // 完成日誌
    console.log(`[API響應] #${requestCounter.total} - 完成請求 ${requestId}`, {
      時間: new Date().toISOString(),
      處理時間: `${executionTimeMs.toFixed(2)}ms`,
      生成URL類型: Object.keys(responseData.privateDownload || {}).join(','),
      過期時間: new Date(expiration * 1000).toISOString()
    });

    // 返回生成的URLs
    res.status(200).json(responseData);
  } catch (error) {
    console.error('生成簽名URL錯誤:', error);
    res.status(500).json({
      message: '生成簽名URL時發生錯誤',
      error: (error as Error).message,
      cacheControl: 'no-store' // 確保錯誤響應不被緩存
    });
  }
}