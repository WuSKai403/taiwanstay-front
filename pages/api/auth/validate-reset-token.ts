import { NextApiRequest, NextApiResponse } from 'next';
import { connectToDatabase } from '@/lib/mongodb';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: '方法不允許' });
  }

  try {
    const { token } = req.query;

    if (!token) {
      return res.status(400).json({ message: '缺少重置令牌' });
    }

    const { db } = await connectToDatabase();

    // 查找具有有效重置令牌的用戶
    const user = await db.collection('users').findOne({
      resetToken: token,
      resetTokenExpiry: { $gt: new Date() }
    });

    if (!user) {
      return res.status(400).json({ message: '無效或已過期的重置令牌' });
    }

    return res.status(200).json({ message: '重置令牌有效' });
  } catch (error) {
    console.error('驗證重置令牌錯誤:', error);
    return res.status(500).json({ message: '驗證重置令牌時發生錯誤' });
  }
}