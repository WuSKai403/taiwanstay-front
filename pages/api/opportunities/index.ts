import type { NextApiRequest, NextApiResponse } from 'next';
import { connectToDatabase } from '../../../lib/mongodb';
import { Opportunity, Host } from '../../../models/index';
import { OpportunityStatus } from '../../../models/enums';
import { generateSlug, buildMongoQuery, calculatePagination, isValidObjectId, generatePublicId } from '../../../utils/helpers';
import mongoose from 'mongoose';
import { ApiError } from '@/lib/errors';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import dbConnect from '@/lib/dbConnect';

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

    // 檢查是否為地圖請求
    const isMapRequest = req.query.map === 'true';

    // 如果是地圖請求，使用較大的限制值
    const limit = isMapRequest
      ? parseInt(req.query.limit as string) || 1000
      : parseInt(req.query.limit as string) || 10;

    const skip = (page - 1) * limit;
    const sort = req.query.sort as string || 'createdAt';
    const order = req.query.order as string || 'desc';

    // 構建查詢條件
    const query = buildMongoQuery(req.query);
    console.log('MongoDB 查詢條件:', JSON.stringify(query, null, 2));
    console.log(`查詢類型: ${isMapRequest ? '地圖請求' : '列表請求'}, 限制: ${limit}`);

    // 處理 availableMonths 參數，用於月份篩選
    if (req.query.availableMonths) {
      try {
        // 處理 availableMonths 參數 - 格式為 "YYYY-MM,YYYY-MM,..."
        const monthsArray = (req.query.availableMonths as string).split(',');
        console.log(`處理 availableMonths 參數: ${monthsArray.join(', ')}`);

        if (monthsArray.length > 0) {
          // 從 YYYY-MM 格式中提取月份
          const monthNumbers = monthsArray
            .filter(yearMonth => yearMonth && yearMonth.includes('-'))
            .map(yearMonth => {
              const [year, month] = yearMonth.split('-');
              console.log(`解析年月: ${year}年${month}月`);
              return parseInt(month, 10);
            })
            .filter(month => !isNaN(month) && month >= 1 && month <= 12);

          if (monthNumbers.length > 0) {
            console.log(`有效月份篩選: ${monthNumbers.join(', ')}`);
            query['workDetails.availableMonths'] = { $in: monthNumbers };
          } else {
            console.log('沒有有效的月份篩選條件');
          }
        }
      } catch (error) {
        console.error('處理月份篩選時出錯:', error);
      }
    } else {
      console.log('請求中未包含 availableMonths 參數');
    }

    // 最多重試3次
    let retries = 0;
    const maxRetries = 3;
    let opportunities: any[] = [];
    let total = 0;

    while (retries < maxRetries) {
      try {
        // 執行查詢
        console.log(`執行 Opportunity.find 查詢... (嘗試 ${retries + 1}/${maxRetries})`);

        // 查詢設置
        const queryOptions = Opportunity.find(query)
          .populate('hostId', 'name description contactEmail contactPhone location')
          .sort({ [sort]: order === 'asc' ? 1 : -1 })
          .setOptions({ maxTimeMS: 20000 }); // 設置查詢超時為20秒

        // 地圖請求可以返回所有記錄，列表請求使用分頁
        if (!isMapRequest) {
          queryOptions.skip(skip).limit(limit);
        } else {
          // 地圖請求仍然需要限制以避免服務器過載
          queryOptions.limit(limit);
        }

        // 執行查詢
        opportunities = await queryOptions;

        // 獲取總數
        total = await Opportunity.countDocuments(query)
          .setOptions({ maxTimeMS: 10000 }); // 設置計數查詢超時為10秒
        console.log(`找到 ${total} 個符合條件的機會，返回 ${opportunities.length} 個結果`);

        // 格式化機會資料
        const formattedOpportunities = opportunities.map(opp => {
          const coordinates = opp.location?.coordinates?.coordinates;
          return {
            ...opp.toObject(),
            location: {
              city: opp.location?.city,
              country: opp.location?.country,
              coordinates: coordinates ? {
                lat: coordinates[1],
                lng: coordinates[0]
              } : undefined
            }
          };
        });

        // 返回結果
        return res.status(200).json({
          opportunities: formattedOpportunities,
          pagination: {
            currentPage: page,
            totalPages: Math.ceil(total / limit),
            totalItems: total,
            hasNextPage: skip + limit < total,
            hasPrevPage: page > 1
          }
        });
      } catch (err) {
        retries++;
        console.error(`查詢失敗 (${retries}/${maxRetries}):`, err);

        if (retries >= maxRetries) {
          // 最後一次重試也失敗了，拋出錯誤
          throw err;
        }

        // 等待一段時間後重試
        console.log(`等待 ${retries * 1000}ms 後重試...`);
        await new Promise(resolve => setTimeout(resolve, retries * 1000));
      }
    }
  } catch (error: any) {
    console.error('工作機會列表錯誤:', error);
    let errorMessage = '伺服器錯誤';
    let statusCode = 500;

    if (error instanceof ApiError) {
      errorMessage = error.message;
      statusCode = error.statusCode;
    } else if (error.name === 'MongooseError' && error.message.includes('buffering timed out')) {
      errorMessage = 'MongoDB連接超時，請稍後再試';
      console.error('MongoDB連接超時詳情:', {
        connectionState: mongoose.connection.readyState,
        errorName: error.name,
        errorMessage: error.message
      });
    } else if (error.name === 'MongoTimeoutError') {
      errorMessage = 'MongoDB查詢超時，請縮小搜尋範圍或稍後再試';
    }

    return res.status(statusCode).json({
      success: false,
      message: errorMessage,
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
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