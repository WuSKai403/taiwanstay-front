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

    if (!session || !session.user) {
      return res.status(401).json({ success: false, message: '未授權：缺少session' });
    }

    if (!session.user.id) {
      return res.status(401).json({ success: false, message: '未授權：缺少用戶ID' });
    }

    // 連接數據庫
    await connectToDatabase();

    // 查找當前用戶
    const user = await User.findById(session.user.id);

    if (!user) {
      console.error(`用戶不存在: ID=${session.user.id}`);
      return res.status(404).json({
        success: false,
        message: '用戶不存在',
        debugInfo: {
          userId: session.user.id ? `${session.user.id.substring(0, 6)}...` : 'missing',
          email: session.user.email
        }
      });
    }

    // 直接嘗試從session中獲取hostId
    const hostId = session.user.hostId || user.hostId;

    // 如果用戶沒有關聯的主人ID，返回404
    if (!hostId) {
      return res.status(404).json({
        success: false,
        message: '未找到主人資訊，用戶沒有關聯的主人ID'
      });
    }

    // 查找主人資訊
    const host = await Host.findById(hostId);

    if (!host) {
      console.error(`主人不存在: ID=${hostId}`);
      return res.status(404).json({
        success: false,
        message: '未找到主人資訊，指定的主人ID不存在',
        debugInfo: {
          hostId: hostId ? `${hostId.substring(0, 6)}...` : 'missing'
        }
      });
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
    return res.status(500).json({
      success: false,
      message: '服務器錯誤',
      error: error instanceof Error ? error.message : '未知錯誤'
    });
  }
}