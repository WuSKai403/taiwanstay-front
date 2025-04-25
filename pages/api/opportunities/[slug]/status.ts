import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from 'next-auth/react';
import { connectToDatabase } from '@/lib/mongodb';
import Opportunity from '@/models/Opportunity';
import Host from '@/models/Host';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // 只允許 PATCH 方法
  if (req.method !== 'PATCH') {
    return res.status(405).json({ success: false, message: '方法不允許' });
  }

  try {
    // 獲取用戶會話
    const session = await getSession({ req });

    if (!session || !session.user) {
      return res.status(401).json({ success: false, message: '未授權' });
    }

    // 連接數據庫
    await connectToDatabase();

    const { opportunityId } = req.query;
    const { status } = req.body;

    // 驗證狀態值
    const validStatuses = ['DRAFT', 'PUBLISHED', 'PAUSED', 'ARCHIVED'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: '無效的狀態值' });
    }

    // 獲取機會信息
    const opportunity = await Opportunity.findById(opportunityId);

    if (!opportunity) {
      return res.status(404).json({ success: false, message: '機會不存在' });
    }

    // 檢查主人身份
    const host = await Host.findOne({
      _id: opportunity.hostId,
      userId: session.user.id
    });

    if (!host) {
      return res.status(403).json({ success: false, message: '沒有訪問權限' });
    }

    // 更新狀態
    opportunity.status = status;

    // 如果從草稿變為已發布，設置發布日期
    if (status === 'PUBLISHED' && opportunity.status !== 'PUBLISHED') {
      opportunity.publishedAt = new Date();
    }

    await opportunity.save();

    return res.status(200).json({
      success: true,
      message: '狀態更新成功',
      opportunity: {
        id: opportunity._id,
        status: opportunity.status,
        publishedAt: opportunity.publishedAt
      }
    });
  } catch (error) {
    console.error('更新機會狀態時出錯:', error);
    return res.status(500).json({ success: false, message: '服務器錯誤' });
  }
}