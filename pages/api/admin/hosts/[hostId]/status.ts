import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../auth/[...nextauth]';
import { UserRole } from '@/models/enums/UserRole';
import { HostStatus } from '@/models/enums/HostStatus';
import dbConnect from '@/lib/dbConnect';
import Host from '@/models/Host';
import mongoose from 'mongoose';

// 定義請求體的類型
interface UpdateStatusRequest {
  status: HostStatus;
  statusNote?: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // 檢查請求方法
  if (req.method !== 'PUT') {
    return res.status(405).json({ message: '方法不允許' });
  }

  // 獲取主辦方 ID
  const { hostId } = req.query;
  if (!hostId || typeof hostId !== 'string') {
    return res.status(400).json({ message: '無效的主辦方 ID' });
  }

  // 檢查 ID 格式
  if (!mongoose.Types.ObjectId.isValid(hostId)) {
    return res.status(400).json({ message: '無效的主辦方 ID 格式' });
  }

  // 驗證請求體
  const { status, statusNote } = req.body as UpdateStatusRequest;
  if (!status || !Object.values(HostStatus).includes(status)) {
    return res.status(400).json({ message: '無效的主辦方狀態' });
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

    // 使用 findByIdAndUpdate 方法直接更新狀態欄位，避免觸發完整文檔驗證
    const updateData: any = {
      status,
      updatedAt: new Date()
    };

    // 如有狀態備註，加入更新數據
    if (statusNote) {
      updateData.statusNote = statusNote;
    }

    // 如果狀態為驗證通過，更新驗證相關欄位
    if (status === HostStatus.ACTIVE) {
      updateData.verified = true;
      updateData.verifiedAt = new Date();
    }

    // 直接更新指定欄位，不驗證其他欄位
    const updatedHost = await Host.findByIdAndUpdate(
      hostId,
      { $set: updateData },
      {
        new: true,  // 返回更新後的文檔
        runValidators: false  // 不執行模型驗證器
      }
    );

    if (!updatedHost) {
      return res.status(404).json({ message: '找不到主辦方' });
    }

    // 處理相應的後續動作
    // 例如: 發送通知、建立活動日誌等
    // TODO: 在這裡添加任何需要的後續處理邏輯

    // 返回更新後的主辦方詳情
    return res.status(200).json({
      success: true,
      message: '主辦方狀態已更新',
      host: {
        _id: updatedHost._id,
        name: updatedHost.name,
        status: updatedHost.status,
        statusNote: updatedHost.statusNote,
        verified: updatedHost.verified,
        verifiedAt: updatedHost.verifiedAt
      }
    });
  } catch (error: unknown) {
    console.error('更新主辦方狀態失敗', error);
    return res.status(500).json({
      message: '伺服器錯誤',
      error: error instanceof Error ? error.message : '未知錯誤'
    });
  }
}