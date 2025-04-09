import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../auth/[...nextauth]';
import { UserRole } from '@/models/enums/UserRole';
import dbConnect from '@/lib/dbConnect';
import Application, { IApplication } from '@/models/Application';
import Host from '@/models/Host';
import User from '@/models/User';
import Opportunity from '@/models/Opportunity';
import mongoose from 'mongoose';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // 檢查請求方法
  if (req.method !== 'GET') {
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
    const rawApplication = await Application.findById(applicationId).lean();
    if (!rawApplication) {
      return res.status(404).json({ message: '找不到申請' });
    }

    // 使用類型轉換以確保類型安全
    const application = rawApplication as unknown as IApplication;

    // 獲取關聯的用戶、主辦方和機會資料
    const [userData, hostData, opportunityData] = await Promise.all([
      // 獲取申請者資料
      application.userId ? User.findById(application.userId)
        .select('name email image profile')
        .lean() : null,

      // 獲取主辦方資料
      application.hostId ? Host.findById(application.hostId)
        .select('name type category media contactInfo location status')
        .lean() : null,

      // 獲取機會資料
      application.opportunityId ? Opportunity.findById(application.opportunityId)
        .select('title description startDate endDate')
        .lean() : null
    ]);

    // 構建完整的資料
    const applicationData = {
      ...application,
      user: userData,
      host: hostData,
      opportunity: opportunityData
    };

    // 返回申請詳情
    return res.status(200).json(applicationData);
  } catch (error: unknown) {
    console.error('獲取申請詳情失敗', error);
    return res.status(500).json({
      message: '伺服器錯誤',
      error: error instanceof Error ? error.message : '未知錯誤'
    });
  }
}