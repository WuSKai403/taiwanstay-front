import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '@/lib/dbConnect';
import { Opportunity } from '../../../../models';
import { requireAuth } from '@/lib/middleware/authMiddleware';
import { UserRole } from '@/models/enums/UserRole';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/pages/api/auth/[...nextauth]';
import { isValidObjectId } from '@/utils/helpers';
import User from '@/models/User';

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
    let opportunity = null;

    // 如果是有效的 MongoDB ObjectId，直接用來查詢
    if (isValidObjectId(id as string)) {
      opportunity = await Opportunity.findById(id).populate('hostId');
    }
    // 如果不是 ObjectId，嘗試通過 slug 或 publicId 查詢
    else {
      opportunity = await Opportunity.findOne({
        $or: [
          { publicId: id },
          { slug: id }
        ]
      }).populate('hostId');
    }

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
          type: 'Point',
          coordinates: coordinates
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
      statusHistory: opportunity.statusHistory || []
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

// 管理員更新機會
async function updateOpportunity(req: NextApiRequest, res: NextApiResponse) {
  try {
    await dbConnect();
    const { id } = req.query;

    // 查找機會
    let opportunity;
    let opportunityId;

    // 如果是有效的 MongoDB ObjectId，直接用來查詢
    if (isValidObjectId(id as string)) {
      opportunityId = id;
      opportunity = await Opportunity.findById(opportunityId);
    } else {
      // 否則嘗試通過 slug 或 publicId 查詢
      opportunity = await Opportunity.findOne({
        $or: [
          { publicId: id },
          { slug: id }
        ]
      });
      opportunityId = opportunity?._id;
    }

    if (!opportunity) {
      return res.status(404).json({ success: false, message: '機會不存在' });
    }

    // 更新字段
    const updateData = req.body;

    // 防止修改關鍵字段
    delete updateData._id;
    delete updateData.createdAt;

    // 狀態修改應通過專門的 status API
    if (updateData.status) {
      return res.status(400).json({
        success: false,
        message: '請使用 /api/admin/opportunities/[id]/status API 來更新狀態'
      });
    }
    delete updateData.status;
    delete updateData.statusHistory;

    // 更新時間戳
    updateData.updatedAt = new Date();

    // 更新機會
    const updatedOpportunity = await Opportunity.findByIdAndUpdate(
      opportunityId,
      { $set: updateData },
      { new: true, runValidators: true }
    ).populate('hostId');

    // 格式化響應數據，與 GET 方法保持一致
    const coordinates = updatedOpportunity.location?.coordinates?.coordinates;
    const formattedOpportunity = {
      _id: updatedOpportunity._id.toString(),
      title: updatedOpportunity.title,
      slug: updatedOpportunity.slug,
      shortDescription: updatedOpportunity.shortDescription,
      description: updatedOpportunity.description,
      type: updatedOpportunity.type,
      status: updatedOpportunity.status,
      location: {
        city: updatedOpportunity.location?.city,
        country: updatedOpportunity.location?.country,
        address: updatedOpportunity.location?.address,
        coordinates: coordinates ? {
          type: 'Point',
          coordinates: coordinates
        } : undefined
      },
      workDetails: updatedOpportunity.workDetails,
      benefits: updatedOpportunity.benefits,
      requirements: updatedOpportunity.requirements,
      media: updatedOpportunity.media,
      hostId: updatedOpportunity.hostId ? {
        _id: updatedOpportunity.hostId._id.toString(),
        name: updatedOpportunity.hostId.name,
        description: updatedOpportunity.hostId.description,
        contactEmail: updatedOpportunity.hostId.contactEmail,
        contactPhone: updatedOpportunity.hostId.contactPhone
      } : null,
      stats: {
        applications: updatedOpportunity.stats?.applications || 0,
        bookmarks: updatedOpportunity.stats?.bookmarks || 0,
        views: updatedOpportunity.stats?.views || 0
      },
      createdAt: updatedOpportunity.createdAt,
      publishedAt: updatedOpportunity.publishedAt,
      updatedAt: updatedOpportunity.updatedAt,
      statusHistory: updatedOpportunity.statusHistory || []
    };

    return res.status(200).json({
      success: true,
      message: '管理員機會更新成功',
      opportunity: formattedOpportunity
    });
  } catch (error) {
    console.error('管理員更新機會時出錯:', error);
    return res.status(500).json({
      success: false,
      message: '服務器錯誤',
      error: (error as Error).message
    });
  }
}

// 檢查管理員權限
async function checkAdminAccess(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);

  if (!session || !session.user) {
    return { isAdmin: false, message: '未授權，請先登入' };
  }

  const user = await User.findById(session.user.id);
  const isAdmin = user && (user.role === UserRole.ADMIN || user.role === UserRole.SUPER_ADMIN);

  if (!isAdmin) {
    return { isAdmin: false, message: '需要管理員權限' };
  }

  return { isAdmin: true };
}

// 路由處理函數
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await dbConnect();

    // 檢查管理員權限
    const { isAdmin, message } = await checkAdminAccess(req, res);
    if (!isAdmin) {
      return res.status(403).json({ success: false, message });
    }

    // 根據 HTTP 方法處理請求
    switch (req.method) {
      case 'GET':
        return getOpportunityById(req, res);
      case 'PUT':
        return updateOpportunity(req, res);
      default:
        return res.status(405).json({ success: false, message: '方法不允許' });
    }
  } catch (error) {
    console.error('管理員 API 處理錯誤:', error);
    return res.status(500).json({
      success: false,
      message: '處理請求時發生錯誤',
      error: (error as Error).message
    });
  }
}