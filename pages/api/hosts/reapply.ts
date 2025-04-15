import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import dbConnect from '@/lib/dbConnect';
import Host from '@/models/Host';
import { HostStatus } from '@/models/enums/HostStatus';
import mongoose from 'mongoose';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // 只允許 POST 請求
  if (req.method !== 'POST') {
    return res.status(405).json({ message: '方法不允許' });
  }

  try {
    // 檢查用戶身份
    const session = await getServerSession(req, res, authOptions);
    if (!session?.user) {
      return res.status(401).json({ message: '未授權' });
    }

    // 連接資料庫
    await dbConnect();

    // 獲取用戶的主機資訊
    const host = await Host.findOne({ userId: session.user.id });

    // 檢查是否存在該主機
    if (!host) {
      return res.status(404).json({ message: '找不到主機資訊' });
    }

    // 檢查狀態是否為 REJECTED
    if (host.status !== HostStatus.REJECTED) {
      return res.status(400).json({
        message: '無法重新申請',
        description: '只有被拒絕的申請可以重新提交'
      });
    }

    // 準備狀態記錄
    const statusRecord = {
      status: host.status,
      statusNote: host.statusNote,
      updatedBy: new mongoose.Types.ObjectId(session.user.id),
      updatedAt: new Date()
    };

    // 使用 findByIdAndUpdate 直接更新狀態，避免觸發完整驗證
    const updatedHost = await Host.findByIdAndUpdate(
      host._id,
      {
        $set: {
          status: HostStatus.EDITING,
          statusNote: '重新編輯申請中',
          updatedAt: new Date()
        },
        $push: {
          statusHistory: statusRecord
        }
      },
      {
        new: true,  // 返回更新後的文檔
        runValidators: false  // 不執行驗證器
      }
    );

    if (!updatedHost) {
      return res.status(500).json({
        message: '更新狀態失敗',
        error: '無法更新主人狀態'
      });
    }

    // 回傳成功訊息
    return res.status(200).json({
      success: true,
      message: '已將狀態更新為編輯中，可以重新提交申請',
      host: {
        _id: updatedHost._id,
        status: updatedHost.status,
        statusNote: updatedHost.statusNote
      }
    });
  } catch (error: unknown) {
    console.error('重新申請失敗:', error);
    return res.status(500).json({
      message: '伺服器錯誤',
      error: error instanceof Error ? error.message : '未知錯誤'
    });
  }
}