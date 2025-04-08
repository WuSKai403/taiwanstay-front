import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]';
import { connectToDatabase } from '@/lib/mongodb';
import Host from '@/models/Host';
import Opportunity from '@/models/Opportunity';
import { ApplicationStatus } from '@/models/enums/ApplicationStatus';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: '方法不允許' });
  }

  try {
    // 檢查用戶是否已登入
    const session = await getServerSession(req, res, authOptions);
    if (!session || !session.user) {
      return res.status(401).json({ success: false, message: '未授權' });
    }

    const { hostId } = req.query;

    // 如果用戶不是該主人的擁有者
    if (session.user.hostId !== hostId) {
      return res.status(403).json({ success: false, message: '權限不足' });
    }

    await connectToDatabase();

    // 獲取主人資料
    const host = await Host.findById(hostId);
    if (!host) {
      return res.status(404).json({ success: false, message: '找不到主人資料' });
    }

    // 獲取工作機會數量
    const opportunityCount = await Opportunity.countDocuments({ hostId });

    // 獲取已發布的工作機會數量
    const publishedOpportunityCount = await Opportunity.countDocuments({
      hostId,
      status: 'ACTIVE'
    });

    // 獲取申請數量
    const db = (await connectToDatabase()).db;
    const applicationCollection = db.collection('applications');

    const applicationCount = await applicationCollection.countDocuments({
      'hostId': hostId
    });

    // 獲取待處理申請數量
    const pendingApplicationCount = await applicationCollection.countDocuments({
      'hostId': hostId,
      'status': ApplicationStatus.PENDING
    });

    // 獲取已接受申請數量
    const acceptedApplicationCount = await applicationCollection.countDocuments({
      'hostId': hostId,
      'status': { $in: [ApplicationStatus.ACCEPTED, ApplicationStatus.ACTIVE] }
    });

    // 獲取未讀訊息數量
    const unreadMessagesCount = await applicationCollection.countDocuments({
      'hostId': hostId,
      'communications.unreadHostMessages': { $gt: 0 }
    });

    // 返回統計數據
    return res.status(200).json({
      success: true,
      data: {
        opportunityCount,
        publishedOpportunityCount,
        applicationCount,
        pendingApplicationCount,
        acceptedApplicationCount,
        unreadMessagesCount
      }
    });
  } catch (error: any) {
    console.error('獲取主人統計數據錯誤:', error);
    return res.status(500).json({
      success: false,
      message: '獲取統計數據失敗',
      error: error.message
    });
  }
}