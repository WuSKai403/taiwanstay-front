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

  // 使用 getServerSession 獲取用戶會話
  const session = await getServerSession(req, res, authOptions);

  if (!session || !session.user) {
    return res.status(401).json({ success: false, message: '未授權' });
  }

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

    // 處理 excludeStatus 參數，過濾掉指定狀態的機會
    if (req.query.excludeStatus) {
      const excludeStatus = req.query.excludeStatus as string;
      // 使用 $ne（不等於）運算符排除特定狀態
      query.status = { $ne: excludeStatus };
      console.log(`排除狀態為 ${excludeStatus} 的機會`);
    }

    // 獲取用戶會話
    const session = await getServerSession(req, res, authOptions);
    const isAdmin = session?.user?.role === 'ADMIN' || session?.user?.role === 'SUPER_ADMIN';

    // 針對非管理員用戶，自動過濾掉草稿狀態的機會
    // 這確保了無論前端如何請求，後端都會自動排除草稿
    if (!isAdmin && (!query.status || !req.query.all)) {
      // 如果已經有狀態過濾，則使用 $and 邏輯
      if (query.status) {
        query.$and = query.$and || [];
        query.$and.push({ status: { $ne: OpportunityStatus.DRAFT } });
      } else {
        // 如果沒有狀態過濾，直接設置排除草稿
        query.status = { $ne: OpportunityStatus.DRAFT };
      }
      console.log('非管理員用戶，自動排除草稿狀態的機會');
    }

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
    // 使用 getServerSession 獲取用戶會話
    const session = await getServerSession(req, res, authOptions);

    if (!session || !session.user) {
      return res.status(401).json({
        success: false,
        message: '未授權，請先登入'
      });
    }

    // 檢查用戶是否是主辦方
    const host = await Host.findOne({ userId: session.user.id });

    if (!host) {
      return res.status(403).json({
        success: false,
        message: '只有認證的主辦方可以創建機會'
      });
    }

    // 創建機會
    const opportunityData = req.body;

    // 設置關鍵字段
    opportunityData.hostId = host._id;
    opportunityData.status = opportunityData.status || 'DRAFT';
    opportunityData.createdAt = new Date();
    opportunityData.updatedAt = new Date();
    opportunityData.viewCount = 0;
    opportunityData.bookmarkCount = 0;
    opportunityData.applications = [];

    // 如果狀態是已發布，設置發布日期
    if (opportunityData.status === 'PUBLISHED') {
      opportunityData.publishedAt = new Date();
    }

    // 創建新機會
    const newOpportunity = new Opportunity(opportunityData);
    await newOpportunity.save();

    return res.status(201).json({
      success: true,
      message: '機會創建成功',
      _id: newOpportunity._id, // 確保返回 _id 字段
      opportunity: JSON.parse(JSON.stringify(newOpportunity))
    });
  } catch (error) {
    console.error('創建機會時出錯:', error);
    return res.status(500).json({ success: false, message: '服務器錯誤' });
  }
}