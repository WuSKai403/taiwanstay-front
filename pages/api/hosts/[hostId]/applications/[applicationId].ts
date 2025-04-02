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
      if (status) {
        const currentStatus = application.status as ApplicationStatus;

        // 檢查狀態轉換是否合法
        const allowedTransitions: Record<ApplicationStatus, ApplicationStatus[]> = {
          [ApplicationStatus.DRAFT]: [ApplicationStatus.PENDING, ApplicationStatus.WITHDRAWN],
          [ApplicationStatus.PENDING]: [ApplicationStatus.REVIEWING, ApplicationStatus.ACCEPTED, ApplicationStatus.REJECTED],
          [ApplicationStatus.REVIEWING]: [ApplicationStatus.ACCEPTED, ApplicationStatus.REJECTED],
          [ApplicationStatus.ACCEPTED]: [ApplicationStatus.CONFIRMED, ApplicationStatus.WITHDRAWN, ApplicationStatus.CANCELLED],
          [ApplicationStatus.REJECTED]: [ApplicationStatus.REVIEWING],
          [ApplicationStatus.CONFIRMED]: [ApplicationStatus.COMPLETED, ApplicationStatus.CANCELLED],
          [ApplicationStatus.CANCELLED]: [],
          [ApplicationStatus.COMPLETED]: [],
          [ApplicationStatus.WITHDRAWN]: []
        };

        if (!allowedTransitions[currentStatus].includes(status)) {
          return res.status(400).json({
            success: false,
            message: `不允許從 ${currentStatus} 狀態轉換為 ${status} 狀態`
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

        if (status === ApplicationStatus.REVIEWING) {
          application.reviewDetails = {
            reviewedBy: host.userId,
            reviewedAt: now,
            notes: statusNote || undefined
          };
        } else if (status === ApplicationStatus.ACCEPTED) {
          if (!application.reviewDetails) {
            application.reviewDetails = {
              reviewedBy: host.userId,
              reviewedAt: now,
              notes: statusNote || undefined
            };
          }
        } else if (status === ApplicationStatus.REJECTED) {
          if (!application.reviewDetails) {
            application.reviewDetails = {
              reviewedBy: host.userId,
              reviewedAt: now,
              notes: statusNote || undefined
            };
          }
        } else if (status === ApplicationStatus.CANCELLED) {
          application.cancellationDetails = {
            cancelledBy: host.userId,
            cancelledAt: now,
            reason: statusNote || undefined,
            initiatedBy: 'host'
          };
        } else if (status === ApplicationStatus.COMPLETED) {
          application.completionDetails = {
            completedAt: now
          };
        }

        await application.save();

        return res.status(200).json({
          success: true,
          message: '申請狀態已更新',
          data: application
        });
      } else {
        return res.status(400).json({
          success: false,
          message: '缺少必要參數'
        });
      }
    }
  } catch (error) {
    console.error('申請詳情處理錯誤:', error);
    return res.status(500).json({ success: false, message: '伺服器錯誤' });
  }
}