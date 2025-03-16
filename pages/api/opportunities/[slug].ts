import type { NextApiRequest, NextApiResponse } from 'next';
import { connectToDatabase } from '../../../lib/mongodb';
import { Opportunity } from '../../../models/index';
import { isValidObjectId } from '../../../utils/helpers';
import { ITimeSlot } from '@/models/Opportunity';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // 連接到數據庫
  await connectToDatabase();

  // 獲取 slug 參數
  const { slug } = req.query;

  // 根據 HTTP 方法處理請求
  switch (req.method) {
    case 'GET':
      return getOpportunityBySlug(req, res, slug as string);
    default:
      return res.status(405).json({ message: '方法不允許' });
  }
}

// 根據 slug 獲取機會詳情
async function getOpportunityBySlug(req: NextApiRequest, res: NextApiResponse, slug: string) {
  try {
    // 檢查 slug 是否存在
    if (!slug) {
      return res.status(400).json({ message: '缺少 slug 參數' });
    }

    // 嘗試查詢機會
    let opportunity;

    // 檢查 slug 是否包含 ID 部分（格式為 {id}-{title-slug} 或 {publicId}-{title-slug}）
    const idPart = slug.split('-')[0];

    // 如果 ID 部分是有效的 MongoDB ObjectId，則使用 _id 查詢
    if (isValidObjectId(idPart)) {
      opportunity = await Opportunity.findById(idPart).populate('hostId');
    }

    // 如果找不到，嘗試使用 publicId 查詢
    if (!opportunity) {
      opportunity = await Opportunity.findOne({
        $or: [
          { publicId: idPart },
          { slug: slug }
        ]
      }).populate('hostId');
    }

    // 如果仍然找不到對應的機會，返回 404
    if (!opportunity) {
      return res.status(404).json({ message: '找不到該機會' });
    }

    // 增加瀏覽次數（但不等待更新完成）
    Opportunity.updateOne(
      { _id: opportunity._id },
      { $inc: { 'stats.views': 1 } }
    ).exec();

    // 格式化響應數據
    const formattedOpportunity = {
      id: opportunity._id.toString(),
      publicId: opportunity.publicId,
      title: opportunity.title,
      slug: opportunity.slug,
      shortDescription: opportunity.shortDescription,
      description: opportunity.description,
      type: opportunity.type,
      status: opportunity.status,
      location: opportunity.location,
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
      timeSlots: opportunity.timeSlots ? opportunity.timeSlots.map((slot: ITimeSlot) => ({
        id: slot._id ? slot._id.toString() : '',
        startDate: slot.startDate,
        endDate: slot.endDate,
        defaultCapacity: slot.defaultCapacity,
        minimumStay: slot.minimumStay,
        appliedCount: slot.appliedCount,
        confirmedCount: slot.confirmedCount,
        status: slot.status,
        description: slot.description
      })) : [],
      createdAt: opportunity.createdAt,
      updatedAt: opportunity.updatedAt
    };

    return res.status(200).json({
      message: '獲取機會詳情成功',
      opportunity: formattedOpportunity
    });
  } catch (error) {
    console.error('獲取機會詳情失敗:', error);
    return res.status(500).json({
      message: '獲取機會詳情時發生錯誤',
      error: (error as Error).message
    });
  }
}