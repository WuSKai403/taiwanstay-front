import type { NextApiRequest, NextApiResponse } from 'next';
import { connectToDatabase } from '../../../lib/mongodb';
import { Opportunity, Host } from '../../../models/index';
import { OpportunityStatus } from '../../../models/enums';
import { generateSlug, buildMongoQuery, calculatePagination, isValidObjectId, generatePublicId } from '../../../utils/helpers';

// 創建Express應用程序（用於測試）
export const app = null;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // 連接到數據庫
  await connectToDatabase();

  // 根據HTTP方法處理請求
  switch (req.method) {
    case 'GET':
      return getOpportunities(req, res);
    case 'POST':
      return createOpportunity(req, res);
    default:
      return res.status(405).json({ message: '方法不允許' });
  }
}

// 獲取工作機會列表
async function getOpportunities(req: NextApiRequest, res: NextApiResponse) {
  try {
    console.log('API 請求參數:', req.query);

    // 從查詢參數中獲取分頁和排序信息
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;
    const sort = req.query.sort as string || 'createdAt';
    const order = req.query.order as string || 'desc';

    // 構建查詢條件
    const query = buildMongoQuery(req.query);
    console.log('MongoDB 查詢條件:', JSON.stringify(query, null, 2));

    // 執行查詢
    console.log('執行 Opportunity.find 查詢...');
    const opportunities = await Opportunity.find(query)
      .populate('hostId', 'name description contactEmail contactPhone location')
      .sort({ [sort]: order === 'asc' ? 1 : -1 })
      .skip(skip)
      .limit(limit);

    // 獲取總數
    const total = await Opportunity.countDocuments(query);
    console.log(`找到 ${total} 個符合條件的機會`);

    // 記錄每個機會的基本信息
    if (opportunities.length > 0) {
      console.log('機會列表:');
      opportunities.forEach((opp, index) => {
        console.log(`${index + 1}. ${opp.title} (${opp.location?.city}, ${opp.location?.region || '無地區'}) - 停留時間: ${opp.workTimeSettings?.minimumStay}-${opp.workTimeSettings?.maximumStay || '無上限'} 天`);
      });
    } else {
      console.log('沒有找到符合條件的機會');
      // 檢查資料庫中是否有任何機會
      const totalOpportunities = await Opportunity.countDocuments({});
      console.log(`資料庫中共有 ${totalOpportunities} 個機會`);

      // 檢查幾個城市的機會
      const cityChecks = ['宜蘭縣', '南投縣', '台南市', '蘭嶼', '綠島', '小琉球'];
      for (const city of cityChecks) {
        const count = await Opportunity.countDocuments({ 'location.city': city });
        console.log(`城市 "${city}" 有 ${count} 個機會`);
      }
    }

    // 計算分頁信息
    const pagination = calculatePagination(page, limit, total);

    // 返回結果
    return res.status(200).json({
      opportunities: opportunities.map(opportunity => ({
        id: opportunity._id,
        title: opportunity.title,
        slug: opportunity.slug,
        shortDescription: opportunity.shortDescription,
        status: opportunity.status,
        type: opportunity.type,
        location: {
          city: opportunity.location?.city,
          region: opportunity.location?.region,
          coordinates: opportunity.location?.coordinates?.coordinates ?
            [opportunity.location.coordinates.coordinates[0], opportunity.location.coordinates.coordinates[1]] :
            undefined
        },
        host: opportunity.hostId ? {
          id: (opportunity.hostId as any)._id,
          name: (opportunity.hostId as any).name,
          description: (opportunity.hostId as any).description
        } : null,
        media: opportunity.media,
        workTimeSettings: {
          minimumStay: opportunity.workTimeSettings?.minimumStay,
          maximumStay: opportunity.workTimeSettings?.maximumStay,
          workHoursPerDay: opportunity.workTimeSettings?.workHoursPerDay,
          workDaysPerWeek: opportunity.workTimeSettings?.workDaysPerWeek
        },
        createdAt: opportunity.createdAt,
        updatedAt: opportunity.updatedAt
      })),
      pagination: {
        currentPage: pagination.currentPage,
        totalPages: pagination.totalPages,
        totalItems: pagination.totalItems,
        hasNextPage: pagination.hasNextPage,
        hasPrevPage: pagination.hasPrevPage
      }
    });
  } catch (error) {
    console.error('獲取工作機會列表失敗:', error);
    return res.status(500).json({ message: '獲取工作機會列表時發生錯誤', error: (error as Error).message });
  }
}

// 創建工作機會
async function createOpportunity(req: NextApiRequest, res: NextApiResponse) {
  try {
    // 從請求體中獲取數據
    const {
      hostId,
      title,
      slug,
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

    // 驗證必要欄位
    if (!hostId || !title || !description || !type) {
      return res.status(400).json({ message: '缺少必要欄位' });
    }

    // 驗證hostId是否有效
    if (!isValidObjectId(hostId)) {
      return res.status(400).json({ message: '無效的主辦方ID' });
    }

    // 檢查主辦方是否存在
    const host = await Host.findById(hostId);
    if (!host) {
      return res.status(404).json({ message: '找不到該主辦方' });
    }

    // 生成 publicId
    const publicId = generatePublicId();

    // 生成 slug，格式為 {publicId}-{title-slug}
    const titleSlug = await generateSlug(title);
    const opportunitySlug = await generateSlug(title, publicId);

    // 創建工作機會
    const opportunity = new Opportunity({
      hostId,
      title,
      slug: opportunitySlug,
      publicId,
      description,
      shortDescription,
      status: status || OpportunityStatus.DRAFT,
      statusNote,
      type,
      workDetails,
      benefits,
      requirements,
      media,
      location,
      applicationProcess,
      impact,
      ratings: ratings || {
        average: 0,
        count: 0
      },
      stats: stats || {
        views: 0,
        applications: 0,
        shares: 0
      }
    });

    // 保存工作機會
    await opportunity.save();

    // 返回成功響應
    return res.status(201).json({
      message: '工作機會創建成功',
      opportunity: {
        id: opportunity._id,
        publicId: opportunity.publicId,
        title: opportunity.title,
        slug: opportunity.slug
      }
    });
  } catch (error) {
    console.error('創建工作機會失敗:', error);
    return res.status(500).json({ message: '創建工作機會時發生錯誤', error: (error as Error).message });
  }
}