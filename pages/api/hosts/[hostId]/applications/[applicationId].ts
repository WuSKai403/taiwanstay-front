import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from 'next-auth/react';
import dbConnect from '@/lib/dbConnect';
import Host from '@/models/Host';
import Application from '@/models/Application';
import { ApplicationStatus } from '@/models/enums/ApplicationStatus';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // 只允許 GET 和 PUT 請求
  if (req.method !== 'GET' && req.method !== 'PUT') {
    return res.status(405).json({ success: false, message: '方法不允許' });
  }

  try {
    // 獲取用戶 session
    const session = await getSession({ req });

    if (!session || !session.user) {
      return res.status(401).json({ success: false, message: '未授權' });
    }

    // 連接數據庫
    await dbConnect();

    const { hostId, applicationId } = req.query;

    // 驗證主人權限
    const host = await Host.findById(hostId).select('userId');

    if (!host) {
      return res.status(404).json({ success: false, message: '找不到主人記錄' });
    }

    if (host.userId.toString() !== session.user.id) {
      return res.status(403).json({ success: false, message: '權限不足' });
    }

    // 查找申請
    const application = await Application.findOne({
      _id: applicationId,
      hostId
    });

    if (!application) {
      return res.status(404).json({ success: false, message: '找不到申請記錄' });
    }

    // GET 請求處理 - 獲取申請詳情
    if (req.method === 'GET') {
      // 獲取更詳細的申請資訊
      const applicationDetail = await Application.findById(applicationId)
        .populate('userId', 'name email profile')
        .populate('opportunityId', 'title slug type location media');

      return res.status(200).json({
        success: true,
        data: applicationDetail
      });
    }

    // PUT 請求處理 - 更新申請狀態或發送訊息
    if (req.method === 'PUT') {
      const { status, statusNote } = req.body;

      // 驗證狀態轉換的合法性
      const allowedTransitions: Record<ApplicationStatus, ApplicationStatus[]> = {
        [ApplicationStatus.DRAFT]: [ApplicationStatus.PENDING, ApplicationStatus.COMPLETED],
        [ApplicationStatus.PENDING]: [ApplicationStatus.ACCEPTED, ApplicationStatus.REJECTED, ApplicationStatus.COMPLETED],
        [ApplicationStatus.ACCEPTED]: [ApplicationStatus.ACTIVE, ApplicationStatus.REJECTED, ApplicationStatus.COMPLETED],
        [ApplicationStatus.REJECTED]: [ApplicationStatus.PENDING, ApplicationStatus.ACCEPTED],
        [ApplicationStatus.ACTIVE]: [ApplicationStatus.COMPLETED],
        [ApplicationStatus.COMPLETED]: []
      };

      if (!allowedTransitions[application.status as ApplicationStatus].includes(status)) {
        return res.status(400).json({
          success: false,
          message: `不允許從 ${application.status} 狀態轉換為 ${status} 狀態`
        });
      }

      // 更新狀態
      application.status = status;

      // 如果有備註，則保存
      if (statusNote) {
        application.statusNote = statusNote;
      }

      // 根據狀態設置相關詳情
      const now = new Date();

      if (status === ApplicationStatus.PENDING) {
        // 從草稿狀態轉為待審核狀態
        // 不需要特別處理
      } else if (status === ApplicationStatus.ACCEPTED) {
        application.reviewDetails = {
          reviewedBy: host.userId,
          reviewedAt: now,
          notes: statusNote || undefined
        };
      } else if (status === ApplicationStatus.REJECTED) {
        application.reviewDetails = {
          reviewedBy: host.userId,
          reviewedAt: now,
          notes: statusNote || undefined
        };
      } else if (status === ApplicationStatus.ACTIVE) {
        // 已確認參與，表示申請進入進行中狀態
        if (!application.confirmationDetails) {
          application.confirmationDetails = {
            confirmedBy: host.userId,
            confirmedAt: now,
            additionalNotes: statusNote
          };
        }
      } else if (status === ApplicationStatus.COMPLETED) {
        // 完成、取消或撤回，統一使用completed狀態
        // 根據是否已經開始進行，決定是設為取消還是完成
        if (application.status === ApplicationStatus.ACTIVE) {
          // 已經開始進行，設為完成
          application.completionDetails = {
            completedAt: now
          };
        } else {
          // 未開始進行，設為取消
          application.cancellationDetails = {
            cancelledBy: host.userId,
            cancelledAt: now,
            reason: statusNote || undefined,
            initiatedBy: 'host'
          };
        }
      }

      await application.save();

      return res.status(200).json({
        success: true,
        message: '申請狀態已更新',
        data: application
      });
    }
  } catch (error) {
    console.error('申請詳情處理錯誤:', error);
    return res.status(500).json({ success: false, message: '伺服器錯誤' });
  }
}