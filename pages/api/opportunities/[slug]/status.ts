import { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '@/lib/dbConnect';
import Opportunity from '@/models/Opportunity';
import { OpportunityStatus } from '@/models/enums';
import { isValidObjectId } from '@/utils/helpers';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/pages/api/auth/[...nextauth]';
import { isTransitionAllowed } from '@/lib/opportunities/statusManager';
import { requireOpportunityAccess } from '@/lib/middleware/authMiddleware';
import mongoose from 'mongoose';

// Host 允許的狀態轉換列表
const HOST_ALLOWED_TRANSITIONS: Partial<Record<OpportunityStatus, OpportunityStatus[]>> = {
  [OpportunityStatus.DRAFT]: [OpportunityStatus.PENDING],
  [OpportunityStatus.PENDING]: [OpportunityStatus.DRAFT], // 撤回審核
  [OpportunityStatus.ACTIVE]: [OpportunityStatus.PAUSED], // 暫停刊登
  [OpportunityStatus.PAUSED]: [OpportunityStatus.ACTIVE], // 重新開放
  [OpportunityStatus.REJECTED]: [OpportunityStatus.PENDING], // 重新送審
  [OpportunityStatus.EXPIRED]: [], // Host 不能從過期狀態變更
  [OpportunityStatus.FILLED]: []  // Host 不能從已滿狀態變更
};

// 檢查 host 是否允許執行此狀態轉換
function isHostAllowedTransition(currentStatus: OpportunityStatus, newStatus: OpportunityStatus): boolean {
  return HOST_ALLOWED_TRANSITIONS[currentStatus]?.includes(newStatus) || false;
}

// 提取 slug 參數並轉換為 ID
const extractOpportunityIdFromSlug = (req: NextApiRequest): string => {
  const { slug } = req.query;
  const idPart = (slug as string).split('-')[0];
  return isValidObjectId(idPart) ? idPart : slug as string;
};

// 狀態歷史記錄介面
interface StatusHistoryItem {
  status: OpportunityStatus;
  reason?: string;
  changedBy: mongoose.Types.ObjectId;
  changedAt: Date;
}

async function updateStatus(req: NextApiRequest, res: NextApiResponse) {
  // 只允許 PATCH 方法
  if (req.method !== 'PATCH') {
    return res.status(405).json({ success: false, message: '方法不允許' });
  }

  try {
    // 連接數據庫
    await dbConnect();

    const { slug } = req.query;
    const { status, reason } = req.body;

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

    // 取得當前用戶會話
    const session = await getServerSession(req, res, authOptions);
    if (!session || !session.user) {
      return res.status(401).json({ success: false, message: '未授權，請先登入' });
    }

    // 檢查狀態轉換是否有效
    const currentStatus = opportunity.status as OpportunityStatus;
    const newStatus = status as OpportunityStatus;

    // 首先檢查是否是可能的狀態轉換
    if (!isTransitionAllowed(currentStatus, newStatus)) {
      return res.status(400).json({
        success: false,
        message: '無效的狀態轉換',
        currentStatus,
        requestedStatus: newStatus
      });
    }

    // 再檢查是否是 host 允許的轉換
    if (!isHostAllowedTransition(currentStatus, newStatus)) {
      return res.status(403).json({
        success: false,
        message: '您沒有權限執行此狀態變更，請聯繫管理員',
        currentStatus,
        requestedStatus: newStatus
      });
    }

    // 添加特殊處理邏輯
    const updateData: any = { status: newStatus };

    // 創建狀態變更歷史記錄
    const statusHistoryItem: StatusHistoryItem = {
      status: newStatus,
      reason: reason || '主辦方主動變更',
      changedBy: new mongoose.Types.ObjectId(session.user.id),
      changedAt: new Date()
    };

    // 更新狀態並添加狀態歷史記錄
    const updatedOpportunity = await Opportunity.findByIdAndUpdate(
      opportunityId,
      {
        $set: updateData,
        $push: { statusHistory: statusHistoryItem }
      },
      { new: true }
    );

    return res.status(200).json({
      success: true,
      message: '狀態更新成功',
      opportunity: {
        id: updatedOpportunity._id,
        status: updatedOpportunity.status,
        statusHistory: updatedOpportunity.statusHistory
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

export default requireOpportunityAccess(extractOpportunityIdFromSlug)(updateStatus);