import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../auth/[...nextauth]';
import { UserRole } from '@/models/enums/UserRole';
import { ApplicationStatus } from '@/models/enums/ApplicationStatus';
import dbConnect from '@/lib/dbConnect';
import Application from '@/models/Application';
import mongoose from 'mongoose';

// 定義請求體的類型
interface UpdateStatusRequest {
  status: ApplicationStatus;
  statusNote?: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // 檢查請求方法
  if (req.method !== 'PUT') {
    return res.status(405).json({ message: '方法不允許' });
  }

  // 獲取申請 ID
  const { applicationId } = req.query;
  if (!applicationId || typeof applicationId !== 'string') {
    return res.status(400).json({ message: '無效的申請 ID' });
  }

  // 檢查 ID 格式
  if (!mongoose.Types.ObjectId.isValid(applicationId)) {
    return res.status(400).json({ message: '無效的申請 ID 格式' });
  }

  // 驗證請求體
  const { status, statusNote } = req.body as UpdateStatusRequest;
  if (!status || !Object.values(ApplicationStatus).includes(status)) {
    return res.status(400).json({ message: '無效的申請狀態' });
  }

  try {
    // 檢查用戶身份和權限
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      return res.status(401).json({ message: '未授權' });
    }

    // 確認用戶是否有管理員權限
    if (session?.user?.role !== UserRole.ADMIN && session?.user?.role !== UserRole.SUPER_ADMIN) {
      return res.status(403).json({ message: '權限不足' });
    }

    // 連接資料庫
    await dbConnect();

    // 獲取申請詳細資料
    const application = await Application.findById(applicationId);
    if (!application) {
      return res.status(404).json({ message: '找不到申請' });
    }

    // 更新狀態
    application.status = status;
    if (statusNote) {
      application.statusNote = statusNote;
    }

    // 根據新狀態更新相關欄位
    switch (status) {
      case ApplicationStatus.ACCEPTED:
        application.acceptedAt = new Date();
        application.acceptedBy = session.user.id;
        break;
      case ApplicationStatus.REJECTED:
        application.rejectedAt = new Date();
        application.rejectedBy = session.user.id;
        break;
      case ApplicationStatus.ACTIVE:
        // 可能需要更新其他相關欄位，如開始日期等
        application.activatedAt = new Date();
        break;
      case ApplicationStatus.COMPLETED:
        application.completedAt = new Date();
        break;
    }

    // 保存更新
    await application.save();

    // 處理相應的後續動作
    // 例如: 發送通知給用戶或主辦方、建立活動日誌等
    // TODO: 在這裡添加任何需要的後續處理邏輯

    // 返回更新後的申請詳情
    return res.status(200).json({
      message: '申請狀態已更新',
      application: {
        _id: application._id,
        status: application.status,
        statusNote: application.statusNote,
        updatedAt: application.updatedAt
      }
    });
  } catch (error: unknown) {
    console.error('更新申請狀態失敗', error);
    return res.status(500).json({
      message: '伺服器錯誤',
      error: error instanceof Error ? error.message : '未知錯誤'
    });
  }
}