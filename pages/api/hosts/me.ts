import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from 'next-auth/react';
import { connectToDatabase } from '@/lib/mongodb';
import Host from '@/models/Host';
import User from '@/models/User';
import Application from '@/models/Application';
import Opportunity from '@/models/Opportunity';

/**
 * 獲取當前用戶的主人資訊
 * GET /api/hosts/me
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: '方法不允許' });
  }

  try {
    // 獲取當前用戶的 session
    const session = await getSession({ req });

    if (!session || !session.user || !session.user.id) {
      return res.status(401).json({ success: false, message: '未授權' });
    }

    // 連接數據庫
    await connectToDatabase();

    // 查找當前用戶
    const user = await User.findById(session.user.id);

    if (!user) {
      return res.status(404).json({ success: false, message: '用戶不存在' });
    }

    // 如果用戶沒有關聯的主人ID，返回404
    if (!user.hostId) {
      return res.status(404).json({ success: false, message: '未找到主人資訊' });
    }

    // 查找主人資訊
    const host = await Host.findById(user.hostId);

    if (!host) {
      return res.status(404).json({ success: false, message: '未找到主人資訊' });
    }

    // 獲取申請數量和機會數量
    const applicationCount = await Application.countDocuments({ hostId: host._id });
    const opportunityCount = await Opportunity.countDocuments({ hostId: host._id });

    // 返回主人資訊
    return res.status(200).json({
      success: true,
      host: {
        ...host.toJSON(),
        applicationCount,
        opportunityCount
      }
    });
  } catch (error) {
    console.error('獲取主人資訊錯誤:', error);
    return res.status(500).json({ success: false, message: '服務器錯誤' });
  }
}