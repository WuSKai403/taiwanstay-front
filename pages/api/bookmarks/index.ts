import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);

  if (!session?.user) {
    return res.status(401).json({ error: '請先登入' });
  }

  const { db } = await connectToDatabase();

  if (req.method === 'GET') {
    const { opportunityId } = req.query;

    if (!opportunityId || typeof opportunityId !== 'string') {
      return res.status(400).json({ error: '缺少必要參數' });
    }

    try {
      const bookmark = await db.collection('bookmarks').findOne({
        userId: new ObjectId(session.user.id),
        opportunityId: new ObjectId(opportunityId)
      });

      return res.json({ isBookmarked: !!bookmark });
    } catch (error) {
      console.error('檢查書籤狀態失敗:', error);
      return res.status(500).json({ error: '檢查書籤狀態時發生錯誤' });
    }
  }

  if (req.method === 'POST') {
    const { opportunityId } = req.body;

    if (!opportunityId) {
      return res.status(400).json({ error: '缺少必要參數' });
    }

    try {
      const existingBookmark = await db.collection('bookmarks').findOne({
        userId: new ObjectId(session.user.id),
        opportunityId: new ObjectId(opportunityId)
      });

      if (existingBookmark) {
        // 如果已經收藏過，則取消收藏
        await db.collection('bookmarks').deleteOne({
          _id: existingBookmark._id
        });
        return res.json({ isBookmarked: false });
      } else {
        // 如果還沒收藏，則新增收藏
        await db.collection('bookmarks').insertOne({
          userId: new ObjectId(session.user.id),
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
}