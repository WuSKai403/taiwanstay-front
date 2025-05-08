import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '@/lib/dbConnect';
import { Opportunity, Host, Application } from '../../../models/index';
import { isValidObjectId } from '../../../utils/helpers';
import { ITimeSlot } from '@/models/Opportunity';
import { requireAuth, requireOpportunityAccess } from '@/lib/middleware/authMiddleware';
import { OpportunityStatus } from '@/models/enums';

// 獲取機會的處理函數
async function getOpportunity(req: NextApiRequest, res: NextApiResponse) {
  try {
    await dbConnect();
    const { slug } = req.query;

    // 檢查 slug 是否存在
    if (!slug) {
      return res.status(400).json({ success: false, message: '缺少 slug 參數' });
    }

    // 嘗試查詢機會
    let opportunity;

    // 檢查 slug 是否包含 ID 部分
    const idPart = (slug as string).split('-')[0];

    // 如果 ID 部分是有效的 MongoDB ObjectId，則使用 _id 查詢
    if (isValidObjectId(idPart)) {
      opportunity = await Opportunity.findById(idPart).populate('hostId').lean();
    }

    // 如果找不到，嘗試使用 publicId 查詢
    if (!opportunity) {
      opportunity = await Opportunity.findOne({
        $or: [
          { publicId: idPart },
          { slug: slug }
        ]
      }).populate('hostId').lean();
    }

    // 如果仍然找不到對應的機會，返回 404
    if (!opportunity) {
      return res.status(404).json({ success: false, message: '找不到該機會' });
    }

    // 增加瀏覽次數（但不等待更新完成）
    Opportunity.updateOne(
      { _id: opportunity._id },
      { $inc: { 'stats.views': 1 } }
    ).exec();

    // 應用轉換邏輯 - 將 workTimeSettings 轉換為 timeSlots
    opportunity = convertToTimeSlots(opportunity);

    // 格式化響應數據
    const coordinates = opportunity.location?.coordinates?.coordinates;
    const formattedOpportunity = {
      id: opportunity._id.toString(),
      publicId: opportunity.publicId,
      title: opportunity.title,
      slug: opportunity.slug,
      shortDescription: opportunity.shortDescription,
      description: opportunity.description,
      type: opportunity.type,
      status: opportunity.status,
      location: {
        city: opportunity.location?.city,
        district: opportunity.location?.district,
        country: opportunity.location?.country,
        address: opportunity.location?.address,
        coordinates: coordinates ? {
          lat: coordinates[1],
          lng: coordinates[0]
        } : undefined
      },
      workDetails: opportunity.workDetails,
      workTimeSettings: opportunity.workTimeSettings,
      benefits: opportunity.benefits,
      requirements: opportunity.requirements,
      media: opportunity.media,
      host: opportunity.hostId ? {
        id: opportunity.hostId._id.toString(),
        name: opportunity.hostId.name,
        description: opportunity.hostId.description,
        profileImage: opportunity.hostId.profileImage,
        responseRate: opportunity.hostId.responseRate,
        responseTime: opportunity.hostId.responseTime,
        verificationStatus: opportunity.hostId.verificationStatus,
        memberSince: opportunity.hostId.createdAt,
        socialMedia: opportunity.hostId.socialMedia
      } : null,
      stats: {
        applications: opportunity.stats?.applications || 0,
        bookmarks: opportunity.stats?.bookmarks || 0,
        views: opportunity.stats?.views || 0
      },
      hasTimeSlots: opportunity.hasTimeSlots || false,
      timeSlots: opportunity.timeSlots ? opportunity.timeSlots.map((slot: any) => ({
        id: slot._id ? slot._id.toString() : slot.id || '',
        startDate: slot.startDate,
        endDate: slot.endDate,
        defaultCapacity: slot.defaultCapacity,
        minimumStay: slot.minimumStay,
        appliedCount: slot.appliedCount || 0,
        confirmedCount: slot.confirmedCount || 0,
        status: slot.status,
        description: slot.description
      })) : [],
      createdAt: opportunity.createdAt,
      updatedAt: opportunity.updatedAt
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

// 更新機會處理函數
async function updateOpportunity(req: NextApiRequest, res: NextApiResponse) {
  try {
    await dbConnect();
    const { slug } = req.query;

    // 查找機會
    let opportunity;
    let opportunityId;

    // 如果是有效的 MongoDB ObjectId，直接用來查詢
    if (isValidObjectId(slug as string)) {
      opportunityId = slug;
      opportunity = await Opportunity.findById(opportunityId);
    } else {
      // 否則嘗試通過 slug 查詢
      opportunity = await Opportunity.findOne({ slug: slug });
      opportunityId = opportunity?._id;
    }

    if (!opportunity) {
      return res.status(404).json({ success: false, message: '機會不存在' });
    }

    // 更新字段
    const updateData = req.body;

    // 防止修改關鍵字段
    delete updateData._id;
    delete updateData.hostId;
    delete updateData.createdAt;

    // 更新時間戳
    updateData.updatedAt = new Date();

    // 更新機會
    const updatedOpportunity = await Opportunity.findByIdAndUpdate(
      opportunityId,
      { $set: updateData },
      { new: true, runValidators: true }
    ).lean();

    return res.status(200).json({
      success: true,
      message: '機會更新成功',
      opportunity: JSON.parse(JSON.stringify(updatedOpportunity))
    });
  } catch (error) {
    console.error('更新機會時出錯:', error);
    return res.status(500).json({ success: false, message: '服務器錯誤' });
  }
}

// 封存機會（代替刪除）處理函數
async function archiveOpportunity(req: NextApiRequest, res: NextApiResponse) {
  try {
    await dbConnect();
    const { slug } = req.query;

    // 查找機會
    let opportunity;
    let opportunityId;

    // 如果是有效的 MongoDB ObjectId，直接用來查詢
    if (isValidObjectId(slug as string)) {
      opportunityId = slug;
      opportunity = await Opportunity.findById(opportunityId);
    } else {
      // 否則嘗試通過 slug 查詢
      opportunity = await Opportunity.findOne({ slug: slug });
      opportunityId = opportunity?._id;
    }

    if (!opportunity) {
      return res.status(404).json({ success: false, message: '機會不存在' });
    }

    // 更新機會狀態為已封存
    opportunity.status = OpportunityStatus.ARCHIVED;
    opportunity.updatedAt = new Date();
    await opportunity.save();

    return res.status(200).json({
      success: true,
      message: '機會已成功封存',
      archived: true,
      opportunity: {
        id: opportunity._id,
        status: opportunity.status
      }
    });
  } catch (error) {
    console.error('封存機會時出錯:', error);
    return res.status(500).json({ success: false, message: '服務器錯誤' });
  }
}

// 提取 slug 參數並轉換為 ID
const extractOpportunityIdFromSlug = (req: NextApiRequest): string => {
  const { slug } = req.query;
  const idPart = (slug as string).split('-')[0];
  return isValidObjectId(idPart) ? idPart : slug as string;
};

// 路由處理函數
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // 根據 HTTP 方法處理請求
  switch (req.method) {
    case 'GET':
      return getOpportunity(req, res);
    case 'PUT':
      return requireOpportunityAccess(extractOpportunityIdFromSlug)(updateOpportunity)(req, res);
    case 'DELETE':
      return requireOpportunityAccess(extractOpportunityIdFromSlug)(archiveOpportunity)(req, res);
    default:
      return res.status(405).json({ success: false, message: '方法不允許' });
  }
}