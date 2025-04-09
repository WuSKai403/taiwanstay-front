import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { UserRole } from '@/models/enums/UserRole';
import { HostStatus } from '@/models/enums/HostStatus';
import { ApplicationStatus } from '@/models/enums/ApplicationStatus';
import dbConnect from '@/lib/dbConnect';
import Host from '@/models/Host';
import User from '@/models/User';
import Application from '@/models/Application';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // 檢查請求方法
  if (req.method !== 'GET') {
    return res.status(405).json({ message: '方法不允許' });
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

    // 獲取統計數據
    const [
      pendingHosts,
      totalHosts,
      totalUsers,
      pendingApplications
    ] = await Promise.all([
      // 待審核主辦方數量
      Host.countDocuments({ status: HostStatus.PENDING }),

      // 總主辦方數量
      Host.countDocuments({}),

      // 總用戶數量
      User.countDocuments({}),

      // 待處理申請數量
      Application.countDocuments({ status: ApplicationStatus.PENDING })
    ]);

    // 返回統計數據
    return res.status(200).json({
      pendingHosts,
      totalHosts,
      totalUsers,
      pendingApplications
    });
  } catch (error: unknown) {
    console.error('獲取管理統計數據失敗', error);
    return res.status(500).json({
      message: '伺服器錯誤',
      error: error instanceof Error ? error.message : '未知錯誤'
    });
  }
}