import { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '@/lib/dbConnect';
import Opportunity from '@/models/Opportunity';
import { OpportunityStatus } from '@/models/enums';
import { isValidObjectId } from '@/utils/helpers';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/pages/api/auth/[...nextauth]';
import { UserRole } from '@/models/enums/UserRole';
import User from '@/models/User';
import mongoose from 'mongoose';
import {
  isTransitionAllowed,
  requiresReason,
  statusLabelMap
} from '@/lib/opportunities/statusManager';

// 定義權限配置的型別
type StatusPermission = {
  allowedRoles: UserRole[];
  requiresOwnership: boolean;
};

type StatusTransitionPermissions = {
  [K in OpportunityStatus]?: {
    [T in OpportunityStatus]?: StatusPermission;
  };
};

// 狀態操作權限配置
const STATUS_PERMISSIONS: StatusTransitionPermissions = {
  [OpportunityStatus.ACTIVE]: {
    [OpportunityStatus.PAUSED]: {
      allowedRoles: [UserRole.HOST],
      requiresOwnership: true
    },
    [OpportunityStatus.ADMIN_PAUSED]: {
      allowedRoles: [UserRole.ADMIN, UserRole.SUPER_ADMIN],
      requiresOwnership: false
    }
  },
  [OpportunityStatus.ADMIN_PAUSED]: {
    [OpportunityStatus.REJECTED]: {
      allowedRoles: [UserRole.ADMIN, UserRole.SUPER_ADMIN],
      requiresOwnership: false
    }
  }
};

// 狀態歷史記錄介面
interface StatusHistoryItem {
  status: OpportunityStatus;
  reason?: string;
  changedBy: mongoose.Types.ObjectId;
  changedAt: Date;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'PATCH') {
    return res.status(405).json({ success: false, message: '方法不允許' });
  }

  try {
    // 1. 基本驗證
    const session = await getServerSession(req, res, authOptions);
    if (!session?.user) {
      return res.status(401).json({ success: false, message: '未授權，請先登入' });
    }

    // 2. 連接數據庫
    await dbConnect();

    // 3. 獲取用戶資訊
    const user = await User.findById(session.user.id);
    if (!user) {
      return res.status(401).json({ success: false, message: '找不到用戶資訊' });
    }
    const isAdmin = user.role === UserRole.ADMIN || user.role === UserRole.SUPER_ADMIN;

    // 4. 驗證請求參數
    const { id } = req.query;
    const { status: newStatus, reason } = req.body;

    if (!newStatus || !Object.values(OpportunityStatus).includes(newStatus)) {
      return res.status(400).json({
        success: false,
        message: `無效的狀態值: ${newStatus}`
      });
    }

    // 5. 查找機會
    const opportunity = isValidObjectId(id as string)
      ? await Opportunity.findById(id)
      : await Opportunity.findOne({ slug: id });

    if (!opportunity) {
      return res.status(404).json({ success: false, message: '機會不存在' });
    }

    const currentStatus = opportunity.status as OpportunityStatus;
    const targetStatus = newStatus as OpportunityStatus;

    // 6. 權限檢查
    const permission = STATUS_PERMISSIONS[currentStatus]?.[targetStatus];
    if (permission) {
      const hasRole = permission.allowedRoles.includes(user.role);
      const isOwner = opportunity.hostId.toString() === user.id;
      const hasOwnership = !permission.requiresOwnership || isOwner || isAdmin;

      if (!hasRole || !hasOwnership) {
        return res.status(403).json({
          success: false,
          message: '您沒有權限執行此操作'
        });
      }
    }

    // 7. 狀態轉換檢查
    if (!isTransitionAllowed(currentStatus, targetStatus)) {
      return res.status(400).json({
        success: false,
        message: `無法從 ${statusLabelMap[currentStatus]} 轉換到 ${statusLabelMap[targetStatus]}`,
        currentStatus,
        requestedStatus: targetStatus
      });
    }

    // 8. 理由檢查
    if (requiresReason(currentStatus, targetStatus) && !reason?.trim()) {
      return res.status(400).json({
        success: false,
        message: '此狀態變更需要提供原因'
      });
    }

    // 9. 更新資料準備
    const updateData: any = { status: targetStatus };
    if (targetStatus === OpportunityStatus.ACTIVE && currentStatus !== OpportunityStatus.ACTIVE) {
      updateData.publishedAt = new Date();
    }

    // 10. 建立狀態歷史記錄
    const statusHistoryItem: StatusHistoryItem = {
      status: targetStatus,
      reason: reason?.trim(),
      changedBy: new mongoose.Types.ObjectId(user._id),
      changedAt: new Date()
    };

    // 11. 執行更新
    const updatedOpportunity = await Opportunity.findByIdAndUpdate(
      opportunity._id,
      {
        $set: updateData,
        $push: { statusHistory: statusHistoryItem }
      },
      { new: true }
    );

    // 12. 回傳結果
    return res.status(200).json({
      success: true,
      message: '狀態更新成功',
      opportunity: {
        id: updatedOpportunity._id,
        status: updatedOpportunity.status,
        publishedAt: updatedOpportunity.publishedAt,
        statusHistory: updatedOpportunity.statusHistory
      }
    });

  } catch (error) {
    console.error('更新機會狀態時出錯:', error);
    return res.status(500).json({
      success: false,
      message: '更新狀態失敗，請稍後再試',
      error: error instanceof Error ? error.message : '未知錯誤'
    });
  }
}