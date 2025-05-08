import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '@/lib/dbConnect';
import { Opportunity } from '../../../../models';
import { requireAuth } from '@/lib/middleware/authMiddleware';
import { UserRole } from '@/models/enums/UserRole';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/pages/api/auth/[...nextauth]';

// 通過ID獲取機會詳情
async function getOpportunityById(req: NextApiRequest, res: NextApiResponse) {
  try {
    await dbConnect();
    const { id } = req.query;

    // 檢查ID是否存在
    if (!id) {
      return res.status(400).json({ success: false, message: '缺少ID參數' });
    }

    // 使用ID查詢機會
    const opportunity = await Opportunity.findById(id).populate('hostId');

    // 如果找不到對應的機會，返回404
    if (!opportunity) {
      return res.status(404).json({ success: false, message: '找不到該機會' });
    }

    // 格式化響應數據
    const coordinates = opportunity.location?.coordinates?.coordinates;
    const formattedOpportunity = {
      _id: opportunity._id.toString(),
      title: opportunity.title,
      slug: opportunity.slug,
      shortDescription: opportunity.shortDescription,
      description: opportunity.description,
      type: opportunity.type,
      status: opportunity.status,
      location: {
        city: opportunity.location?.city,
        country: opportunity.location?.country,
        address: opportunity.location?.address,
        coordinates: coordinates ? {
          lat: coordinates[1],
          lng: coordinates[0]
        } : undefined
      },
      workDetails: opportunity.workDetails,
      benefits: opportunity.benefits,
      requirements: opportunity.requirements,
      media: opportunity.media,
      hostId: opportunity.hostId ? {
        _id: opportunity.hostId._id.toString(),
        name: opportunity.hostId.name,
        description: opportunity.hostId.description,
        contactEmail: opportunity.hostId.contactEmail,
        contactPhone: opportunity.hostId.contactPhone
      } : null,
      stats: {
        applications: opportunity.stats?.applications || 0,
        bookmarks: opportunity.stats?.bookmarks || 0,
        views: opportunity.stats?.views || 0
      },
      createdAt: opportunity.createdAt,
      publishedAt: opportunity.publishedAt,
      updatedAt: opportunity.updatedAt,
      rejectionReason: opportunity.rejectionReason
    };

    return res.status(200).json({
      success: true,
      message: '獲取機會詳情成功',
      opportunity: formattedOpportunity
    });
  } catch (error) {
    console.error('獲取機會詳情失敗:', error);
    return res.status(500).json({
      success: false,
      message: '獲取機會詳情時發生錯誤',
      error: (error as Error).message
    });
  }
}

// 路由處理函數
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // 檢查用戶是否有管理員權限
  const session = await getServerSession(req, res, authOptions);

  // 驗證用戶是否為管理員
  if (!session?.user || (session.user.role !== UserRole.ADMIN && session.user.role !== UserRole.SUPER_ADMIN)) {
    return res.status(403).json({ success: false, message: '無權訪問' });
  }

  // 根據HTTP方法處理請求
  switch (req.method) {
    case 'GET':
      return getOpportunityById(req, res);
    default:
      return res.status(405).json({ success: false, message: '方法不允許' });
  }
}