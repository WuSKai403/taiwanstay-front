import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/pages/api/auth/[...nextauth]';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { isValidObjectId } from '@/utils/helpers';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const session = await getServerSession(req, res, authOptions);

    // 除錯訊息
    console.log('Bookmarks API - Session:', {
      user: session?.user,
      authenticated: !!session
    });

    if (!session?.user) {
      return res.status(401).json({ error: '請先登入' });
    }

    // 確保有有效的用戶 ID
    const userId = session.user.id;
    if (!userId) {
      console.error('Session 中缺少用戶 ID');
      return res.status(400).json({ error: 'Session 中缺少用戶 ID' });
    }

    // 檢查用戶 ID 格式
    if (!isValidObjectId(userId)) {
      console.error('無效的用戶 ID 格式:', userId);
      return res.status(400).json({ error: '無效的用戶 ID 格式' });
    }

    const { db } = await connectToDatabase();

    if (req.method === 'GET') {
      const { opportunityId } = req.query;

      if (!opportunityId || typeof opportunityId !== 'string') {
        return res.status(400).json({ error: '缺少機會 ID' });
      }

      // 檢查機會 ID 格式
      if (!isValidObjectId(opportunityId)) {
        console.error('無效的機會 ID 格式:', opportunityId);
        return res.status(400).json({ error: '無效的機會 ID 格式' });
      }

      try {
        const bookmark = await db.collection('bookmarks').findOne({
          userId: new ObjectId(userId),
          opportunityId: new ObjectId(opportunityId)
        });

        return res.json({ isBookmarked: !!bookmark });
      } catch (error) {
        console.error('查詢書籤狀態失敗:', error);
        return res.status(500).json({ error: '查詢書籤狀態時發生錯誤' });
      }
    }

    if (req.method === 'POST') {
      const { opportunityId } = req.body;

      if (!opportunityId) {
        return res.status(400).json({ error: '缺少機會 ID' });
      }

      // 檢查機會 ID 格式
      if (!isValidObjectId(opportunityId)) {
        console.error('無效的機會 ID 格式:', opportunityId);
        return res.status(400).json({ error: '無效的機會 ID 格式' });
      }

      try {
        const existingBookmark = await db.collection('bookmarks').findOne({
          userId: new ObjectId(userId),
          opportunityId: new ObjectId(opportunityId)
        });

        if (existingBookmark) {
          await db.collection('bookmarks').deleteOne({
            _id: existingBookmark._id
          });
          return res.json({ isBookmarked: false });
        } else {
          await db.collection('bookmarks').insertOne({
            userId: new ObjectId(userId),
            opportunityId: new ObjectId(opportunityId),
            createdAt: new Date()
          });
          return res.json({ isBookmarked: true });
        }
      } catch (error) {
        console.error('更新書籤狀態失敗:', error);
        return res.status(500).json({ error: '更新書籤狀態時發生錯誤' });
      }
    }

    return res.status(405).json({ error: '不支援的請求方法' });
  } catch (error) {
    console.error('書籤 API 錯誤:', error);
    return res.status(500).json({ error: '處理請求時發生錯誤' });
  }
}