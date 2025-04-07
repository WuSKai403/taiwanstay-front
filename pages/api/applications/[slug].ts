// pages/api/applications/[slug].ts
import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { connectToDatabase } from '@/lib/mongodb';
import Application from '@/models/Application';
import { ApplicationStatus } from '@/models/enums/ApplicationStatus';
import { isAdmin } from '@/utils/roleUtils';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { slug } = req.query;

  if (!slug || typeof slug !== 'string') {
    return res.status(400).json({ message: '申請 ID 無效' });
  }

  try {
    await connectToDatabase();

    // 獲取用戶會話
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      return res.status(401).json({ success: false, message: '未授權' });
    }

    // 根據請求方法處理不同操作
    switch (req.method) {
      case 'GET':
        return await getApplicationDetail(req, res, slug, session);
      case 'PUT':
        return await updateApplication(req, res, slug, session);
      case 'DELETE':
        return await deleteApplication(req, res, slug, session);
      default:
        return res.status(405).json({ message: '方法不允許' });
    }
  } catch (error) {
    console.error('申請 API 錯誤:', error);
    return res.status(500).json({ message: '伺服器錯誤' });
  }
}

/**
 * 獲取申請詳情
 */
async function getApplicationDetail(req: NextApiRequest, res: NextApiResponse, slug: string, session: any) {
  try {
    // 查詢申請
    const application = await Application.findById(slug)
      .populate('opportunityId', 'title slug shortDescription type location media')
      .populate('hostId', 'name profileImage')
      .populate('userId', 'name email profile');

    if (!application) {
      return res.status(404).json({ success: false, message: '申請不存在' });
    }

    // 輸出調試信息
    console.log('申請詳情查詢結果:', {
      applicationId: application._id,
      userId: application.userId,
      hostId: application.hostId,
      hasUserId: !!application.userId,
      hasHostId: !!application.hostId,
      currentUserId: session.user.id,
      status: application.status
    });

    // 臨時解決方案：允許所有已登錄用戶查看申請詳情
    // TODO: 在MVP階段後恢復權限檢查
    /*
    // 檢查權限：只有申請者、主辦方或管理員可以查看申請詳情
    const isApplicant = application.userId && application.userId._id
      ? application.userId._id.toString() === session.user.id
      : false;

    const isHost = application.hostId && application.hostId._id
      ? application.hostId._id.toString() === session.user.id
      : false;

    const isAdminUser = isAdmin(session.user);

    if (!isApplicant && !isHost && !isAdminUser) {
      return res.status(403).json({ success: false, message: '無權查看此申請' });
    }
    */

    return res.status(200).json({
      success: true,
      data: application
    });
  } catch (error: any) {
    console.error('獲取申請詳情錯誤:', error);
    return res.status(500).json({ success: false, message: '獲取申請詳情失敗', error: error.message });
  }
}

/**
 * 更新申請狀態
 */
async function updateApplication(req: NextApiRequest, res: NextApiResponse, slug: string, session: any) {
  try {
    const { status, statusNote, message } = req.body;

    // 查詢申請
    const application = await Application.findById(slug);
    if (!application) {
      return res.status(404).json({ success: false, message: '申請不存在' });
    }

    // 檢查權限
    const isApplicant = application.userId.toString() === session.user.id;
    const isHost = application.hostId.toString() === session.user.id;
    const isAdminUser = isAdmin(session.user);

    // 根據不同角色允許的操作
    if (status) {
      // 申請者只能取消或確認申請
      if (isApplicant) {
        if (![ApplicationStatus.COMPLETED, ApplicationStatus.ACTIVE].includes(status)) {
          return res.status(403).json({ success: false, message: '無權執行此操作' });
        }
      }
      // 主辦方可以審核、接受或拒絕申請
      else if (isHost) {
        if (![ApplicationStatus.PENDING, ApplicationStatus.ACCEPTED, ApplicationStatus.REJECTED].includes(status)) {
          return res.status(403).json({ success: false, message: '無權執行此操作' });
        }
      }
      // 非申請者、主辦方或管理員無權更新申請
      else if (!isAdminUser) {
        return res.status(403).json({ success: false, message: '無權執行此操作' });
      }

      application.status = status;
      if (statusNote) {
        application.statusNote = statusNote;
      }
    }

    // 如果有新訊息，添加到通訊記錄
    if (message) {
      application.communications.messages.push({
        sender: session.user.id,
        content: message,
        timestamp: new Date(),
        read: false
      });
      application.communications.lastMessageAt = new Date();

      // 更新未讀訊息計數
      if (isApplicant) {
        application.communications.unreadHostMessages += 1;
      } else {
        application.communications.unreadUserMessages += 1;
      }
    }

    // 保存更新
    await application.save();

    return res.status(200).json({
      success: true,
      message: '申請更新成功',
      data: application
    });
  } catch (error: any) {
    console.error('更新申請錯誤:', error);
    return res.status(500).json({ success: false, message: '更新申請失敗', error: error.message });
  }
}

/**
 * 刪除申請
 */
async function deleteApplication(req: NextApiRequest, res: NextApiResponse, slug: string, session: any) {
  try {
    // 查詢申請
    const application = await Application.findById(slug);
    if (!application) {
      return res.status(404).json({ success: false, message: '申請不存在' });
    }

    // 檢查權限：只有管理員可以刪除申請
    if (!isAdmin(session.user)) {
      return res.status(403).json({ success: false, message: '無權刪除申請' });
    }

    // 刪除申請
    await application.deleteOne();

    return res.status(200).json({
      success: true,
      message: '申請刪除成功'
    });
  } catch (error: any) {
    console.error('刪除申請錯誤:', error);
    return res.status(500).json({ success: false, message: '刪除申請失敗', error: error.message });
  }
}