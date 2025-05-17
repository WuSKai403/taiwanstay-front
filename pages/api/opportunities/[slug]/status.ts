import { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '@/lib/dbConnect';
import Opportunity from '@/models/Opportunity';
import { OpportunityStatus } from '@/models/enums';
import { isValidObjectId } from '@/utils/helpers';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/pages/api/auth/[...nextauth]';
import { UserRole } from '@/models/enums/UserRole';
import User from '@/models/User';
import { isValidStatusTransition } from '@/lib/hooks/useOpportunities';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // 只允許 PATCH 方法
  if (req.method !== 'PATCH') {
    return res.status(405).json({ success: false, message: '方法不允許' });
  }

  try {
    // 獲取用戶會話
    const session = await getServerSession(req, res, authOptions);

    if (!session || !session.user) {
      return res.status(401).json({ success: false, message: '未授權，請先登入' });
    }

    // 連接數據庫
    await dbConnect();

    // 檢查用戶是否為管理員
    const user = await User.findById(session.user.id);
    const isAdmin = user && (user.role === UserRole.ADMIN || user.role === UserRole.SUPER_ADMIN);

    if (!isAdmin) {
      return res.status(403).json({ success: false, message: '需要管理員權限' });
    }

    const { slug } = req.query;
    const { status } = req.body;

    if (!status || !Object.values(OpportunityStatus).includes(status)) {
      return res.status(400).json({ success: false, message: '無效的狀態值' });
    }

    // 查找機會
    let opportunity;
    let opportunityId;

    // 如果是有效的 MongoDB ObjectId，直接用來查詢
    if (isValidObjectId(slug as string)) {
      opportunityId = slug;
      opportunity = await Opportunity.findById(opportunityId);
    } else {
      // 否則嘗試通過 slug 查詢
      opportunity = await Opportunity.findOne({ slug: slug });
      opportunityId = opportunity?._id;
    }

    if (!opportunity) {
      return res.status(404).json({ success: false, message: '機會不存在' });
    }

    // 檢查狀態轉換是否有效
    const currentStatus = opportunity.status;
    if (!isValidStatusTransition(currentStatus, status)) {
      return res.status(400).json({
        success: false,
        message: '無效的狀態轉換',
        currentStatus,
        requestedStatus: status
      });
    }

    // 添加特殊處理邏輯
    const updateData: any = { status };

    // 如果從非活躍狀態變為活躍狀態，設置發布日期
    if (status === OpportunityStatus.ACTIVE && currentStatus !== OpportunityStatus.ACTIVE) {
      updateData.publishedAt = new Date();
    }

    // 如果是被拒絕的狀態，可能需要包含拒絕原因
    if (status === OpportunityStatus.REJECTED && req.body.rejectionReason) {
      updateData.rejectionReason = req.body.rejectionReason;
    }

    // 更新狀態
    const updatedOpportunity = await Opportunity.findByIdAndUpdate(
      opportunityId,
      { $set: updateData },
      { new: true }
    );

    return res.status(200).json({
      success: true,
      message: '狀態更新成功',
      opportunity: {
        id: updatedOpportunity._id,
        status: updatedOpportunity.status,
        publishedAt: updatedOpportunity.publishedAt
      }
    });
  } catch (error) {
    console.error('更新機會狀態時出錯:', error);
    return res.status(500).json({
      success: false,
      message: '更新狀態失敗，請稍後再試',
      error: (error as Error).message
    });
  }
}