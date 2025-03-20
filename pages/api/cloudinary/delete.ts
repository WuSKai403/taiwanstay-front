import { NextApiRequest, NextApiResponse } from 'next';
import { v2 as cloudinary } from 'cloudinary';

// Cloudinary 設定
cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ message: '只允許 DELETE 請求' });
  }

  const { publicId } = req.query;

  if (!publicId || typeof publicId !== 'string') {
    return res.status(400).json({ message: '缺少 publicId 參數' });
  }

  try {
    const result = await cloudinary.uploader.destroy(publicId);
    res.status(200).json(result);
  } catch (error) {
    console.error('刪除檔案時發生錯誤:', error);
    res.status(500).json({ message: '刪除檔案失敗' });
  }
}