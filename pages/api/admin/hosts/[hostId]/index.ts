import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../auth/[...nextauth]';
import { UserRole } from '@/models/enums/UserRole';
import dbConnect from '@/lib/dbConnect';
import Host from '@/models/Host';
import User from '@/models/User';
import mongoose from 'mongoose';

// 定義主辦方資料結構，確保有 userId 欄位
interface HostDocument {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  name: string;
  status: string;
  [key: string]: any; // 允許其他屬性
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // 檢查請求方法
  if (req.method !== 'GET') {
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

    // 獲取主辦方詳細資料
    const host = await Host.findById(hostId).lean() as HostDocument | null;
    if (!host) {
      return res.status(404).json({ message: '找不到主辦方' });
    }

    // 獲取關聯的用戶資料
    let userData = null;
    if (host.userId) {
      userData = await User.findById(host.userId)
        .select('name email image profile.phoneNumber')
        .lean();
    }

    // 構建完整的資料
    const hostData = {
      ...host,
      user: userData
    };

    // 返回主辦方詳情
    return res.status(200).json(hostData);
  } catch (error: unknown) {
    console.error('獲取主辦方詳情失敗', error);
    return res.status(500).json({
      message: '伺服器錯誤',
      error: error instanceof Error ? error.message : '未知錯誤'
    });
  }
}