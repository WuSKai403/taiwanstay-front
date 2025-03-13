// pages/api/applications/[id].ts
import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { connectToDatabase } from '@/lib/mongodb';
import Application from '@/models/Application';
import { ApplicationStatus } from '@/models/enums/ApplicationStatus';
import { isAdmin } from '@/utils/roleUtils';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await connectToDatabase();

    // 獲取用戶會話
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      return res.status(401).json({ success: false, message: '未授權' });
    }

    const { id } = req.query;
    if (!id || typeof id !== 'string') {
      return res.status(400).json({ success: false, message: '無效的申請ID' });
    }

    // 根據HTTP方法處理請求
    switch (req.method) {
      case 'GET':
        return getApplication(req, res, id, session);
      case 'PUT':
        return updateApplication(req, res, id, session);
      case 'DELETE':
        return deleteApplication(req, res, id, session);
      default:
        return res.status(405).json({ success: false, message: '方法不允許' });
    }
  } catch (error: any) {
    console.error('申請詳情API錯誤:', error);
    return res.status(500).json({ success: false, message: '伺服器錯誤', error: error.message });
  }
}

/**
 * 獲取申請詳情
 */
async function getApplication(req: NextApiRequest, res: NextApiResponse, id: string, session: any) {
  try {
    // 查詢申請
    const application = await Application.findById(id)
      .populate('opportunityId', 'title slug shortDescription type location media')
      .populate('hostId', 'name profileImage')
      .populate('userId', 'name email profile');

    if (!application) {
      return res.status(404).json({ success: false, message: '申請不存在' });
    }

    // 檢查權限：只有申請者、主辦方或管理員可以查看申請詳情
    const isApplicant = application.userId._id.toString() === session.user.id;
    const isHost = application.hostId._id.toString() === session.user.id;
    const isAdminUser = isAdmin(session.user);

    if (!isApplicant && !isHost && !isAdminUser) {
      return res.status(403).json({ success: false, message: '無權查看此申請' });
    }

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
async function updateApplication(req: NextApiRequest, res: NextApiResponse, id: string, session: any) {
  try {
    const { status, statusNote, message } = req.body;

    // 查詢申請
    const application = await Application.findById(id);
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
        if (![ApplicationStatus.WITHDRAWN, ApplicationStatus.CONFIRMED].includes(status)) {
          return res.status(403).json({ success: false, message: '無權執行此操作' });
        }
      }
      // 主辦方可以審核、接受或拒絕申請
      else if (isHost) {
        if (![ApplicationStatus.REVIEWING, ApplicationStatus.ACCEPTED, ApplicationStatus.REJECTED].includes(status)) {
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
async function deleteApplication(req: NextApiRequest, res: NextApiResponse, id: string, session: any) {
  try {
    // 查詢申請
    const application = await Application.findById(id);
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