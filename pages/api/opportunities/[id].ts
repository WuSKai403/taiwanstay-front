import type { NextApiRequest, NextApiResponse } from 'next';
import { connectToDatabase } from '../../../lib/mongodb';
import { Opportunity, Host } from '../../../models/index';
import { isValidObjectId, generateSlug } from '../../../utils/helpers';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // 連接到數據庫
  await connectToDatabase();

  // 獲取工作機會ID
  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ message: '缺少機會ID' });
  }

  // 根據HTTP方法處理請求
  switch (req.method) {
    case 'GET':
      return getOpportunity(req, res, id as string);
    case 'PUT':
      return updateOpportunity(req, res, id as string);
    case 'DELETE':
      return deleteOpportunity(req, res, id as string);
    default:
      return res.status(405).json({ message: '方法不允許' });
  }
}

// 獲取單個工作機會
async function getOpportunity(req: NextApiRequest, res: NextApiResponse, id: string) {
  try {
    // 查詢工作機會，支持 MongoDB ID 或 publicId
    let opportunity;

    if (isValidObjectId(id)) {
      // 如果是有效的 MongoDB ID，使用 _id 查詢
      opportunity = await Opportunity.findById(id).populate('hostId', 'name email profile');
    } else {
      // 否則嘗試使用 publicId 查詢
      opportunity = await Opportunity.findOne({ publicId: id }).populate('hostId', 'name email profile');
    }

    if (!opportunity) {
      return res.status(404).json({ message: '找不到該工作機會' });
    }

    // 增加瀏覽次數
    opportunity.stats.views += 1;
    await opportunity.save();

    // 返回工作機會詳情
    return res.status(200).json({
      opportunity: {
        id: opportunity._id,
        publicId: opportunity.publicId,
        hostId: opportunity.hostId,
        title: opportunity.title,
        slug: opportunity.slug,
        description: opportunity.description,
        shortDescription: opportunity.shortDescription,
        status: opportunity.status,
        statusNote: opportunity.statusNote,
        type: opportunity.type,
        workDetails: opportunity.workDetails,
        benefits: opportunity.benefits,
        requirements: opportunity.requirements,
        media: opportunity.media,
        location: opportunity.location,
        applicationProcess: opportunity.applicationProcess,
        impact: opportunity.impact,
        ratings: opportunity.ratings,
        stats: opportunity.stats,
        createdAt: opportunity.createdAt,
        updatedAt: opportunity.updatedAt
      }
    });
  } catch (error) {
    console.error('獲取工作機會詳情失敗:', error);
    return res.status(500).json({ message: '獲取工作機會詳情時發生錯誤', error: (error as Error).message });
  }
}

// 更新工作機會
async function updateOpportunity(req: NextApiRequest, res: NextApiResponse, id: string) {
  try {
    // 查詢工作機會，支持 MongoDB ID 或 publicId
    let opportunity;

    if (isValidObjectId(id)) {
      // 如果是有效的 MongoDB ID，使用 _id 查詢
      opportunity = await Opportunity.findById(id);
    } else {
      // 否則嘗試使用 publicId 查詢
      opportunity = await Opportunity.findOne({ publicId: id });
    }

    if (!opportunity) {
      return res.status(404).json({ message: '找不到該工作機會' });
    }

    // 從請求體中獲取更新數據
    const {
      title,
      description,
      shortDescription,
      status,
      statusNote,
      type,
      workDetails,
      benefits,
      requirements,
      media,
      location,
      applicationProcess,
      impact,
      ratings,
      stats
    } = req.body;

    // 更新工作機會資料
    if (title && title !== opportunity.title) {
      opportunity.title = title;
      // 使用現有的 publicId 生成新的 slug
      opportunity.slug = await generateSlug(title, opportunity.publicId);
    }

    if (description) opportunity.description = description;
    if (shortDescription) opportunity.shortDescription = shortDescription;
    if (status) opportunity.status = status;
    if (statusNote !== undefined) opportunity.statusNote = statusNote;
    if (type) opportunity.type = type;

    // 更新工作詳情
    if (workDetails) {
      opportunity.workDetails = {
        ...opportunity.workDetails.toObject(),
        ...workDetails
      };
    }

    // 更新福利
    if (benefits) {
      opportunity.benefits = {
        ...opportunity.benefits.toObject(),
        ...benefits
      };
    }

    // 更新要求
    if (requirements) {
      opportunity.requirements = {
        ...opportunity.requirements.toObject(),
        ...requirements
      };
    }

    // 更新媒體
    if (media) {
      opportunity.media = {
        ...opportunity.media.toObject(),
        ...media
      };
    }

    // 更新位置
    if (location) {
      opportunity.location = {
        ...opportunity.location.toObject(),
        ...location
      };
    }

    // 更新申請流程
    if (applicationProcess) {
      opportunity.applicationProcess = {
        ...opportunity.applicationProcess.toObject(),
        ...applicationProcess
      };
    }

    // 更新影響
    if (impact) {
      opportunity.impact = {
        ...opportunity.impact.toObject(),
        ...impact
      };
    }

    // 更新評分
    if (ratings) {
      opportunity.ratings = {
        ...opportunity.ratings.toObject(),
        ...ratings
      };
    }

    // 更新統計數據
    if (stats) {
      opportunity.stats = {
        ...opportunity.stats.toObject(),
        ...stats
      };
    }

    // 保存更新
    await opportunity.save();

    // 返回更新後的工作機會
    return res.status(200).json({
      message: '工作機會更新成功',
      opportunity: {
        id: opportunity._id,
        publicId: opportunity.publicId,
        title: opportunity.title,
        slug: opportunity.slug,
        description: opportunity.description,
        shortDescription: opportunity.shortDescription,
        status: opportunity.status,
        statusNote: opportunity.statusNote,
        type: opportunity.type,
        workDetails: opportunity.workDetails,
        benefits: opportunity.benefits,
        requirements: opportunity.requirements,
        media: opportunity.media,
        location: opportunity.location,
        applicationProcess: opportunity.applicationProcess,
        impact: opportunity.impact,
        ratings: opportunity.ratings,
        stats: opportunity.stats,
        createdAt: opportunity.createdAt,
        updatedAt: opportunity.updatedAt
      }
    });
  } catch (error) {
    console.error('更新工作機會失敗:', error);
    return res.status(500).json({ message: '更新工作機會時發生錯誤', error: (error as Error).message });
  }
}

// 刪除工作機會
async function deleteOpportunity(req: NextApiRequest, res: NextApiResponse, id: string) {
  try {
    // 查詢工作機會，支持 MongoDB ID 或 publicId
    let opportunity;

    if (isValidObjectId(id)) {
      // 如果是有效的 MongoDB ID，使用 _id 查詢
      opportunity = await Opportunity.findById(id);
    } else {
      // 否則嘗試使用 publicId 查詢
      opportunity = await Opportunity.findOne({ publicId: id });
    }

    if (!opportunity) {
      return res.status(404).json({ message: '找不到該工作機會' });
    }

    // 刪除工作機會
    await opportunity.deleteOne();

    // 返回成功訊息
    return res.status(200).json({ message: '工作機會刪除成功' });
  } catch (error) {
    console.error('刪除工作機會失敗:', error);
    return res.status(500).json({ message: '刪除工作機會時發生錯誤', error: (error as Error).message });
  }
}