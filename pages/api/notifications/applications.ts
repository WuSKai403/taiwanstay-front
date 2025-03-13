import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { connectToDatabase } from '@/lib/mongodb';
import Application from '@/models/Application';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // 只允許GET請求
    if (req.method !== 'GET') {
      return res.status(405).json({ success: false, message: '方法不允許' });
    }

    await connectToDatabase();

    // 獲取用戶會話
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      return res.status(401).json({ success: false, message: '未授權' });
    }

    // 查詢用戶的未讀訊息通知
    const applications = await Application.find({
      userId: session.user.id,
      'communications.unreadUserMessages': { $gt: 0 }
    })
      .select('opportunityId hostId status communications.unreadUserMessages communications.lastMessageAt')
      .populate('opportunityId', 'title')
      .populate('hostId', 'name')
      .sort({ 'communications.lastMessageAt': -1 });

    return res.status(200).json({
      success: true,
      data: applications
    });
  } catch (error: any) {
    console.error('獲取通知錯誤:', error);
    return res.status(500).json({ success: false, message: '伺服器錯誤', error: error.message });
  }
}
